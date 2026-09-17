export type Product = {
  id: string;
  name: string;
  brand: string;
  emoji: string;
  nutrition: string;
  price: number;
  isOnSale: boolean;
  oldPrice?: number;
};

export type IngredientProductInformation = {
  name: string;
  emoji: string;
  nutrition: string;
  basePrice: number;
  hasOffer: boolean;
};

export const ingredientInformation: Record<
  string,
  IngredientProductInformation
> = {
  pasta: {
    name: "Pasta",
    emoji: "🍝",
    nutrition: "350 kcal · Proteine 13 g · Carboidrati 70 g · Grassi 1,5 g",
    basePrice: 1.25,
    hasOffer: true,
  },

  tomato: {
    name: "Passata di pomodoro",
    emoji: "🍅",
    nutrition: "29 kcal · Proteine 1,4 g · Carboidrati 4,5 g · Grassi 0,2 g",
    basePrice: 1.45,
    hasOffer: true,
  },

  oil: {
    name: "Olio extravergine",
    emoji: "🫒",
    nutrition: "824 kcal · Grassi 91,6 g",
    basePrice: 7.5,
    hasOffer: false,
  },

  salt: {
    name: "Sale",
    emoji: "🧂",
    nutrition: "0 kcal · Sale 100 g",
    basePrice: 0.85,
    hasOffer: false,
  },

  chicken: {
    name: "Petto di pollo",
    emoji: "🍗",
    nutrition: "110 kcal · Proteine 23 g · Grassi 1,2 g",
    basePrice: 5.9,
    hasOffer: true,
  },

  salad: {
    name: "Insalata",
    emoji: "🥬",
    nutrition: "15 kcal · Proteine 1,4 g · Carboidrati 2,9 g",
    basePrice: 1.35,
    hasOffer: false,
  },

  tomatoes: {
    name: "Pomodorini",
    emoji: "🍅",
    nutrition: "18 kcal · Proteine 0,9 g · Carboidrati 3,9 g",
    basePrice: 2.2,
    hasOffer: true,
  },

  rice: {
    name: "Riso",
    emoji: "🍚",
    nutrition: "360 kcal · Proteine 7 g · Carboidrati 79 g · Grassi 0,6 g",
    basePrice: 2.15,
    hasOffer: true,
  },

  zucchini: {
    name: "Zucchine",
    emoji: "🥒",
    nutrition: "17 kcal · Proteine 1,2 g · Carboidrati 3,1 g",
    basePrice: 2.4,
    hasOffer: false,
  },

  pepper: {
    name: "Peperone",
    emoji: "🫑",
    nutrition: "31 kcal · Proteine 1 g · Carboidrati 6 g",
    basePrice: 1.7,
    hasOffer: true,
  },
};

export function createProducts(ingredientId: string): Product[] {
  const ingredient = ingredientInformation[ingredientId];

  if (!ingredient) {
    return [];
  }

  const standardProduct: Product = {
    id: `${ingredientId}-standard`,
    name: ingredient.name,
    brand: "Marca Classica",
    emoji: ingredient.emoji,
    nutrition: ingredient.nutrition,
    price: ingredient.basePrice,
    isOnSale: false,
  };

  const alternativeProduct: Product = {
    id: `${ingredientId}-alternative`,
    name: ingredient.name,
    brand: "Buona Scelta",
    emoji: ingredient.emoji,
    nutrition: ingredient.nutrition,
    price: Number((ingredient.basePrice * 1.15).toFixed(2)),
    isOnSale: false,
  };

  if (!ingredient.hasOffer) {
    return [standardProduct, alternativeProduct];
  }

  const saleProduct: Product = {
    id: `${ingredientId}-sale`,
    name: ingredient.name,
    brand: "Offerta del giorno",
    emoji: ingredient.emoji,
    nutrition: ingredient.nutrition,
    price: Number((ingredient.basePrice * 0.8).toFixed(2)),
    oldPrice: ingredient.basePrice,
    isOnSale: true,
  };

  return [saleProduct, standardProduct, alternativeProduct];
}
