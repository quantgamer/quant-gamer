<script setup lang="ts">
import { reactive, ref, type Reactive } from "vue";

const gameStarted = ref(true);
const score = ref(0);
const timeRemaining = ref(0);
const gameOver = ref(true);

const settings = reactive({
  includeAddition: true,
  includeMultiplication: true,
  additionMin: 2,
  additionMax: 100,
  multiplicationMin: 2,
  multiplicationMax: 12,
  duration: 120,
});

const updateTime = () => {
  if (timeRemaining.value > 0) {
    timeRemaining.value -= 1;
  } else endGame();
};
const startGame = () => {
  gameStarted.value = !gameStarted.value;
  gameOver.value = false;

  score.value = 0;
  timeRemaining.value = settings.duration;
  setInterval(updateTime, 1000);

  generateQuestion();
};

const endGame = () => {
  gameStarted.value = false;
  gameOver.value = true;
};

interface Question {
  text: string;
  answer: number;
}

const currentQuestion: Reactive<Question> = reactive({
  text: "1 + 1 =",
  answer: 2,
});

const generateQuestion = () => {
  const operations = [];
  if (settings.includeAddition) operations.push("addition");
  if (settings.includeMultiplication) operations.push("multiplication");

  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1, num2, text, answer;
  if (operation === "addition") {
    num1 = randomInt(settings.additionMin, settings.additionMax);
    num2 = randomInt(settings.additionMin, settings.additionMax);
    text = `${num1} + ${num2} =`;
    answer = num1 + num2;
  } else if (operation === "multiplication") {
    num1 = randomInt(settings.multiplicationMin, settings.multiplicationMax);
    num2 = randomInt(settings.multiplicationMin, settings.multiplicationMax);
    text = `${num1} x ${num2} =`;
    answer = num1 * num2;
  }

  currentQuestion.text = text ?? "";
  currentQuestion.answer = answer ?? 0;
};

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
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
        <p>Score: {{ score }}</p>
        <p>Time Remaining: {{ timeRemaining }}</p>
        <div v-if="currentQuestion">
          {{ currentQuestion.text }}
        </div>
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
