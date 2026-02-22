import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/arithmeticgame",
      name: "arithmeticgame",
      component: () => import("../views/ArithmeticGame.vue"),
    },
    {
      path: "/probabilitygame",
      name: "probabilitygame",
      component: () => import("../views/ProbabilityGame.vue"),
    },
    {
      path: "/percentagegame",
      name: "percentagegame",
      component: () => import("../views/PercentageGame.vue"),
    },
  ],
});

export default router;
