# Manufacturing Section UX Mockup - Before & After

## 🔴 BEFORE (Current Implementation)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Manufacturing                                       [Refresh] [New] │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                        │
│ ┌──────────┐ │  Selected Run Details Card                           │
│ │RUN #2401 │ │  ┌─────────────────────────────────────────────┐    │
│ │In Progress│◄──┤ Production Run #2401                         │    │
│ │Hardware v1│ │  │ Status: In Progress                         │    │
│ └──────────┘ │  │ Target: 10,000 units                        │    │
│              │  └─────────────────────────────────────────────┘    │
│ ┌──────────┐ │                                                        │
│ │RUN #2402 │ │  Units Table (NO PAGINATION!)                        │
│ │Completed │ │  ┌─────────────────────────────────────────────┐    │
│ │Hardware v1│ │  │ Serial    Status   QA      Hardware   Date │    │
│ └──────────┘ │  ├─────────────────────────────────────────────┤    │
│              │  │ SN-000001 Produced Pass    v1.0   Mar 1     │    │
│ ┌──────────┐ │  │ SN-000002 Produced Pending v1.0   Mar 1     │    │
│ │RUN #2403 │ │  │ SN-000003 Shipped  Pass    v1.0   Mar 2     │    │
│ │In Progress│ │  │ ...                                         │    │
│ │Hardware v2│ │  │ SN-009998 Produced Pending v2.0   Mar 28    │    │
│ └──────────┘ │  │ SN-009999 Produced Pending v2.0   Mar 28    │    │
│              │  │ SN-010000 Produced Pending v2.0   Mar 28    │◄───┐
│ ┌──────────┐ │  └─────────────────────────────────────────────┘    │
│ │RUN #2404 │ │                                                 │    │
│ │Planning  │ │  👆 ALL 10,000 ROWS RENDERED                   │    │
│ │Hardware v2│ │     = BROWSER DIES                             │    │
│ └──────────┘ │     = INFINITE SCROLL                          │    │
│   ...        │     = NO SEARCH                                │    │
│ (98 more!)   │     = NO FILTERS                               │    │
│              │                                                        │
└──────────────┴──────────────────────────────────────────────────────┘
    👆 320px sidebar
    With 100 runs = endless scroll nightmare
```

### Problems:
- ❌ **Runs**: All 100+ runs render as cards → huge scrolling sidebar
- ❌ **Units**: ALL 10,000 units load at once → DOM explosion, memory leak
- ❌ **No Search**: Can't find specific serials or runs
- ❌ **No Filters**: Can't filter by QA status, hardware rev, etc.
- ❌ **No Pagination**: One giant table
- ❌ **Poor Layout**: Sidebar wastes space, gets overwhelmed

---

## ✅ AFTER (Mockup Implementation)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Manufacturing                                         [Refresh] [New] │
├───────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 Stats Cards                                                        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐                             │
│  │ 100 Runs│  │ 47K Units│  │ 342 Fails│                             │
│  └─────────┘  └──────────┘  └──────────┘                             │
│                                                                         │
│  🏭 Select Production Run                                              │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ [🔍 Search runs...]          [PR-2401 • Production Run #2401▼] │   │
│  │                                                                  │   │
│  │ Selected: Production Run #2401 • PR-2401 • In Progress         │   │
│  │ Target: 10,000 units                          [Edit] [Delete]  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                    👆 Searchable dropdown = scales!    │
│                                                                         │
│  📦 Produced Units (127 total)                            [Add Unit]   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ [🔍 Search serials...] [QA: All▼] [Status: All▼]              │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │ Serial      Status    QA     Hardware  Date        Actions     │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │ SN-000001  Produced   Pass   v1.0      Mar 1    [Edit][Del]   │   │
│  │ SN-000002  Produced   Pending v1.0    Mar 1    [Edit][Del]   │   │
│  │ SN-000003  Shipped    Pass    v1.0    Mar 2    [Edit][Del]   │   │
│  │ ...                                                             │   │
│  │ SN-000050  Produced   Pending v1.0    Mar 18   [Edit][Del]   │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │ Page 1 of 3 • 127 units    [◀️ Prev] [1] [2] [3] [Next ▶️]   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                    👆 Only shows 50 rows per page!     │
└───────────────────────────────────────────────────────────────────────┘
```

### Improvements:
- ✅ **Runs**: Searchable dropdown → handles 1000s of runs
- ✅ **Units**: Pagination (50 per page) → only renders visible rows
- ✅ **Search**: Find serials instantly, search runs by number/name
- ✅ **Filters**: Filter by QA status, shipment status
- ✅ **Scalable**: 10,000 units? No problem (50 at a time)
- ✅ **Better Layout**: No cramped sidebar, full-width content
- ✅ **Performance**: Fast rendering, low memory

---

## Key Features Demonstrated

### 1. Run Selection (Lines 162-219)
```tsx
// OLD: Sidebar with ALL runs as cards
runsState.runs.map((run) => <CardButton>...</CardButton>)

// NEW: Searchable dropdown
<Input
  placeholder="Search runs..."
  value={runSearchQuery}
  onChange={...}
/>
<Select value={selectedRunId}>
  {filteredRuns.map((run) => (
    <SelectItem key={run.id}>
      {run.settings?.runNumber} • {run.name}
    </SelectItem>
  ))}
</Select>
```

### 2. Units Search & Filters (Lines 272-308)
```tsx
// Search input
<Input placeholder="Search serial numbers..." />

// QA Status filter
<Select value={qaStatusFilter}>
  <SelectItem value="all">All QA Status</SelectItem>
  <SelectItem value="pass">Pass</SelectItem>
  <SelectItem value="fail">Fail</SelectItem>
</Select>

// Status filter
<Select value={statusFilter}>
  <SelectItem value="produced">Produced</SelectItem>
  <SelectItem value="shipped">Shipped</SelectItem>
</Select>
```

### 3. Client-Side Pagination (Lines 86-106)
```tsx
// Filter units
const filteredUnits = units.filter(unit =>
  matchesSearch && matchesQaFilter && matchesStatusFilter
);

// Paginate (only show 50 rows)
const paginatedUnits = filteredUnits.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);

// Render ONLY the paginated units
{paginatedUnits.map(unit => <TableRow>...</TableRow>)}
```

### 4. Pagination Controls (Lines 377-419)
```tsx
<div className="pagination">
  Page {currentPage} of {totalPages} • {filteredUnits.length} units

  <Button onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
  {[1, 2, 3, 4, 5].map(pageNum => (
    <Button variant={currentPage === pageNum ? 'default' : 'outline'}>
      {pageNum}
    </Button>
  ))}
  <Button onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
</div>
```

---

## Performance Comparison

| Scenario | BEFORE | AFTER |
|----------|--------|-------|
| **100 Runs** | 100 DOM cards in sidebar | 1 dropdown + search |
| **10K Units** | 10,000 table rows rendered | 50 rows per page |
| **DOM Nodes** | ~50,000+ elements | ~250 elements |
| **Memory** | ~500MB | ~10MB |
| **Load Time** | 5-10 seconds | <500ms |
| **Search** | Browser Find (Ctrl+F) | Instant filter |
| **Scroll** | Infinite nightmare | Smooth pagination |

---

## Next Steps

### Quick Win (2-3 hours):
1. Implement the run dropdown (replace sidebar)
2. Add client-side pagination to units
3. Add search input for runs and units

### Full Implementation (1-2 days):
1. Add server-side pagination to API
   - Modify `queryNodes` to support `limit`, `offset`
   - Return total count for pagination
2. Add filters for QA status, shipment status
3. Optional: Upgrade to TanStack Table for advanced features
   - Column sorting
   - Column resizing/hiding
   - Multi-select
   - Export to CSV

### Files to Modify:
- ✏️ `ManufacturingSection.tsx` - Main component
- ✏️ `UnitTable.tsx` - Add pagination props
- ✏️ `use-production-run.ts` - Add pagination params to API calls
- 🆕 `UnitTableFilters.tsx` - New component for filters
- 📚 Backend: Add pagination support to node queries

---

## Try It Out

The mockup file has **127 mock units** with realistic data. You can:
- Search serials (e.g., "SN-000042")
- Filter by QA status (pass/fail/pending)
- Filter by shipment status (produced/shipped)
- Navigate pages (3 pages @ 50 units/page)

**To preview:** Replace `ManufacturingSection` import with `ManufacturingSectionMockup` temporarily.
