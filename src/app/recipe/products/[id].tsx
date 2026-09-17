import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Product = {
  id: string;
  name: string;
  brand: string;
  emoji: string;
  nutrition: string;
  price: number;
  isOnSale: boolean;
  oldPrice?: number;
};

const ingredientInformation: Record<
  string,
  {
    name: string;
    emoji: string;
    nutrition: string;
    basePrice: number;
    hasOffer: boolean;
  }
> = {
  pasta: {
    name: "Pasta",
    emoji: "🍝",
    nutrition: "350 kcal · Proteine 13 g · Carboidrati 70 g · Grassi 1,5 g",
    basePrice: 1.25,
    hasOffer: true,
  },
  tomato: {
    name: "Passata di pomodoro",
    emoji: "🍅",
    nutrition: "29 kcal · Proteine 1,4 g · Carboidrati 4,5 g · Grassi 0,2 g",
    basePrice: 1.45,
    hasOffer: true,
  },
  oil: {
    name: "Olio extravergine",
    emoji: "🫒",
    nutrition: "824 kcal · Grassi 91,6 g",
    basePrice: 7.5,
    hasOffer: false,
  },
  salt: {
    name: "Sale",
    emoji: "🧂",
    nutrition: "0 kcal · Sale 100 g",
    basePrice: 0.85,
    hasOffer: false,
  },
  chicken: {
    name: "Petto di pollo",
    emoji: "🍗",
    nutrition: "110 kcal · Proteine 23 g · Grassi 1,2 g",
    basePrice: 5.9,
    hasOffer: true,
  },
  salad: {
    name: "Insalata",
    emoji: "🥬",
    nutrition: "15 kcal · Proteine 1,4 g · Carboidrati 2,9 g",
    basePrice: 1.35,
    hasOffer: false,
  },
  tomatoes: {
    name: "Pomodorini",
    emoji: "🍅",
    nutrition: "18 kcal · Proteine 0,9 g · Carboidrati 3,9 g",
    basePrice: 2.2,
    hasOffer: true,
  },
  rice: {
    name: "Riso",
    emoji: "🍚",
    nutrition: "360 kcal · Proteine 7 g · Carboidrati 79 g · Grassi 0,6 g",
    basePrice: 2.15,
    hasOffer: true,
  },
  zucchini: {
    name: "Zucchine",
    emoji: "🥒",
    nutrition: "17 kcal · Proteine 1,2 g · Carboidrati 3,1 g",
    basePrice: 2.4,
    hasOffer: false,
  },
  pepper: {
    name: "Peperone",
    emoji: "🫑",
    nutrition: "31 kcal · Proteine 1 g · Carboidrati 6 g",
    basePrice: 1.7,
    hasOffer: true,
  },
};

function createProducts(ingredientId: string): Product[] {
  const ingredient = ingredientInformation[ingredientId];

  if (!ingredient) {
    return [];
  }

  const standardProduct: Product = {
    id: `${ingredientId}-standard`,
    name: ingredient.name,
    brand: "Marca Classica",
    emoji: ingredient.emoji,
    nutrition: ingredient.nutrition,
    price: ingredient.basePrice,
    isOnSale: false,
  };

  const secondProduct: Product = {
    id: `${ingredientId}-alternative`,
    name: ingredient.name,
    brand: "Buona Scelta",
    emoji: ingredient.emoji,
    nutrition: ingredient.nutrition,
    price: Number((ingredient.basePrice * 1.15).toFixed(2)),
    isOnSale: false,
  };

  if (!ingredient.hasOffer) {
    return [standardProduct, secondProduct];
  }

  const saleProduct: Product = {
    id: `${ingredientId}-sale`,
    name: ingredient.name,
    brand: "Offerta del giorno",
    emoji: ingredient.emoji,
    nutrition: ingredient.nutrition,
    price: Number((ingredient.basePrice * 0.8).toFixed(2)),
    oldPrice: ingredient.basePrice,
    isOnSale: true,
  };

  return [saleProduct, standardProduct, secondProduct];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export default function ProductsScreen() {
  const { id, missing, supermarket } = useLocalSearchParams<{
    id: string;
    missing: string;
    supermarket: string;
  }>();

  const missingIds = missing ? missing.split(",") : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, string>
  >({});

  const currentIngredientId = missingIds[currentIndex];
  const ingredient = ingredientInformation[currentIngredientId];
  const products = createProducts(currentIngredientId);

  const selectedProductId =
    selectedProducts[currentIngredientId] ?? products[0]?.id;

  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? products[0];

  if (!ingredient || !selectedProduct) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Nessun prodotto disponibile</Text>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Torna indietro</Text>
        </Pressable>
      </View>
    );
  }

  function selectProduct(productId: string) {
    setSelectedProducts({
      ...selectedProducts,
      [currentIngredientId]: productId,
    });
  }

  function continueShopping() {
    const updatedProducts = {
      ...selectedProducts,
      [currentIngredientId]: selectedProduct.id,
    };

    setSelectedProducts(updatedProducts);

    const isLastIngredient = currentIndex === missingIds.length - 1;

    if (isLastIngredient) {
      router.push({
        pathname: "/recipe/cook/[id]",
        params: { id },
      });
      return;
    }

    setCurrentIndex(currentIndex + 1);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.store}>Supermercato: {supermarket}</Text>

      <Text style={styles.progress}>
        Prodotto {currentIndex + 1} di {missingIds.length}
      </Text>

      <Text style={styles.title}>{ingredient.name}</Text>

      {selectedProduct.isOnSale && (
        <Text style={styles.saleBadge}>IN OFFERTA</Text>
      )}

      <View style={styles.productImage}>
        <Text style={styles.productEmoji}>{selectedProduct.emoji}</Text>
      </View>

      <Text style={styles.brand}>{selectedProduct.brand}</Text>
      <Text style={styles.productName}>{selectedProduct.name}</Text>

      <Text style={styles.nutrition}>
        Valori medi per 100 g: {selectedProduct.nutrition}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(selectedProduct.price)}</Text>

        {selectedProduct.oldPrice && (
          <Text style={styles.oldPrice}>
            {formatPrice(selectedProduct.oldPrice)}
          </Text>
        )}
      </View>

      <Text style={styles.alternativeTitle}>Altre marche disponibili</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.alternativeList}
      >
        {products
          .filter((product) => product.id !== selectedProduct.id)
          .map((product) => (
            <Pressable
              key={product.id}
              style={styles.alternativeCard}
              onPress={() => selectProduct(product.id)}
            >
              <Text style={styles.alternativeEmoji}>{product.emoji}</Text>

              <Text style={styles.alternativeBrand}>{product.brand}</Text>

              <Text style={styles.alternativePrice}>
                {formatPrice(product.price)}
              </Text>
            </Pressable>
          ))}
      </ScrollView>

      <Pressable style={styles.continueButton} onPress={continueShopping}>
        <Text style={styles.continueButtonText}>
          {currentIndex === missingIds.length - 1
            ? "Ho tutto, iniziamo a cucinare"
            : "Prodotto successivo"}
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
  },

  productEmoji: {
    fontSize: 110,
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

  alternativeEmoji: {
    fontSize: 42,
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

  continueButton: {
    backgroundColor: "#EA5B36",
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
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
});
