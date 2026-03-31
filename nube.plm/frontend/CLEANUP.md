# Cleanup Steps

After verifying the new feature-first architecture works, you can clean up old directories:

## Old Directories (Can be Deleted)

These are from the old type-first structure and are now duplicated in `projects/` and `shared/`:

```bash
# Navigate to frontend src
cd nube.plm/frontend/src

# Delete old type-first structure
rm -rf types/
rm -rf lib/
rm -rf components/

# Keep only:
# - projects/        (new feature-first structure)
# - shared/          (new shared code)
# - widgets/         (legacy export for backwards compat)
```

## Files to Keep

- ✅ `projects/` - Complete project feature
- ✅ `shared/` - Cross-feature code
- ✅ `widgets/ProjectTableWidget.tsx` - Legacy export (re-exports from projects/widget/)
- ✅ `ARCHITECTURE.md` - Documentation
- ✅ `index.ts` - Main exports
- ✅ `vite-env.d.ts` - Type definitions

## Files to Delete (After Testing)

- ❌ `types/` - Moved to `projects/common/types.ts`
- ❌ `lib/` - Moved to `projects/common/` and `shared/`
- ❌ `components/` - Moved to `projects/components/`, `projects/dialogs/`, `shared/components/`
- ❌ `widgets/ProjectTableWidget.old.tsx` - Old backup

## Testing Checklist

Before deleting old files, verify:

1. **Widget loads:** ProjectTableWidget appears in scene-builder
2. **Projects list:** Shows existing projects
3. **Create works:** Can create new project
4. **Edit works:** Can edit existing project
5. **Delete works:** Can delete project
6. **No errors:** Check browser console

## Cleanup Command (Run After Testing)

```bash
cd /home/user/code/go/nube/rubix-plugin/nube.plm/frontend/src

# Backup old structure (optional)
tar -czf ../backup-old-structure-$(date +%Y%m%d).tar.gz types/ lib/ components/

# Delete old directories
rm -rf types/ lib/ components/

# Delete old backup file
rm widgets/ProjectTableWidget.old.tsx

echo "✅ Cleanup complete! Only feature-first structure remains."
```

## Final Structure

After cleanup:
```
src/
├── projects/          # Project feature (complete)
├── shared/            # Cross-feature code
├── widgets/           # Legacy exports (re-export from projects/)
├── ARCHITECTURE.md
└── index.ts
```

Clean and maintainable! 🚀
