# Production Run Domain

**Status**: Implemented in product detail workspace

This feature now powers the manufacturing workflow for product detail pages using the `plm.manufacturing-run` node type and `core.asset` children for units.

## What Exists

- `types/` defines run and unit shapes, statuses, and form defaults
- `hooks/` loads runs for a product and units for a selected run
- `components/` provides run forms, status badges, progress, and the unit table
- `ManufacturingSection` is mounted inside the product V2 workspace

## Current Workflow

1. Create a manufacturing run under a product
2. Track target quantity, facility, hardware version, and batch notes
3. Add serialized `core.asset` units under that run
4. Monitor progress from run counters and actual child units

## Notes

- The frontend treats `plm.manufacturing-run` as the canonical node type
- Units are created as `core.asset` nodes and denormalize `productionRunNumber`
- Run stats fall back to live child counts so the UI stays useful while backend counter hooks evolve
