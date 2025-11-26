# TradeAid2 - Cline Rules

## Project Rules for AI Assistant

### Documentation Rules
- **Post-Push Documentation**: Do NOT update `docs/KNOWLEDGE_TRANSFER.md` or `docs/TRADING_PLAN_MODAL_DEVELOPMENT_PLAN.md` during feature implementation
- **Documentation Workflow**: Only update documentation files AFTER code changes have been committed and pushed to remote repository
- **Separate Commits**: Documentation updates must be in separate commits from code changes
- **Reference Implementation**: Documentation should reflect what was actually implemented, not planned changes

### Code Structure Rules
- **Respect Architecture**: Maintain clear separation between backend (Node.js/Express) and frontend (Vue 3)
- **AI Personality**: Always use the existing AI personality system in `backend/src/config/aiPersonality.js`
- **Emotional Check Flow**: Keep emotional check logic aligned with documented workflows in `docs/`
- **REST Consistency**: Follow existing patterns in Express routes (see `backend/src/routes/tradePlans.js`)
- **Vue Patterns**: Use Composition API patterns as seen in `frontend/src/components/NewTradePlanModal.vue`

### Development Process Rules
- **Read Before Writing**: Always review relevant documentation sections before making changes
- **Test Before Docs**: Implement and test code changes before updating documentation
- **Git Hygiene**: Use conventional commit format and ensure clean commit history
- **Push First**: Always push code changes before updating documentation files

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

### Quality Rules
- **Code Consistency**: Follow existing code style and patterns
- **Error Prevention**: Validate and normalize data before API submission
- **User Experience**: Prioritize progressive disclosure and clear user guidance
- **Performance**: Optimize API calls and avoid unnecessary re-renders in Vue components
