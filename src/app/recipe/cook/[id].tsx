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

export default function CookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
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

        if (databaseRecipe.steps.length === 0) {
          setErrorMessage("Questa ricetta non contiene ancora passaggi.");
          return;
        }

        setRecipe(databaseRecipe);
        setCurrentStep(0);
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA5B36" />

        <Text style={styles.statusText}>Preparazione della ricetta...</Text>
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

  const isLastStep = currentStep === recipe.steps.length - 1;

  const step = recipe.steps[currentStep];

  function goForward() {
    if (isLastStep) {
      router.replace("/");
      return;
    }

    setCurrentStep((previousStep) => previousStep + 1);
  }

  function goBack() {
    if (currentStep === 0) {
      router.back();
      return;
    }

    setCurrentStep((previousStep) => previousStep - 1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.recipeName}>{recipe.name}</Text>

      <Text style={styles.progress}>
        Passaggio {currentStep + 1} di {recipe.steps.length}
      </Text>

      <View style={styles.stepCard}>
        <Text style={styles.stepNumber}>{currentStep + 1}</Text>

        <Text style={styles.instruction}>{step.instruction}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={goForward}>
        <Text style={styles.primaryButtonText}>
          {isLastStep ? "Ho finito!" : "Passaggio successivo"}
        </Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>
          {currentStep === 0 ? "Torna indietro" : "Passaggio precedente"}
        </Text>
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
    marginBottom: 24,
  },

  recipeName: {
    color: "#171717",
    fontSize: 28,
    fontWeight: "700",
  },

  progress: {
    color: "#777777",
    fontSize: 15,
    marginTop: 8,
    marginBottom: 24,
  },

  stepCard: {
    minHeight: 230,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    justifyContent: "center",
    marginBottom: 24,
  },

  stepNumber: {
    color: "#EA5B36",
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 16,
  },

  instruction: {
    color: "#171717",
    fontSize: 23,
    lineHeight: 32,
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  backButton: {
    padding: 16,
    alignItems: "center",
  },

  backText: {
    color: "#666666",
    fontSize: 15,
    marginTop: 12,
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
