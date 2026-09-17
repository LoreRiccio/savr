export type Ingredient = {
  id: string;
  name: string;
  quantity: string;
};

export type Recipe = {
  id: string;
  emoji: string;
  name: string;
  time: string;
  ingredients: Ingredient[];
  steps: string[];
};

export const recipes: Record<string, Recipe> = {
  "1": {
    id: "1",
    emoji: "🍝",
    name: "Pasta al pomodoro",
    time: "20 minuti",

    ingredients: [
      {
        id: "pasta",
        name: "Pasta",
        quantity: "180 g",
      },
      {
        id: "tomato",
        name: "Passata di pomodoro",
        quantity: "250 g",
      },
      {
        id: "oil",
        name: "Olio extravergine",
        quantity: "2 cucchiai",
      },
      {
        id: "salt",
        name: "Sale",
        quantity: "Quanto basta",
      },
    ],

    steps: [
      "Metti a bollire una pentola d’acqua.",
      "Aggiungi il sale quando l’acqua bolle.",
      "Cuoci la pasta seguendo il tempo indicato.",
      "Scalda il sugo di pomodoro in una padella.",
      "Scola la pasta e uniscila al sugo.",
    ],
  },

  "2": {
    id: "2",
    emoji: "🥗",
    name: "Insalata di pollo",
    time: "25 minuti",

    ingredients: [
      {
        id: "chicken",
        name: "Petto di pollo",
        quantity: "300 g",
      },
      {
        id: "salad",
        name: "Insalata",
        quantity: "150 g",
      },
      {
        id: "tomatoes",
        name: "Pomodorini",
        quantity: "150 g",
      },
      {
        id: "oil",
        name: "Olio extravergine",
        quantity: "2 cucchiai",
      },
    ],

    steps: [
      "Scalda una padella.",
      "Cuoci il pollo fino a completa doratura.",
      "Lava e taglia l’insalata.",
      "Taglia il pollo a strisce.",
      "Unisci gli ingredienti e condisci.",
    ],
  },

  "3": {
    id: "3",
    emoji: "🍚",
    name: "Riso con verdure",
    time: "30 minuti",

    ingredients: [
      {
        id: "rice",
        name: "Riso",
        quantity: "180 g",
      },
      {
        id: "zucchini",
        name: "Zucchine",
        quantity: "2",
      },
      {
        id: "pepper",
        name: "Peperone",
        quantity: "1",
      },
      {
        id: "oil",
        name: "Olio extravergine",
        quantity: "2 cucchiai",
      },
    ],

    steps: [
      "Lava e taglia le verdure.",
      "Cuoci le verdure in padella.",
      "Porta a bollore una pentola d’acqua.",
      "Cuoci e scola il riso.",
      "Unisci il riso alle verdure.",
    ],
  },
};

export const recipeList = Object.values(recipes);
