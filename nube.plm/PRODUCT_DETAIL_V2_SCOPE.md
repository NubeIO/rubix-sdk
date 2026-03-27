# Product Detail Page V2 - Scope Document

## Overview
Create a modern, polished Product Detail Page based on the plm-workspace-pro example design. This replaces the current ProductDetailPage with a full-featured workspace view for managing a single product.

## Reference
- **Example**: `/home/user/Downloads/plm-workspace-pro/src/App.tsx`
- **Current Implementation**: `nube.plm/frontend/src/features/product/pages/ProductDetailPage.tsx`
- **Screenshot**: Modern workspace with stat cards, sidebar navigation, and section-based content

## Goals
1. **Modern UI/UX**: Professional, polished interface matching the example
2. **Real API Integration**: Use `frontend-sdk/plugin-client` for all data operations
3. **Full Feature Parity**: All existing functionality plus new features
4. **Performance**: Smooth transitions, lazy loading, optimized rendering

---

## Layout Structure

### 1. Header (Top Bar)
**Left Side:**
- Product icon (colored box with Package icon)
- Product name (large, bold)
- Badge for status (e.g., "Design", "Production", "Active")
- Product type indicator (hardware/software)
- Product code and Node ID (small, muted text)

**Right Side:**
- Search box (rounded, with icon)
- "Edit" button (outline style)
- "Release" button (primary, with confirmation dialog)
- Command palette trigger (⌘K)

**Styling:**
- Height: 80px (h-20)
- Border bottom
- White background
- Proper spacing and alignment

### 2. Main Content Area

#### Left: Content Sections (Flex-1)
Scrollable content area with sections based on active tab:

**2.1 Overview Section**
- **Stat Cards Grid** (4 columns on desktop, responsive)
  - Total Tasks (with trend badge: "+12%")
  - BOM Items (with pending count)
  - Total Cost (calculated from BOM)
  - Activity (last edit time)

  Each card:
  - Icon with colored background circle
  - Title (uppercase, small, muted)
  - Large value (bold, 2xl)
  - Description (small, muted)
  - Optional trend indicator

- **Two-Column Layout**:
  - **Recent Tasks** (2/3 width):
    - Card with header
    - List of tasks (5 most recent)
    - Each task shows: status dot, title, assignee, due date
    - "View All" button in header
    - Hover effects on rows

  - **Quick Actions** (1/3 width):
    - Card with action buttons
    - "Add BOM Item" (with icon)
    - "Create Task" (with icon)
    - "Update Pricing" (with icon)
    - Separator
    - "Export Report" (with icon)

**2.2 Basic Info Section**
- Product name field
- Description textarea
- Product type selector
- Status dropdown
- Created/modified timestamps
- Form validation

**2.3 Pricing Section**
- Base price input
- Currency selector
- Cost breakdown table
- Margin calculator
- Historical pricing chart (optional)

**2.4 Bill of Materials Section**
- **Header with actions:**
  - Search box
  - Filter dropdown
  - "Add Item" button

- **BOM Table**:
  - Columns: Part Code, Description, Qty, Unit, Status, Unit Cost
  - Uppercase headers with wide tracking
  - Row hover effects (hover:bg-primary/5)
  - Part code is clickable (opens popover with details)
  - Status badges (Released/Pending with colors)
  - Monospace font for codes and prices
  - Pagination footer

- **Popover Details** (on part code click):
  - Part image/icon
  - Full description
  - Supplier info
  - Lead time
  - Stock status
  - Quick actions

**2.5 Tasks Section**
- **Kanban-style board** (3 columns):
  - Pending (gray dot)
  - In Progress (amber dot)
  - Completed (green dot)

- **Each Column**:
  - Header with status dot and count
  - Scrollable list of task cards
  - Each card shows:
    - Priority badge (High/Medium/Low with colors)
    - Task title
    - Assignee and due date
    - Edit/More actions (appears on hover)

- **Search/Filter** at top

**2.6 System Info Section**
- Node ID (read-only)
- Created timestamp
- Last modified timestamp
- Created by user
- Node type
- Parent node
- Tags/References
- Metadata table

#### Right: Sidebar Navigation (Fixed Width: 320px)
**Top Section:**
- "WORKSPACE NAVIGATION" label
- Sync status indicator (green dot + "Connected")
- Workspace progress bar (65%)

**Navigation Menu:**
- Overview (with grid icon)
- Basic Info (with info icon)
- Pricing (with dollar icon)
- Bill of Materials (with layers icon, shows count badge: 1000)
- Tasks (with check icon, shows count badge: 1000)
- System Info (with settings icon)

Active section:
- Black background
- White text
- Rounded corners

Inactive sections:
- Transparent background
- Muted text
- Hover state (light background)

**Bottom Section: Quick Stats**
- "QUICK STATS" label
- Health: 98.2% (green text)
- Latency: 24ms
- Other metrics as needed

---

## Components to Create

### 1. UI Components (shadcn/ui style)
**Already have:**
- ✅ Table, Card, Badge (created earlier)

**Need to create:**
- Input (text input with variants)
- Textarea
- Select dropdown
- Button (if not using SDK Button)
- Progress bar
- Skeleton loaders
- Alert Dialog
- Popover
- Scroll Area
- Separator
- Tabs (custom styled)

### 2. Product Detail Components

**Main Page:**
- `ProductDetailPageV2.tsx` - Main container with layout

**Sections:**
- `OverviewSection.tsx` - Stat cards + Recent Tasks + Quick Actions
- `BasicInfoSection.tsx` - Product info form
- `PricingSection.tsx` - Pricing management
- `BOMSectionV2.tsx` - Modern BOM table with popovers
- `TasksSectionV2.tsx` - Kanban-style task board
- `SystemInfoSection.tsx` - Read-only system metadata

**Shared Components:**
- `StatCard.tsx` - Reusable stat card component
- `SidebarNavigation.tsx` - Right sidebar with nav menu
- `ProductHeader.tsx` - Top header bar
- `QuickActions.tsx` - Quick actions card
- `RecentTasks.tsx` - Recent tasks card
- `BOMTableRow.tsx` - BOM table row with popover
- `TaskCard.tsx` - Individual task card for kanban

---

## Data Integration (Real APIs)

### Product Data
```typescript
// Fetch product on load
const product = await client.getNode(productId);

// Update product
await client.updateNode(productId, {
  name: newName,
  settings: { ...updatedSettings }
});
```

### BOM Items
```typescript
// Query BOM items (children of product with type core.document/bom)
const bomItems = await client.queryNodes({
  filter: `parentId is "${productId}" and type is "core.document"`,
  // May need to check profile too: profile is "plm-bom"
});

// Create BOM item
await client.createNode({
  type: 'core.document',
  profile: 'plm-bom',
  parentId: productId,
  name: partCode,
  settings: { description, quantity, unitCost, status }
});
```

### Tasks
```typescript
// Query tasks (children of product with type core.task)
const tasks = await client.queryNodes({
  filter: `parentId is "${productId}" and type is "core.task"`,
});

// Create task
await client.createNode({
  type: 'core.task',
  profile: 'plm-task',
  parentId: productId,
  name: taskName,
  settings: { status, priority, assignee, dueDate, progress }
});
```

### Stats Calculations
```typescript
// Calculate from fetched data:
- Total Tasks: tasks.length
- Tasks Completed This Week: filter by status + date
- BOM Items: bomItems.length
- Items Pending Release: filter by settings.status === 'Pending'
- Total Cost: sum(bomItems.map(i => i.settings.quantity * i.settings.unitCost))
- Activity: Use product.updatedAt timestamp
```

---

## Styling Standards

### Colors
```css
/* Use Tailwind theme colors */
Primary: blue (bg-blue-500, text-blue-700, etc.)
Muted: gray (text-muted-foreground, bg-muted)
Success: emerald (bg-emerald-50, text-emerald-700)
Warning: amber (bg-amber-50, text-amber-700)
Error: red (bg-red-50, text-red-700)
```

### Typography
```css
/* Headers */
Section headers: text-2xl font-bold tracking-tight
Subsections: text-lg font-bold
Card titles: text-lg font-bold

/* Table headers */
Uppercase, text-[10px], tracking-widest, font-bold, text-muted-foreground

/* Body text */
Normal: text-sm
Small: text-xs
Tiny: text-[10px]

/* Monospace */
Codes, IDs, prices: font-mono
```

### Spacing
```css
/* Padding */
Page container: p-8
Card padding: p-6
Table cells: px-6 py-4

/* Gaps */
Grid gaps: gap-4 or gap-6
Flex gaps: gap-2 or gap-3

/* Rounded corners */
Cards: rounded-xl
Buttons: rounded-xl or rounded-lg
Inputs: rounded-xl
Badges: rounded-md
```

### Transitions
```css
/* Standard */
transition-all duration-300

/* Opacity */
transition-opacity

/* Hover states */
hover:bg-primary/5 (very subtle)
hover:bg-muted/50
group-hover:opacity-100 (for hidden elements)
```

---

## Features

### Must Have (MVP)
- ✅ Modern header with product info
- ✅ Sidebar navigation
- ✅ Overview section with stat cards
- ✅ Recent tasks widget
- ✅ Quick actions widget
- ✅ Basic Info section (form)
- ✅ Pricing section
- ✅ BOM section with modern table
- ✅ Tasks section with kanban board
- ✅ System Info section
- ✅ Real API integration (no fake data)
- ✅ Loading states
- ✅ Error handling
- ✅ Smooth section transitions

### Nice to Have (Phase 2)
- Command palette (⌘K) for quick actions
- Keyboard shortcuts
- Drag-and-drop for BOM/tasks reordering
- Real-time updates (if backend supports)
- Export functionality
- Advanced filtering/search
- Inline editing (click to edit)
- Undo/redo
- Activity feed
- Version history

### Out of Scope (Future)
- Multi-language support
- Theming/customization
- Collaboration features (comments, @mentions)
- Advanced analytics/charts
- Mobile responsive (desktop-first)
- Offline mode

---

## File Structure

```
nube.plm/frontend/src/
├── components/ui/          (shadcn/ui components)
│   ├── table.tsx          ✅ Already created
│   ├── card.tsx           ✅ Already created
│   ├── badge.tsx          ✅ Already created
│   ├── input.tsx          ⬜ TODO
│   ├── textarea.tsx       ⬜ TODO
│   ├── select.tsx         ⬜ TODO
│   ├── progress.tsx       ⬜ TODO
│   ├── skeleton.tsx       ⬜ TODO
│   ├── alert-dialog.tsx   ⬜ TODO
│   ├── popover.tsx        ⬜ TODO
│   ├── scroll-area.tsx    ⬜ TODO
│   └── separator.tsx      ⬜ TODO
│
├── lib/
│   └── utils.ts           ✅ Already created (cn function)
│
└── features/product/
    ├── pages/
    │   ├── ProductDetailPage.tsx           (current v1)
    │   └── ProductDetailPageV2.tsx         ⬜ TODO (new)
    │
    └── components/
        └── detail-v2/                      ⬜ TODO (new folder)
            ├── ProductHeader.tsx
            ├── SidebarNavigation.tsx
            ├── StatCard.tsx
            ├── sections/
            │   ├── OverviewSection.tsx
            │   ├── BasicInfoSection.tsx
            │   ├── PricingSection.tsx
            │   ├── BOMSectionV2.tsx
            │   ├── TasksSectionV2.tsx
            │   └── SystemInfoSection.tsx
            └── widgets/
                ├── QuickActions.tsx
                ├── RecentTasks.tsx
                ├── BOMTableRow.tsx
                └── TaskCard.tsx
```

---

## Implementation Phases

### Phase 1: Foundation (1-2 hours)
1. Create missing UI components (Input, Select, Progress, etc.)
2. Set up ProductDetailPageV2 container
3. Create ProductHeader component
4. Create SidebarNavigation component
5. Implement section routing/switching

### Phase 2: Overview Section (1-2 hours)
1. Create StatCard component
2. Create OverviewSection with stat cards
3. Create RecentTasks widget
4. Create QuickActions widget
5. Wire up real data for stats
6. Add loading/error states

### Phase 3: Form Sections (2-3 hours)
1. Create BasicInfoSection
2. Create PricingSection
3. Create SystemInfoSection
4. Wire up forms to API
5. Add validation
6. Add save/cancel logic

### Phase 4: BOM Section (2-3 hours)
1. Create BOMSectionV2
2. Create modern BOM table
3. Add popover details for parts
4. Add search/filter
5. Add pagination
6. Wire up BOM CRUD operations

### Phase 5: Tasks Section (2-3 hours)
1. Create TasksSectionV2
2. Create TaskCard component
3. Implement kanban layout (3 columns)
4. Add task CRUD operations
5. Add drag-and-drop (optional)
6. Wire up real task data

### Phase 6: Polish & Testing (1-2 hours)
1. Add transitions/animations
2. Add keyboard shortcuts
3. Test all CRUD operations
4. Test loading/error states
5. Fix styling issues
6. Performance optimization

**Total Estimate: 9-15 hours**

---

## Success Criteria

### Visual
- ✅ Matches plm-workspace-pro example design
- ✅ Professional, modern appearance
- ✅ Smooth transitions between sections
- ✅ Consistent spacing and typography
- ✅ Proper hover/focus states

### Functional
- ✅ All product data loads from real API
- ✅ Can view and edit product info
- ✅ Can manage BOM items (create, edit, delete)
- ✅ Can manage tasks (create, edit, delete)
- ✅ Stats calculate correctly
- ✅ Search/filter works
- ✅ No fake/mock data

### Performance
- ✅ Initial load < 1 second
- ✅ Section switching < 200ms
- ✅ No layout shift
- ✅ Smooth scrolling

### Code Quality
- ✅ TypeScript strict mode
- ✅ Proper error handling
- ✅ Loading states for async operations
- ✅ Reusable components
- ✅ Clean, maintainable code

---

## Migration Plan

### Option A: Side-by-side (Recommended)
1. Keep ProductDetailPage.tsx as-is
2. Create ProductDetailPageV2.tsx
3. Add new page entry in plugin.json:
   ```json
   {
     "pageId": "product-detail-v2",
     "title": "Product Details V2 (Modern UI)",
     "nodeTypes": ["plm.product"],
     "enabled": true,
     "isDefault": false
   }
   ```
4. Users can choose which version to use
5. When v2 is stable, make it default
6. Eventually remove v1

### Option B: Direct replacement
1. Backup ProductDetailPage.tsx
2. Replace with ProductDetailPageV2.tsx
3. Test thoroughly
4. Remove backup if all good

**Recommendation: Option A** - Allows gradual migration and fallback if needed.

---

## Dependencies

### Already Installed ✅
- React 19
- Tailwind CSS
- clsx, tailwind-merge
- lucide-react (for icons)
- @radix-ui packages
- frontend-sdk (plugin-client)

### May Need to Add
- framer-motion (for animations) - check if already there
- @tanstack/react-virtual (for large lists) - already there ✅
- react-hook-form (for forms) - optional, can use controlled components

---

## Questions / Decisions Needed

1. **Command Palette**: Include ⌘K search? (Nice to have, not critical)
2. **Animations**: Use framer-motion or just CSS transitions? (CSS first, framer-motion if needed)
3. **Drag & Drop**: For BOM/tasks reordering? (Phase 2)
4. **Mobile**: Responsive or desktop-only? (Desktop-first, responsive later)
5. **Theme**: Light mode only or dark mode too? (Light mode MVP)

---

## Next Steps

1. ✅ Review and approve this scope
2. ⬜ Create missing UI components
3. ⬜ Build ProductDetailPageV2 container
4. ⬜ Implement sections one by one
5. ⬜ Test with real data
6. ⬜ Add to plugin.json when ready
7. ⬜ User testing & feedback
8. ⬜ Make default when stable

---

**Ready to start implementation?**
This scope gives us a clear roadmap for creating a professional, modern Product Detail Page that matches the example design while using real APIs.
