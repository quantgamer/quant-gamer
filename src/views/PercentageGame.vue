<script setup lang="ts">
import { reactive, ref, computed, nextTick } from "vue";

const gameStarted = ref(false);
const score = ref(0);
const timeRemaining = ref(0);
const gameOver = ref(false);
const userAnswer = ref<number | null>(null);
const wrongAnswer = ref(false);

const settings = reactive({
  mode: "exact" as "exact" | "approximate",
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
  } else {
    endGame();
  }
};

const startGame = () => {
  clearTimer();
  gameStarted.value = true;
  gameOver.value = false;
  score.value = 0;
  timeRemaining.value = settings.duration;
  timerInterval = setInterval(updateTime, 1000);
  generateQuestion();
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
  userAnswer.value = null;
  wrongAnswer.value = false;
};

interface Question {
  numerator: number;
  denominator: number;
  answer: number;
  isExact: boolean;
}

const currentQuestion = reactive<Question>({
  numerator: 0,
  denominator: 0,
  answer: 0,
  isExact: true,
});

const answerInput = ref<HTMLInputElement | null>(null);

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Generate a question where X/Y * 100 is exactly an integer P (1–200, not 100).
// For P=100, X would always equal Y (trivially obvious), so it's excluded.
const generateExactQuestion = (): { numerator: number; denominator: number; answer: number } => {
  let numerator = 0;
  let denominator = 0;
  let p = 0;
  let attempts = 0;

  do {
    p = randomInt(1, 199);
    if (p === 100) continue; // X === Y always; too obvious
    const g = gcd(p, 100);
    const minDenom = 100 / g;
    const maxScale = Math.max(1, Math.floor(600 / minDenom));
    const scale = randomInt(1, maxScale);
    denominator = minDenom * scale;
    numerator = (p * denominator) / 100;
    attempts++;
  } while (denominator < 10 && attempts < 60);

  return { numerator, denominator, answer: p };
};

// Generate a question where X/Y * 100 is NOT an integer — ask for the nearest whole %.
const generateApproxQuestion = (): { numerator: number; denominator: number; answer: number } => {
  let attempts = 0;
  while (attempts < 120) {
    const denominator = randomInt(10, 200);
    const numerator = randomInt(1, Math.ceil(denominator * 2));
    const pct = (numerator / denominator) * 100;
    const rounded = Math.round(pct);
    if (!Number.isInteger(pct) && rounded >= 1 && rounded <= 200) {
      return { numerator, denominator, answer: rounded };
    }
    attempts++;
  }
  return { numerator: 7, denominator: 10, answer: 70 }; // unreachable fallback
};

const generateQuestion = () => {
  const mode = settings.mode;
  const q = mode === "exact" ? generateExactQuestion() : generateApproxQuestion();

  currentQuestion.numerator = q.numerator;
  currentQuestion.denominator = q.denominator;
  currentQuestion.answer = q.answer;
  currentQuestion.isExact = settings.mode === "exact";

  userAnswer.value = null;
  wrongAnswer.value = false;
};

const canStart = computed(() => !!settings.mode);

const checkAnswer = () => {
  if (userAnswer.value === null || userAnswer.value === undefined) return;
  if (userAnswer.value === currentQuestion.answer) {
    score.value += 1;
    generateQuestion();
    nextTick(() => answerInput.value?.focus());
  } else {
    wrongAnswer.value = true;
    setTimeout(() => (wrongAnswer.value = false), 600);
  }
};

const blockInvalidKeys = (e: KeyboardEvent) => {
  if (["-", "+", ".", "e", "E"].includes(e.key)) e.preventDefault();
};

const clampDuration = () => {
  settings.duration = Math.max(30, Math.floor(isNaN(settings.duration) ? 30 : settings.duration));
};
</script>

<template>
  <div class="percentagegame">
    <h1>Percentage Game</h1>
    <div class="game-container">

      <!-- Settings Screen -->
      <div v-if="!gameStarted" class="settings">
        <p class="settings-subtitle">Calculate what percentage one number is of another</p>

        <div class="mode-cards">
          <label class="mode-card" :class="{ active: settings.mode === 'exact' }">
            <input type="radio" v-model="settings.mode" value="exact" />
            <span class="mode-symbol">= %</span>
            <span class="mode-label">Exact</span>
            <span class="mode-desc">The answer is always a whole number percentage</span>
          </label>

          <label class="mode-card" :class="{ active: settings.mode === 'approximate' }">
            <input type="radio" v-model="settings.mode" value="approximate" />
            <span class="mode-symbol">≈ %</span>
            <span class="mode-label">Approximate</span>
            <span class="mode-desc">Round to the nearest whole percentage</span>
          </label>
        </div>

        <div class="duration-row">
          <label class="duration-label">
            <span>⏱ Duration</span>
            <div class="duration-input-wrap">
              <input
                type="number"
                v-model.number="settings.duration"
                @blur="clampDuration"
                min="30"
                step="30"
              />
              <span class="unit">sec</span>
            </div>
          </label>
        </div>

        <button class="start-btn" @click="startGame" :disabled="!canStart">Start Game</button>
      </div>

      <!-- Game Screen -->
      <div v-if="gameStarted && !gameOver" class="game">
        <div class="game-stats">
          <span class="stat">Score: <strong>{{ score }}</strong></span>
          <span class="stat timer" :class="{ urgent: timeRemaining <= 10 }">
            Time: <strong>{{ timeRemaining }}s</strong>
          </span>
        </div>

        <div class="question-card">
          <div class="mode-badge" :class="{ approx: !currentQuestion.isExact }">
            {{ currentQuestion.isExact ? 'Exact' : 'Approximate' }}
          </div>
          <div class="numbers-display">
            <span class="num-big">{{ currentQuestion.numerator }}</span>
            <span class="connector">is what % of</span>
            <span class="num-big">{{ currentQuestion.denominator }}</span>
            <span class="question-mark">?</span>
          </div>
          <p class="hint-text" v-if="!currentQuestion.isExact">
            Round to the nearest whole percentage
          </p>
        </div>

        <div class="question-area">
          <div class="answer-row" :class="{ shake: wrongAnswer, wrong: wrongAnswer }">
            <input
              ref="answerInput"
              class="answer-input"
              type="number"
              v-model.number="userAnswer"
              @keyup.enter="checkAnswer"
              @keydown="blockInvalidKeys"
              placeholder=""
              autofocus
            />
            <span class="answer-unit">%</span>
          </div>
          <button class="submit-btn" @click="checkAnswer">Submit</button>
        </div>

        <button class="back-btn" @click="backToSettings">Return to Settings</button>
      </div>

      <!-- Game Over Screen -->
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
.percentagegame {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: sans-serif;
  padding: 2rem 1rem;
  text-align: center;
}

.game-container {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

/* ── Settings ── */
.settings {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.settings-subtitle {
  color: #888;
  margin: 0;
  font-size: 0.95rem;
  max-width: 380px;
  line-height: 1.5;
}

.mode-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px solid #ddd;
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  background: #fafafa;
  user-select: none;
}

.mode-card input[type="radio"] {
  display: none;
}

.mode-card.active {
  border-color: #1a9e6f;
  background: #edfaf4;
  box-shadow: 0 2px 12px rgba(26, 158, 111, 0.18);
}

.mode-symbol {
  font-size: 2rem;
  font-weight: 700;
  color: #1a9e6f;
  line-height: 1;
}

.mode-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mode-desc {
  font-size: 0.78rem;
  color: #999;
  line-height: 1.5;
  font-style: italic;
}

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

/* ── Game ── */
.game {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
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

.timer.urgent strong {
  color: #e05252;
}

/* ── Question card ── */
.question-card {
  width: 100%;
  background: #fff;
  border: 1.5px solid #c3e8d7;
  border-radius: 16px;
  padding: 1.75rem 1.5rem 1.5rem;
  box-shadow: 0 2px 14px rgba(26, 158, 111, 0.09);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.mode-badge {
  display: inline-block;
  padding: 0.2rem 0.75rem;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #edfaf4;
  color: #1a9e6f;
  border: 1px solid #b2e5cf;
}

.mode-badge.approx {
  background: #fff8ec;
  color: #c07b1a;
  border-color: #f0d09a;
}

.numbers-display {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.6rem 0.85rem;
  margin: 0.25rem 0;
}

.num-big {
  font-size: 2.6rem;
  font-weight: 800;
  color: #1a9e6f;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.connector {
  font-size: 1rem;
  color: #888;
  font-weight: 500;
  white-space: nowrap;
}

.question-mark {
  font-size: 2.4rem;
  font-weight: 800;
  color: #aaa;
  line-height: 1;
}

.hint-text {
  font-size: 0.8rem;
  color: #c07b1a;
  margin: 0;
  font-style: italic;
}

/* ── Answer area ── */
.question-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
}

.answer-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.answer-row.wrong .answer-input {
  border-color: #e05252;
  box-shadow: 0 0 0 3px rgba(224, 82, 82, 0.2);
}

@keyframes shake {
  0%   { transform: translateX(0); }
  20%  { transform: translateX(-6px); }
  40%  { transform: translateX(6px); }
  60%  { transform: translateX(-4px); }
  80%  { transform: translateX(4px); }
  100% { transform: translateX(0); }
}

.answer-row.shake {
  animation: shake 0.5s ease;
}

.answer-input {
  width: 110px;
  padding: 0.65rem 0.8rem;
  font-size: 1.8rem;
  text-align: center;
  border: 2px solid #1a9e6f;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.answer-input:focus {
  box-shadow: 0 0 0 3px rgba(26, 158, 111, 0.22);
}

.answer-unit {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a9e6f;
}

.submit-btn {
  padding: 0.55rem 2rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  background: #1a9e6f;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.submit-btn:hover {
  background: #157d58;
}

.submit-btn:active {
  transform: scale(0.97);
}

/* ── Shared buttons ── */
.start-btn {
  width: 100%;
  padding: 0.85rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  background: #1a9e6f;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.start-btn:hover {
  background: #157d58;
}

.start-btn:active {
  transform: scale(0.98);
}

.start-btn:disabled {
  background: #9fd4bf;
  cursor: not-allowed;
  transform: none;
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

/* ── Game over ── */
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
  color: #1a9e6f;
  font-size: 1.5rem;
}

/* ── Nav ── */
nav {
  margin-top: 2rem;
}

nav a {
  color: #1a9e6f;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
}

nav a:hover {
  text-decoration: underline;
}

/* Hide number spinners */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
