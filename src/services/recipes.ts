import { supabase } from "@/lib/supabase";

export type RecipeListItem = {
  id: string;
  name: string;
  emoji: string | null;
  preparationMinutes: number;
  servings: number;
};

export type RecipeIngredient = {
  id: string;
  name: string;
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

export async function getRecipes(): Promise<RecipeListItem[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
        id,
        name,
        emoji,
        preparation_minutes,
        servings
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
          servings
        `,
      )
      .eq("id", recipeId)
      .maybeSingle(),

    supabase
      .from("recipe_ingredients")
      .select(
        `
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
    ingredients,
    steps,
  };
}
