# Documentation Workflow Guide

## Overview
This document outlines the proper workflow for ensuring documentation is updated before code changes are committed, as required by the project's Cline rules.

## Core Principle
**Documentation MUST be updated BEFORE code changes are committed to git.** This ensures documentation always reflects the actual implementation.

## Step-by-Step Workflow

### 1. Implementation Phase
```bash
# Make your code changes
# Test thoroughly
# Ensure everything works as expected
```

### 2. Documentation Update Phase (BEFORE Git Operations)
```bash
# Update relevant documentation files BEFORE any git operations
# Required files: docs/KNOWLEDGE_TRANSFER.md and/or docs/TRADING_PLAN_MODAL_DEVELOPMENT_PLAN.md
```

### 3. Git Operations Phase
```bash
# Stage documentation files FIRST
git add docs/KNOWLEDGE_TRANSFER.md
git add docs/TRADING_PLAN_MODAL_DEVELOPMENT_PLAN.md

# Then stage code changes
git add frontend/src/components/NewTradePlanModal.vue
# or use specific file paths, not git add .

# Commit documentation and code together
git commit -m "fix: improve modal closing and chat experience

- Fix modal closing functionality for X buttons
- Improve chat scrolling with CSS fixes
- Update documentation to reflect changes"
```

## Common Mistakes to Avoid

### ❌ Wrong Approach
```bash
# DON'T: Stage everything without checking documentation
git add .

# DON'T: Commit code before updating documentation
git commit -m "fix: modal improvements"

# DON'T: Make separate commits for documentation
git commit -m "docs: update modal changes"
```

### ✅ Correct Approach
```bash
# DO: Update documentation first
# DO: Stage documentation files explicitly
git add docs/KNOWLEDGE_TRANSFER.md

# DO: Stage code files explicitly
git add frontend/src/components/NewTradePlanModal.vue

# DO: Commit documentation and code together
git commit -m "fix: modal improvements with documentation updates"
```

## Verification Checklist

Before committing, verify:
- [ ] Documentation files are updated to reflect code changes
- [ ] Documentation accurately describes what was implemented (not planned)
- [ ] Both documentation and code changes are staged together
- [ ] Commit message describes both code and documentation changes

## Automated Workflow Template

For consistency, follow this pattern:

```bash
# 1. Make code changes and test
# 2. Update documentation files
# 3. Stage changes in this order:
git add docs/KNOWLEDGE_TRANSFER.md
git add [code files...]
# 4. Commit with descriptive message
git commit -m "type: description of changes

- List of specific changes
- Include documentation updates"
# 5. Push to remote
git push
```

## Why This Matters

- **Knowledge Preservation**: Documentation reflects actual implementation, not intentions
- **Team Collaboration**: Other developers can understand what was built
- **Maintenance**: Future changes are easier with accurate documentation
- **Quality Assurance**: Forces thinking through changes before committing

## Enforcement

The Cline assistant will:
- Refuse to complete tasks until documentation is updated
- Verify documentation is included in commits
- Ensure commit messages reference documentation updates
- Check that git history shows documentation alongside implementation

---

*Last updated: November 26, 2025*
