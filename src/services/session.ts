import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_STORAGE_KEY = "savr_active_session";

export type SavrSessionStage =
  | "recipe"
  | "supermarket"
  | "products"
  | "summary"
  | "cooking";

export type SavrSession = {
  recipeId: string | null;
  selectedServings: number;
  ingredientCheckCompleted: boolean;
  missingIngredientIds: string[];
  supermarketId: string | null;
  selectedProducts: Record<string, string>;
  currentCookingStep: number;
  stage: SavrSessionStage;
  updatedAt: string;
};

const emptySession: SavrSession = {
  recipeId: null,
  selectedServings: 1,
  ingredientCheckCompleted: false,
  missingIngredientIds: [],
  supermarketId: null,
  selectedProducts: {},
  currentCookingStep: 0,
  stage: "recipe",
  updatedAt: new Date(0).toISOString(),
};

function isSessionStage(value: unknown): value is SavrSessionStage {
  return (
    value === "recipe" ||
    value === "supermarket" ||
    value === "products" ||
    value === "summary" ||
    value === "cooking"
  );
}

function inferSessionStage(
  session: Pick<
    SavrSession,
    | "ingredientCheckCompleted"
    | "missingIngredientIds"
    | "supermarketId"
    | "selectedProducts"
    | "currentCookingStep"
  >,
): SavrSessionStage {
  if (session.currentCookingStep > 0) {
    return "cooking";
  }

  if (!session.ingredientCheckCompleted) {
    return "recipe";
  }

  if (session.missingIngredientIds.length === 0) {
    return "cooking";
  }

  if (!session.supermarketId) {
    return "supermarket";
  }

  const selectedIngredientCount = session.missingIngredientIds.filter(
    (ingredientId) => Boolean(session.selectedProducts[ingredientId]),
  ).length;

  if (selectedIngredientCount === session.missingIngredientIds.length) {
    return "summary";
  }

  return "products";
}

export async function getSession(): Promise<SavrSession> {
  const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

  if (!storedSession) {
    return emptySession;
  }

  try {
    const parsedSession = JSON.parse(storedSession) as Partial<SavrSession>;

    const normalizedSession: SavrSession = {
      ...emptySession,
      ...parsedSession,

      selectedServings:
        parsedSession.selectedServings && parsedSession.selectedServings >= 1
          ? parsedSession.selectedServings
          : 1,

      ingredientCheckCompleted: parsedSession.ingredientCheckCompleted ?? false,

      missingIngredientIds: parsedSession.missingIngredientIds ?? [],

      selectedProducts: parsedSession.selectedProducts ?? {},

      stage: "recipe",
    };

    normalizedSession.stage = isSessionStage(parsedSession.stage)
      ? parsedSession.stage
      : inferSessionStage(normalizedSession);

    return normalizedSession;
  } catch {
    await clearSession();
    return emptySession;
  }
}

export async function updateSession(
  changes: Partial<SavrSession>,
): Promise<SavrSession> {
  const currentSession = await getSession();

  const mergedSession: SavrSession = {
    ...currentSession,
    ...changes,
    updatedAt: new Date().toISOString(),
  };

  const updatedSession: SavrSession = {
    ...mergedSession,
    stage: changes.stage ?? inferSessionStage(mergedSession),
  };

  await AsyncStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(updatedSession),
  );

  return updatedSession;
}

export async function startSession(recipeId: string): Promise<SavrSession> {
  const newSession: SavrSession = {
    ...emptySession,
    recipeId,
    selectedServings: 1,
    ingredientCheckCompleted: false,
    missingIngredientIds: [],
    supermarketId: null,
    selectedProducts: {},
    currentCookingStep: 0,
    stage: "recipe",
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));

  return newSession;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}
