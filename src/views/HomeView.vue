<script setup lang="ts">
const games = [
  {
    id: "arithmetic",
    title: "Arithmetic",
    description: "Race the clock solving addition and multiplication problems.",
    symbol: "±",
    route: "/arithmeticgame",
    available: true,
  },
  {
    id: "probability",
    title: "Probability",
    description: "Calculate chances and odds before the clock runs out.",
    symbol: "%",
    route: null,
    available: false,
  },
];
</script>

<template>
  <main class="home">
    <header class="hero">
      <h1 class="hero-title">Quant Gamer</h1>
      <p class="hero-subtitle">Sharpen your math skills, one game at a time.</p>
    </header>

    <section class="game-grid">
      <RouterLink
        v-for="game in games"
        :key="game.id"
        :to="game.route ?? ''"
        class="game-card"
        :class="{ disabled: !game.available }"
        @click.prevent="!game.available ? null : undefined"
      >
        <div class="card-symbol">{{ game.symbol }}</div>
        <div class="card-body">
          <h2 class="card-title">{{ game.title }}</h2>
          <p class="card-description">{{ game.description }}</p>
        </div>
        <span v-if="!game.available" class="coming-soon-badge">Coming Soon</span>
        <span v-else class="play-arrow">→</span>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  font-family: sans-serif;
}

/* Hero */
.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #4a90e2, #7b5ea7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: #888;
  margin: 0;
}

/* Game grid */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  width: 100%;
  max-width: 760px;
}

/* Cards */
.game-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.75rem 1.5rem;
  border-radius: 16px;
  border: 2px solid #e8e8e8;
  background: #fff;
  text-decoration: none;
  color: inherit;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  cursor: pointer;
}

.game-card:not(.disabled):hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(74, 144, 226, 0.15);
  border-color: #4a90e2;
}

.game-card.disabled {
  opacity: 0.55;
  cursor: default;
  pointer-events: none;
}

.card-symbol {
  font-size: 2.4rem;
  font-weight: 700;
  color: #4a90e2;
  line-height: 1;
}

.card-body {
  flex: 1;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 0.35rem;
  color: #222;
}

.card-description {
  font-size: 0.88rem;
  color: #777;
  margin: 0;
  line-height: 1.5;
}

.coming-soon-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f0f0f0;
  color: #aaa;
  padding: 0.2rem 0.55rem;
  border-radius: 99px;
}

.play-arrow {
  position: absolute;
  bottom: 1.25rem;
  right: 1.5rem;
  font-size: 1.3rem;
  color: #4a90e2;
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 0.18s, transform 0.18s;
}

.game-card:not(.disabled):hover .play-arrow {
  opacity: 1;
  transform: translateX(0);
}
</style>
