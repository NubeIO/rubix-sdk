# Manufacturing Pagination - Implementation Checklist

**Scope:** See [PAGINATION-SCOPE.md](./PAGINATION-SCOPE.md)

## Quick Start (What to do first)

### ✅ Phase 0: Immediate Win (No backend changes)
*Can be done TODAY in 30 minutes*

- [ ] Update `useProductionRun` to pass `limit: 50, offset: 0`
- [ ] Test with production run that has 100+ units
- [ ] Verify only 50 units load instead of all

**Result:** Instant performance improvement, but no total count yet.

---

## Backend Implementation

### Query Service Enhancement

**Files to modify:**
- `internal/business/query/service.go` - Fix TotalCount calculation
- `internal/libs/haystack/v2/db_executor.go` - Verify ExecuteCount() works
- `internal/gateway/dispatcher/query.go` - Use result.TotalCount

**Changes needed:**

**1. Update executeDatabaseQuery signature** (`service.go:112`):
```go
// Change from:
func (s *QueryService) executeDatabaseQuery(...) ([]*models.Node, error)

// To:
func (s *QueryService) executeDatabaseQuery(...) ([]*models.Node, int, error) {
    executor := haystackv2.NewDBExecutor(sqliteRepo.DB(), s.orgID)

    // Get total count (ExecuteCount already exists!)
    totalCount, err := executor.ExecuteCount(ctx, ast)
    if err != nil {
        return nil, 0, err
    }

    // Get paginated results
    nodeIDs, err := executor.ExecuteWithLimit(ctx, ast, opts.Limit, opts.Offset)
    // ... fetch nodes ...

    return nodes, int(totalCount), nil  // Return both
}
```

**2. Update executeRuntimeQuery** (`service.go:143`):
```go
func (s *QueryService) executeRuntimeQuery(...) ([]*models.Node, int, error) {
    // ... execute query ...
    matchedNodes, err := executor.Execute(ctx, ast)
    totalCount := len(matchedNodes)  // Capture BEFORE pagination

    // Apply pagination
    start := opts.Offset
    end := start + opts.Limit
    // ... bounds check ...

    return matchedNodes[start:end], totalCount, nil  // Return both
}
```

**3. Thread through Execute()** (`service.go:38`):
```go
func (s *QueryService) Execute(ctx context.Context, opts QueryOptions) (*QueryResult, error) {
    var nodes []*models.Node
    var totalCount int  // NEW
    var err error

    if opts.Runtime {
        nodes, totalCount, err = s.executeRuntimeQuery(ctx, ast, opts)
    } else {
        nodes, totalCount, err = s.executeDatabaseQuery(ctx, ast, opts)
    }

    return &QueryResult{
        Nodes:      nodes,
        TotalCount: totalCount,  // ✅ CORRECT (before pagination)
        // ...
    }, nil
}
```

**4. Update HandleFilter** (`query.go:247`):
```go
// Change from:
ctx.Collection(nodes, len(nodes))  // ❌ Wrong

// To:
ctx.Collection(result.Nodes, result.TotalCount)  // ✅ Correct
```

**Checklist:**
- [ ] Verify `ExecuteCount()` exists in DBExecutor (it does - line 63)
- [ ] Update `executeDatabaseQuery()` to return `(nodes, total, error)`
- [ ] Update `executeRuntimeQuery()` to return `(nodes, total, error)`
- [ ] Update `Execute()` to capture and use totalCount
- [ ] Update `HandleFilter()` to use `result.TotalCount`
- [ ] Add unit tests for pagination
- [ ] Add unit tests for COUNT accuracy

---

### Settings Filter Verification

✅ **Already implemented** - `internal/libs/haystack/v2/db_executor.go:220`

Settings filters work out of the box:
- `settings.qaStatus is "pass"` ✅
- `settings.serialNumber contains "ABC"` ✅
- `settings.price > 100` ✅

**Checklist:**
- [x] Settings filters already work
- [ ] Add tests if missing (optional)

---

### API Documentation Update

**File:** `configs/ras/query.yaml`

**Add response schema** (currently missing from yaml):
```yaml
# Under actions.filter and actions.create
response:
  type: object
  properties:
    data:                    # NOT "nodes" - rubix standard!
      type: array
      items:
        $ref: '#/schemas/Node'
    meta:
      type: object
      properties:
        timestamp:
          type: string
          description: ISO 8601 timestamp
        total:
          type: integer
          description: Total matching records (accurate with limit/offset)
```

**Checklist:**
- [ ] Add response schema to query.yaml
- [ ] Update README.md with pagination example
- [ ] Document that `data` field is used (not `nodes`)

---

## Frontend Implementation

### Plugin Client Types

**File:** `frontend-sdk/plugin-client/index.d.ts`

**CRITICAL**: Use `data` field, NOT `nodes` (rubix standard format)!

```typescript
// Standard rubix response format
export interface RubixResponse<T> {
    data: T[];              // NOT "nodes"!
    meta?: {
        timestamp: string;
        total?: number;     // Now accurate (before pagination)
    };
}

export interface PluginClient {
    queryNodes<T = Node>(options?: QueryNodesOptions): Promise<RubixResponse<T>>;
}
```

**Checklist:**
- [ ] Fix types to use `data` field (not `nodes`)
- [ ] Update `queryNodes` return type
- [ ] Update JSDoc examples

---

### Plugin Client Implementation

**File:** `frontend-sdk/plugin-client/query.ts`

**No changes needed** - response format already correct!

```typescript
export async function queryNodes<T = Node>(
    client: PluginClient,
    options?: QueryNodesOptions
): Promise<RubixResponse<T>> {
    const response = await fetch(`${baseUrl}/query`, {
        method: 'POST',
        body: JSON.stringify({
            filter: options?.filter,
            limit: options?.limit ?? 100,
            offset: options?.offset ?? 0,
            runtime: options?.runtime ?? false,
        }),
    });

    return await response.json();
    // Returns: { data: [...], meta: { timestamp, total } }
}
```

**Checklist:**
- [ ] Verify return type matches `RubixResponse`
- [ ] Update error handling (if needed)
- [ ] Add unit tests

---

### Production Run Hook

**File:** `nube.plm/frontend/src/features/production-run/hooks/use-production-run.ts`

**Changes:**
1. Add `totalUnits` state
2. Add `fetchUnits` method with pagination params
3. Support server-side filtering

```typescript
export function useProductionRun(config: UseProductionRunConfig) {
    const [totalUnits, setTotalUnits] = useState<number>(0);

    const fetchUnits = useCallback(async (
        limit: number = 50,
        offset: number = 0,
        filters?: { search?: string; qaStatus?: string; status?: string }
    ) => {
        let filter = `type is "core.asset" and parent.id is "${config.runId}"`;

        if (filters?.search) {
            filter += ` and settings.serialNumber contains "${filters.search}"`;
        }
        if (filters?.qaStatus && filters.qaStatus !== 'all') {
            filter += ` and settings.qaStatus is "${filters.qaStatus}"`;
        }
        if (filters?.status && filters.status !== 'all') {
            filter += ` and settings.status is "${filters.status}"`;
        }

        const response = await client.queryNodes<ManufacturingUnit>({
            filter,
            limit,
            offset,
        });

        setUnits(response.data);  // Use "data", not "nodes"!
        setTotalUnits(response.meta?.total ?? response.data.length);
    }, [client, config.runId]);

    return {
        units,
        totalUnits,
        fetchUnits,
        // ...
    };
}
```

**Checklist:**
- [ ] Add `totalUnits` state
- [ ] Add `fetchUnits` method
- [ ] Build filter with search/QA/status
- [ ] Call `fetchUnits` instead of loading all
- [ ] Use `response.data` (not `response.nodes`)
- [ ] Extract `response.meta?.total`

---

### Units Tab Component

**File:** `nube.plm/frontend/src/features/production-run/components/UnitsTab.tsx`

**Changes:**
1. Use `fetchUnits` from hook
2. Server-side filtering instead of client-side
3. Show accurate total count

```typescript
export function UnitsTab({
    units,
    totalUnits,      // NEW - from hook
    fetchUnits,      // NEW - from hook
    loading,
    onAddUnit,
    onEditUnit,
    onDeleteUnit,
}: UnitsTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [qaStatusFilter, setQaStatusFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const pageSize = 50;

    useEffect(() => {
        fetchUnits(pageSize, (currentPage - 1) * pageSize, {
            search: searchQuery,
            qaStatus: qaStatusFilter,
            status: statusFilter,
        });
    }, [currentPage, searchQuery, qaStatusFilter, statusFilter, fetchUnits]);

    const totalPages = Math.ceil(totalUnits / pageSize);

    return (
        <Card>
            <CardDescription>
                Showing {units.length} of {totalUnits} units
            </CardDescription>

            {/* Rest of component */}
        </Card>
    );
}
```

**Checklist:**
- [ ] Remove client-side filtering logic
- [ ] Add `useEffect` to call `fetchUnits`
- [ ] Update props interface
- [ ] Use `totalUnits` from props (not calculated)
- [ ] Calculate `totalPages` from `totalUnits`
- [ ] Reset to page 1 when filters change

---

### Manufacturing Section Integration

**File:** `nube.plm/frontend/src/features/product/v2/sections/ManufacturingSection.tsx`

**Changes:**
1. Pass `totalUnits` to UnitsTab
2. Pass `fetchUnits` to UnitsTab
3. Remove old unit filtering code

```typescript
{activeTab === 'units' && (
    <TabsContent value="units">
        <UnitsTab
            units={units}
            totalUnits={runState.totalUnits}  // NEW
            fetchUnits={runState.fetchUnits}  // NEW
            loading={runState.loading}
            onAddUnit={() => {
                setEditingUnit(null);
                setUnitDialogOpen(true);
            }}
            onEditUnit={(unit) => {
                setEditingUnit(unit);
                setUnitDialogOpen(true);
            }}
            onDeleteUnit={handleDeleteUnit}
        />
    </TabsContent>
)}
```

**Checklist:**
- [ ] Update UnitsTab props
- [ ] Remove old pagination logic
- [ ] Remove old filtering logic
- [ ] Test pagination works
- [ ] Test search works
- [ ] Test filters work

---

## Testing

### Backend Tests

**File:** `internal/query/handler_test.go`

```go
func TestQueryPagination(t *testing.T) {
    // Create 100 test units
    // ...

    tests := []struct {
        name       string
        limit      int
        offset     int
        wantCount  int
        wantTotal  int
        wantHasMore bool
    }{
        {"first page", 10, 0, 10, 100, true},
        {"second page", 10, 10, 10, 100, true},
        {"last page", 10, 90, 10, 100, false},
        {"over limit", 10, 95, 5, 100, false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            resp, err := queryHandler.Execute(ctx, QueryRequest{
                Filter: `type is "core.asset"`,
                Limit:  tt.limit,
                Offset: tt.offset,
            })
            require.NoError(t, err)
            assert.Len(t, resp.Nodes, tt.wantCount)
            assert.Equal(t, tt.wantTotal, resp.Meta.Total)
            assert.Equal(t, tt.wantHasMore, resp.Meta.HasMore)
        })
    }
}

func TestSettingsFilters(t *testing.T) {
    // Create test data
    // ...

    tests := []struct {
        name   string
        filter string
        want   int
    }{
        {"QA pass", `settings.qaStatus is "pass"`, 80},
        {"QA fail", `settings.qaStatus is "fail"`, 20},
        {"Serial contains", `settings.serialNumber contains "ABC"`, 10},
        {"Price range", `settings.price > 100 and settings.price < 200`, 15},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            resp, err := queryHandler.Execute(ctx, QueryRequest{
                Filter: tt.filter,
                Limit:  1000,
            })
            require.NoError(t, err)
            assert.Equal(t, tt.want, len(resp.Nodes))
        })
    }
}
```

**Checklist:**
- [ ] Test pagination with different pages
- [ ] Test offset edge cases
- [ ] Test total count accuracy
- [ ] Test hasMore flag
- [ ] Test settings filters
- [ ] Test combined filters
- [ ] Test performance (10,000+ records)

---

### Frontend Tests

**File:** `nube.plm/frontend/src/features/production-run/hooks/__tests__/use-production-run.test.ts`

```typescript
describe('useProductionRun pagination', () => {
    beforeEach(() => {
        mockClient.queryNodes.mockResolvedValue({
            nodes: mockUnits,
            meta: { total: 1234, limit: 50, offset: 0, hasMore: true }
        });
    });

    it('fetches units with pagination', async () => {
        const { result } = renderHook(() => useProductionRun(config));

        await act(() => result.current.fetchUnits(50, 0));

        expect(mockClient.queryNodes).toHaveBeenCalledWith({
            filter: 'type is "core.asset" and parent.id is "run_123"',
            limit: 50,
            offset: 0,
        });

        expect(result.current.totalUnits).toBe(1234);
    });

    it('applies server-side search filter', async () => {
        const { result } = renderHook(() => useProductionRun(config));

        await act(() => result.current.fetchUnits(50, 0, { search: 'ABC' }));

        expect(mockClient.queryNodes).toHaveBeenCalledWith({
            filter: expect.stringContaining('settings.serialNumber contains "ABC"'),
            limit: 50,
            offset: 0,
        });
    });
});
```

**Checklist:**
- [ ] Test pagination params passed correctly
- [ ] Test totalUnits set from meta
- [ ] Test search filter added to query
- [ ] Test QA status filter
- [ ] Test status filter
- [ ] Test combined filters
- [ ] Test backward compatibility (no meta)

---

## Manual Testing

### Test Cases

**1. Large production run (1000+ units)**
- [ ] Create run with 1000+ units
- [ ] Verify only 50 load initially
- [ ] Check network tab: ~85KB (not 8MB)
- [ ] Verify page count shows correctly
- [ ] Navigate to page 2, 3, etc.

**2. Search functionality**
- [ ] Search for serial number
- [ ] Verify results filter server-side
- [ ] Check network tab: filter includes search
- [ ] Verify total count updates

**3. QA Status filter**
- [ ] Filter by "Pass"
- [ ] Verify only pass units shown
- [ ] Check total count updates
- [ ] Combine with search

**4. Performance**
- [ ] Load run with 5000 units
- [ ] Measure time to first render
- [ ] Should be < 200ms
- [ ] Check SQL query time in logs

**5. Backward compatibility**
- [ ] Test with old frontend (if meta not returned)
- [ ] Verify no errors
- [ ] Verify pagination still works (client-side)

---

## Performance Validation

### Metrics to Track

**Before:**
```
Load 5000 units:
- Query time: 2.5s
- Transfer: 8.2 MB
- Render: 1.8s
- Total: 4.3s
```

**After:**
```
Load 5000 units (page 1):
- Query time: < 200ms
- Transfer: < 100 KB
- Render: < 50ms
- Total: < 250ms
```

**Target: 20x improvement**

### Database Performance

```sql
-- Add indexes for common filters
CREATE INDEX idx_nodes_type_parent ON nodes(type, parent_id);
CREATE INDEX idx_nodes_settings_qa ON nodes((settings->>'qaStatus'));
CREATE INDEX idx_nodes_settings_serial ON nodes((settings->>'serialNumber'));

-- Verify COUNT performance
EXPLAIN ANALYZE
SELECT COUNT(*) FROM nodes
WHERE type = 'core.asset' AND parent_id = 'run_123';
-- Should be < 10ms
```

**Checklist:**
- [ ] Add indexes if queries are slow
- [ ] Test COUNT performance
- [ ] Verify no full table scans
- [ ] Monitor query logs

---

## Deployment

### Simplified Rollout

**Day 1: Backend (rubix core)** - 4-6 hours
- [ ] Update QueryService signatures
- [ ] Thread totalCount through Execute()
- [ ] Update HandleFilter to use result.TotalCount
- [ ] Write tests
- [ ] Deploy to dev

**Day 2: Plugin Updates** - 2-3 hours
- [ ] Verify types use `data` field
- [ ] Update hook to use `meta.total`
- [ ] Test with production-sized data
- [ ] Done! 🎉

**Total effort**: 1-2 days

---

## Success Criteria

- ✅ Load time < 200ms for pages with 5000+ units (49x improvement)
- ✅ Accurate total count ("Showing 50 of 5000 units")
- ✅ Server-side filtering works (settings.qaStatus, etc.)
- ✅ No breaking changes (response format already correct)
- ✅ COUNT query < 10ms (verify with benchmarks)

## Done! ✨

When all checkboxes are complete, this feature is ready for production.
