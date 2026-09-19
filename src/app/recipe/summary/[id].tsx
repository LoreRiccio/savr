import { updateSession } from "@/services/session";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getStoreProductsByIds,
  type StoreProductOption,
} from "@/services/products";
import { getRecipeById } from "@/services/recipes";
import { getSupermarketById, type Supermarket } from "@/services/supermarkets";

function formatPrice(price: number, currency = "EUR") {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(price);
}

export default function ShoppingSummaryScreen() {
  const {
    id,
    selected,
    unavailable,
    supermarket: supermarketId,
  } = useLocalSearchParams<{
    id: string;
    selected?: string;
    unavailable?: string;
    supermarket: string;
  }>();

  const storeProductIds = useMemo(
    () => (selected ? selected.split(",").filter(Boolean) : []),
    [selected],
  );

  const unavailableIngredientIds = useMemo(
    () => (unavailable ? unavailable.split(",").filter(Boolean) : []),
    [unavailable],
  );

  const [products, setProducts] = useState<StoreProductOption[]>([]);
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);

  const [unavailableIngredientNames, setUnavailableIngredientNames] = useState<
    string[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      if (!id || !supermarketId) {
        setErrorMessage("Mancano alcune informazioni per il riepilogo.");
        setIsLoading(false);
        return;
      }

      try {
        const [selectedProducts, selectedSupermarket, databaseRecipe] =
          await Promise.all([
            getStoreProductsByIds(storeProductIds),
            getSupermarketById(supermarketId),
            getRecipeById(id),
          ]);

        if (!selectedSupermarket) {
          setErrorMessage("Supermercato non trovato.");
          return;
        }

        if (!databaseRecipe) {
          setErrorMessage("Ricetta non trovata.");
          return;
        }

        const unavailableNames = databaseRecipe.ingredients
          .filter((ingredient) =>
            unavailableIngredientIds.includes(ingredient.id),
          )
          .map((ingredient) => ingredient.name);

        setProducts(selectedProducts);
        setSupermarket(selectedSupermarket);
        setUnavailableIngredientNames(unavailableNames);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Errore sconosciuto";

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSummary();
  }, [id, storeProductIds, supermarketId, unavailableIngredientIds]);

  const totalPrice = products.reduce(
    (total, product) => total + (product.effectivePrice ?? 0),
    0,
  );

  const currency = products[0]?.currency ?? "EUR";

  async function startCooking() {
    if (!id) {
      return;
    }

    try {
      setErrorMessage(null);

      await updateSession({
        recipeId: id,
        stage: "cooking",
        currentCookingStep: 0,
      });

      router.push({
        pathname: "/recipe/cook/[id]",
        params: { id },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile iniziare la preparazione.";

      setErrorMessage(message);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA5B36" />

        <Text style={styles.statusText}>Preparazione del riepilogo...</Text>
      </View>
    );
  }

  if (errorMessage || !supermarket) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {errorMessage ?? "Riepilogo non disponibile."}
        </Text>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Torna indietro</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.title}>La tua spesa</Text>

      <Text style={styles.store}>
        {supermarket.chain} · {supermarket.name}
      </Text>

      {products.length > 0 ? (
        <View style={styles.list}>
          {products.map((product) => (
            <View key={product.storeProductId} style={styles.productCard}>
              <View style={styles.imageContainer}>
                {product.imageUrl ? (
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.image}
                    resizeMode="contain"
                    accessibilityLabel={product.name}
                  />
                ) : (
                  <Text style={styles.placeholder}>
                    {(product.brand || product.name).charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={styles.productInformation}>
                <Text style={styles.brand}>{product.brand}</Text>

                <Text style={styles.productName}>{product.name}</Text>

                {product.packQuantity !== null && (
                  <Text style={styles.pack}>
                    {product.packQuantity} {product.packUnit}
                  </Text>
                )}

                {product.isOnSale && (
                  <Text style={styles.sale}>In offerta</Text>
                )}
              </View>

              <Text style={styles.productPrice}>
                {formatPrice(product.effectivePrice ?? 0, product.currency)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyProducts}>
          <Text style={styles.emptyProductsTitle}>
            Nessun prodotto aggiunto
          </Text>

          <Text style={styles.emptyProductsDescription}>
            Nessuno degli ingredienti selezionati è ancora presente nel catalogo
            del supermercato.
          </Text>
        </View>
      )}

      {unavailableIngredientNames.length > 0 && (
        <View style={styles.unavailableContainer}>
          <Text style={styles.unavailableTitle}>Da cercare manualmente</Text>

          <Text style={styles.unavailableDescription}>
            Questi ingredienti non sono ancora presenti nel catalogo:
          </Text>

          {unavailableIngredientNames.map((ingredientName) => (
            <Text key={ingredientName} style={styles.unavailableIngredient}>
              • {ingredientName}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Totale stimato</Text>

        <Text style={styles.totalPrice}>
          {formatPrice(totalPrice, currency)}
        </Text>
      </View>

      <Text style={styles.disclaimer}>
        Prezzi dimostrativi. Il totale comprende solamente i prodotti presenti
        nel catalogo. Disponibilità e prezzi devono essere verificati nel punto
        vendita.
      </Text>

      <Pressable style={styles.primaryButton} onPress={startCooking}>
        <Text style={styles.primaryButtonText}>Ho completato la spesa</Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.backText}>Modifica i prodotti</Text>
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
  },

  title: {
    color: "#171717",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 24,
  },

  store: {
    color: "#666666",
    fontSize: 15,
    marginTop: 8,
  },

  list: {
    gap: 12,
    marginTop: 28,
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#FFF8EE",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    color: "#EA5B36",
    fontSize: 24,
    fontWeight: "800",
  },

  productInformation: {
    flex: 1,
  },

  brand: {
    color: "#EA5B36",
    fontSize: 12,
    fontWeight: "700",
  },

  productName: {
    color: "#171717",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 3,
  },

  pack: {
    color: "#777777",
    fontSize: 13,
    marginTop: 3,
  },

  sale: {
    color: "#157A37",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  productPrice: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "700",
  },

  emptyProducts: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 28,
  },

  emptyProductsTitle: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "700",
  },

  emptyProductsDescription: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },

  unavailableContainer: {
    backgroundColor: "#FFF1EC",
    borderColor: "#EA5B36",
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
  },

  unavailableTitle: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "700",
  },

  unavailableDescription: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 10,
  },

  unavailableIngredient: {
    color: "#171717",
    fontSize: 15,
    marginTop: 4,
  },

  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    paddingTop: 20,
  },

  totalLabel: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "600",
  },

  totalPrice: {
    color: "#000000",
    fontSize: 28,
    fontWeight: "700",
  },

  disclaimer: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  primaryButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
    marginTop: 28,
  },

  primaryButtonText: {
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
