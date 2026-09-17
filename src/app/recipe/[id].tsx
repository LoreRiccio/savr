import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getRecipeById, type RecipeDetails } from "@/services/recipes";

export default function IngredientCheckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);

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

  function handleYes() {
    router.push({
      pathname: "/recipe/cook/[id]",
      params: { id },
    });
  }

  function handleNo() {
    router.push({
      pathname: "/recipe/missing/[id]",
      params: { id },
    });
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA5B36" />
        <Text style={styles.statusText}>Caricamento della ricetta...</Text>
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
          <Text style={styles.backButton}>Torna alla Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.recipe}>{recipe.name}</Text>

      <Text style={styles.title}>Hai già tutti gli ingredienti?</Text>

      <Text style={styles.subtitle}>
        Se hai già tutto, possiamo iniziare subito a cucinare.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
        onPress={handleYes}
      >
        <Text style={styles.primaryButtonText}>Sì, ho tutto</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
        onPress={handleNo}
      >
        <Text style={styles.secondaryButtonText}>No, mi manca qualcosa</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.backButton}>Torna ai piatti</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8EE",
    justifyContent: "center",
    padding: 24,
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
    marginBottom: 32,
  },

  recipe: {
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
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 32,
  },

  primaryButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EA5B36",
    borderWidth: 2,
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#EA5B36",
    fontSize: 17,
    fontWeight: "600",
  },

  backButton: {
    color: "#666666",
    fontSize: 15,
    textAlign: "center",
    marginTop: 24,
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

  pressed: {
    opacity: 0.7,
  },
});
