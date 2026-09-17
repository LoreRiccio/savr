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

import { getRecipeById, type RecipeDetails } from "@/services/recipes";

export default function MissingIngredientsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);

  const [missingIds, setMissingIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipe() {
      if (!id) {
        setErrorMessage("Identificativo della ricetta mancante.");
        setIsLoading(false);
        return;
      }

      try {
        const databaseRecipe = await getRecipeById(id);

        if (!databaseRecipe) {
          setErrorMessage("Ricetta non trovata.");
          return;
        }

        setRecipe(databaseRecipe);
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

  function toggleIngredient(ingredientId: string) {
    setMissingIds((currentIds) => {
      const isAlreadySelected = currentIds.includes(ingredientId);

      if (isAlreadySelected) {
        return currentIds.filter((currentId) => currentId !== ingredientId);
      }

      return [...currentIds, ingredientId];
    });
  }

  function continueToSupermarket() {
    if (missingIds.length === 0) {
      return;
    }

    router.push({
      pathname: "/recipe/supermarket/[id]",
      params: {
        id,
        missing: missingIds.join(","),
      },
    });
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA5B36" />

        <Text style={styles.statusText}>Caricamento degli ingredienti...</Text>
      </View>
    );
  }

  if (errorMessage || !recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {errorMessage ?? "Ricetta non disponibile."}
        </Text>

        <Pressable onPress={() => router.replace("/")}>
          <Text style={styles.backText}>Torna alla Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.recipeName}>{recipe.name}</Text>

      <Text style={styles.title}>Cosa ti manca?</Text>

      <Text style={styles.subtitle}>
        Seleziona gli ingredienti che devi comprare.
      </Text>

      <View style={styles.list}>
        {recipe.ingredients.map((ingredient) => {
          const isSelected = missingIds.includes(ingredient.id);

          return (
            <Pressable
              key={ingredient.id}
              style={[styles.ingredientCard, isSelected && styles.selectedCard]}
              onPress={() => toggleIngredient(ingredient.id)}
            >
              <View style={styles.ingredientInformation}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>

                <Text style={styles.quantity}>
                  {ingredient.displayQuantity}
                </Text>
              </View>

              <View
                style={[styles.checkbox, isSelected && styles.selectedCheckbox]}
              >
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={missingIds.length === 0}
        style={[
          styles.continueButton,
          missingIds.length === 0 && styles.disabledButton,
        ]}
        onPress={continueToSupermarket}
      >
        <Text style={styles.continueButtonText}>Scegli il supermercato</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.backText}>Torna indietro</Text>
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
    color: "#EA5B36",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  title: {
    color: "#171717",
    fontSize: 32,
    fontWeight: "700",
  },

  subtitle: {
    color: "#666666",
    fontSize: 16,
    marginTop: 10,
  },

  list: {
    gap: 12,
    marginTop: 28,
    marginBottom: 28,
  },

  ingredientCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedCard: {
    borderColor: "#EA5B36",
    backgroundColor: "#FFF1EC",
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
    backgroundColor: "#EA5B36",
    borderColor: "#EA5B36",
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  continueButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#D4AAA0",
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
    fontSize: 17,
    textAlign: "center",
  },
});
