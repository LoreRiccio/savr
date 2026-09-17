import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { recipes } from "@/data/recipes";

export default function CookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);

  const recipe = recipes[id];

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ricetta non trovata</Text>

        <Pressable onPress={() => router.replace("/")}>
          <Text style={styles.backText}>Torna alla Home</Text>
        </Pressable>
      </View>
    );
  }

  const isLastStep = currentStep === recipe.steps.length - 1;

  function goForward() {
    if (isLastStep) {
      router.replace("/");
      return;
    }

    setCurrentStep(currentStep + 1);
  }

  function goBack() {
    if (currentStep === 0) {
      router.back();
      return;
    }

    setCurrentStep(currentStep - 1);
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
        <Text style={styles.instruction}>{recipe.steps[currentStep]}</Text>
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
  },

  title: {
    color: "#171717",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
});
