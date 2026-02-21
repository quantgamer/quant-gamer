<script setup lang="ts">
import { reactive, ref, computed, nextTick, type Reactive } from "vue";

const gameStarted = ref(false);
const score = ref(0);
const timeRemaining = ref(0);
const gameOver = ref(false);
const userAnswer = ref(null);

const settings = reactive({
  includeAddition: true,
  includeSubtraction: false,
  includeMultiplication: true,
  includeDivision: false,
  additionMin: 2,
  additionMax: 100,
  multiplicationMin: 2,
  multiplicationMax: 12,
  duration: 120,
});

let timerInterval: ReturnType<typeof setInterval> | null = null;

const clearTimer = () => {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const updateTime = () => {
  if (timeRemaining.value > 0) {
    timeRemaining.value -= 1;
  } else endGame();
};

const startGame = () => {
  if (settings.includeAddition || settings.includeSubtraction || settings.includeMultiplication || settings.includeDivision) {
    clearTimer();
    gameStarted.value = true;
    gameOver.value = false;

    score.value = 0;
    timeRemaining.value = settings.duration;
    timerInterval = setInterval(updateTime, 1000);

    generateQuestion();
  }
};

const endGame = () => {
  if (gameStarted.value) {
    clearTimer();
    gameOver.value = true;
  }
};

const backToSettings = () => {
  clearTimer();
  gameStarted.value = false;
  gameOver.value = false;
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
  if (settings.includeSubtraction) operations.push("subtraction");
  if (settings.includeMultiplication) operations.push("multiplication");
  if (settings.includeDivision) operations.push("division");

  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1, num2, text, answer;
  if (operation === "addition") {
    num1 = randomInt(settings.additionMin, settings.additionMax);
    num2 = randomInt(settings.additionMin, settings.additionMax);
    text = `${num1} + ${num2} =`;
    answer = num1 + num2;
  } else if (operation === "subtraction") {
    // Generate two addends then ask for the difference, ensuring result is always positive
    num1 = randomInt(settings.additionMin, settings.additionMax);
    num2 = randomInt(settings.additionMin, settings.additionMax);
    const total = num1 + num2;
    text = `${total} − ${num2} =`;
    answer = num1;
  } else if (operation === "multiplication") {
    num1 = randomInt(settings.multiplicationMin, settings.multiplicationMax);
    num2 = randomInt(settings.multiplicationMin, settings.multiplicationMax);
    text = `${num1} × ${num2} =`;
    answer = num1 * num2;
  } else if (operation === "division") {
    // Generate two factors then ask for the quotient — always a whole number
    num1 = randomInt(settings.multiplicationMin, settings.multiplicationMax);
    num2 = randomInt(settings.multiplicationMin, settings.multiplicationMax);
    const product = num1 * num2;
    text = `${product} ÷ ${num2} =`;
    answer = num1;
  }

  currentQuestion.text = text ?? "";
  currentQuestion.answer = answer ?? 0;
};

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const blockInvalidKeys = (e: KeyboardEvent) => {
  if (["-", "+", ".", "e", "E"].includes(e.key)) e.preventDefault();
};

const clampPositiveInt = (field: keyof typeof settings) => {
  const val = settings[field] as number;
  (settings[field] as number) = Math.max(1, Math.floor(isNaN(val) ? 1 : val));
};

const additionRangeError = computed(() =>
  settings.additionMin >= settings.additionMax
    ? "Min must be less than Max"
    : null
);

const multiplicationRangeError = computed(() =>
  settings.multiplicationMin >= settings.multiplicationMax
    ? "Min must be less than Max"
    : null
);

const canStart = computed(() =>
  (settings.includeAddition || settings.includeSubtraction || settings.includeMultiplication || settings.includeDivision) &&
  !(additionRangeError.value) &&
  !(multiplicationRangeError.value)
);

const answerInput = ref<HTMLInputElement | null>(null);

const checkAnswer = () => {
  if (userAnswer.value === currentQuestion.answer) {
    score.value += 1;
    userAnswer.value = null;
    generateQuestion();
    nextTick(() => answerInput.value?.focus());
  }
};
</script>

<template>
  <div class="arithmeticgame">
    <h1>Arithmetic Game</h1>
    <div class="game-container">
      <div v-if="!gameStarted" class="settings">
        <p class="settings-subtitle">Choose your operations and ranges</p>

        <div class="operation-cards">
          <label class="operation-card" :class="{ active: settings.includeAddition, error: additionRangeError }">
            <input type="checkbox" v-model="settings.includeAddition" />
            <span class="op-symbol">+</span>
            <span class="op-label">Addition</span>
            <div class="range-inputs">
              <input
                type="number"
                v-model.number="settings.additionMin"
                placeholder="Min"
                min="1"
                step="1"
                :class="{ 'input-error': additionRangeError }"
                @keydown="blockInvalidKeys"
                @blur="clampPositiveInt('additionMin')"
              />
              <span>–</span>
              <input
                type="number"
                v-model.number="settings.additionMax"
                placeholder="Max"
                min="1"
                step="1"
                :class="{ 'input-error': additionRangeError }"
                @keydown="blockInvalidKeys"
                @blur="clampPositiveInt('additionMax')"
              />
            </div>
            <span v-if="additionRangeError" class="range-error">{{ additionRangeError }}</span>
          </label>

          <label class="operation-card" :class="{ active: settings.includeSubtraction }">
            <input type="checkbox" v-model="settings.includeSubtraction" />
            <span class="op-symbol">−</span>
            <span class="op-label">Subtraction</span>
            <div class="range-inputs">
              <span class="range-note">Reverse of addition</span>
            </div>
          </label>

          <label class="operation-card" :class="{ active: settings.includeMultiplication, error: multiplicationRangeError }">
            <input type="checkbox" v-model="settings.includeMultiplication" />
            <span class="op-symbol">×</span>
            <span class="op-label">Multiplication</span>
            <div class="range-inputs">
              <input
                type="number"
                v-model.number="settings.multiplicationMin"
                placeholder="Min"
                min="1"
                step="1"
                :class="{ 'input-error': multiplicationRangeError }"
                @keydown="blockInvalidKeys"
                @blur="clampPositiveInt('multiplicationMin')"
              />
              <span>–</span>
              <input
                type="number"
                v-model.number="settings.multiplicationMax"
                placeholder="Max"
                min="1"
                step="1"
                :class="{ 'input-error': multiplicationRangeError }"
                @keydown="blockInvalidKeys"
                @blur="clampPositiveInt('multiplicationMax')"
              />
            </div>
            <span v-if="multiplicationRangeError" class="range-error">{{ multiplicationRangeError }}</span>
          </label>

          <label class="operation-card" :class="{ active: settings.includeDivision }">
            <input type="checkbox" v-model="settings.includeDivision" />
            <span class="op-symbol">÷</span>
            <span class="op-label">Division</span>
            <div class="range-inputs">
              <span class="range-note">Reverse of multiplication</span>
            </div>
          </label>
        </div>

        <div class="duration-row">
          <label class="duration-label">
            <span>⏱ Duration</span>
            <div class="duration-input-wrap">
              <input type="number" v-model.number="settings.duration" />
              <span class="unit">sec</span>
            </div>
          </label>
        </div>

        <button class="start-btn" @click="startGame" :disabled="!canStart">Start Game</button>
      </div>
      <div v-if="gameStarted && !gameOver" class="game">
        <div class="game-stats">
          <span class="stat">Score: <strong>{{ score }}</strong></span>
          <span class="stat">Time: <strong>{{ timeRemaining }}s</strong></span>
        </div>
        <div class="question-area" v-if="currentQuestion">
          <p class="question-text">{{ currentQuestion.text }}</p>
          <input
            ref="answerInput"
            class="answer-input"
            type="number"
            v-model.number="userAnswer"
            @keyup="checkAnswer"
            autofocus
          />
        </div>
        <button class="back-btn" @click="backToSettings">Return to Settings</button>
      </div>
      <div v-if="gameOver" class="game-over">
        <p class="game-over-title">Time's up!</p>
        <p class="game-over-score">You scored <strong>{{ score }}</strong></p>
        <button class="start-btn" @click="backToSettings">Play Again</button>
      </div>
    </div>
    <nav>
      <RouterLink to="/">Home</RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.arithmeticgame {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: sans-serif;
  padding: 2rem;
  text-align: center;
}

.game-container {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

/* Game screen */
.game {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.game-stats {
  display: flex;
  gap: 2rem;
  font-size: 1.1rem;
  color: #555;
}

.stat strong {
  color: #222;
}

.question-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.question-text {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
  color: #222;
}

.answer-input {
  width: 120px;
  padding: 0.6rem 0.8rem;
  font-size: 1.8rem;
  text-align: center;
  border: 2px solid #4a90e2;
  border-radius: 10px;
  outline: none;
}

.answer-input:focus {
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.25);
}

.back-btn {
  background: none;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  color: #888;
  cursor: pointer;
  font-size: 0.9rem;
  transition: border-color 0.2s, color 0.2s;
}

.back-btn:hover {
  border-color: #888;
  color: #444;
}

/* Game over screen */
.game-over {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.game-over-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.game-over-score {
  font-size: 1.2rem;
  color: #555;
  margin: 0;
}

.game-over-score strong {
  color: #4a90e2;
  font-size: 1.5rem;
}

.settings {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 480px;
}

.settings-subtitle {
  color: #888;
  margin: 0;
  font-size: 0.95rem;
}

/* Operation toggle cards */
.operation-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
}

.operation-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.25rem 1rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  background: #fafafa;
  user-select: none;
}

.operation-card input[type="checkbox"] {
  display: none;
}

.operation-card.active {
  border-color: #4a90e2;
  background: #eef5fd;
  box-shadow: 0 2px 10px rgba(74, 144, 226, 0.2);
}

.op-symbol {
  font-size: 2.2rem;
  font-weight: bold;
  color: #4a90e2;
  line-height: 1;
}

.op-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.range-note {
  font-size: 0.78rem;
  color: #aaa;
  font-style: italic;
}

.range-error {
  font-size: 0.75rem;
  color: #e05252;
  font-weight: 600;
}

.input-error {
  border-color: #e05252 !important;
  outline-color: #e05252;
}

.operation-card.error {
  border-color: #e05252;
  background: #fff5f5;
}

.start-btn:disabled {
  background: #b0c9e8;
  cursor: not-allowed;
  transform: none;
}

.range-inputs input {
  width: 60px;
  padding: 0.3rem 0.4rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.range-inputs span {
  color: #888;
  font-size: 0.9rem;
}

/* Duration row */
.duration-row {
  width: 100%;
}

.duration-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f4f4f4;
  border-radius: 10px;
  padding: 0.8rem 1.2rem;
  font-weight: 600;
  color: #555;
  font-size: 0.95rem;
}

.duration-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.duration-input-wrap input {
  width: 70px;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  text-align: center;
  font-size: 0.95rem;
}

.unit {
  font-size: 0.85rem;
  color: #888;
}

/* Start button */
.start-btn {
  width: 100%;
  padding: 0.85rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  background: #4a90e2;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.start-btn:hover {
  background: #357abd;
}

.start-btn:active {
  transform: scale(0.98);
}

/* Hide number input spinners */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
