<script setup lang="ts">
import { ref } from "vue";

const gameStarted = ref(true);
const switchGameStarted = () => {
  gameStarted.value = !gameStarted.value;
};
</script>

<template>
  <div class="arithmeticgame">
    <div class="game-container">
      <div v-if="!gameStarted" class="settings">settings</div>
      <div v-else class="game">game</div>
      <button @click="switchGameStarted" />
    </div>
    <nav>
      <RouterLink to="/">Home</RouterLink>
    </nav>
  </div>
</template>

<style>
.arithmeticgame {
  min-height: 100vh;
  display: flex;
  align-items: center;
}
</style>
