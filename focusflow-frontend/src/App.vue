<template>
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --c1: #FF6B6B;
  --c2: #FFD93D;
  --c3: #6BCB77;
  --c4: #4D96FF;
  --c5: #C77DFF;
  --bg: #0F0E17;
  --surface: #1A1829;
  --surface2: #242238;
  --text: #FFFFFE;
  --muted: #a8a4c5;
  --radius: 20px;
}

body {
  font-family: 'Nunito', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}
</style>