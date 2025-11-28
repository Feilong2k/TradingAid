# TradeAid2 - Cline Rules

## Project Rules for AI Assistant

### Documentation Rules
- **Pre-Commit Documentation**: Update `docs/KNOWLEDGE_TRANSFER.md` or `docs/TRADING_PLAN_MODAL_DEVELOPMENT_PLAN.md` BEFORE committing code changes
- **Documentation Workflow**: Documentation files must be updated before code changes are committed to ensure documentation reflects implementation
- **Combined Commits**: Documentation updates should be included in the same commit as code changes when they directly relate
- **Reference Implementation**: Documentation should reflect what was actually implemented, not planned changes
- **Mandatory Updates**: Documentation MUST be updated for every feature implementation or bug fix
- **Verification Step**: Always verify documentation is updated before committing code changes

### Documentation Update Workflow
1. **Implement Code Changes**: Complete all code modifications and testing
2. **Update Documentation**: Update documentation files to reflect implemented changes
3. **Commit Code and Documentation**: Use conventional commit format, including documentation updates in the same commit
4. **Push to Remote**: Push combined code and documentation changes to remote repository
5. **Verify Implementation**: Ensure documentation accurately reflects the code implementation

### Cline Workflow Enforcement (Assistant Behavior)
- **Docs Gate**: The assistant MUST NOT use attempt_completion until:
  1) Documentation files are updated to reflect code changes
  2) Code changes and documentation updates are committed together
  3) Combined commit is pushed to remote repository
  4) Git history shows documentation is included with implementation
  - **Scope of Docs Updates**:
  - Update `docs/KNOWLEDGE_TRANSFER.md` and/or `docs/TRADING_PLAN_MODAL_DEVELOPMENT_PLAN.md` to reflect actual implemented changes
  - Do not include planned but unimplemented work
- **Commit Hygiene**:
  - Use conventional commits for code changes (e.g., `feat:`, `fix:`, `refactor:`)
  - Include documentation updates in the same commit as code changes


### Code Structure Rules
- **Respect Architecture**: Maintain clear separation between backend (Node.js/Express) and frontend (Vue 3)
- **AI Personality**: Always use the existing AI personality system in `backend/src/config/aiPersonality.js`
- **Emotional Check Flow**: Keep emotional check logic aligned with documented workflows in `docs/`
- **REST Consistency**: Follow existing patterns in Express routes (see `backend/src/routes/tradePlans.js`)
- **Vue Patterns**: Use Composition API patterns as seen in `frontend/src/components/NewTradePlanModal.vue`

### Development Process Rules
- **Read Before Writing**: Always review relevant documentation sections before making changes
- **Test Before Commit**: Implement and test code changes before committing
- **Git Hygiene**: Use conventional commit format and ensure clean commit history
- **Documentation First**: Always update documentation before committing code changes

### File Organization Rules
- **Backend Structure**: Keep backend code in `backend/src/` with proper separation (routes, models, services, middleware)
- **Frontend Structure**: Keep frontend code in `frontend/src/` with Vue 3 Composition API patterns
- **Documentation Location**: All project documentation belongs in `docs/` directory
- **Configuration**: Use environment variables and existing configuration patterns

### AI Integration Rules
- **Aria Persona**: Maintain the "Aria" female trading coach persona with warm, supportive communication style
- **Context Awareness**: Ensure AI responses consider trading context (first trade, streaks, etc.)
- **Emotional Flow**: Follow the documented emotional check-in workflow before analysis
- **Response Length**: Keep AI responses concise (2-3 paragraphs maximum)

### Security Rules
- **Input Validation**: Always use Joi validation for API endpoints
- **Authentication**: Respect JWT token authentication for protected routes
- **Error Handling**: Implement proper error handling and user-friendly messages
- **No Hardcoded Secrets**: Use environment variables for sensitive data

### Command Syntax Rules
- **PowerShell Compatibility**: Use semicolons (`;`) instead of `&&` for command chaining in PowerShell
- **Command Examples**: 
  - Use: `cd backend; npm run dev`
  - Avoid: `cd backend && npm run dev`
  - Use: `cd frontend; npm run build`
  - Avoid: `cd frontend && npm run build`

### Quality Rules
- **Code Consistency**: Follow existing code style and patterns
- **Error Prevention**: Validate and normalize data before API submission
- **User Experience**: Prioritize progressive disclosure and clear user guidance
- **Performance**: Optimize API calls and avoid unnecessary re-renders in Vue components
