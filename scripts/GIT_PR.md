# Git Pull Request Guidelines (for AI)

This document defines how AI should generate pull request descriptions for this repository.

## PR Description Scope

### 🚨 CRITICAL RULE: CURRENT BRANCH ONLY 🚨

**Analyze ONLY commits that exist on the current branch but NOT in the base branch.**

**DO NOT include:**
- ❌ Commits from other feature branches
- ❌ Commits already in main/master
- ❌ Merged PR commits from other branches
- ❌ Any changes not authored on this specific branch

**REQUIRED workflow:**
1. **First** - Run `git branch --show-current` to identify the branch
2. **Second** - Run `git log main...HEAD --oneline` (use three dots `...`)
3. **Third** - Only describe commits from step 2
4. **Verify** - If you see 50+ commits, double-check you're not including main's history

The three-dot syntax `main...HEAD` shows commits in HEAD that are NOT in main. This is the ONLY correct way to identify branch-specific commits.

### Default Behavior: Summary Mode

**By default, provide a summarized overview:**

- Group related commits logically by feature/area
- Provide high-level bullet points
- Keep it concise and readable
- Focus on the "why" and "what changed" not individual commit details

**Example:**
```markdown
## Summary
Added navigation builder with team/user management and lazy loading support.

## Changes
- Navigation system with drag-and-drop functionality
- Team and user association pages
- Lazy loading for improved performance
- Fixed several routing issues

```

### Detailed Mode (on request)

**When user requests detailed commit listing:**

User can ask for:
- "detailed PR description"
- "include all commits"
- "show commit numbers"
- "list each commit"

Provide:
- Each commit with its hash
- Organized by logical groupings
- More granular breakdown of changes

**Example:**
```markdown
## Summary
Navigation and user management improvements

## Detailed Changes

### Navigation Builder
- `22885fe5` got auth/nav working
- `4cb3cc63` added teams to nav builder page
- `9a1b1f0b` added nav builder
- `ce236ac1` update to nav page

### User Management
- `4fec983e` fix ref on user
- `a5339a7d` got add user working
- `83bf51bd` clean up on teams/users pages

### Bug Fixes
- `48526c13` fixed add nodes to nav
- `8c67e067` added node name when adding a new node
```

## Output Format

**Always return the PR description as a rendered markdown code block** so the user can copy it directly:

````
```markdown
## Summary
...
```
````

Do not just dump plain text - wrap it in a fenced markdown code block.

## PR Description Format

Always use this structure:

```markdown
## Summary
<1-3 sentence overview of what this PR accomplishes>

## Changes
<Bulleted list of main changes - summary mode or detailed mode based on user request>

## Test Plan (only if requested)
<Only include a test plan section if the user explicitly asks for one. Do not generate it by default.>
DONT SAY THIS  🤖 Generated with [Claude Code](https://claude.com/claude-code)

```

## Style Guidelines

- **Casual but clear**: Don't be overly formal, match the repo's commit style
- **No fluff**: Get to the point, developers are busy
- **Logical grouping**: Group related changes together
- **User-focused**: Describe what changed from a user perspective when possible
- **No em dashes**: Never use `—` in PR descriptions. Use `-` or `:` instead

## Commands to Gather PR Info

**MANDATORY STEPS - Execute in this exact order:**

```bash
# STEP 1: Identify the current branch
git branch --show-current

# STEP 2: Get ONLY commits unique to this branch (note the three dots)
git log main...HEAD --oneline

# STEP 3: Verify commit count makes sense for the PR
# - If 100+ commits: likely including merged history (wrong!)
# - If 5-20 commits: probably correct for a feature branch
# - STOP and verify if numbers seem off

# STEP 4: Get the actual code changes for this branch only
git diff main...HEAD --stat

# STEP 5: Confirm clean working state
git status
```

**⚠️ VERIFICATION CHECK:**
After running the commands, ask yourself:
- Does the commit count match what you'd expect for a single feature?
- Are the commit messages all related to the same feature/area?
- If you see commits like "Merge pull request #XXX", you've included other branches (WRONG!)


## Examples

### User says: "create a PR"
→ Use **summary mode** (default)

### User says: "create a detailed PR" or "create PR with all commits"
→ Use **detailed mode** with commit hashes

### User says: "create a PR description"
→ Use **summary mode** (default)

### User says: "show me all the commits in a PR format"
→ Use **detailed mode** with commit hashes

## Common Mistakes to AVOID

❌ **WRONG: Including merged branches**
```bash
git log main..HEAD  # Two dots - can include merged history!
```

✅ **CORRECT: Only this branch**
```bash
git log main...HEAD  # Three dots - only unique commits
```

❌ **WRONG: Describing unrelated features**
- If the branch is called `add-widget` but your description mentions database migrations, navigation updates, and authentication changes, you've likely included other branches

✅ **CORRECT: Focused on branch purpose**
- Branch `add-widget` should describe widget-related changes only
- If you see 100 commits, something is wrong - verify your git commands

❌ **WRONG: Listing commits already in main**
- Check if commits you're listing already exist in main by looking at the git log output carefully

✅ **CORRECT: Only net-new work**
- The PR description should only include work that this branch adds on top of main
