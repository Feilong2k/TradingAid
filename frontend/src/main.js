import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Home from "./views/Home.vue";
import Dashboard from "./views/Dashboard.vue";
import AuthSuccess from "./views/AuthSuccess.vue";
import AuthError from "./views/AuthError.vue";

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
    { path: "/dashboard", component: Dashboard },
    { path: "/auth-success", component: AuthSuccess },
    { path: "/auth-error", component: AuthError },
  ],
});
app.use(router);

// Mount the app
app.mount("#app");