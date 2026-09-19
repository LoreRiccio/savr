import { supabase } from "@/lib/supabase";

export type RecipeListItem = {
  id: string;
  name: string;
  emoji: string | null;
  preparationMinutes: number;
  servings: number;
  category: string;
  imageUrl: string | null;
  caloriesKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  isLight: boolean;
  variantOfRecipeId: string | null;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  displayQuantity: string;
  position: number;
};

export type RecipeStep = {
  id: string;
  position: number;
  instruction: string;
  imageUrl: string | null;
  timerSeconds: number | null;
};

export type RecipeDetails = RecipeListItem & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

function numberOrNull(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const convertedValue = Number(value);

  return Number.isNaN(convertedValue) ? null : convertedValue;
}

export async function getRecipes(): Promise<RecipeListItem[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
        id,
        name,
        emoji,
        preparation_minutes,
        servings,
        category,
        image_url,
        calories_kcal,
        protein_g,
        carbohydrates_g,
        fat_g,
        is_light,
        variant_of_recipe_id
      `,
    )
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    emoji: recipe.emoji,
    preparationMinutes: recipe.preparation_minutes,
    servings: recipe.servings,
    category: recipe.category,
    imageUrl: recipe.image_url,
    caloriesKcal: numberOrNull(recipe.calories_kcal),
    proteinG: numberOrNull(recipe.protein_g),
    carbohydratesG: numberOrNull(recipe.carbohydrates_g),
    fatG: numberOrNull(recipe.fat_g),
    isLight: recipe.is_light,
    variantOfRecipeId: recipe.variant_of_recipe_id,
  }));
}

export async function getRecipeById(
  recipeId: string,
): Promise<RecipeDetails | null> {
  const [recipeResult, ingredientsResult, stepsResult] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        `
          id,
          name,
          emoji,
          preparation_minutes,
          servings,
          category,
          image_url,
          calories_kcal,
          protein_g,
          carbohydrates_g,
          fat_g,
          is_light,
          variant_of_recipe_id
        `,
      )
      .eq("id", recipeId)
      .maybeSingle(),

    supabase
      .from("recipe_ingredients")
      .select(
        `
          quantity,
          unit,
          display_quantity,
          position,
          ingredient:ingredients (
            id,
            name
          )
        `,
      )
      .eq("recipe_id", recipeId)
      .order("position"),

    supabase
      .from("recipe_steps")
      .select(
        `
          id,
          position,
          instruction,
          image_url,
          timer_seconds
        `,
      )
      .eq("recipe_id", recipeId)
      .order("position"),
  ]);

  if (recipeResult.error) {
    throw new Error(recipeResult.error.message);
  }

  if (ingredientsResult.error) {
    throw new Error(ingredientsResult.error.message);
  }

  if (stepsResult.error) {
    throw new Error(stepsResult.error.message);
  }

  if (!recipeResult.data) {
    return null;
  }

  const ingredients: RecipeIngredient[] = (
    ingredientsResult.data ?? []
  ).flatMap((row) => {
    const ingredient = Array.isArray(row.ingredient)
      ? row.ingredient[0]
      : row.ingredient;

    if (!ingredient) {
      return [];
    }

    return [
      {
        id: ingredient.id,
        name: ingredient.name,
        quantity: numberOrNull(row.quantity),
        unit: row.unit,
        displayQuantity: row.display_quantity,
        position: row.position,
      },
    ];
  });

  const steps: RecipeStep[] = (stepsResult.data ?? []).map((step) => ({
    id: step.id,
    position: step.position,
    instruction: step.instruction,
    imageUrl: step.image_url,
    timerSeconds: step.timer_seconds,
  }));

  return {
    id: recipeResult.data.id,
    name: recipeResult.data.name,
    emoji: recipeResult.data.emoji,
    preparationMinutes: recipeResult.data.preparation_minutes,
    servings: recipeResult.data.servings,
    category: recipeResult.data.category,
    imageUrl: recipeResult.data.image_url,
    caloriesKcal: numberOrNull(recipeResult.data.calories_kcal),
    proteinG: numberOrNull(recipeResult.data.protein_g),
    carbohydratesG: numberOrNull(recipeResult.data.carbohydrates_g),
    fatG: numberOrNull(recipeResult.data.fat_g),
    isLight: recipeResult.data.is_light,
    variantOfRecipeId: recipeResult.data.variant_of_recipe_id,
    ingredients,
    steps,
  };
}
