import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";

// Create Vue app
const app = createApp(App);

// Setup Pinia for state management
app.use(createPinia());

// Setup Vue Router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: { template: "<div>Welcome to Trading Aid!</div>" } }
  ]
});
app.use(router);

// Mount the app
app.mount("#app");