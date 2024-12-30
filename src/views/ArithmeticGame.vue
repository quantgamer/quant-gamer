<script setup lang="ts">
import { reactive, ref } from "vue";

const gameStarted = ref(true);

const startGame = () => (gameStarted.value = !gameStarted.value);

const settings = reactive({
  includeAddition: true,
  includeMultiplication: true,
  additionMin: 2,
  additionMax: 100,
  multiplicationMin: 2,
  multiplicationMax: 12,
  duration: 120,
});
</script>

<template>
  <div class="arithmeticgame">
    <h1>Arithmetic Game</h1>
    <div class="game-container">
      <div v-if="!gameStarted" class="settings">
        <h2>Settings</h2>
        <div>
          <label>
            <input type="checkbox" v-model="settings.includeAddition" /> Include
            Addition
          </label>
          <label>
            <input type="checkbox" v-model="settings.includeMultiplication" />
            Include Multiplication
          </label>
        </div>
        <div>
          <label>
            Value Range for Addition:
            <input
              type="number"
              v-model.number="settings.additionMin"
              placeholder="Min"
            />
            <input
              type="number"
              v-model.number="settings.additionMax"
              placeholder="Max"
            />
          </label>
        </div>
        <div>
          <label>
            Value Range for Multiplication:
            <input
              type="number"
              v-model.number="settings.multiplicationMin"
              placeholder="Min"
            />
            <input
              type="number"
              v-model.number="settings.multiplicationMax"
              placeholder="Max"
            />
          </label>
        </div>
        <div>
          <label>
            Game Duration:
            <input type="number" v-model.number="settings.duration" />
          </label>
        </div>
      </div>
      <div v-else class="game">
        <h2>Game</h2>
      </div>
      <button @click="startGame" />
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
