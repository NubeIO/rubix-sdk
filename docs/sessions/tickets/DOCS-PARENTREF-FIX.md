# Documentation Fix: parentRef vs parentId

**Date**: 2026-03-28
**Issue**: Core documentation examples using `parentId` instead of `parentRef`
**Severity**: 🚨 CRITICAL - People copy from these docs!

---

## Files Fixed

### 1. ✅ HOWTO-CORE-NODE.md

**Lines Fixed**: 372, 419

#### Before:
```typescript
// ❌ WRONG
await client.createNode({
  type: 'plm.task',
  name: 'Fix bug',
  parentId: productId,  // WRONG!
  settings: { ... }
});
```

#### After:
```typescript
// ✅ CORRECT
await client.createNode({
  type: 'plm.task',
  name: 'Fix bug',
  parentRef: productId,  // ✅ Use parentRef, NOT parentId
  settings: { ... }
});
```

**Also Fixed**:
- curl example in "Verification Steps" section (line 419)
- Added clear comments warning against `parentId`

---

### 2. ✅ PLUGIN-CLIENT-TS.md

**Status**: Already correct! ✅

This file was already using `parentRef` correctly in all examples:
- Line 105: Quick Start example uses `parentRef`
- Line 276: API Reference shows `parentRef` with warning comment
- Line 289: Explicitly documents "Use `parentRef`, not `parentId`"
- Line 1601-1602: FAQ directly addresses the question

**No changes needed.**

---

## Verification

### HOWTO-CORE-NODE.md
```bash
grep -n "parentId" docs/HOWTO-CORE-NODE.md
```
**Result**: Only appears in comment: `"Use parentRef, NOT parentId"` ✅

### PLUGIN-CLIENT-TS.md
```bash
grep -n "parentId" docs/PLUGIN-CLIENT-TS.md
```
**Result**: Only appears in:
- Warning comments (line 276, 289)
- Query filters like `parent.id` (correct usage)
- FAQ explaining not to use it (line 1601-1602)

✅ Both docs are now safe to copy from!

---

## Why This Matters

**The Footgun**:
```typescript
// This appears to work...
await client.createNode({
  type: 'plm.task',
  parentId: productId,  // ❌ Silently fails to create relationship
  settings: { ... }
});

// But creates an ORPHANED node
// - No parent relationship in database
// - Won't appear in UI tree
// - Queries for children return nothing
// - Silent failure - no error message
```

**The Fix**:
```typescript
await client.createNode({
  type: 'plm.task',
  parentRef: productId,  // ✅ Creates proper parent relationship
  settings: { ... }
});
```

---

## Impact

**Before**: Developers copying from docs would create orphaned nodes
**After**: All doc examples use correct `parentRef` pattern

**Related Fixes**:
- ✅ Task implementation fixed (TasksPage.tsx)
- ✅ Helper functions use `parentRef`
- ✅ Type definitions enforce `parentRef`
- ✅ Documentation updated (this file)

---

## Future Prevention

**Recommendations**:
1. ✅ **Docs fixed** - All examples now correct
2. 💡 **Add ESLint rule** - Ban `parentId` in code
3. 💡 **API validation** - Reject `parentId` field with helpful error
4. 💡 **TypeScript types** - Remove `parentId` from type definitions

---

## See Also

- [FIXES-APPLIED.md](./FIXES-APPLIED.md) - All code fixes applied
- [DESIGN-DECISIONS.md](./DESIGN-DECISIONS.md) - Why parentRef vs parentId
- [PEER-REVIEW-HELPERS.md](./PEER-REVIEW-HELPERS.md) - Code quality review
