<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// Main Vue app component - acts as layout container
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #c9daf8  0%, #667eea 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>
