# TradeAid2 - Cline Workflows

## Available Workflows for AI Assistant

### Workflow A: Implement Trading Feature
**Purpose**: Implement new trading features or modify existing ones without touching documentation

**Steps:**
1. **Read Documentation** (Read-only)
   - Read `docs/KNOWLEDGE_TRANSFER.md` for project context
   - Read `docs/TRADING_PLAN_MODAL_DEVELOPMENT_PLAN.md` for specific feature plans
   - Understand existing architecture and patterns

2. **Analyze Impact**
   - Identify which files will be affected (backend, frontend, models, routes, services)
   - Check existing code patterns in similar files
   - Plan data model changes if needed

3. **Implement Code Changes**
   - Make targeted changes to backend/frontend code
   - Follow existing patterns and coding standards
   - Maintain AI personality and emotional check flow consistency

4. **Test & Validate**
   - Check for syntax errors
   - Verify API endpoint consistency
   - Ensure no breaking changes to existing functionality

5. **Git Operations**
   - `git add .` to stage changes
   - `git commit -m "feat: [clear description of changes]"` using conventional commit format
   - `git push origin master` to push changes to remote

6. **Stop** - Do NOT update documentation files in this workflow

---

### Workflow B: Post-Push Documentation Update
**Purpose**: Update documentation files AFTER code has been pushed to remote repository

**Trigger Condition**: After successful completion of Workflow A (code pushed)

**Steps:**
1. **Sync Repository**
   - `git pull` to ensure local is up to date with remote
   - Verify recent commits are present

2. **Analyze Changes**
   - `git log -1` to see the most recent commit
   - `git diff HEAD~1` to see what changed in the last commit
   - Map code changes to documentation sections

3. **Update KNOWLEDGE_TRANSFER.md**
   - Add new section under "Recent Changes & Improvements" if needed
   - Update existing sections to reflect implemented changes
   - Include technical implementation details and lessons learned
   - Keep format consistent with existing structure

4. **Update TRADING_PLAN_MODAL_DEVELOPMENT_PLAN.md**
   - Update "Existing Foundation" section with new accomplishments
   - Mark completed items in implementation timeline
   - Add any new insights or patterns discovered
   - Keep development plan aligned with actual implementation

5. **Documentation Quality Check**
   - Ensure documentation accurately reflects what was implemented
   - Check for consistency between both documentation files
   - Verify technical details are correct and complete

6. **Commit Documentation Changes**
   - `git add docs/` to stage documentation updates
   - `git commit -m "chore(docs): document [feature name] implementation"`
   - `git push origin master` to push documentation updates

---

### Workflow C: Quick Documentation Sync
**Purpose**: Minor documentation updates for small changes or corrections

**Steps:**
1. **Identify Change Scope**
   - Determine if change affects both documentation files or just one
   - Check if it's a correction, addition, or update

2. **Make Targeted Updates**
   - Update only the affected sections
   - Keep changes minimal and focused

3. **Commit & Push**
   - `git add docs/`
   - `git commit -m "docs: [brief description of update]"`
   - `git push origin master`

---

### Workflow D: Emergency Bug Fix
**Purpose**: Quick fixes for critical bugs or errors

**Steps:**
1. **Identify Problem**
   - Locate the source of the bug
   - Check error logs and recent changes

2. **Implement Fix**
   - Make minimal changes to resolve the issue
   - Avoid scope creep

3. **Test Fix**
   - Verify the fix resolves the issue
   - Check for regressions

4. **Commit & Push**
   - `git add [affected files]`
   - `git commit -m "fix: [description of fix]"`
   - `git push origin master`

5. **Optional**: Run Workflow B if documentation needs updating

---

## Workflow Selection Guidelines

### Use Workflow A when:
- Implementing new features
- Modifying existing functionality
- Adding new API endpoints
- Updating UI components

### Use Workflow B when:
- Code changes have been pushed in Workflow A
- Documentation needs to reflect recent implementations
- Keeping project documentation current

### Use Workflow C when:
- Fixing typos or formatting in docs
- Adding minor clarifications
- Updating documentation without code changes

### Use Workflow D when:
- Critical bugs are found
- Production issues need immediate attention
- Security vulnerabilities are discovered

## Best Practices

### Always:
- Follow the rules in `cline_rules.md`
- Maintain separation between code and documentation commits
- Use conventional commit messages
- Test changes before pushing

### Never:
- Update documentation during feature implementation
- Mix code and documentation in the same commit
- Push untested changes
- Bypass the established workflows without good reason

### Remember:
- Documentation should always reflect the current state of the implemented code
- Code changes come first, documentation updates come after
- Keep commits focused and atomic
- Maintain the project's architectural patterns and coding standards
