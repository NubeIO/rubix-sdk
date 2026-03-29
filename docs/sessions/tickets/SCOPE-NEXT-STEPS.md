# PLM Ticket System - Project Scope & Next Steps

**Date**: 2026-03-28
**Status**: Infrastructure Complete, UI Implementation Needed

---

## Executive Summary

**What's Done**: Core data models, helper functions, and Task UI are complete.

**What's Next**: Build Ticket and Time Entry UI components to complete the system.

**Timeline Estimate**: 2-3 weeks for full implementation + testing

---

## Current State

### ✅ Completed (Infrastructure Layer)

| Component | Status | Files |
|-----------|--------|-------|
| **Data Models** | ✅ Complete | `task.types.ts`, `ticket.types.ts`, `time-entry.types.ts` |
| **Helper Functions** | ✅ Complete | `task-helpers.ts`, `ticket-helpers.ts`, `time-entry-helpers.ts` |
| **Status Normalization** | ✅ Complete | All 6 statuses implemented |
| **Task UI** | ✅ Complete | `TasksPage.tsx`, `TaskTable.tsx`, tabs, badges |
| **Documentation** | ✅ Complete | README, DESIGN-DECISIONS, API-QUICK-REFERENCE |
| **Critical Bugs** | ✅ Fixed | parentRef, identity tags, normalization |

### ❌ Not Started (UI Layer)

| Component | Status | Description |
|-----------|--------|-------------|
| **Ticket UI** | ❌ Not Started | List, create, edit, delete tickets |
| **Time Entry UI** | ❌ Not Started | Log time, view time entries |
| **Task ↔ Ticket Integration** | ❌ Not Started | View tickets under tasks, move tickets |
| **Comments UI** | ❌ Not Started | Add/view/delete comments |
| **Tests** | ❌ Not Started | Integration tests for calculated fields |

---

## Phase 1: Ticket Management UI (Week 1)

### 1.1 Ticket List Page

**Goal**: Display all tickets for a task or product

**Files to Create**:
```
features/ticket/
├── pages/
│   └── TicketsPage.tsx                    # Main ticket list page
├── components/
│   ├── TicketTable.tsx                    # Table of tickets
│   ├── TicketRow.tsx                      # Single ticket row
│   └── TicketStatusBadge.tsx              # Status badge component
```

**Requirements**:
- Show tickets in a table (similar to TaskTable)
- Support filtering by status, priority, assignee
- Support sorting by due date, priority, created date
- Context menu for edit/delete
- Empty state when no tickets

**Acceptance Criteria**:
- [ ] Can view all tickets for a task
- [ ] Can view all tickets for a product (uses `getAllProductTickets()` helper)
- [ ] Can filter by status, priority
- [ ] Can sort by multiple fields
- [ ] Right-click menu works

---

### 1.2 Create Ticket Dialog

**Files to Create**:
```
features/ticket/
├── components/
│   ├── TicketDialog.tsx                   # Create/edit dialog
│   └── TicketForm.tsx                     # Form fields
```

**Requirements**:
- Form fields: name, description, ticketType, status, priority, assignee, dueDate, estimatedHours
- Use `TICKET_IDENTITY` constants for identity tags
- Use `normalizeTicketStatus()` for status
- Add `productRef` when creating ticket under task
- Validation: name required, hours must be positive

**Acceptance Criteria**:
- [ ] Can create ticket under task
- [ ] Can create ticket under product (standalone)
- [ ] Status is normalized automatically
- [ ] Identity tags are set correctly
- [ ] productRef is added when needed
- [ ] Form validation works

---

### 1.3 Edit Ticket Dialog

**Files to Update**:
```
features/ticket/components/TicketDialog.tsx  # Reuse for edit
```

**Requirements**:
- Reuse TicketDialog component in "edit mode"
- Pre-populate form with existing ticket data
- Call `normalizeTicketStatus()` on save
- After status change to/from 'completed', call `recalculateTaskProgress()`

**Acceptance Criteria**:
- [ ] Can edit ticket name, description
- [ ] Can change status (triggers progress recalc)
- [ ] Can change priority, assignee
- [ ] Can update estimated/actual hours
- [ ] Changes are saved correctly

---

### 1.4 Delete Ticket

**Requirements**:
- Confirmation dialog
- After delete, call `recalculateTaskProgress()` for parent task
- Show warning if ticket has time entries

**Acceptance Criteria**:
- [ ] Delete confirmation shown
- [ ] Ticket is deleted
- [ ] Parent task progress updates
- [ ] Warning shown if time entries exist

---

### 1.5 Task → Ticket Integration

**Files to Update**:
```
features/task/
├── components/
│   └── TaskTable.tsx                      # Add expand/collapse
└── pages/
    └── TasksPage.tsx                      # Show ticket count
```

**Requirements**:
- Show ticket count on each task row
- Expandable rows to show tickets under task
- Click task name to view task detail with tickets
- Action to "Add Ticket" from task view

**Acceptance Criteria**:
- [ ] Task table shows ticket count
- [ ] Can expand task to see tickets
- [ ] Can click task to see detail view
- [ ] Can add ticket from task view

---

## Phase 2: Time Entry UI (Week 2)

### 2.1 Time Entry List

**Files to Create**:
```
features/time/
├── pages/
│   └── TimeEntriesPage.tsx                # Time log view
├── components/
│   ├── TimeEntryTable.tsx                 # Table of entries
│   └── TimeEntryRow.tsx                   # Single entry row
```

**Requirements**:
- Show time entries for a ticket
- Show time entries for a user (timesheet view)
- Group by date or ticket
- Show total hours
- Support filtering by date range, user

**Acceptance Criteria**:
- [ ] Can view time entries for ticket
- [ ] Can view timesheet for user
- [ ] Shows total hours
- [ ] Can filter by date range
- [ ] Can sort by date, hours

---

### 2.2 Log Time Dialog

**Files to Create**:
```
features/time/
├── components/
│   ├── TimeEntryDialog.tsx                # Log time dialog
│   └── TimeEntryForm.tsx                  # Form fields
```

**Requirements**:
- Form fields: date, hours, description, category
- Date picker for date selection
- Hours input (decimal, e.g., 2.5)
- Use `createTimeEntryWithRecalc()` helper (auto-updates actualHours)
- Validation: hours > 0, date not in future

**Acceptance Criteria**:
- [ ] Can log time on a ticket
- [ ] Date picker works
- [ ] Hours can be decimal (2.5)
- [ ] Ticket actualHours updates automatically
- [ ] Task actualHours updates automatically
- [ ] Form validation works

---

### 2.3 Edit/Delete Time Entry

**Requirements**:
- Edit time entry hours, description
- Delete time entry
- After edit/delete, use `recalculateActualHours()` for ticket
- After edit/delete, use `recalculateTaskActualHours()` for task

**Acceptance Criteria**:
- [ ] Can edit time entry
- [ ] Can delete time entry
- [ ] Ticket actualHours updates
- [ ] Task actualHours updates
- [ ] Confirmation shown for delete

---

### 2.4 Time Entry in Ticket View

**Files to Update**:
```
features/ticket/
├── pages/
│   └── TicketDetailPage.tsx               # New detail view
```

**Requirements**:
- Ticket detail page shows time entries
- Shows actualHours vs estimatedHours
- Button to "Log Time"
- Inline time entry list

**Acceptance Criteria**:
- [ ] Ticket detail shows time entries
- [ ] Shows hours comparison
- [ ] Can log time from detail page
- [ ] Time entries update in real-time

---

## Phase 3: Comments & Polish (Week 3)

### 3.1 Comments UI

**Files to Create**:
```
features/comments/
├── components/
│   ├── CommentsThread.tsx                 # Full comments thread
│   ├── CommentItem.tsx                    # Single comment
│   └── CommentForm.tsx                    # Add comment form
```

**Requirements**:
- Use `executeGetCommand(client, nodeId, 'listComments')`
- Use `executePostCommand(client, nodeId, 'addComment', { text })`
- Use `executeDeleteCommand(client, nodeId, 'deleteComment', { id })`
- Show comment count badge on tasks/tickets
- Inline comments on task/ticket detail pages

**Acceptance Criteria**:
- [ ] Can add comment to task
- [ ] Can add comment to ticket
- [ ] Can delete own comments
- [ ] Shows comment count
- [ ] Comments are chronological

---

### 3.2 Bulk Operations

**Files to Create**:
```
features/task/utils/bulk-operations.ts
features/ticket/utils/bulk-operations.ts
```

**Requirements**:
- Bulk status change (multiple tickets)
- Bulk assign (multiple tickets)
- Bulk delete with confirmation
- After bulk operations, recalculate all affected tasks

**Acceptance Criteria**:
- [ ] Can select multiple tickets
- [ ] Can bulk change status
- [ ] Can bulk assign
- [ ] Can bulk delete
- [ ] Progress updates correctly

---

### 3.3 Search & Filters

**Files to Create**:
```
features/search/
├── components/
│   ├── SearchBar.tsx                      # Global search
│   └── FilterPanel.tsx                    # Advanced filters
```

**Requirements**:
- Search tickets by name, description
- Filter by status, priority, assignee, tags
- Filter by date range (created, due)
- Save filter presets

**Acceptance Criteria**:
- [ ] Can search tickets
- [ ] Can filter by multiple criteria
- [ ] Can save filter presets
- [ ] Search is fast (<500ms)

---

### 3.4 Reports & Dashboards

**Files to Create**:
```
features/reports/
├── pages/
│   └── ReportsPage.tsx
├── components/
│   ├── BurndownChart.tsx
│   ├── TimeBreakdown.tsx
│   └── TeamVelocity.tsx
```

**Requirements**:
- Task completion over time
- Time logged by user/category
- Tickets by status (pie chart)
- Overdue tickets report

**Acceptance Criteria**:
- [ ] Shows task burndown
- [ ] Shows time breakdown
- [ ] Shows ticket distribution
- [ ] Can export to CSV

---

## Phase 4: Testing & Polish (Concurrent)

### 4.1 Integration Tests

**Files to Create**:
```
tests/
├── task-progress.test.ts                  # Test progress recalc
├── actual-hours.test.ts                   # Test hours recalc
└── ticket-lifecycle.test.ts               # Full ticket flow
```

**Requirements**:
- Test `recalculateTaskProgress()` after ticket status change
- Test `recalculateActualHours()` after time entry add/edit/delete
- Test `getAllProductTickets()` with direct + nested tickets
- Test status normalization edge cases

**Acceptance Criteria**:
- [ ] All helper functions have tests
- [ ] Calculated field updates are tested
- [ ] 2-query ticket fetching is tested
- [ ] Status normalization is tested

---

### 4.2 Error Handling

**Requirements**:
- Network error handling (retry, offline mode)
- Optimistic updates with rollback
- Form validation errors
- Loading states everywhere

**Acceptance Criteria**:
- [ ] Network errors show user-friendly messages
- [ ] Optimistic updates work
- [ ] Form errors are clear
- [ ] Loading states shown

---

### 4.3 Performance Optimization

**Requirements**:
- React Query for caching
- Virtualized lists for large datasets
- Debounced search
- Lazy load time entries

**Acceptance Criteria**:
- [ ] Queries are cached
- [ ] Large lists perform well
- [ ] Search doesn't lag
- [ ] Page load is fast

---

## Phase 5: Documentation & Handoff

### 5.1 User Documentation

**Files to Create**:
```
docs/
├── USER-GUIDE.md                          # End-user guide
├── ADMIN-GUIDE.md                         # Admin setup
└── TROUBLESHOOTING.md                     # Common issues
```

---

### 5.2 Developer Documentation

**Requirements**:
- Update README with UI patterns
- Add component storybook
- Add API examples for tickets/time
- Migration guide if needed

---

## Critical Path & Dependencies

```
Week 1: Tickets
├─ Day 1-2: TicketTable + TicketDialog (create)
├─ Day 3: TicketDialog (edit) + Delete
├─ Day 4: Task ↔ Ticket integration
└─ Day 5: Polish + bug fixes

Week 2: Time Entries
├─ Day 1-2: TimeEntryTable + Dialog
├─ Day 3: Edit/Delete + Recalculation
├─ Day 4: Integration with Ticket detail
└─ Day 5: Polish + bug fixes

Week 3: Comments + Polish
├─ Day 1-2: Comments UI
├─ Day 3: Bulk operations
├─ Day 4: Search & filters
└─ Day 5: Reports (basic)
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Calculated fields drift | High | High | ✅ Already mitigated with helpers |
| 2-query performance issue | Medium | Medium | Use productRef + caching |
| Complex UI state management | Medium | Medium | Use React Query for server state |
| Time entry validation edge cases | Low | Medium | Comprehensive form validation |

---

## Success Metrics

**MVP Complete When**:
- [ ] Can create/edit/delete tasks
- [ ] Can create/edit/delete tickets
- [ ] Can log time on tickets
- [ ] actualHours and progress update correctly
- [ ] Can view all tickets for a product (2-query works)
- [ ] Status normalization prevents data drift

**Production Ready When**:
- [ ] All above + comments working
- [ ] All above + integration tests passing
- [ ] All above + error handling complete
- [ ] All above + performance acceptable (<1s load time)

---

## Open Questions

1. **Q**: Should tickets have subtasks (ticket → ticket)?
   - **A**: Discouraged per DESIGN-DECISIONS.md L4, but not blocked. Decision needed.

2. **Q**: Should we enforce productRef on all tickets?
   - **A**: Recommended but not required. Makes queries simpler.

3. **Q**: Should actualHours be editable manually?
   - **A**: No - calculated only. Prevents drift.

4. **Q**: What happens when task is deleted with tickets?
   - **A**: Cascade delete OR move to product. Need to decide.

---

## Resources Needed

- **Frontend Developer**: 1 FTE for 3 weeks
- **Designer**: UI mockups for ticket/time entry forms
- **QA**: Integration testing + manual testing
- **Backend Support**: If API changes needed

---

## Next Immediate Actions

1. **Today**: Review this scope, get approval
2. **Tomorrow**: Start on TicketsPage.tsx + TicketTable.tsx
3. **This Week**: Complete Phase 1 (Ticket UI)
4. **Next Week**: Phase 2 (Time Entry UI)
5. **Week 3**: Phase 3 (Polish + Comments)

---

## Appendix: File Structure After Completion

```
nube.plm/frontend/src/features/
├── task/
│   ├── types/task.types.ts                ✅
│   ├── utils/
│   │   ├── task-status.ts                 ✅
│   │   ├── task-helpers.ts                ✅
│   │   └── task-date.ts                   ✅
│   ├── components/
│   │   ├── TaskTable.tsx                  ✅
│   │   └── TaskStatusBadge.tsx            ✅
│   └── pages/
│       ├── TasksPage.tsx                  ✅
│       └── tasks-page-tabs.tsx            ✅
├── ticket/
│   ├── types/ticket.types.ts              ✅
│   ├── utils/ticket-helpers.ts            ✅
│   ├── components/
│   │   ├── TicketTable.tsx                ❌ TODO
│   │   ├── TicketRow.tsx                  ❌ TODO
│   │   ├── TicketDialog.tsx               ❌ TODO
│   │   ├── TicketForm.tsx                 ❌ TODO
│   │   └── TicketStatusBadge.tsx          ❌ TODO
│   └── pages/
│       ├── TicketsPage.tsx                ❌ TODO
│       └── TicketDetailPage.tsx           ❌ TODO
├── time/
│   ├── types/time-entry.types.ts          ✅
│   ├── utils/time-entry-helpers.ts        ✅
│   ├── components/
│   │   ├── TimeEntryTable.tsx             ❌ TODO
│   │   ├── TimeEntryDialog.tsx            ❌ TODO
│   │   └── TimeEntryForm.tsx              ❌ TODO
│   └── pages/
│       └── TimeEntriesPage.tsx            ❌ TODO
├── comments/
│   └── components/
│       ├── CommentsThread.tsx             ❌ TODO
│       ├── CommentItem.tsx                ❌ TODO
│       └── CommentForm.tsx                ❌ TODO
└── search/
    └── components/
        ├── SearchBar.tsx                  ❌ TODO
        └── FilterPanel.tsx                ❌ TODO
```

**Legend**:
- ✅ Complete
- ❌ TODO
- ⚠️ In Progress
