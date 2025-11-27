# TradeAid2 - Knowledge Transfer Document

## Project Overview

TradeAid2 is a **psychological trading assistant application** that helps traders make better decisions by incorporating emotional awareness into their trading process. The application focuses on emotional discipline and structured trading workflows.

### Core Purpose
- Integrate emotional intelligence with technical trading
- Help traders assess their emotional state before making trades
- Provide structured decision-making framework
- Track trading performance with psychological context

### Tech Stack
- **Frontend**: Vue 3 + Composition API, Pinia (state management), Vite (build tool)
- **Backend**: Node.js + Express, MongoDB + Mongoose
- **Authentication**: Google OAuth 2.0 with JWT tokens
- **Deployment**: Netlify (frontend), Render (backend)

---

## Security Implementation

### Recent Security Improvements

#### 1. Input Validation
- **Library**: Joi validation
- **Location**: `backend/src/middleware/validation.js`
- **Schemas Implemented**:
  - OAuth callback codes
  - Trade plan creation
  - Trade plan updates

```javascript
// Example validation schema
const oauthCallbackSchema = Joi.object({
  code: Joi.string().required().min(10).max(500)
    .pattern(/^[a-zA-Z0-9\-_\.\/+=]+$/)
});
```

#### 2. Authentication Security
- **JWT Token Storage**: localStorage (consider moving to httpOnly cookies)
- **Auto-logout**: 30-minute inactivity timeout
- **Token Validation**: Backend middleware for protected routes
- **Activity Tracking**: Mouse/keyboard/touch events for session management

#### 3. OAuth Flow Security
- **Original Issue**: Tokens passed in URL parameters (fixed)
- **Current Flow**: Secure redirect with encoded parameters
- **Validation**: Proper Google authorization code format validation

---

## Authentication System

### OAuth Flow
1. Frontend calls `/auth/google` to get authorization URL
2. Redirect to Google OAuth consent screen
3. Google redirects to `/auth/google/callback` with code
4. Backend exchanges code for tokens, creates/retrieves user
5. Redirect to frontend `/auth-success` with JWT token and user data
6. Frontend stores token and redirects to `/planning`

### Key Files
- **Backend Routes**: `backend/src/routes/auth.js`
- **Frontend Store**: `frontend/src/stores/auth.js`
- **OAuth Utility**: `backend/src/utils/googleOAuth.js`
- **Auth Middleware**: `backend/src/middleware/auth.js`

### Session Management
- **Token Validation**: `/auth/validate` endpoint
- **Auto-logout**: 30-minute inactivity
- **Activity Tracking**: Multiple event listeners
- **Logout**: Client-side token removal + API call

---

## Data Models & Architecture

### User Model (`backend/src/models/User.js`)
```javascript
{
  googleId: String (required, unique),
  email: String (required, unique),
  name: String (required),
  picture: String,
  lastActivity: Date,
  timestamps: true
}
```

### TradePlan Model (`backend/src/models/TradePlan.js`)
```javascript
{
  userId: ObjectId (ref: User),
  asset: String (required),
  direction: String (enum: ['long', 'short']),
  timeframe: String (enum: timeframes),
  emotionalState: {
    state: String (emotional states enum),
    bodySignals: Array of { signal: String, intensity: Number },
    notes: String,
    aiAnalysis: String,
    timestamp: Date
  },
  status: String (workflow status enum),
  decision: String (decision enum),
  timestamps: true
}
```

### API Routes Structure
- **Auth Routes**: `/auth/*` (OAuth, validation, logout)
- **Trade Plan Routes**: `/api/trade-plans/*` (CRUD operations)
- **Protected Routes**: Use `authenticateToken` middleware

---

## Development Environment

### Backend Setup
```bash
cd backend
npm install
npm run dev  # Development server
npm start   # Production server
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Development server
npm run build  # Production build
```

### Environment Variables

#### Backend (`.env`)
```
MONGODB_URI=mongodb://localhost:27017/tradingapp
PORT=3000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret
```

#### Frontend (`.env.production`)
```
VITE_API_BASE_URL=https://tradingaid.onrender.com
```

### Database Connection
- MongoDB with connection retry logic
- 30-second server selection timeout
- 45-second socket timeout
- Connection pooling (max 10 connections)

---

## Recent Changes & Improvements

### Trade Plan Status Management & Active Trades Integration (November 26, 2025)

#### 1. Enhanced Trade Plan Status Workflow
- **Status Enum Expanded**: Added 'open' status and set as default for new trade plans
- **Immediate Visibility**: Trade plans now appear in Active Trades immediately after creation
- **Status Transitions**: Clear workflow from 'open' → 'emotional_check' → decision-based statuses

**Technical Implementation:**
- **Backend**: Updated TradePlan model with new 'open' status enum value
- **API Endpoints**: Created `/api/trade-plans/open` and `/api/trade-plans/active` endpoints
- **Frontend Integration**: Real-time data loading in ActiveTrades.vue and TradePlanning.vue

#### 2. Active Trades Page Real Data Integration
- **Replaced Mock Data**: ActiveTrades.vue now fetches real trade plans from backend
- **Data Transformation**: API response mapped to match existing UI structure
- **Error Handling**: Comprehensive try-catch with user-friendly fallbacks

**Implementation Lessons:**
- **Data Mapping**: Transform backend data to match frontend expectations while maintaining separation of concerns
- **API Integration**: Handle both development and production API base URLs consistently
- **Error Recovery**: Graceful handling of API failures with console logging for debugging

#### 3. Trade Planning Current Plans Pane
- **Real-time Updates**: Current plans section shows open trade plans immediately
- **Activity Generation**: Recent activity dynamically generated from trade plan data
- **Auto-refresh**: Plans list refreshes automatically after new plan creation

### Aria AI Persona & Emotional Check Flow (November 26, 2025)

#### 1. AI Personality Enhancement
- **Persona**: "Aria" - female professional trading coach
- **Communication Style**: Warm, supportive but firm, concise (2-3 paragraphs max)
- **Frontend Integration**: Updated to show "Aria's Analysis" with female emoji (👩‍💼)

#### 2. Emotional Check Flow Fix
- **400 Error Resolution**: Fixed timeframe validation by normalizing collection labels to backend enum values
- **Context-Aware Prompts**: AI now provides trading context check-in before emotional assessment
- **Conditional Analysis**: Backend routes distinguish between empty emotional state (check-in prompt) and completed emotional state (analysis)

#### 3. Technical Implementation
- **Backend**: New `analyzeTradingContext()` method in AI service
- **Validation**: Relaxed emotionalState requirements for initial trade plan creation
- **Frontend**: Timeframe collection normalization before API calls

**Implementation Lessons:**
- **AI Prompt Engineering**: Clear instructions for different scenarios (check-in vs. analysis)
- **User Experience**: Progressive disclosure - don't analyze incomplete data
- **Error Prevention**: Validate and normalize data before API submission

### Implementation Lessons & Best Practices

#### Backend Development
- **Status Management**: Always update status enums in both model definition and existing data
- **API Design**: Create specific endpoints for different use cases (open vs active trade plans)
- **Data Separation**: Structure API responses to match frontend component needs

#### Frontend Development
- **Data Loading**: Implement loading states and error handling for all API calls
- **Reactive Updates**: Use Vue's reactivity system to automatically update UI when data changes
- **Component Communication**: Properly emit events from child components and handle in parent

#### Common Implementation Mistakes & Solutions
1. **Duplicate Variable Declarations**: 
   - **Mistake**: Declaring `recentActivity` twice in TradePlanning.vue
   - **Solution**: Remove duplicate declarations and ensure single source of truth

2. **Missing Helper Functions**:
   - **Mistake**: Calling `formatRelativeTime` before it was defined
   - **Solution**: Define helper functions before they're used in data processing

3. **API Integration Issues**:
   - **Mistake**: Hardcoded API URLs that break in different environments
   - **Solution**: Use environment variables for API base URLs

### Backend Validation & Emotional State Improvements (November 26, 2025)

#### 1. Dynamic Emotional State Support
- **Removed Enum Validation**: TradePlan.emotionalState.state no longer uses hardcoded enum values
- **Dynamic Emotions**: Frontend now uses emotions loaded from configuration API
- **Flexible System**: Allows adding new emotional states without backend changes
- **Admin-Controlled**: Emotional states can be managed via admin configuration

#### 2. Enhanced API Validation
- **Joi Validation**: Added comprehensive validation for PATCH emotional-state and decision endpoints
- **Error Prevention**: Prevents invalid data from reaching database
- **Consistent Error Messages**: Standardized validation error responses
- **Input Sanitization**: Strips unknown fields and validates required parameters

#### 3. Timeframe Normalization
- **Frontend/Backend Bridge**: Converts M/H format (M15, H1) to backend format (15m, 1h)
- **Seamless Integration**: Users see familiar timeframe labels while backend uses standardized format
- **Backend Processing**: Automatic normalization in trade plan creation endpoint
- **Validation Compatibility**: Maintains Joi validation while supporting flexible frontend display

#### 4. Admin Security for Configuration Routes
- **Admin Guard**: Added `requireAdmin` middleware for configuration modification routes
- **Environment-Based**: Admin emails configured via ADMIN_EMAILS environment variable
- **Protected Endpoints**: Asset addition and emotions reset now require admin privileges
- **Security Enhancement**: Prevents unauthorized modification of system configurations

#### 5. Active Trades Endpoint Fix
- **Status Inclusion**: Fixed `/api/trade-plans/active` to include 'entered' status in query
- **Complete Data**: Open positions now correctly show trade plans with 'entered' status
- **Data Consistency**: Ensures all active trade states are properly represented

**Technical Implementation:**
- **Validation Schemas**: New `emotionalStateUpdateSchema` and `decisionUpdateSchema` in validation middleware
- **Admin Middleware**: `requireAdmin` function checks user email against ADMIN_EMAILS environment variable
- **Timeframe Normalization**: Regex-based conversion in trade plan creation endpoint
- **Status Query Fix**: Updated MongoDB query to include 'entered' status in active trades

**Implementation Lessons:**
- **Flexible Architecture**: Removing hardcoded enums enables dynamic configuration
- **Security Layers**: Admin guards protect critical system configuration endpoints
- **Data Normalization**: Bridge frontend display formats with backend storage requirements
- **Comprehensive Validation**: Joi validation prevents data integrity issues

### Asset Autocomplete Enhancement (November 26, 2025)

#### Enhanced Asset Selection Experience
- **Immediate Dropdown**: Asset suggestions appear immediately on input focus
- **Arrow Key Navigation**: Use ↑/↓ keys to navigate through asset suggestions
- **Keyboard Selection**: Enter key selects highlighted asset, Escape closes dropdown
- **Visual Highlighting**: Selected suggestion is visually highlighted during navigation
- **Improved UX**: Seamless keyboard and mouse interaction for asset selection

**Technical Implementation:**
- **Enhanced Focus Handler**: `handleAssetInputFocus()` immediately shows and populates suggestions
- **Keyboard Navigation**: `handleAssetKeydown()` handles arrow keys, Enter, and Escape
- **Smart Highlighting**: Automatically highlights first item when dropdown opens
- **Event Integration**: Works with existing mouse selection and search filtering

**Implementation Lessons:**
- **User Experience**: Immediate feedback improves perceived performance
- **Accessibility**: Keyboard navigation enhances accessibility for power users
- **Progressive Enhancement**: Maintains existing functionality while adding new features

### Asset Management & UI Enhancements (Previous Implementation)

#### Autocomplete Asset Selection
- **Feature**: Replaced dropdown with typeahead autocomplete component
- **Functionality**: Users can type and select from suggestions that pop up
- **Real-time Filtering**: Instantly filters assets as user types

#### Emotions Reset Endpoint
- **Feature**: REST API endpoint to restore original emotions configuration
- **Security**: Requires JWT authentication
- **Preservation**: All other configurations remain unchanged

### Seed Script Fix & Configuration Reliability
- **Problem Identified**: Previous seed script used native MongoDB driver which bypassed Mongoose validation
- **Solution**: Updated to use proper Mongoose Configuration model with full ES6 imports
- **Data Integrity**: Complete configuration data with proper structure and validation

### Security Enhancements
- Added comprehensive input validation with Joi
- Created validation middleware for all critical endpoints
- Fixed OAuth callback security issue

---

### AI Model & UI Layout Improvements (November 26, 2025)

#### AI Model Configuration
- **Model Confirmed**: The application uses `deepseek-reasoner` model for all AI interactions
- **Model Usage**:
  - Emotional check conversations
  - Trading context analysis  
  - Emotional questionnaire analysis
  - Chat message analysis during emotional checks
- **Files**: `backend/src/services/aiService.js` (all methods use 'deepseek-reasoner')

#### Emotional Check Layout Enhancement
- **50-50 Split Layout**: Changed emotional check container from `1fr 450px` to `1fr 1fr` for equal column distribution
- **Better Balance**: Chat and emotion selection columns now each take 50% of modal width
- **Files**: `frontend/src/components/NewTradePlanModal.vue` (CSS grid-template-columns)

### Modal Closing & Body Signals Fixes (November 26, 2025)

#### Modal Closing Functionality
- **Fixed Close Button**: Resolved issue where X buttons weren't closing the modal
- **Emotional Check Header**: Added X button to emotional check step header for consistent UX
- **Close Logic**: Updated `closeModal` function to properly emit close event
- **Overlay Click Removal**: Removed overlay click-to-close functionality - modal now only closes via X buttons for consistent UX
- **Files**: `frontend/src/components/NewTradePlanModal.vue`

#### Body Signals Integration
- **Complete Data Submission**: Emotional check now sends both emotion selection and body signals with intensity
- **Message Enhancement**: Submit emotional check includes formatted body signal details in chat message
- **Data Filtering**: Only sends body signals that have been filled (non-empty signal values)
- **Intensity Display**: Body signals now include intensity values (1-10 scale) in the chat message
- **Files**: `frontend/src/components/NewTradePlanModal.vue`

### Chat Experience & AI Response Improvements (November 26, 2025)

#### Chat Scrolling Fix
- **Flex Container Issues**: Fixed chat container scrolling by adding `min-height: 0` to flex containers
- **CSS Hierarchy**: Applied `min-height: 0` to `.emotional-check-container`, `.chat-column`, and `.chat-messages`
- **Proper Scrolling**: Ensured chat messages container scrolls properly when conversation gets long
- **Files**: `frontend/src/components/NewTradePlanModal.vue`

#### AI Response Quality Enhancement
- **Generic Response Detection**: Frontend now detects and replaces generic AI responses like "Thank you for sharing your emotional state"
- **Emotion-Specific Responses**: Provides engaging, emotion-specific responses based on positive/negative emotional states
- **Positive Emotions**: Encourages sharing positive mindset factors and reinforces good trading habits
- **Negative Emotions**: Acknowledges tension and explores specific triggers for better emotional management
- **Encourages Engagement**: All responses prompt user to share more details about their emotional state
- **Files**: `frontend/src/components/NewTradePlanModal.vue` (submitEmotionalCheck function)

### Reliability & Fallback Improvements (November 26, 2025)

#### Backend AI Fallback
- Implemented a graceful fallback in AI service when `DEEPSEEK_API_KEY` is missing or external API fails
- The backend no longer throws on `analyze-emotions`; it returns a supportive, concise assistant response instead
- Files:
  - `backend/src/services/aiService.js` (added `generateFallbackResponse`, key guard, and non-throwing fallback logic)

#### Frontend Stabilization
- NewTradePlanModal fallback timeframes now match the API collection shape (label + timeframes[] + description)
- Enhanced error logging in `proceedToEmotionalCheck` to include status, response data, message, URL, and payload
- Files:
  - `frontend/src/components/NewTradePlanModal.vue`

## Known Issues & Future Considerations

### Current Limitations
1. **Token Storage**: JWT tokens in localStorage (vulnerable to XSS)
2. **No Rate Limiting**: API endpoints vulnerable to brute force
3. **No CSRF Protection**: Missing CSRF tokens for state-changing operations
4. **Limited Error Handling**: Frontend error handling could be more robust
5. **No Unit Tests**: Critical business logic lacks test coverage

### Recommended Improvements

#### High Priority
1. **Move JWT to httpOnly cookies** for better XSS protection
2. **Implement rate limiting** on authentication endpoints
3. **Add CSRF protection** for state-changing operations
4. **Add input sanitization** for trade plan data

#### Medium Priority
1. **Add TypeScript** for better type safety
2. **Implement proper logging** and monitoring
3. **Add database indexing** for common queries
4. **Create unit tests** for critical business logic

#### Low Priority
1. **Implement Redis caching** for frequent queries
2. **Add real-time features** with WebSockets
3. **Code splitting** for better frontend performance
4. **Comprehensive API documentation**

### Feature Development Opportunities
1. **Advanced Emotional Analytics**: Machine learning for emotional pattern recognition
2. **Trading Journal Integration**: Detailed post-trade analysis
3. **Risk Management Tools**: Position sizing calculators
4. **Market Data Integration**: Real-time price feeds
5. **Social Features**: Trader community and sharing

---

## Development Workflow

### Git Strategy
- **Main Branch**: `master`
- **Feature Branches**: Create for new features
- **Commit Messages**: Use conventional commit format
- **Remote**: GitHub (`https://github.com/Feilong2k/TradingAid.git`)

### Testing Procedures
1. **Backend Testing**: Start server, test endpoints with curl/Postman
2. **Frontend Testing**: Build verification, manual UI testing
3. **Integration Testing**: Full OAuth flow testing
4. **Security Testing**: Input validation and error handling

### Deployment
- **Frontend**: Netlify (automatically builds from GitHub)
- **Backend**: Render (automatically deploys from GitHub)
- **Database**: MongoDB Atlas (cloud database)

---

## Troubleshooting Guide

### Common Issues

#### OAuth Login Fails
- Check Google OAuth credentials in backend environment
- Verify redirect URIs in Google Cloud Console
- Ensure frontend URL matches configured redirect URI

#### Database Connection Issues
- Verify MongoDB connection string
- Check network connectivity to database
- Review connection timeout settings

#### Frontend Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review console for specific error messages

### Debug Tools
- **Backend**: Console logging in routes and middleware
- **Frontend**: Browser dev tools and Vue devtools
- **Network**: Check API requests and responses

---

## Contact & Support

- **Repository**: https://github.com/Feilong2k/TradingAid.git
- **Latest Commit**: `90134b7f49e5f6b56802e851dd92b0396ae70d07`
- **Production URL**: https://tradingaid.netlify.app
- **Backend API**: https://tradingaid.onrender.com

*This document was generated based on comprehensive code review and security improvements implemented on November 26, 2025.*
