import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getRecipeById, type RecipeDetails } from "@/services/recipes";
import { clearSession, getSession, updateSession } from "@/services/session";

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type StepTimerProps = {
  initialSeconds: number;
};

function StepTimer({ initialSeconds }: StepTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const remainingSecondsRef = useRef(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  function stopInterval() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function toggleTimer() {
    if (isRunning) {
      stopInterval();
      setIsRunning(false);
      return;
    }

    if (remainingSecondsRef.current <= 0) {
      return;
    }

    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const nextSeconds = Math.max(remainingSecondsRef.current - 1, 0);

      remainingSecondsRef.current = nextSeconds;
      setRemainingSeconds(nextSeconds);

      if (nextSeconds === 0) {
        stopInterval();
        setIsRunning(false);

        Alert.alert(
          "Timer terminato",
          "Il tempo previsto per questo passaggio è terminato.",
        );
      }
    }, 1000);
  }

  function resetTimer() {
    stopInterval();

    remainingSecondsRef.current = initialSeconds;
    setRemainingSeconds(initialSeconds);
    setIsRunning(false);
  }

  return (
    <View style={styles.timerContainer}>
      <Text style={styles.timerLabel}>
        {remainingSeconds === 0 ? "Tempo terminato" : "Timer"}
      </Text>

      <Text style={styles.timerValue}>{formatTimer(remainingSeconds)}</Text>

      <View style={styles.timerActions}>
        <Pressable
          disabled={remainingSeconds === 0}
          style={[
            styles.timerButton,
            remainingSeconds === 0 && styles.disabledTimerButton,
          ]}
          onPress={toggleTimer}
        >
          <Text style={styles.timerButtonText}>
            {isRunning ? "Pausa" : "Avvia"}
          </Text>
        </Pressable>

        <Pressable style={styles.resetButton} onPress={resetTimer}>
          <Text style={styles.resetButtonText}>Ricomincia</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
        const [databaseRecipe, savedSession] = await Promise.all([
          getRecipeById(id),
          getSession(),
        ]);

        if (!databaseRecipe) {
          setErrorMessage("Ricetta non trovata.");
          return;
        }

        if (databaseRecipe.steps.length === 0) {
          setErrorMessage("Questa ricetta non contiene ancora passaggi.");
          return;
        }

        setRecipe(databaseRecipe);

        const savedStepIsValid =
          savedSession.recipeId === id &&
          savedSession.currentCookingStep >= 0 &&
          savedSession.currentCookingStep < databaseRecipe.steps.length;

        setCurrentStep(savedStepIsValid ? savedSession.currentCookingStep : 0);
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

  async function goForward() {
    try {
      if (isLastStep) {
        await clearSession();
        router.replace("/");
        return;
      }

      const nextStep = currentStep + 1;

      await updateSession({
        recipeId: id,
        stage: "cooking",
        currentCookingStep: nextStep,
      });

      setCurrentStep(nextStep);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile salvare il passaggio.";

      setErrorMessage(message);
    }
  }

  async function goBack() {
    if (currentStep === 0) {
      router.back();
      return;
    }

    try {
      const previousStep = currentStep - 1;

      await updateSession({
        recipeId: id,
        stage: "cooking",
        currentCookingStep: previousStep,
      });

      setCurrentStep(previousStep);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile salvare il passaggio.";

      setErrorMessage(message);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.recipeName}>{recipe.name}</Text>

      <Text style={styles.progress}>
        Passaggio {currentStep + 1} di {recipe.steps.length}
      </Text>

      <View style={styles.stepCard}>
        <Text style={styles.stepNumber}>{currentStep + 1}</Text>

        <Text style={styles.instruction}>{step.instruction}</Text>

        {step.timerSeconds !== null && (
          <StepTimer key={step.id} initialSeconds={step.timerSeconds} />
        )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFF8EE",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
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
    fontSize: 28,
    lineHeight: 34,
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
    fontSize: 22,
    lineHeight: 31,
    fontWeight: "600",
  },

  timerContainer: {
    backgroundColor: "#FFF1EC",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    alignItems: "center",
  },

  timerLabel: {
    color: "#777777",
    fontSize: 13,
    fontWeight: "600",
  },

  timerValue: {
    color: "#171717",
    fontSize: 40,
    fontWeight: "700",
    marginTop: 4,
  },

  timerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  timerButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },

  disabledTimerButton: {
    opacity: 0.45,
  },

  timerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  resetButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  resetButtonText: {
    color: "#555555",
    fontSize: 15,
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
