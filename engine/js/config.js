/* Every economic and simulation value lives here. Money is integer cents. */
window.Pizza = window.Pizza || {};
Pizza.DEBUG_MODE = false;
Pizza.CONFIG = {
  version: '2.3.0', saveVersion: 3, maxDays: 100,
  startingCash: 6400, startingHealth: 10, maxHealth: 10, startingRep: 2,
  healthLoss: 1, foodCost: 800, foodHealth: 3, foodSeconds: 5,
  daySeconds: 20, speeds: [1, 2, 4], baseCustomers: 4, maxCustomers: 100,
  slicesPerBatch: 8,
  work: { total: 100, skillBonus: 4, dough: 20, prepare: 25, train: 20, clean: 25 },
  service: { customerSeconds: 1.9, decisionSeconds: 0.7 },
  skillXP: 10, skillMax: 9, doughXP: 1, prepXP: 1, trainingXP: 2,
  price: { start: 300, min: 100, max: 1000, step: 25, sensitivity: 0.06 },
  buy: { base: 0.52, min: 0.05, max: 0.95, menu: 0.03, maxMenu: 0.15, supply: 0.03, disgust: 0.025 },
  reaction: { delight: 0.12, skill: 0.012, disgust: 0.03, dirt: 0.025, missing: 0.08, fallback: 0.1, satisfied: 0.58, maxDelight: 0.45, maxDisgust: 0.8 },
  reputation: { fullDay: 1, early: -2, delighted: 1, disgusted: -1, turnedAway: -1 },
  disgust: { max: 20, missingSupply: 0.35, perSale: 0.08, spoiledSlice: 0.05, wastedDough: 0.1, spoiledTopping: 0.02, perRat: 1, overflowCan: 0.25 },
  recycling: { capacity: 24, centsPerUnit: 25, windfall: 10, wheelchairRep: 8 },
  freshnessDays: 7, popPrice: 150, popChance: 0.25,
  inventoryCosts: { flour: 100, sauce: 100, cheese: 200, pepperoni: 55, mushroom: 35, green_peppers: 35, napkins: 25, paper_plates: 25, pop: 100 },
  recipeBonuses: { plain: 0, pepperoni: 100, mushroom: 75, green_peppers: 75, classic: 175 },
  recipeDelight: { plain: 0, pepperoni: 0.02, mushroom: 0.02, green_peppers: 0.02, classic: 0.07 },
  orderWeights: { menu: 4, plain: 1 },
  slots: [[0, 1], [25, 2], [75, 3], [150, 4], [300, 5]],
  toppingUnlocks: { pepperoni: 25, mushroom: 50, green_peppers: 100 },
  upgrades: {
    clean_microwave: { cost: 2000, unlock: 0, capacity: 0, rep: 0, clean: 1 },
    hand_made_sign: { cost: 2500, unlock: 0, capacity: 0, rep: 2 },
    folding_table: { cost: 5000, unlock: 25, capacity: 5, rep: 0 },
    mini_fridge: { cost: 6500, unlock: 75, capacity: 0, rep: 0 },
    second_microwave: { cost: 7500, unlock: 50, capacity: 5, rep: 0 },
    tiny_menu_board: { cost: 12000, unlock: 100, capacity: 0, rep: 0, slots: 1 }
  },
  events: { chance: 0.32, bigGame: 10, rain: 0.5, scratch: 4500, interview: 5, catRep: 1, catDirt: 1, weekend: 3, weekendDays: [6, 0], weekLength: 7, sympathyThreshold: 500, sympathyCash: 1000, ratPerSlice: 0.015, ratMaxChance: 0.3 },
  score: { reputation: 10, slices: 2, days: 5, disgust: -5 },
  maxLog: 100, maxHistory: 100, maxPurchase: 100,
  keys: { run: 'pizza-place-rebuild.run.v1', bests: 'pizza-place-rebuild.bests.v1', settings: 'pizza-place-rebuild.settings.v1' }
};
