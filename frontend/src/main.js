import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Home from "./views/Home.vue";

// Create Vue app
const app = createApp(App);

// Setup Pinia for state management
const pinia = createPinia();
app.use(pinia);

// Setup Vue Router
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", component: Home }],
});
app.use(router);

// Mount the app
app.mount("#app");