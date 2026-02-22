<script setup lang="ts">
import { reactive, ref, computed, nextTick } from "vue";

const gameStarted = ref(false);
const score = ref(0);
const timeRemaining = ref(0);
const gameOver = ref(false);
const userAnswer = ref<number | null>(null);
const wrongAnswer = ref(false);

const settings = reactive({
  includeExpectedProfit: true,
  includeExpectedRevenue: false,
  includeExpectedCost: false,
  includeProbProfitable: true,
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

interface ScenarioState {
  name: string;
  probability: number;
  revenue: number;
  cost: number;
}

interface Question {
  scenarios: ScenarioState[];
  questionText: string;
  hint: string;
  answer: number;
  unit: string;
  questionType: string;
}

const currentQuestion = reactive<Question>({
  scenarios: [],
  questionText: "",
  hint: "",
  answer: 0,
  unit: "",
  questionType: "",
});

const answerInput = ref<HTMLInputElement | null>(null);

// All probabilities are multiples of 0.1 — combined with revenues/costs in multiples of $10M,
// this guarantees expected values are always whole integers.
const probSets = [
  [0.5, 0.5],
  [0.4, 0.6],
  [0.3, 0.7],
  [0.2, 0.8],
  [0.1, 0.9],
  [0.3, 0.4, 0.3],
  [0.2, 0.5, 0.3],
  [0.1, 0.6, 0.3],
  [0.2, 0.4, 0.4],
  [0.1, 0.5, 0.4],
  [0.2, 0.3, 0.5],
  [0.1, 0.4, 0.5],
  [0.2, 0.2, 0.6],
  [0.3, 0.3, 0.4],
];

const twoStateNames = [
  ["Bull Market", "Bear Market"],
  ["Strong", "Weak"],
  ["Boom", "Bust"],
  ["Favorable", "Unfavorable"],
  ["Growth", "Contraction"],
];

const threeStateNames = [
  ["Strong", "Normal", "Weak"],
  ["Good", "Average", "Poor"],
  ["Boom", "Steady", "Recession"],
  ["Favorable", "Neutral", "Adverse"],
  ["Bull", "Flat", "Bear"],
];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateQuestion = () => {
  const probSet = randomChoice(probSets);
  const n = probSet.length;

  const names = n === 2 ? randomChoice(twoStateNames) : randomChoice(threeStateNames);

  // Revenue: multiples of $10M in range $30M–$150M
  // Cost: multiples of $10M, between 50%–140% of revenue — keeps scenarios realistic
  const scenarios: ScenarioState[] = probSet.map((p, i) => {
    const revenue = randomInt(3, 15) * 10;
    const minCostSteps = Math.max(1, Math.floor(revenue * 0.5 / 10));
    const maxCostSteps = Math.ceil(revenue * 1.4 / 10);
    const cost = randomInt(minCostSteps, maxCostSteps) * 10;
    return { name: names[i], probability: p, revenue, cost };
  });

  const types: string[] = [];
  if (settings.includeExpectedProfit) types.push("expectedProfit");
  if (settings.includeExpectedRevenue) types.push("expectedRevenue");
  if (settings.includeExpectedCost) types.push("expectedCost");
  if (settings.includeProbProfitable) types.push("probProfitable");

  const questionType = randomChoice(types);

  let questionText = "";
  let hint = "";
  let answer = 0;
  let unit = "";

  if (questionType === "expectedProfit") {
    answer = Math.round(
      scenarios.reduce((sum, s) => sum + s.probability * (s.revenue - s.cost), 0)
    );
    questionText = "What is the expected profit?";
    hint = "E[Profit] = Σ P × (Revenue − Cost)";
    unit = "$M";
  } else if (questionType === "expectedRevenue") {
    answer = Math.round(
      scenarios.reduce((sum, s) => sum + s.probability * s.revenue, 0)
    );
    questionText = "What is the expected revenue?";
    hint = "E[Revenue] = Σ P × Revenue";
    unit = "$M";
  } else if (questionType === "expectedCost") {
    answer = Math.round(
      scenarios.reduce((sum, s) => sum + s.probability * s.cost, 0)
    );
    questionText = "What is the expected cost?";
    hint = "E[Cost] = Σ P × Cost";
    unit = "$M";
  } else {
    answer = Math.round(
      scenarios.filter(s => s.revenue > s.cost).reduce((sum, s) => sum + s.probability, 0) * 100
    );
    questionText = "What is the probability of being profitable?";
    hint = "P(Profitable) = sum of P where Revenue > Cost";
    unit = "%";
  }

  currentQuestion.scenarios = [...scenarios];
  currentQuestion.questionText = questionText;
  currentQuestion.hint = hint;
  currentQuestion.answer = answer;
  currentQuestion.unit = unit;
  currentQuestion.questionType = questionType;

  userAnswer.value = null;
  wrongAnswer.value = false;
};

const canStart = computed(
  () =>
    settings.includeExpectedProfit ||
    settings.includeExpectedRevenue ||
    settings.includeExpectedCost ||
    settings.includeProbProfitable
);

const checkAnswer = () => {
  if (userAnswer.value === null || userAnswer.value === undefined) return;
  if (userAnswer.value === currentQuestion.answer) {
    score.value += 1;
    userAnswer.value = null;
    wrongAnswer.value = false;
    generateQuestion();
    nextTick(() => answerInput.value?.focus());
  } else {
    wrongAnswer.value = true;
    setTimeout(() => (wrongAnswer.value = false), 600);
  }
};

const blockInvalidKeys = (e: KeyboardEvent) => {
  if (["+", ".", "e", "E"].includes(e.key)) e.preventDefault();
};

const clampDuration = () => {
  settings.duration = Math.max(30, Math.floor(isNaN(settings.duration) ? 30 : settings.duration));
};

const formatProb = (p: number) => `${Math.round(p * 100)}%`;
</script>

<template>
  <div class="probabilitygame">
    <h1>Probability Game</h1>
    <div class="game-container">

      <!-- Settings Screen -->
      <div v-if="!gameStarted" class="settings">
        <p class="settings-subtitle">Calculate expected profitability from revenue & cost distributions</p>

        <div class="qtype-cards">
          <label class="qtype-card" :class="{ active: settings.includeExpectedProfit }">
            <input type="checkbox" v-model="settings.includeExpectedProfit" />
            <span class="qtype-symbol">E[π]</span>
            <span class="qtype-label">Expected Profit</span>
            <span class="qtype-formula">Σ P × (R − C)</span>
          </label>

          <label class="qtype-card" :class="{ active: settings.includeProbProfitable }">
            <input type="checkbox" v-model="settings.includeProbProfitable" />
            <span class="qtype-symbol">P(+)</span>
            <span class="qtype-label">P(Profitable)</span>
            <span class="qtype-formula">Σ P where R &gt; C</span>
          </label>

          <label class="qtype-card" :class="{ active: settings.includeExpectedRevenue }">
            <input type="checkbox" v-model="settings.includeExpectedRevenue" />
            <span class="qtype-symbol">E[R]</span>
            <span class="qtype-label">Expected Revenue</span>
            <span class="qtype-formula">Σ P × Revenue</span>
          </label>

          <label class="qtype-card" :class="{ active: settings.includeExpectedCost }">
            <input type="checkbox" v-model="settings.includeExpectedCost" />
            <span class="qtype-symbol">E[C]</span>
            <span class="qtype-label">Expected Cost</span>
            <span class="qtype-formula">Σ P × Cost</span>
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

        <div class="scenario-card">
          <table class="scenario-table">
            <thead>
              <tr>
                <th>Market State</th>
                <th>Probability</th>
                <th>Revenue ($M)</th>
                <th>Cost ($M)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="state in currentQuestion.scenarios"
                :key="state.name"
                :class="{ profitable: state.revenue > state.cost, loss: state.revenue <= state.cost }"
              >
                <td class="state-name">{{ state.name }}</td>
                <td class="prob-cell">{{ formatProb(state.probability) }}</td>
                <td class="num-cell">{{ state.revenue }}</td>
                <td class="num-cell">{{ state.cost }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="question-area">
          <p class="question-text">{{ currentQuestion.questionText }}</p>
          <p class="hint-text">{{ currentQuestion.hint }}</p>
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
            <span class="answer-unit">{{ currentQuestion.unit }}</span>
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
.probabilitygame {
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
  max-width: 600px;
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
  max-width: 420px;
  line-height: 1.5;
}

.qtype-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
}

.qtype-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.25rem 1rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  background: #fafafa;
  user-select: none;
}

.qtype-card input[type="checkbox"] {
  display: none;
}

.qtype-card.active {
  border-color: #7b5ea7;
  background: #f3eeff;
  box-shadow: 0 2px 10px rgba(123, 94, 167, 0.18);
}

.qtype-symbol {
  font-size: 1.8rem;
  font-weight: 700;
  color: #7b5ea7;
  line-height: 1;
  font-family: "Georgia", serif;
}

.qtype-label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.qtype-formula {
  font-size: 0.76rem;
  color: #999;
  font-style: italic;
  font-family: "Georgia", serif;
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
  gap: 1.5rem;
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

/* ── Scenario table ── */
.scenario-card {
  width: 100%;
  border-radius: 14px;
  border: 1.5px solid #e0d6f0;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px rgba(123, 94, 167, 0.08);
}

.scenario-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.scenario-table thead tr {
  background: #f3eeff;
}

.scenario-table th {
  padding: 0.65rem 0.8rem;
  font-weight: 700;
  color: #7b5ea7;
  text-align: center;
  border-bottom: 1.5px solid #e0d6f0;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.scenario-table th:first-child {
  text-align: left;
}

.scenario-table td {
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid #f0e8ff;
  color: #333;
  text-align: center;
}

.scenario-table tbody tr:last-child td {
  border-bottom: none;
}

.state-name {
  text-align: left !important;
  font-weight: 600;
}

.prob-cell {
  font-weight: 600;
  color: #7b5ea7;
}

.num-cell {
  font-family: "Georgia", monospace;
}

.scenario-table tbody tr.profitable td {
  background: #f6fff6;
}

.scenario-table tbody tr.loss td {
  background: #fff8f8;
}

/* ── Question area ── */
.question-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.question-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #222;
  margin: 0;
}

.hint-text {
  font-size: 0.82rem;
  color: #aaa;
  margin: 0;
  font-style: italic;
  font-family: "Georgia", serif;
}

.answer-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: transform 0.1s;
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
  padding: 0.6rem 0.8rem;
  font-size: 1.6rem;
  text-align: center;
  border: 2px solid #7b5ea7;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.answer-input:focus {
  box-shadow: 0 0 0 3px rgba(123, 94, 167, 0.22);
}

.answer-unit {
  font-size: 1.1rem;
  font-weight: 700;
  color: #7b5ea7;
  min-width: 28px;
  text-align: left;
}

.submit-btn {
  padding: 0.55rem 2rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  background: #7b5ea7;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.submit-btn:hover {
  background: #6248a0;
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
  background: #7b5ea7;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.start-btn:hover {
  background: #6248a0;
}

.start-btn:active {
  transform: scale(0.98);
}

.start-btn:disabled {
  background: #c4b0e0;
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
  color: #7b5ea7;
  font-size: 1.5rem;
}

/* ── Nav ── */
nav {
  margin-top: 2rem;
}

nav a {
  color: #7b5ea7;
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
