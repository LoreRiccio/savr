import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_STORAGE_KEY = "savr_active_session";

export type SavrSession = {
  recipeId: string | null;
  missingIngredientIds: string[];
  supermarketId: string | null;
  selectedProducts: Record<string, string>;
  currentCookingStep: number;
  updatedAt: string;
};

const emptySession: SavrSession = {
  recipeId: null,
  missingIngredientIds: [],
  supermarketId: null,
  selectedProducts: {},
  currentCookingStep: 0,
  updatedAt: new Date(0).toISOString(),
};

export async function getSession(): Promise<SavrSession> {
  const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

  if (!storedSession) {
    return emptySession;
  }

  try {
    const parsedSession = JSON.parse(storedSession) as Partial<SavrSession>;

    return {
      ...emptySession,
      ...parsedSession,
      missingIngredientIds: parsedSession.missingIngredientIds ?? [],
      selectedProducts: parsedSession.selectedProducts ?? {},
    };
  } catch {
    await clearSession();
    return emptySession;
  }
}

export async function updateSession(
  changes: Partial<SavrSession>,
): Promise<SavrSession> {
  const currentSession = await getSession();

  const updatedSession: SavrSession = {
    ...currentSession,
    ...changes,
    updatedAt: new Date().toISOString(),
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
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));

  return newSession;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}
