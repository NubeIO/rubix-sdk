# PLM Ticket System - UI Implementation Status

**Date**: 2026-03-28
**Status**: Commands Added, Task Page Structure Created

---

## ✅ What Was Just Completed

### 1. Commands Added to nodes.yaml ✅

Added commands for tasks, tickets, and time entries:

#### **plm.task Commands**
- `listComments` - List all comments on task
- `addComment` - Add comment to task
- `deleteComment` - Delete comment from task
- `listTickets` - List all tickets under task
- `recalculateProgress` - Recalculate progress from tickets

#### **core.ticket (plm-work-item profile) Commands**
- `listComments` - List all comments on ticket
- `addComment` - Add comment to ticket
- `deleteComment` - Delete comment from ticket
- `listTimeEntries` - List time entries for ticket
- `recalculateHours` - Recalculate actual hours

#### **core.entry (plm-time-log profile) Validations**
- Added validation rules for hours, date, category
- Required fields: date, hours, userId

---

### 2. Task Detail Page Structure Created ✅

Created the page structure following the Product page pattern:

#### **Created Files:**

1. ✅ `features/task/pages/TaskDetailPageEntry.tsx`
   - Module Federation entry point
   - Mount/unmount pattern
   - Loads TaskDetailPage component

2. ✅ `features/task/pages/TaskDetailPage.tsx`
   - Main task detail page
   - Fixed header + sidebar navigation
   - Section-based layout (overview, basic-info, tickets, time-entries, system-info)
   - Plugin client integration
   - Stats tracking

3. ✅ `features/task/sections/TicketsSectionV2.tsx`
   - Kanban board for tickets
   - 6 status columns (pending, in-progress, blocked, review, completed, cancelled)
   - Shows ticket type icons (bug 🐛, feature ✨, chore 🔧, task 📝)
   - Priority badges with colors
   - Assignee, due date, hours tracking
   - Edit/delete actions
   - Auto-recalculates task progress on ticket changes

---

## ❌ What Still Needs to Be Built

### High Priority Components (Week 1)

#### 1. Ticket Components

**Create these files:**

```
features/ticket/
├── components/
│   ├── TicketDialog.tsx                    # ❌ Create/edit ticket dialog
│   ├── TicketForm.tsx                      # ❌ Ticket form fields
│   └── DeleteTicketDialog.tsx              # ❌ Delete confirmation
```

**Requirements:**
- Form fields: name, description, ticketType, status, priority, assignee, dueDate, estimatedHours
- Use `TICKET_IDENTITY` constants
- Use `normalizeTicketStatus()` for status
- Call `recalculateTaskProgress()` after status changes

---

#### 2. Task Page Components

**Create these files:**

```
features/task/
├── components/
│   ├── TaskHeader.tsx                      # ❌ Fixed header with task info
│   ├── TaskSidebarNavigation.tsx          # ❌ Right sidebar with section links
│   └── TaskStatusBadge.tsx                 # ❌ Status badge (reuse existing?)
├── sections/
│   ├── TaskOverviewSection.tsx            # ❌ Overview with stats
│   ├── TaskBasicInfoSection.tsx           # ❌ Edit task details
│   ├── TaskTimeEntriesSection.tsx         # ❌ Time entries for task
│   └── TaskSystemInfoSection.tsx          # ❌ System metadata
```

**Pattern to Follow:**
- Copy from `features/product/v2/components/` and `features/product/v2/sections/`
- Replace "product" with "task"
- Adjust fields to match task schema

---

#### 3. Time Entry Components

**Create these files:**

```
features/time/
├── components/
│   ├── TimeEntryDialog.tsx                 # ❌ Log time dialog
│   ├── TimeEntryForm.tsx                   # ❌ Form fields
│   └── TimeEntryTable.tsx                  # ❌ Table of time entries
├── pages/
│   └── TimeEntriesPage.tsx                 # ❌ Standalone time log view
```

**Requirements:**
- Use `createTimeEntryWithRecalc()` helper
- Validates hours > 0, date not in future
- Shows actual vs estimated hours
- Auto-updates ticket and task actualHours

---

### 4. Module Federation Setup

**Update plugin.json:**

Add page routes for task detail:

```json
{
  "pages": [
    {
      "type": "plm.task",
      "path": "features/task/pages/TaskDetailPageEntry.tsx",
      "displayName": "Task Details",
      "description": "View and manage task with tickets"
    }
  ]
}
```

**Verify Module Federation:**
- Check `frontend/module-federation.config.js`
- Ensure TaskDetailPageEntry is exposed
- Test hot reload

---

## 📋 Implementation Checklist

### Week 1: Ticket Management

- [ ] **Day 1**: Ticket Components
  - [ ] Create `TicketDialog.tsx` with create/edit modes
  - [ ] Create `TicketForm.tsx` with all fields
  - [ ] Create `DeleteTicketDialog.tsx`
  - [ ] Test ticket CRUD operations

- [ ] **Day 2**: Task Page Components
  - [ ] Create `TaskHeader.tsx`
  - [ ] Create `TaskSidebarNavigation.tsx`
  - [ ] Create `TaskOverviewSection.tsx`
  - [ ] Create `TaskBasicInfoSection.tsx`

- [ ] **Day 3**: Integration
  - [ ] Wire up TicketDialog to TicketsSectionV2
  - [ ] Test ticket create/edit/delete
  - [ ] Verify progress recalculation works
  - [ ] Test Module Federation loading

- [ ] **Day 4**: Time Entries
  - [ ] Create `TimeEntryDialog.tsx`
  - [ ] Create `TaskTimeEntriesSection.tsx`
  - [ ] Test time logging + hour recalculation

- [ ] **Day 5**: Polish & Bug Fixes
  - [ ] Add loading states
  - [ ] Add error handling
  - [ ] Test all workflows end-to-end
  - [ ] Fix any bugs found

---

## 🎯 Quick Start Guide

### To Continue Implementation:

1. **Copy Product Components as Templates:**
   ```bash
   # Use these as reference:
   features/product/v2/components/ProductHeader.tsx
   features/product/v2/components/SidebarNavigation.tsx
   features/product/v2/sections/OverviewSection.tsx
   features/product/v2/sections/BasicInfoSection.tsx
   ```

2. **Follow the Pattern:**
   - TaskHeader ← ProductHeader
   - TaskSidebarNavigation ← SidebarNavigation
   - TaskOverviewSection ← OverviewSection
   - TaskBasicInfoSection ← BasicInfoSection

3. **Use Existing Helpers:**
   - `recalculateTaskProgress()` - after ticket status change
   - `recalculateActualHours()` - after time entry add/edit/delete
   - `normalizeTicketStatus()` - before saving ticket
   - `TICKET_IDENTITY` - for ticket creation

4. **Test with Real API:**
   ```typescript
   // The plugin client is already set up
   const client = createPluginClient({ orgId, deviceId, baseUrl, token });

   // Create ticket
   await client.createNode({
     type: 'core.ticket',
     profile: 'plm-work-item',
     name: 'Fix login bug',
     parentRef: taskId,
     identity: TICKET_IDENTITY.BUG,
     settings: {
       ticketType: 'bug',
       status: normalizeTicketStatus('pending'),
       priority: 'High'
     }
   });
   ```

---

## 📦 Dependencies

All dependencies are already in place:

- ✅ Helper functions (error handling, validation, recalculation)
- ✅ Type definitions (Task, Ticket, TimeEntry)
- ✅ Status normalization
- ✅ Commands defined in nodes.yaml
- ✅ Plugin client SDK available
- ✅ UI components (shadcn/ui) available

---

## 🔗 Related Documentation

- [SCOPE-NEXT-STEPS.md](./SCOPE-NEXT-STEPS.md) - Full 3-week plan
- [API-QUICK-REFERENCE.md](./API-QUICK-REFERENCE.md) - API examples
- [HOWTO-CORE-NODE.md](/home/user/code/go/nube/rubix-sdk/docs/HOWTO-CORE-NODE.md) - Node types guide
- [ProductDetailPageV2Entry.tsx](/home/user/code/go/nube/rubix-sdk/nube.plm/frontend/src/features/product/pages/ProductDetailPageV2Entry.tsx) - Reference example

---

## 🎉 Summary

**Infrastructure**: ✅ **100% Complete**
- Helper functions hardened
- Commands defined
- Page structure created
- Tickets section ready

**UI Components**: ⚠️ **30% Complete**
- TicketsSectionV2 created ✅
- TaskDetailPage structure created ✅
- Need dialogs, forms, and supporting components ❌

**Next Step**: Create `TicketDialog.tsx` and `TaskHeader.tsx` to make the UI fully functional!
