<template>
  <div class="trading-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="app-title">📈 Trading Aid</h1>
        <nav class="navigation">
          <router-link to="/planning" class="nav-link">Trade Planning</router-link>
          <router-link to="/history" class="nav-link">Journal History</router-link>
          <router-link to="/logs" class="nav-link active">Trade Logs</router-link>
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

    <!-- Main Content -->
    <main class="page-content">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header-section">
          <h2 class="page-title">Trade Logs</h2>
          <p class="page-subtitle">View imported and real-time MT5 trade logs with filters</p>
        </div>

        <!-- Filters -->
        <div class="section">
          <div class="filters-grid">
            <div class="filter-item">
              <label>Symbol</label>
              <input v-model="symbol" type="text" placeholder="e.g. NAS100, XAUUSD" />
            </div>
            <div class="filter-item">
              <label>Status</label>
              <select v-model="status">
                <option value="">Any</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div class="filter-item">
              <label>Start Date</label>
              <input v-model="startDate" type="date" />
            </div>
            <div class="filter-item">
              <label>End Date</label>
              <input v-model="endDate" type="date" />
            </div>
            <div class="filter-item">
              <label>Sort By</label>
              <select v-model="sortBy">
                <option value="openTime">Open Time</option>
                <option value="closeTime">Close Time</option>
                <option value="profit">Profit</option>
                <option value="symbol">Symbol</option>
              </select>
            </div>
            <div class="filter-item">
              <label>Order</label>
              <select v-model="sortOrder">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
            <div class="filter-actions">
              <button class="action-btn small" @click="resetFilters">Reset</button>
              <button class="action-btn small" @click="loadTradeLogs" :disabled="isLoading">
                {{ isLoading ? 'Loading...' : 'Apply' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Trade Logs Table -->
        <div class="section">
          <div class="trades-table">
            <div class="table-header logs">
              <div class="table-cell">Ticket</div>
              <div class="table-cell">Symbol</div>
              <div class="table-cell">Dir</div>
              <div class="table-cell">Vol</div>
              <div class="table-cell">Entry</div>
              <div class="table-cell">Exit</div>
              <div class="table-cell">Profit</div>
              <div class="table-cell">Open</div>
              <div class="table-cell">Close</div>
              <div class="table-cell">Shot</div>
            </div>

            <div v-if="tradeLogs.length === 0" class="empty-table">
              <div class="empty-icon">📄</div>
              <p>No trades found for current filters</p>
            </div>

            <div v-for="log in tradeLogs" :key="log._id" class="table-row logs">
              <div class="table-cell mono">{{ log.mt5Ticket }}</div>
              <div class="table-cell symbol">{{ log.symbol }}</div>
              <div class="table-cell">
                <span class="direction" :class="log.direction">{{ log.direction }}</span>
              </div>
              <div class="table-cell">{{ formatNum(log.volume, 2) }}</div>
              <div class="table-cell">{{ formatNum(log.entryPrice, 5) }}</div>
              <div class="table-cell">{{ log.exitPrice != null ? formatNum(log.exitPrice, 5) : '' }}</div>
              <div class="table-cell">
                <span class="pnl" :class="{ positive: log.profit > 0, negative: log.profit < 0 }">
                  {{ formatNum(log.profit, 2) }}
                </span>
              </div>
              <div class="table-cell">{{ formatDate(log.openTime) }}</div>
              <div class="table-cell">{{ log.closeTime ? formatDate(log.closeTime) : '' }}</div>
              <div class="table-cell">
                <a v-if="log.screenshotUrl" :href="log.screenshotUrl" target="_blank">View</a>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <button class="action-btn small" :disabled="page <= 1 || isLoading" @click="changePage(page - 1)">Prev</button>
            <span class="page-info">Page {{ page }} / {{ totalPages }}</span>
            <button class="action-btn small" :disabled="page >= totalPages || isLoading" @click="changePage(page + 1)">Next</button>
            <span class="page-info">Total: {{ pagination.total }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.js';

const authStore = useAuthStore();

// Filters and state
const symbol = ref('');
const status = ref('');
const startDate = ref('');
const endDate = ref('');
const sortBy = ref('openTime');
const sortOrder = ref('desc');
const page = ref(1);
const limit = ref(50);
const isLoading = ref(false);
const tradeLogs = ref([]);
const pagination = ref({ page: 1, limit: 50, total: 0, pages: 1 });

const totalPages = computed(() => pagination.value.pages || 1);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://tradingaid.onrender.com' : 'http://localhost:3000');

const loadTradeLogs = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    };
    if (symbol.value) params.symbol = symbol.value.trim();
    if (status.value) params.status = status.value;
    if (startDate.value) params.startDate = startDate.value;
    if (endDate.value) params.endDate = endDate.value;

    const resp = await axios.get(`${apiBaseUrl}/api/trade-logs`, {
      params,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    tradeLogs.value = resp.data.tradeLogs || [];
    pagination.value = resp.data.pagination || { page: 1, limit: 50, total: 0, pages: 1 };
  } catch (err) {
    console.error('Failed to load trade logs:', err?.response?.data || err?.message || err);
    tradeLogs.value = [];
    pagination.value = { page: 1, limit: 50, total: 0, pages: 1 };
  } finally {
    isLoading.value = false;
  }
};

const changePage = (p) => {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
  loadTradeLogs();
};

const resetFilters = () => {
  symbol.value = '';
  status.value = '';
  startDate.value = '';
  endDate.value = '';
  sortBy.value = 'openTime';
  sortOrder.value = 'desc';
  page.value = 1;
  loadTradeLogs();
};

const formatDate = (d) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleString();
};

const formatNum = (n, fixed = 2) => {
  if (n === undefined || n === null || !isFinite(n)) return '';
  return Number(n).toFixed(fixed);
};

const handleLogout = async () => {
  try {
    await authStore.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Auto reload when filters change (debounced page reset)
watch([symbol, status, startDate, endDate, sortBy, sortOrder], () => {
  page.value = 1;
}, { deep: false });

onMounted(() => {
  loadTradeLogs();
});
</script>

<style scoped>
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
  margin-bottom: 2rem;
}

.page-title {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.6;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-item label {
  font-size: 0.85rem;
  color: #2c3e50;
}

.filter-item input,
.filter-item select {
  padding: 0.5rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #2c3e50;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.trades-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table-header.logs,
.table-row.logs {
  display: grid;
  grid-template-columns: 1.1fr 1fr 0.7fr 0.7fr 1.1fr 1.1fr 1fr 1.6fr 1.6fr 0.7fr;
  gap: 0;
}

.table-header {
  background: #f8f9fa;
  padding: 0.75rem 0.75rem;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
}

.table-row {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-cell {
  padding: 0.25rem 0.5rem;
  display: flex;
  align-items: center;
}

.table-cell.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.symbol {
  font-weight: 600;
  color: #2c3e50;
}

.direction {
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.direction.BUY {
  background: #d4edda;
  color: #155724;
}

.direction.SELL {
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
  padding: 2rem 1rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.pagination {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.page-info {
  color: #2c3e50;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
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
</style>
