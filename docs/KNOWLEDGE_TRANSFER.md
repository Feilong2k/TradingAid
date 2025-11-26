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
