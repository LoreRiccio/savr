import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getRecipeById,
  type RecipeDetails,
  type RecipeIngredient,
} from "@/services/recipes";
import { getSession, updateSession } from "@/services/session";

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  if (value === 0.25) {
    return "1/4";
  }

  if (value === 0.5) {
    return "1/2";
  }

  if (value === 0.75) {
    return "3/4";
  }

  return value
    .toFixed(2)
    .replace(/\.?0+$/, "")
    .replace(".", ",");
}

function formatEggs(multiplier: number): string {
  const eggsText =
    multiplier === 1 ? "1 uovo" : `${formatNumber(multiplier)} uova`;

  const yolksText =
    multiplier === 1 ? "1 tuorlo" : `${formatNumber(multiplier)} tuorli`;

  return `${eggsText} + ${yolksText}`;
}

function getScaledDisplayQuantity(
  ingredient: RecipeIngredient,
  selectedServings: number,
  baseServings: number,
): string {
  if (ingredient.quantity === null) {
    return ingredient.displayQuantity;
  }

  const multiplier = selectedServings / Math.max(1, baseServings);
  const scaledQuantity = ingredient.quantity * multiplier;
  const normalizedName = ingredient.name.toLowerCase();

  if (
    normalizedName === "uova" &&
    ingredient.displayQuantity.toLowerCase().includes("tuorlo")
  ) {
    return formatEggs(multiplier);
  }

  if (ingredient.unit) {
    return `${formatNumber(scaledQuantity)} ${ingredient.unit}`;
  }

  if (normalizedName === "aglio") {
    return `${formatNumber(scaledQuantity)} ${
      scaledQuantity === 1 ? "spicchio" : "spicchi"
    }`;
  }

  if (normalizedName === "lime") {
    return `${formatNumber(scaledQuantity)} lime`;
  }

  return formatNumber(scaledQuantity);
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [selectedServings, setSelectedServings] = useState(1);
  const [ownedIngredientIds, setOwnedIngredientIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipe() {
      if (!id) {
        setErrorMessage("Identificativo della ricetta mancante.");
        setIsLoading(false);
        return;
      }

      try {
        const [databaseRecipe, savedSession] = await Promise.all([
          getRecipeById(id),
          getSession(),
        ]);

        if (!databaseRecipe) {
          setErrorMessage("Ricetta non trovata.");
          return;
        }

        setRecipe(databaseRecipe);

        if (savedSession.recipeId === id) {
          setSelectedServings(Math.max(1, savedSession.selectedServings));

          if (savedSession.ingredientCheckCompleted) {
            const ownedIds = databaseRecipe.ingredients
              .filter(
                (ingredient) =>
                  !savedSession.missingIngredientIds.includes(ingredient.id),
              )
              .map((ingredient) => ingredient.id);

            setOwnedIngredientIds(ownedIds);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Errore sconosciuto";

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecipe();
  }, [id]);

  function decreaseServings() {
    setSelectedServings((current) => Math.max(1, current - 1));
  }

  function increaseServings() {
    setSelectedServings((current) => Math.min(8, current + 1));
  }

  function toggleOwnedIngredient(ingredientId: string) {
    setOwnedIngredientIds((currentIds) => {
      if (currentIds.includes(ingredientId)) {
        return currentIds.filter((currentId) => currentId !== ingredientId);
      }

      return [...currentIds, ingredientId];
    });
  }

  function markEverythingAsOwned() {
    if (!recipe) {
      return;
    }

    setOwnedIngredientIds(
      recipe.ingredients.map((ingredient) => ingredient.id),
    );
  }

  function markNothingAsOwned() {
    setOwnedIngredientIds([]);
  }

  async function continueRecipe() {
    if (!id || !recipe) {
      return;
    }

    const missingIngredientIds = recipe.ingredients
      .filter((ingredient) => !ownedIngredientIds.includes(ingredient.id))
      .map((ingredient) => ingredient.id);

    try {
      setIsSaving(true);
      setErrorMessage(null);

      await updateSession({
        recipeId: id,
        selectedServings,
        ingredientCheckCompleted: true,
        missingIngredientIds,
        supermarketId: null,
        selectedProducts: {},
        currentCookingStep: 0,
        stage: missingIngredientIds.length === 0 ? "cooking" : "supermarket",
      });

      if (missingIngredientIds.length === 0) {
        router.push({
          pathname: "/recipe/cook/[id]",
          params: { id },
        });

        return;
      }

      router.push({
        pathname: "/recipe/supermarket/[id]",
        params: {
          id,
          missing: missingIngredientIds.join(","),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile salvare gli ingredienti.";

      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA5B36" />

        <Text style={styles.statusText}>Caricamento della ricetta...</Text>
      </View>
    );
  }

  if (errorMessage && !recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMessage}</Text>

        <Pressable onPress={() => router.replace("/")}>
          <Text style={styles.backText}>Torna alla Home</Text>
        </Pressable>
      </View>
    );
  }

  if (!recipe) {
    return null;
  }

  const missingCount = recipe.ingredients.length - ownedIngredientIds.length;

  const totalCalories =
    recipe.caloriesKcal !== null
      ? Math.round(recipe.caloriesKcal * selectedServings)
      : null;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.recipeName}>{recipe.name}</Text>

      <Text style={styles.sectionTitle}>Per quante persone cucini?</Text>

      <View style={styles.servingsCard}>
        <Pressable
          disabled={selectedServings === 1}
          style={[
            styles.servingsButton,
            selectedServings === 1 && styles.disabledServingsButton,
          ]}
          onPress={decreaseServings}
        >
          <Text style={styles.servingsButtonText}>−</Text>
        </Pressable>

        <View style={styles.servingsValueContainer}>
          <Text style={styles.servingsValue}>{selectedServings}</Text>

          <Text style={styles.servingsLabel}>
            {selectedServings === 1 ? "persona" : "persone"}
          </Text>
        </View>

        <Pressable
          disabled={selectedServings === 8}
          style={[
            styles.servingsButton,
            selectedServings === 8 && styles.disabledServingsButton,
          ]}
          onPress={increaseServings}
        >
          <Text style={styles.servingsButtonText}>+</Text>
        </Pressable>
      </View>

      {totalCalories !== null && (
        <Text style={styles.caloriesText}>
          {totalCalories} kcal totali · {recipe.caloriesKcal} kcal a persona
        </Text>
      )}

      <View style={styles.ingredientsHeader}>
        <View style={styles.ingredientsHeaderText}>
          <Text style={styles.sectionTitle}>Controlla gli ingredienti</Text>

          <Text style={styles.subtitle}>
            Spunta quelli che hai già in casa.
          </Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickActionButton}
          onPress={markEverythingAsOwned}
        >
          <Text style={styles.quickActionText}>Ho già tutto</Text>
        </Pressable>

        <Pressable
          style={styles.quickActionButton}
          onPress={markNothingAsOwned}
        >
          <Text style={styles.quickActionText}>Non ho niente</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {recipe.ingredients.map((ingredient) => {
          const isOwned = ownedIngredientIds.includes(ingredient.id);

          const scaledQuantity = getScaledDisplayQuantity(
            ingredient,
            selectedServings,
            recipe.servings,
          );

          return (
            <Pressable
              key={ingredient.id}
              style={[
                styles.ingredientCard,
                isOwned && styles.ownedIngredientCard,
              ]}
              onPress={() => toggleOwnedIngredient(ingredient.id)}
            >
              <View style={styles.ingredientInformation}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>

                <Text style={styles.quantity}>{scaledQuantity}</Text>
              </View>

              <View style={styles.ownedStatus}>
                {isOwned && <Text style={styles.ownedLabel}>Ce l’ho</Text>}

                <View
                  style={[styles.checkbox, isOwned && styles.selectedCheckbox]}
                >
                  {isOwned && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryNumber}>{missingCount}</Text>

        <Text style={styles.summaryText}>
          {missingCount === 1
            ? "ingrediente da comprare"
            : "ingredienti da comprare"}
        </Text>
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <Pressable
        disabled={isSaving}
        style={({ pressed }) => [
          styles.continueButton,
          (pressed || isSaving) && styles.pressed,
        ]}
        onPress={continueRecipe}
      >
        <Text style={styles.continueButtonText}>
          {isSaving
            ? "Salvataggio..."
            : missingCount === 0
              ? "Inizia a cucinare"
              : `Trova i prodotti (${missingCount})`}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.backText}>Torna ai piatti</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFF8EE",
  },

  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    backgroundColor: "#FFF8EE",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 24,
  },

  logo: {
    color: "#EA5B36",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },

  recipeName: {
    color: "#171717",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    marginBottom: 28,
  },

  sectionTitle: {
    color: "#171717",
    fontSize: 21,
    fontWeight: "700",
  },

  servingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  servingsButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EA5B36",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledServingsButton: {
    backgroundColor: "#E7C5BC",
  },

  servingsButtonText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "600",
    lineHeight: 34,
  },

  servingsValueContainer: {
    alignItems: "center",
  },

  servingsValue: {
    color: "#171717",
    fontSize: 32,
    fontWeight: "700",
  },

  servingsLabel: {
    color: "#666666",
    fontSize: 14,
    marginTop: 2,
  },

  caloriesText: {
    color: "#777777",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },

  ingredientsHeader: {
    marginTop: 36,
  },

  ingredientsHeaderText: {
    flex: 1,
  },

  subtitle: {
    color: "#666666",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },

  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  quickActionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },

  quickActionText: {
    color: "#EA5B36",
    fontSize: 14,
    fontWeight: "600",
  },

  list: {
    gap: 12,
    marginTop: 18,
    marginBottom: 24,
  },

  ingredientCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
    borderWidth: 2,
    borderRadius: 16,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  ownedIngredientCard: {
    borderColor: "#65A765",
    backgroundColor: "#F3FAF1",
  },

  ingredientInformation: {
    flex: 1,
  },

  ingredientName: {
    color: "#171717",
    fontSize: 17,
    fontWeight: "600",
  },

  quantity: {
    color: "#777777",
    fontSize: 14,
    marginTop: 5,
  },

  ownedStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  ownedLabel: {
    color: "#4F8D4F",
    fontSize: 13,
    fontWeight: "600",
  },

  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#BBBBBB",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedCheckbox: {
    backgroundColor: "#65A765",
    borderColor: "#65A765",
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: "#FFF1EC",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginBottom: 16,
  },

  summaryNumber: {
    color: "#EA5B36",
    fontSize: 20,
    fontWeight: "700",
  },

  summaryText: {
    color: "#704C43",
    fontSize: 14,
    fontWeight: "600",
  },

  continueButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  backText: {
    color: "#666666",
    fontSize: 15,
    textAlign: "center",
    marginTop: 20,
  },

  statusText: {
    color: "#666666",
    fontSize: 15,
  },

  errorText: {
    color: "#B00020",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },

  pressed: {
    opacity: 0.7,
  },
});
