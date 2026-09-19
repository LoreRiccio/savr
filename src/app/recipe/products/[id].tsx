import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getProductsForIngredient,
  type NutritionValues,
  type StoreProductOption,
} from "@/services/products";
import { getRecipeById, type RecipeDetails } from "@/services/recipes";
import { getSession, updateSession } from "@/services/session";
import { getSupermarketById, type Supermarket } from "@/services/supermarkets";

function getIngredientImage(ingredientName?: string) {
  const name = ingredientName?.trim().toLowerCase() ?? "";

  switch (name) {
    case "insalata":
      return require("../../../../assets/images/ingredients-optimized/insalata.webp");

    case "olio extravergine":
      return require("../../../../assets/images/ingredients-optimized/olio-extravergine.webp");

    case "passata di pomodoro":
      return require("../../../../assets/images/ingredients-optimized/passata-pomodoro.webp");

    case "pasta":
      return require("../../../../assets/images/ingredients-optimized/pasta.webp");

    case "peperone":
      return require("../../../../assets/images/ingredients-optimized/peperone.webp");

    case "petto di pollo":
      return require("../../../../assets/images/ingredients-optimized/petto-pollo.webp");

    case "pomodorini":
      return require("../../../../assets/images/ingredients-optimized/pomodorini.webp");

    case "riso":
      return require("../../../../assets/images/ingredients-optimized/riso.webp");

    case "sale":
      return require("../../../../assets/images/ingredients-optimized/sale.webp");

    case "zucchine":
      return require("../../../../assets/images/ingredients-optimized/zucchine.webp");

    case "uova":
      return require("../../../../assets/images/ingredients-optimized/uova.webp");

    case "guanciale":
      return require("../../../../assets/images/ingredients-optimized/guanciale.webp");

    case "pecorino romano":
      return require("../../../../assets/images/ingredients-optimized/pecorino-romano.webp");

    case "pepe nero":
      return require("../../../../assets/images/ingredients-optimized/pepe-nero.webp");

    default:
      return null;
  }
}

function formatPrice(price: number | null, currency: string) {
  if (price === null) {
    return "Prezzo non disponibile";
  }

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(price);
}

function formatNutrition(nutrition: NutritionValues) {
  const values: string[] = [];

  if (nutrition.energy_kcal !== undefined) {
    values.push(`${nutrition.energy_kcal} kcal`);
  }

  if (nutrition.protein_g !== undefined) {
    values.push(`Proteine ${nutrition.protein_g} g`);
  }

  if (nutrition.carbohydrates_g !== undefined) {
    values.push(`Carboidrati ${nutrition.carbohydrates_g} g`);
  }

  if (nutrition.fat_g !== undefined) {
    values.push(`Grassi ${nutrition.fat_g} g`);
  }

  if (nutrition.salt_g !== undefined) {
    values.push(`Sale ${nutrition.salt_g} g`);
  }

  return values.length > 0
    ? values.join(" · ")
    : "Valori nutrizionali non disponibili";
}

export default function ProductsScreen() {
  const {
    id,
    missing,
    supermarket: supermarketId,
  } = useLocalSearchParams<{
    id: string;
    missing: string;
    supermarket: string;
  }>();

  const missingIds = useMemo(
    () => (missing ? missing.split(",").filter(Boolean) : []),
    [missing],
  );

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [supermarket, setSupermarket] = useState<Supermarket | null>(null);

  const [productsByIngredient, setProductsByIngredient] = useState<
    Record<string, StoreProductOption[]>
  >({});

  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, string>
  >({});

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadShoppingData() {
      if (!id || !supermarketId || missingIds.length === 0) {
        setErrorMessage("Mancano alcune informazioni per la spesa.");
        setIsLoading(false);
        return;
      }

      try {
        const [
          databaseRecipe,
          databaseSupermarket,
          productLists,
          savedSession,
        ] = await Promise.all([
          getRecipeById(id),
          getSupermarketById(supermarketId),

          Promise.all(
            missingIds.map((ingredientId) =>
              getProductsForIngredient(ingredientId, supermarketId),
            ),
          ),

          getSession(),
        ]);

        if (!databaseRecipe) {
          setErrorMessage("Ricetta non trovata.");
          return;
        }

        if (!databaseSupermarket) {
          setErrorMessage("Supermercato non trovato.");
          return;
        }

        const productMap: Record<string, StoreProductOption[]> =
          Object.fromEntries(
            missingIds.map((ingredientId, index) => [
              ingredientId,
              productLists[index],
            ]),
          );

        setRecipe(databaseRecipe);
        setSupermarket(databaseSupermarket);
        setProductsByIngredient(productMap);

        if (
          savedSession.recipeId === id &&
          savedSession.supermarketId === supermarketId
        ) {
          const validSavedSelections = Object.fromEntries(
            Object.entries(savedSession.selectedProducts).filter(
              ([ingredientId, storeProductId]) =>
                (productMap[ingredientId] ?? []).some(
                  (product) => product.storeProductId === storeProductId,
                ),
            ),
          );

          setSelectedProducts(validSavedSelections);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Errore sconosciuto";

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadShoppingData();
  }, [id, missingIds, supermarketId]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA5B36" />

        <Text style={styles.statusText}>Ricerca dei prodotti migliori...</Text>
      </View>
    );
  }

  if (errorMessage || !recipe || !supermarket) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {errorMessage ?? "Dati non disponibili."}
        </Text>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Torna indietro</Text>
        </Pressable>
      </View>
    );
  }

  const currentIngredientId = missingIds[currentIndex];

  const currentIngredient = recipe.ingredients.find(
    (ingredient) => ingredient.id === currentIngredientId,
  );

  const availableProducts = productsByIngredient[currentIngredientId] ?? [];

  const selectedProductId = selectedProducts[currentIngredientId];

  const selectedProduct =
    availableProducts.find(
      (product) => product.storeProductId === selectedProductId,
    ) ?? availableProducts[0];

  const isLastIngredient = currentIndex === missingIds.length - 1;

  const ingredientImage = getIngredientImage(currentIngredient?.name);

  function selectProduct(product: StoreProductOption) {
    setSelectedProducts((currentSelection) => ({
      ...currentSelection,
      [currentIngredientId]: product.storeProductId,
    }));
  }

  async function continueShopping() {
    const updatedSelection = selectedProduct
      ? {
          ...selectedProducts,
          [currentIngredientId]: selectedProduct.storeProductId,
        }
      : selectedProducts;

    setSelectedProducts(updatedSelection);

    try {
      await updateSession({
        recipeId: id,
        missingIngredientIds: missingIds,
        supermarketId,
        selectedProducts: updatedSelection,
        currentCookingStep: 0,
        stage: isLastIngredient ? "summary" : "products",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossibile salvare i prodotti.";

      setErrorMessage(message);
      return;
    }

    if (isLastIngredient) {
      const selectedStoreProductIds = missingIds
        .map((ingredientId) => updatedSelection[ingredientId])
        .filter((storeProductId): storeProductId is string =>
          Boolean(storeProductId),
        );

      const unavailableIngredientIds = missingIds.filter(
        (ingredientId) =>
          (productsByIngredient[ingredientId] ?? []).length === 0,
      );

      router.push({
        pathname: "/recipe/summary/[id]",
        params: {
          id,
          supermarket: supermarketId,
          selected: selectedStoreProductIds.join(","),
          unavailable: unavailableIngredientIds.join(","),
        },
      });

      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.store}>
        {supermarket.chain} · {supermarket.name}
      </Text>

      <Text style={styles.progress}>
        Prodotto {currentIndex + 1} di {missingIds.length}
      </Text>

      <Text style={styles.title}>
        {currentIngredient?.name ?? "Ingrediente"}
      </Text>

      {!selectedProduct ? (
        <View style={styles.unavailableCard}>
          <Text style={styles.unavailableTitle}>
            Prodotto non ancora disponibile
          </Text>

          <Text style={styles.unavailableDescription}>
            Questo ingrediente non è ancora presente nel catalogo del
            supermercato. Potrai cercarlo manualmente.
          </Text>
        </View>
      ) : (
        <>
          {selectedProduct.isOnSale && (
            <Text style={styles.saleBadge}>IN OFFERTA</Text>
          )}

          <View style={styles.productImage}>
            {ingredientImage ? (
              <Image
                source={ingredientImage}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
                enforceEarlyResizing
                accessibilityLabel={`Immagine illustrativa di ${currentIngredient?.name}`}
              />
            ) : (
              <Text style={styles.placeholderEmoji}>🛒</Text>
            )}
          </View>

          {ingredientImage && (
            <Text style={styles.imageDisclaimer}>
              Immagine illustrativa generata con AI
            </Text>
          )}

          <Text style={styles.brand}>{selectedProduct.brand}</Text>

          <Text style={styles.productName}>{selectedProduct.name}</Text>

          {selectedProduct.packQuantity !== null && (
            <Text style={styles.pack}>
              Confezione da {selectedProduct.packQuantity}{" "}
              {selectedProduct.packUnit}
            </Text>
          )}

          <Text style={styles.nutrition}>
            Valori medi per 100 g: {formatNutrition(selectedProduct.nutrition)}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatPrice(
                selectedProduct.effectivePrice,
                selectedProduct.currency,
              )}
            </Text>

            {selectedProduct.isOnSale &&
              selectedProduct.regularPrice !== null && (
                <Text style={styles.oldPrice}>
                  {formatPrice(
                    selectedProduct.regularPrice,
                    selectedProduct.currency,
                  )}
                </Text>
              )}
          </View>

          {availableProducts.length > 1 && (
            <>
              <Text style={styles.alternativeTitle}>
                Altre marche disponibili
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.alternativeList}
              >
                {availableProducts
                  .filter(
                    (product) =>
                      product.storeProductId !== selectedProduct.storeProductId,
                  )
                  .map((product) => (
                    <Pressable
                      key={product.storeProductId}
                      style={styles.alternativeCard}
                      onPress={() => selectProduct(product)}
                    >
                      <View style={styles.alternativeImageContainer}>
                        {product.imageUrl || ingredientImage ? (
                          <Image
                            source={
                              product.imageUrl
                                ? { uri: product.imageUrl }
                                : ingredientImage
                            }
                            style={styles.alternativeImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <Text style={styles.alternativeEmoji}>🛒</Text>
                        )}
                      </View>

                      <Text style={styles.alternativeBrand} numberOfLines={2}>
                        {product.brand}
                      </Text>

                      <Text style={styles.alternativePrice}>
                        {formatPrice(product.effectivePrice, product.currency)}
                      </Text>

                      {product.isOnSale && (
                        <Text style={styles.smallSale}>Offerta</Text>
                      )}
                    </Pressable>
                  ))}
              </ScrollView>
            </>
          )}
        </>
      )}

      <Pressable style={styles.continueButton} onPress={continueShopping}>
        <Text style={styles.continueButtonText}>
          {isLastIngredient
            ? "Vai al riepilogo"
            : selectedProduct
              ? "Prodotto successivo"
              : "Continua senza prodotto"}
        </Text>
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
    paddingTop: 50,
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

  store: {
    color: "#666666",
    fontSize: 14,
    marginTop: 14,
  },

  progress: {
    color: "#777777",
    fontSize: 14,
    marginTop: 20,
  },

  title: {
    color: "#171717",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 5,
  },

  saleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DDF5E5",
    color: "#157A37",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontWeight: "700",
    marginTop: 16,
  },

  productImage: {
    height: 230,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageDisclaimer: {
    color: "#888888",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },

  placeholderEmoji: {
    fontSize: 100,
  },

  brand: {
    color: "#EA5B36",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 18,
  },

  productName: {
    color: "#171717",
    fontSize: 21,
    fontWeight: "600",
    marginTop: 4,
  },

  pack: {
    color: "#666666",
    fontSize: 14,
    marginTop: 5,
  },

  nutrition: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },

  price: {
    color: "#000000",
    fontSize: 32,
    fontWeight: "700",
  },

  oldPrice: {
    color: "#999999",
    fontSize: 17,
    textDecorationLine: "line-through",
  },

  alternativeTitle: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 30,
  },

  alternativeList: {
    gap: 12,
    paddingTop: 14,
    paddingBottom: 20,
  },

  alternativeCard: {
    width: 145,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 14,
  },

  alternativeImageContainer: {
    width: "100%",
    height: 82,
    borderRadius: 10,
    backgroundColor: "#FFF8EE",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  alternativeImage: {
    width: "100%",
    height: "100%",
  },

  alternativeEmoji: {
    fontSize: 38,
  },

  alternativeBrand: {
    color: "#171717",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },

  alternativePrice: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },

  smallSale: {
    color: "#157A37",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  unavailableCard: {
    backgroundColor: "#FFF1EC",
    borderColor: "#EA5B36",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },

  unavailableTitle: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "700",
  },

  unavailableDescription: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },

  continueButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
    marginTop: 20,
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
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
