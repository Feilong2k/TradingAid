import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Home from "./views/Home.vue";
import TradePlanning from "./views/TradePlanning.vue";
import TradeHistory from "./views/TradeHistory.vue";
import TradeLogs from "./views/TradeLogs.vue";
import AuthSuccess from "./views/AuthSuccess.vue";
import AuthError from "./views/AuthError.vue";
import Login from "./components/Login.vue";

// Create Vue app
const app = createApp(App);

// Setup Pinia for state management
const pinia = createPinia();
app.use(pinia);

// Setup Vue Router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/login", component: Login },
    { path: "/planning", component: TradePlanning, meta: { requiresAuth: true } },
    { path: "/history", component: TradeHistory, meta: { requiresAuth: true } },
    { path: "/logs", component: TradeLogs, meta: { requiresAuth: true } },
    { path: "/auth-success", component: AuthSuccess },
    { path: "/auth-error", component: AuthError },
  ],
});

// Add navigation guard for authentication
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = localStorage.getItem('auth_token');
  
  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

app.use(router);

// Mount the app
app.mount("#app");
