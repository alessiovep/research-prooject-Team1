<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <h1>Handshake POC</h1>
    <nav>
      <RouterLink to="/student">Student</RouterLink>
      <RouterLink to="/scanner">Scanner (Bedrijf)</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
header {
  padding: 1rem;
  border-bottom: 1px solid #ccc;
  margin-bottom: 1rem;
}
nav a {
  margin-right: 1rem;
}
nav a.router-link-active {
  font-weight: bold;
}
main {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}
</style>
