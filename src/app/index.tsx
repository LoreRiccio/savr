import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getRecipes, type RecipeListItem } from "@/services/recipes";
import {
  clearSession,
  getSession,
  startSession,
  type SavrSession,
  type SavrSessionStage,
} from "@/services/session";

type CategoryId =
  | "all"
  | "primi"
  | "piatti_unici"
  | "antipasti"
  | "dolci"
  | "light";

const categories: { id: CategoryId; label: string }[] = [
  { id: "all", label: "Tutte" },
  { id: "primi", label: "Primi" },
  { id: "piatti_unici", label: "Piatti unici" },
  { id: "antipasti", label: "Antipasti" },
  { id: "dolci", label: "Dolci" },
  { id: "light", label: "Leggere" },
];

function formatPreparationTime(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

function getSessionStageDescription(stage: SavrSessionStage) {
  switch (stage) {
    case "supermarket":
      return "Continua dalla scelta del supermercato";

    case "products":
      return "Continua dalla scelta dei prodotti";

    case "summary":
      return "Torna al riepilogo della spesa";

    case "cooking":
      return "Continua la preparazione";

    case "recipe":
    default:
      return "Continua dalla scelta degli ingredienti";
  }
}

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<SavrSession | null>(null);

  const filteredRecipes = useMemo(() => {
    if (selectedCategory === "all") {
      return recipes;
    }

    if (selectedCategory === "light") {
      return recipes.filter((recipe) => recipe.isLight);
    }

    return recipes.filter((recipe) => recipe.category === selectedCategory);
  }, [recipes, selectedCategory]);

  const activeRecipe = useMemo(
    () =>
      recipes.find((recipe) => recipe.id === activeSession?.recipeId) ?? null,
    [recipes, activeSession],
  );

  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [databaseRecipes, savedSession] = await Promise.all([
        getRecipes(),
        getSession(),
      ]);

      setRecipes(databaseRecipes);

      if (!savedSession.recipeId) {
        setActiveSession(null);
        return;
      }

      const savedRecipeStillExists = databaseRecipes.some(
        (recipe) => recipe.id === savedSession.recipeId,
      );

      if (!savedRecipeStillExists) {
        await clearSession();
        setActiveSession(null);
        return;
      }

      setActiveSession(savedSession);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore sconosciuto";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  async function selectRecipe(recipeId: string) {
    try {
      const newSession = await startSession(recipeId);

      setActiveSession(newSession);

      router.push({
        pathname: "/recipe/[id]",
        params: { id: recipeId },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile salvare la sessione.";

      setErrorMessage(message);
    }
  }

  function resumeSession() {
    if (!activeSession?.recipeId) {
      return;
    }

    const recipeId = activeSession.recipeId;

    const missing = activeSession.missingIngredientIds.join(",");

    const selected = activeSession.missingIngredientIds
      .map((ingredientId) => activeSession.selectedProducts[ingredientId])
      .filter((storeProductId): storeProductId is string =>
        Boolean(storeProductId),
      )
      .join(",");

    const unavailable = activeSession.missingIngredientIds
      .filter((ingredientId) => !activeSession.selectedProducts[ingredientId])
      .join(",");

    switch (activeSession.stage) {
      case "cooking":
        router.push({
          pathname: "/recipe/cook/[id]",
          params: { id: recipeId },
        });
        return;

      case "summary":
        if (!activeSession.supermarketId) {
          router.push({
            pathname: "/recipe/supermarket/[id]",
            params: {
              id: recipeId,
              missing,
            },
          });
          return;
        }

        router.push({
          pathname: "/recipe/summary/[id]",
          params: {
            id: recipeId,
            supermarket: activeSession.supermarketId,
            selected,
            unavailable,
          },
        });
        return;

      case "products":
        if (!activeSession.supermarketId) {
          router.push({
            pathname: "/recipe/supermarket/[id]",
            params: {
              id: recipeId,
              missing,
            },
          });
          return;
        }

        router.push({
          pathname: "/recipe/products/[id]",
          params: {
            id: recipeId,
            missing,
            supermarket: activeSession.supermarketId,
          },
        });
        return;

      case "supermarket":
        router.push({
          pathname: "/recipe/supermarket/[id]",
          params: {
            id: recipeId,
            missing,
          },
        });
        return;

      case "recipe":
      default:
        router.push({
          pathname: "/recipe/[id]",
          params: { id: recipeId },
        });
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.title}>Cosa vuoi mangiare oggi?</Text>

      <Text style={styles.subtitle}>
        Scegli una categoria e trova la ricetta giusta per te.
      </Text>

      {activeSession?.recipeId && activeRecipe && (
        <Pressable style={styles.resumeButton} onPress={resumeSession}>
          <Text style={styles.resumeButtonTitle}>
            Riprendi {activeRecipe.name}
          </Text>

          <Text style={styles.resumeButtonSubtitle}>
            {getSessionStageDescription(activeSession.stage)}
          </Text>
        </Pressable>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;

          return (
            <Pressable
              key={category.id}
              style={[
                styles.categoryButton,
                isSelected && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.selectedCategoryText,
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#EA5B36" />

          <Text style={styles.statusText}>Caricamento delle ricette...</Text>
        </View>
      )}

      {!isLoading && errorMessage && (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>Impossibile caricare le ricette.</Text>

          <Text style={styles.statusText}>{errorMessage}</Text>

          <Pressable style={styles.retryButton} onPress={loadHomeData}>
            <Text style={styles.retryButtonText}>Riprova</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !errorMessage && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === "all"
                ? "Ricette in evidenza"
                : categories.find(
                    (category) => category.id === selectedCategory,
                  )?.label}
            </Text>

            <Text style={styles.recipeCount}>
              {filteredRecipes.length}{" "}
              {filteredRecipes.length === 1 ? "ricetta" : "ricette"}
            </Text>
          </View>

          {filteredRecipes.length === 0 ? (
            <Text style={styles.emptyText}>
              Non ci sono ancora ricette in questa categoria.
            </Text>
          ) : (
            <View style={styles.recipeGrid}>
              {filteredRecipes.map((recipe) => (
                <Pressable
                  key={recipe.id}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => selectRecipe(recipe.id)}
                >
                  <View style={styles.imageContainer}>
                    {recipe.imageUrl ? (
                      <Image
                        source={{ uri: recipe.imageUrl }}
                        style={styles.recipeImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={150}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.emoji}>{recipe.emoji ?? "🍽️"}</Text>
                      </View>
                    )}

                    {recipe.isLight && (
                      <View style={styles.lightBadge}>
                        <Text style={styles.lightBadgeText}>Leggera</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.recipeName} numberOfLines={2}>
                      {recipe.name}
                    </Text>

                    <View style={styles.recipeMainInformation}>
                      <Text style={styles.recipeTime}>
                        {formatPreparationTime(recipe.preparationMinutes)}
                      </Text>

                      <Text style={styles.recipeCalories}>
                        {recipe.caloriesKcal !== null
                          ? `${Math.round(recipe.caloriesKcal)} kcal`
                          : "— kcal"}
                      </Text>
                    </View>

                    {recipe.proteinG !== null &&
                    recipe.carbohydratesG !== null &&
                    recipe.fatG !== null ? (
                      <Text style={styles.macronutrients} numberOfLines={1}>
                        P {Math.round(recipe.proteinG)} g · C{" "}
                        {Math.round(recipe.carbohydratesG)} g · G{" "}
                        {Math.round(recipe.fatG)} g
                      </Text>
                    ) : (
                      <Text style={styles.macronutrients}>
                        Valori nutrizionali in arrivo
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFF8EE",
  },

  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  logo: {
    color: "#EA5B36",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },

  title: {
    color: "#171717",
    fontSize: 32,
    fontWeight: "700",
  },

  subtitle: {
    color: "#666666",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },

  resumeButton: {
    backgroundColor: "#171717",
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
  },

  resumeButtonTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  resumeButtonSubtitle: {
    color: "#CCCCCC",
    fontSize: 13,
    marginTop: 5,
  },

  categoryList: {
    gap: 10,
    paddingTop: 26,
    paddingBottom: 10,
  },

  categoryButton: {
    minHeight: 42,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E7DDD4",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
  },

  selectedCategoryButton: {
    backgroundColor: "#EA5B36",
    borderColor: "#EA5B36",
  },

  categoryText: {
    color: "#444444",
    fontSize: 14,
    fontWeight: "600",
  },

  selectedCategoryText: {
    color: "#FFFFFF",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 18,
    marginBottom: 14,
  },

  sectionTitle: {
    color: "#171717",
    fontSize: 21,
    fontWeight: "700",
  },

  recipeCount: {
    color: "#777777",
    fontSize: 13,
  },

  recipeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  card: {
    width: "47.8%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },

  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 1.08,
    backgroundColor: "#F4E8DB",
  },

  recipeImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emoji: {
    fontSize: 52,
  },

  lightBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#E5F3DF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  lightBadgeText: {
    color: "#356234",
    fontSize: 11,
    fontWeight: "700",
  },

  cardContent: {
    padding: 12,
  },

  recipeName: {
    minHeight: 42,
    color: "#171717",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },

  recipeMainInformation: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },

  recipeTime: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "600",
  },

  recipeCalories: {
    color: "#EA5B36",
    fontSize: 13,
    fontWeight: "700",
  },

  macronutrients: {
    color: "#777777",
    fontSize: 11,
    marginTop: 7,
  },

  statusContainer: {
    alignItems: "center",
    gap: 12,
    marginTop: 40,
  },

  statusText: {
    color: "#666666",
    fontSize: 15,
    textAlign: "center",
  },

  errorText: {
    color: "#B00020",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },

  retryButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  emptyText: {
    color: "#777777",
    fontSize: 15,
    textAlign: "center",
    marginTop: 36,
  },
});
