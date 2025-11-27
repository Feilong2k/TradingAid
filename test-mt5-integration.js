// Test script for MT5 integration
// This script simulates sending trade data from MT5 EA to the backend
// Updated to use Node 18+ global fetch (no external axios dependency required)

// Configuration - match your backend URL and API key
const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'tradeaid_mt5_key_2025';

// Simple fetch helpers returning { status, data }
async function httpPostJson(url, payload, headers = {}) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: resp.status, data };
}

async function httpGetJson(url, headers = {}) {
  const resp = await fetch(url, { headers });
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: resp.status, data };
}

// Sample trade data (simulating MT5 EA payload)
const sampleTrades = [
  {
    mt5Ticket: '123456789',
    symbol: 'EURUSD',
    direction: 'BUY',
    volume: 0.1,
    entryPrice: 1.0850,
    exitPrice: 1.0875,
    profit: 25.0,
    commission: 2.5,
    swap: 0.0,
    openTime: '2025-11-27T10:30:00Z',
    closeTime: '2025-11-27T11:45:00Z',
    accountBalance: 10000.0,
    accountEquity: 10025.0,
    accountMargin: 250.0,
    apiKey: API_KEY
  },
  {
    mt5Ticket: '123456790',
    symbol: 'GBPUSD',
    direction: 'SELL',
    volume: 0.05,
    entryPrice: 1.2600,
    exitPrice: 1.2575,
    profit: 12.5,
    commission: 1.25,
    swap: 0.0,
    openTime: '2025-11-27T14:20:00Z',
    closeTime: '2025-11-27T15:30:00Z',
    accountBalance: 10025.0,
    accountEquity: 10037.5,
    accountMargin: 125.0,
    apiKey: API_KEY
  }
];

async function testTradeLogCreation() {
  console.log('🧪 Testing MT5 Trade Log Integration...\n');

  try {
    console.log('📤 Sending sample trade data to backend...');
    const response = await httpPostJson(`${API_BASE_URL}/api/trade-logs`, sampleTrades[0]);

    if (response.status === 201) {
      console.log('✅ Trade log created successfully!');
      console.log('📊 Response:', response.data);
    } else {
      console.log('❌ Unexpected response:', response.status, response.data);
    }
  } catch (error) {
    console.log('❌ Error during trade log creation:', error?.message || error);
  }
}

// Note: GET /api/trade-logs and /api/trade-logs/context require authentication in the app.
// These tests will likely return 401 Unauthorized unless you supply a valid Bearer token.
// Left here for completeness; they will handle and print error messages gracefully.
async function testTradeLogRetrieval() {
  console.log('\n📥 Testing trade log retrieval (may require auth)...');

  try {
    const response = await httpGetJson(`${API_BASE_URL}/api/trade-logs`, {
      // Authorization: `Bearer ${YOUR_JWT_TOKEN}`
    });

    if (response.status === 200) {
      const logs = response.data.tradeLogs || [];
      console.log('✅ Successfully retrieved trade logs!');
      console.log('📊 Total trades:', logs.length);
      if (logs.length > 0) {
        console.log('📈 Recent trades:');
        logs.slice(0, 3).forEach((trade, index) => {
          console.log(`   ${index + 1}. ${trade.symbol} ${trade.direction} - $${trade.profit}`);
        });
      }
    } else {
      console.log('ℹ️ Retrieval response:', response.status, response.data);
    }
  } catch (error) {
    console.log('❌ Failed to retrieve trade logs:', error?.message || error);
  }
}

async function testTradeContext() {
  console.log('\n🎯 Testing trade context for AI analysis (may require auth)...');

  try {
    const response = await httpGetJson(`${API_BASE_URL}/api/trade-logs/context`, {
      // Authorization: `Bearer ${YOUR_JWT_TOKEN}`
    });

    if (response.status === 200) {
      console.log('✅ Trade context retrieved successfully!');
      console.log("📊 Today's trades:", response.data.today.totalTrades);
      console.log("📊 Yesterday's trades:", response.data.yesterday.totalTrades);
      console.log('💰 Current balance:', response.data.currentBalance);
      console.log("🎯 Today's win rate:", response.data.today.winRate + '%');
    } else {
      console.log('ℹ️ Context response:', response.status, response.data);
    }
  } catch (error) {
    console.log('❌ Failed to retrieve trade context:', error?.message || error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting MT5 Integration Tests\n');
  console.log('📡 API Base URL:', API_BASE_URL);
  console.log('🔑 API Key:', API_KEY);
  console.log('='.repeat(50));

  await testTradeLogCreation();
  await testTradeLogRetrieval();
  await testTradeContext();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 MT5 Integration Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start your backend server: cd backend && npm run dev');
  console.log('2. Run this test again to verify integration');
  console.log('3. Update MT5 EA with your API key and backend URL');
  console.log('4. Load the EA in MT5 platform');
  console.log('5. Test with real trades!');
}

// Check if backend is running first
async function checkBackend() {
  try {
    const res = await httpGetJson(`${API_BASE_URL}/health`);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  const isBackendRunning = await checkBackend();

  if (!isBackendRunning) {
    console.log('❌ Backend is not running on', API_BASE_URL);
    console.log('💡 Please start your backend server first:');
    console.log('   cd backend && npm run dev');
    console.log('\n📋 Quick start commands:');
    console.log('   cd backend && npm install');
    console.log('   npm run dev');
    return;
  }

  await runAllTests();
}

// Run the tests
main().catch(console.error);
