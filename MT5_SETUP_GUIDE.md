# MT5 Integration Setup Guide

## Quick Start

### 1. Environment Setup
Your backend environment is already configured with:
- **API Key**: `tradeaid_mt5_key_2025`
- **API URL**: `https://tradingaid.onrender.com/api/trade-logs`

### 2. MT5 Expert Advisor Installation

#### Step 1: Copy Files to MT5
1. Copy these files to your MT5 `Experts` folder:
   - `MT5_TradeAid_EA.mq5`
   - `MT5_Historical_Export.mq5`

#### Step 2: Compile the EA
1. Open MetaEditor in MT5
2. Open `MT5_TradeAid_EA.mq5`
3. Click **Compile** (F7)
4. The compiled `.ex5` file will appear in your Experts folder

#### Step 3: Configure the EA
1. In MT5, drag the TradeAid EA from Navigator to any chart
2. Configure the input parameters:
   - **API_URL**: `https://tradingaid.onrender.com/api/trade-logs`
   - **API_KEY**: `tradeaid_mt5_key_2025`
   - **Enable_Screenshots**: `true` (recommended)
   - **Screenshot_Width**: `800`
   - **Screenshot_Height**: `600`

#### Step 4: Enable Algo Trading
1. In MT5, go to **Tools → Options → Expert Advisors**
2. Check **Allow algorithmic trading**
3. Check **Allow WebRequest for listed URL** and add: `https://tradingaid.onrender.com`

### 3. Testing the Integration

#### Test 1: Local Backend Test
```bash
# Start your backend
cd backend
npm run dev

# In a new terminal, run the test
node test-mt5-integration.js
```

#### Test 2: Production Backend Test
The MT5 EA is configured to use your production backend at `https://tradingaid.onrender.com`

#### Test 3: Historical Data Import
1. Run `MT5_Historical_Export.mq5` script in MT5
2. This will create CSV files with your last 3 days of trade data
3. Use the import endpoint to load historical data

### 4. API Key Authentication

The MT5 EA uses simple shared key authentication:
- **Key**: `tradeaid_mt5_key_2025`
- **Sent via**: `apiKey` field in JSON payload
- **Backend validation**: Checks against `process.env.MT5_API_KEY`

### 5. Data Flow

1. **Trade Open**: EA sends trade data immediately
2. **Trade Close**: EA sends updated data with profit/loss
3. **Account Details**: Balance, equity, margin included with every trade
4. **Screenshots**: Optional chart screenshots stored in Google Drive

### 6. Monitoring & Debugging

#### MT5 Journal Tab
Check for these messages:
- ✅ "TradeAid EA initialized"
- ✅ "Successfully sent trade data for ticket X"
- ❌ Error messages if any

#### Backend Logs
Look for:
- ✅ "Trade log created" messages
- ✅ Google Drive upload success
- ❌ Validation errors

### 7. Troubleshooting

#### Common Issues

**EA not sending data:**
- Check WebRequest permissions in MT5
- Verify API URL is correct
- Check internet connection

**Authentication errors:**
- Verify API key matches between EA and backend
- Check backend environment variables

**Data validation errors:**
- Check trade data format in MT5 Journal
- Verify all required fields are present

### 8. Production Deployment

#### Backend Updates
1. Add these environment variables to Render:
   - `MT5_API_KEY=tradeaid_mt5_key_2025`
   - `DEFAULT_USER_ID=65a1b2c3d4e5f6a7b8c9d0e1`
   - `GOOGLE_DRIVE_FOLDER_ID=1CH4mUh-gHZ_Waao6r6hz0trTMTBVp65Y`

#### MT5 Configuration
- Use production URL: `https://tradingaid.onrender.com/api/trade-logs`
- Same API key: `tradeaid_mt5_key_2025`

### 9. Security Considerations

The current setup uses a simple shared key. For enhanced security:

1. **Rotate API keys** periodically
2. **Monitor trade logs** for suspicious activity
3. **Consider IP whitelisting** if needed
4. **Implement rate limiting** on backend

### 10. Next Steps

After successful testing:

1. **Deploy backend updates** to production
2. **Load EA in MT5** on live account
3. **Monitor trade data** flowing to your database
4. **Create frontend Trade Logs page** to view the data
5. **Enhance AI emotional analysis** with trade context

## Support

If you encounter issues:
1. Check MT5 Journal for error messages
2. Run the test script: `node test-mt5-integration.js`
3. Check backend logs for validation errors
4. Verify environment variables are set correctly

The integration is designed to handle 10-30 trades per day and provides comprehensive trade tracking with emotional context for your AI analysis.
