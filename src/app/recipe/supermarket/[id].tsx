import * as Location from "expo-location";
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

import { getSession, updateSession } from "@/services/session";
import {
  addCatalogAvailability,
  getNearbySupermarkets,
  type Supermarket,
} from "@/services/supermarkets";

export default function SupermarketScreen() {
  const { id, missing } = useLocalSearchParams<{
    id: string;
    missing: string;
  }>();

  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [selectedSupermarket, setSelectedSupermarket] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const missingIngredientIds = missing
    ? missing.split(",").filter(Boolean)
    : [];

  useEffect(() => {
    async function loadNearbySupermarkets() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          throw new Error(
            "Per mostrarti i supermercati vicini, Savr ha bisogno del permesso di usare la posizione.",
          );
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const nearbySupermarkets = await getNearbySupermarkets(
          currentPosition.coords.latitude,
          currentPosition.coords.longitude,
        );

        const supermarketsWithCatalog =
          await addCatalogAvailability(nearbySupermarkets);

        setSupermarkets(supermarketsWithCatalog);

        const savedSession = await getSession();

        const savedSupermarket = supermarketsWithCatalog.find(
          (supermarket) =>
            supermarket.catalogSupermarketId === savedSession.supermarketId,
        );

        if (savedSession.recipeId === id && savedSupermarket) {
          setSelectedSupermarket(savedSupermarket.id);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossibile cercare i supermercati vicini.";

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadNearbySupermarkets();
  }, [id]);

  async function continueToProducts() {
    if (!selectedSupermarket) {
      return;
    }

    try {
      setSelectionError(null);

      const realSupermarket = supermarkets.find(
        (supermarket) => supermarket.id === selectedSupermarket,
      );

      if (!realSupermarket) {
        throw new Error("Il supermercato selezionato non è più disponibile.");
      }

      const catalogSupermarketId = realSupermarket.catalogSupermarketId;

      if (!catalogSupermarketId) {
        setSelectionError(
          `Il catalogo di ${realSupermarket.chain} non è ancora disponibile.`,
        );
        return;
      }

      await updateSession({
        recipeId: id,
        missingIngredientIds,
        supermarketId: catalogSupermarketId,
        selectedProducts: {},
        currentCookingStep: 0,
        stage: "products",
      });

      router.push({
        pathname: "/recipe/products/[id]",
        params: {
          id,
          missing,
          supermarket: catalogSupermarketId,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile salvare il supermercato.";

      setSelectionError(message);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA5B36" />
        <Text style={styles.statusText}>Ricerca dei supermercati...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMessage}</Text>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Torna indietro</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.title}>Scegli il supermercato</Text>

      <Text style={styles.subtitle}>
        Hai selezionato {missingIngredientIds.length}{" "}
        {missingIngredientIds.length === 1 ? "ingrediente" : "ingredienti"} da
        comprare. I punti vendita con catalogo disponibile sono mostrati per
        primi.
      </Text>

      <View style={styles.list}>
        {supermarkets.map((supermarket) => {
          const isSelected = selectedSupermarket === supermarket.id;
          const hasCatalog = Boolean(supermarket.catalogSupermarketId);

          return (
            <Pressable
              key={supermarket.id}
              disabled={!hasCatalog}
              accessibilityRole="radio"
              accessibilityState={{
                selected: isSelected,
                disabled: !hasCatalog,
              }}
              style={[
                styles.supermarketCard,
                isSelected && styles.selectedCard,
                !hasCatalog && styles.unavailableCard,
              ]}
              onPress={() => {
                setSelectedSupermarket(supermarket.id);
                setSelectionError(null);
              }}
            >
              <View style={styles.supermarketInformation}>
                <Text style={styles.chain}>{supermarket.chain}</Text>
                <Text style={styles.supermarketName}>{supermarket.name}</Text>
                <Text style={styles.address}>{supermarket.address}</Text>

                {supermarket.distanceMeters !== undefined && (
                  <Text style={styles.distance}>
                    {supermarket.distanceMeters < 1000
                      ? `${supermarket.distanceMeters} m`
                      : `${(supermarket.distanceMeters / 1000).toFixed(1)} km`}
                  </Text>
                )}

                <Text
                  style={
                    hasCatalog
                      ? styles.catalogAvailable
                      : styles.catalogUnavailable
                  }
                >
                  {hasCatalog
                    ? "Catalogo disponibile"
                    : "Catalogo non disponibile"}
                </Text>
              </View>

              <View
                style={[
                  styles.radio,
                  isSelected && styles.selectedRadio,
                  !hasCatalog && styles.unavailableRadio,
                ]}
              >
                {isSelected && <View style={styles.radioCenter} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {supermarkets.length === 0 && (
        <Text style={styles.statusText}>Nessun supermercato disponibile.</Text>
      )}

      {selectionError && <Text style={styles.errorText}>{selectionError}</Text>}

      <Pressable
        disabled={!selectedSupermarket}
        style={[
          styles.continueButton,
          !selectedSupermarket && styles.disabledButton,
        ]}
        onPress={continueToProducts}
      >
        <Text style={styles.continueButtonText}>Mostrami i prodotti</Text>
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
  list: {
    gap: 14,
    marginTop: 28,
    marginBottom: 28,
  },
  supermarketCard: {
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
  unavailableCard: {
    opacity: 0.5,
  },
  supermarketInformation: {
    flex: 1,
  },
  chain: {
    color: "#EA5B36",
    fontSize: 14,
    fontWeight: "700",
  },
  supermarketName: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 3,
  },
  address: {
    color: "#777777",
    fontSize: 14,
    marginTop: 5,
  },
  distance: {
    color: "#EA5B36",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 5,
  },
  catalogAvailable: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 7,
  },
  catalogUnavailable: {
    color: "#777777",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 7,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#BBBBBB",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadio: {
    borderColor: "#EA5B36",
  },
  unavailableRadio: {
    backgroundColor: "#EEEEEE",
  },
  radioCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EA5B36",
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
    textAlign: "center",
  },
  errorText: {
    color: "#B00020",
    fontSize: 17,
    textAlign: "center",
  },
});
