<template>
  <div class="trading-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="app-title">📈 Trading Aid</h1>
        <nav class="navigation">
          <router-link to="/planning" class="nav-link">Trade Planning</router-link>
          <router-link to="/history" class="nav-link active">Journal History</router-link>
          <router-link to="/logs" class="nav-link">Trade Logs</router-link>
        </nav>
        <div class="user-controls">
          <div class="user-info">
            <img 
              :src="authStore.user?.picture" 
              :alt="authStore.user?.name"
              class="user-avatar"
            />
            <span class="user-name">{{ authStore.user?.name }}</span>
          </div>
          <button 
            @click="handleLogout" 
            class="logout-btn"
            :disabled="authStore.isLoading"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Trade Plan Details Modal -->
    <TradePlanDetailsModal
      v-if="showDetailsModal"
      :trade-plan-id="selectedPlanId"
      @close="showDetailsModal = false"
      @plan-deleted="handlePlanDeleted"
      @plan-continued="handlePlanContinued"
    />

    <!-- Main Content -->
    <main class="page-content">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header-section">
          <h2 class="page-title">Journal History</h2>
          <p class="page-subtitle">Review completed trades and learn from your performance</p>
        </div>

        <!-- CSV Import -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">Import MT5 CSV</h3>
          </div>
          <div class="import-panel">
            <input type="file" accept=".csv" @change="onCsvFileChange" />
            <div v-if="parsedRowsCount" class="info" style="margin-top: 0.5rem;">
              Parsed {{ parsedRowsCount }} rows ready to upload
            </div>
            <div v-if="importErrors.length" class="error-list" style="color:#dc3545; margin-top:0.5rem;">
              <div v-for="(err, idx) in importErrors" :key="idx" class="error-item">• {{ err }}</div>
            </div>
            <button class="action-btn small" :disabled="!parsedRowsCount || isImporting" @click="uploadTrades" style="margin-top: 0.75rem;">
              {{ isImporting ? 'Importing...' : 'Upload to Trade Logs' }}
            </button>
            <div v-if="lastImportResult" class="info" style="margin-top: 0.5rem;">
              Imported {{ lastImportResult.importedCount || 0 }} trades
              <div v-if="lastImportResult.errors && lastImportResult.errors.length" class="error-list" style="color:#dc3545; margin-top:0.5rem;">
                <div v-for="(e, i) in lastImportResult.errors" :key="'imp-'+i" class="error-item">• {{ e }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Trade History -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">Completed Trade Plans</h3>
            <div class="filters">
              <select v-model="timeFilter" class="filter-select" @change="loadCompletedTradePlans">
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
          <div class="trades-table">
            <div class="table-header">
              <div class="table-cell">Asset</div>
              <div class="table-cell">Direction</div>
              <div class="table-cell">Timeframe</div>
              <div class="table-cell">Status</div>
              <div class="table-cell">Created</div>
              <div class="table-cell">Actions</div>
            </div>
            <div v-if="tradeHistory.length === 0" class="empty-table">
              <div class="empty-icon">📊</div>
              <p>No completed trades yet</p>
            </div>
            <div v-for="trade in tradeHistory" :key="trade.id" class="table-row">
              <div class="table-cell symbol">{{ trade.asset }}</div>
              <div class="table-cell">
                <span class="direction" :class="trade.direction">{{ trade.direction }}</span>
              </div>
              <div class="table-cell">{{ trade.timeframe }}</div>
              <div class="table-cell">
                <span class="status" :class="trade.status">{{ trade.status }}</span>
              </div>
              <div class="table-cell">{{ formatDate(trade.createdAt) }}</div>
              <div class="table-cell">
                <button @click="openPlanDetails(trade.id)" class="action-btn small">Review</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import TradePlanDetailsModal from '../components/TradePlanDetailsModal.vue';
import axios from 'axios';
import Papa from 'papaparse';

const authStore = useAuthStore();

const timeFilter = ref('all');
const tradeHistory = ref([]);
const showDetailsModal = ref(false);
const selectedPlanId = ref(null);
const isLoading = ref(false);

// CSV Import state
const selectedFile = ref(null);
const parsedTrades = ref([]);
const parsedRowsCount = ref(0);
const importErrors = ref([]);
const isImporting = ref(false);
const lastImportResult = ref(null);

const onCsvFileChange = (e) => {
  selectedFile.value = e.target.files?.[0] || null;
  importErrors.value = [];
  parsedTrades.value = [];
  parsedRowsCount.value = 0;
  if (selectedFile.value) {
    parseCsvAndPrepare(selectedFile.value);
  }
};

function parseCsvAndPrepare(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      try {
        const rows = Array.isArray(results.data) ? results.data : [];
        const trades = rows.map(normalizeRow).filter((r) => r !== null);
        parsedTrades.value = trades;
        parsedRowsCount.value = trades.length;
      } catch (err) {
        importErrors.value = [err?.message || 'Failed to parse CSV'];
      }
    },
    error: (err) => {
      importErrors.value = [err?.message || 'Failed to read CSV'];
    }
  });
}

function normalizeRow(row) {
  const parseNum = (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(String(v).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : undefined;
  };

  const asString = (v) => (v === undefined || v === null ? '' : String(v));

  const mt5Ticket = asString(row.mt5Ticket ?? row.ticket ?? row.Ticket).trim();
  const symbol = asString(row.symbol ?? row.Symbol).trim();
  const directionRaw = asString(row.direction ?? row.Direction).trim().toUpperCase();
  const direction = directionRaw === 'SELL' ? 'SELL' : 'BUY';

  const volume = parseNum(row.volume ?? row.Volume);
  const entryPrice = parseNum(row.entryPrice ?? row.EntryPrice ?? row.price ?? row.Price);
  const exitPrice = parseNum(row.exitPrice ?? row.ExitPrice);
  const profit = parseNum(row.profit ?? row.Profit);
  const commission = parseNum(row.commission ?? row.Commission) ?? 0;
  const swap = parseNum(row.swap ?? row.Swap) ?? 0;

  const openTimeStr = asString(row.openTime ?? row.OpenTime).trim();
  const closeTimeStr = asString(row.closeTime ?? row.CloseTime).trim();
  const openTime = parseMt5Date(openTimeStr);
  const closeTime = closeTimeStr ? parseMt5Date(closeTimeStr) : null;

  const accountBalance = parseNum(row.accountBalance ?? row.AccountBalance);
  const accountEquity = parseNum(row.accountEquity ?? row.AccountEquity);
  const accountMargin = parseNum(row.accountMargin ?? row.AccountMargin);

  // Minimal required fields for backend validation
  if (!mt5Ticket || !symbol || !volume || !entryPrice || profit === undefined || !openTime || accountBalance === undefined || accountEquity === undefined) {
    return null;
  }

  return {
    mt5Ticket,
    symbol,
    direction,
    volume,
    entryPrice,
    exitPrice,
    profit,
    commission,
    swap,
    openTime,
    closeTime,
    accountBalance,
    accountEquity,
    accountMargin
  };
}

function parseMt5Date(s) {
  if (!s) return null;
  // Expect "YYYY.MM.DD HH:MM:SS"
  const m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (m) {
    const [, Y, M, D, h, min, sec] = m;
    const d = new Date(Date.UTC(Number(Y), Number(M) - 1, Number(D), Number(h), Number(min), Number(sec)));
    return d.toISOString();
  }
  const d2 = new Date(s);
  if (isNaN(d2.getTime())) return null;
  return d2.toISOString();
}

const uploadTrades = async () => {
  importErrors.value = [];
  lastImportResult.value = null;

  if (parsedTrades.value.length === 0) {
    importErrors.value = ['No valid rows parsed from CSV'];
    return;
  }

  isImporting.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://tradingaid.onrender.com' : 'http://localhost:3000');
    const resp = await axios.post(
      `${apiBaseUrl}/api/trade-logs/import`,
      { trades: parsedTrades.value },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    lastImportResult.value = resp.data;
    // Optionally refresh other views after import
    // await loadCompletedTradePlans();
  } catch (err) {
    if (err?.response?.data?.details) {
      importErrors.value = err.response.data.details;
    } else if (err?.response?.data?.error) {
      importErrors.value = [err.response.data.error];
    } else {
      importErrors.value = [err?.message || 'Import failed'];
    }
  } finally {
    isImporting.value = false;
  }
};

const loadCompletedTradePlans = async () => {
  isLoading.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://tradingaid.onrender.com' : 'http://localhost:3000');
    const response = await axios.get(`${apiBaseUrl}/api/trade-plans`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
    
    // Filter for completed and passed_over trades
    const completedTrades = response.data.filter(plan => 
      ['completed', 'passed_over', 'cancelled'].includes(plan.status)
    );
    
    // Transform trade plan data for the table
    tradeHistory.value = completedTrades.map(plan => ({
      id: plan._id,
      asset: plan.asset,
      direction: plan.direction,
      timeframe: plan.timeframe,
      status: plan.status,
      createdAt: plan.createdAt
    }));
    
  } catch (error) {
    console.error('Error loading completed trade plans:', error);
  } finally {
    isLoading.value = false;
  }
};

const openPlanDetails = (planId) => {
  selectedPlanId.value = planId;
  showDetailsModal.value = true;
};

const handlePlanDeleted = (planId) => {
  // Remove from trade history immediately
  tradeHistory.value = tradeHistory.value.filter(plan => plan.id !== planId);
  console.log('Trade plan deleted from details modal:', planId);
};

const handlePlanContinued = (tradePlan) => {
  console.log('Continuing trade plan from details modal:', tradePlan);
};

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const handleLogout = async () => {
  try {
    await authStore.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

onMounted(() => {
  loadCompletedTradePlans();
});
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-value.positive {
  color: #28a745;
}

.stat-value.negative {
  color: #dc3545;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #2c3e50;
}

.trades-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  background: #f8f9fa;
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-cell {
  padding: 0.5rem;
}

.symbol {
  font-weight: 600;
  color: #2c3e50;
}

.direction {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.direction.long {
  background: #d4edda;
  color: #155724;
}

.direction.short {
  background: #f8d7da;
  color: #721c24;
}

.pnl {
  font-weight: 600;
}

.pnl.positive {
  color: #28a745;
}

.pnl.negative {
  color: #dc3545;
}

.empty-table {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Reuse other styles from TradePlanning.vue */
.trading-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
}

.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.app-title {
  color: #2c3e50;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

.navigation {
  display: flex;
  gap: 2rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  color: #6c757d;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-link:hover,
.nav-link.active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #667eea;
}

.user-name {
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.95rem;
}

.logout-btn {
  background: linear-gradient(135deg, #c9daf8 0%, #667eea 100%);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header-section {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #6c757d;
  font-size: 1.2rem;
  line-height: 1.6;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.section-title {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  text-decoration: none;
}

.action-btn.small {
  background: #667eea;
  color: white;
}

.action-btn.small:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }
  
  .navigation {
    order: 3;
    width: 100%;
    justify-content: space-around;
  }
  
  .page-content {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
}
</style>
