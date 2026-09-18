import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getRecipes, type RecipeListItem } from "@/services/recipes";
import { getSession, startSession, type SavrSession } from "@/services/session";

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeSession, setActiveSession] = useState<SavrSession | null>(null);
  async function loadRecipes() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const databaseRecipes = await getRecipes();
      setRecipes(databaseRecipes);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore sconosciuto";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    Promise.all([getRecipes(), getSession()])
      .then(([databaseRecipes, savedSession]) => {
        if (!isActive) {
          return;
        }

        setRecipes(databaseRecipes);

        setActiveSession(savedSession.recipeId ? savedSession : null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Errore sconosciuto";

        setErrorMessage(message);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

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

    const selected = Object.values(activeSession.selectedProducts).join(",");

    if (activeSession.currentCookingStep > 0) {
      router.push({
        pathname: "/recipe/cook/[id]",
        params: { id: recipeId },
      });
      return;
    }

    if (selected && activeSession.supermarketId) {
      router.push({
        pathname: "/recipe/summary/[id]",
        params: {
          id: recipeId,
          supermarket: activeSession.supermarketId,
          selected,
        },
      });
      return;
    }

    if (activeSession.supermarketId && missing) {
      router.push({
        pathname: "/recipe/products/[id]",
        params: {
          id: recipeId,
          missing,
          supermarket: activeSession.supermarketId,
        },
      });
      return;
    }

    if (missing) {
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
      pathname: "/recipe/[id]",
      params: { id: recipeId },
    });
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.title}>Cosa vuoi mangiare oggi?</Text>

      <Text style={styles.subtitle}>
        Scegli un piatto e ti accompagnerò dalla spesa alla cucina.
      </Text>

      {activeSession?.recipeId && (
        <Pressable style={styles.resumeButton} onPress={resumeSession}>
          <Text style={styles.resumeButtonTitle}>Riprendi la sessione</Text>

          <Text style={styles.resumeButtonSubtitle}>
            Continua da dove avevi interrotto
          </Text>
        </Pressable>
      )}

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

          <Pressable style={styles.retryButton} onPress={loadRecipes}>
            <Text style={styles.retryButtonText}>Riprova</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !errorMessage && recipes.length === 0 && (
        <Text style={styles.statusText}>Non ci sono ancora ricette.</Text>
      )}

      {!isLoading && !errorMessage && (
        <View style={styles.recipeList}>
          {recipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => selectRecipe(recipe.id)}
            >
              <Text style={styles.emoji}>{recipe.emoji ?? "🍽️"}</Text>

              <View>
                <Text style={styles.recipeName}>{recipe.name}</Text>

                <Text style={styles.recipeTime}>
                  {recipe.preparationMinutes} minuti
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
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
    padding: 24,
    paddingTop: 60,
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
    marginTop: 12,
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

  recipeList: {
    gap: 16,
    marginTop: 32,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
  },

  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  emoji: {
    fontSize: 42,
  },

  recipeName: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "600",
  },

  recipeTime: {
    color: "#777777",
    fontSize: 14,
    marginTop: 5,
  },
});
