import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const supermarkets = [
  {
    id: "mercadona",
    name: "Mercadona",
    address: "Punto vendita più vicino",
    distance: "800 m",
  },
  {
    id: "dia",
    name: "DIA",
    address: "Punto vendita nelle vicinanze",
    distance: "1,2 km",
  },
  {
    id: "alcampo",
    name: "Alcampo",
    address: "Punto vendita nelle vicinanze",
    distance: "2,4 km",
  },
];

export default function SupermarketScreen() {
  const { id, missing } = useLocalSearchParams<{
    id: string;
    missing: string;
  }>();

  const [selectedSupermarket, setSelectedSupermarket] = useState<string | null>(
    null,
  );

  const missingIngredientIds = missing ? missing.split(",") : [];

  function continueToProducts() {
    if (!selectedSupermarket) {
      return;
    }

    router.push({
      pathname: "/recipe/products/[id]",
      params: {
        id,
        missing,
        supermarket: selectedSupermarket,
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.title}>Scegli il supermercato</Text>

      <Text style={styles.subtitle}>
        Hai selezionato {missingIngredientIds.length} ingredienti da comprare.
      </Text>

      <View style={styles.list}>
        {supermarkets.map((supermarket) => {
          const isSelected = selectedSupermarket === supermarket.id;

          return (
            <Pressable
              key={supermarket.id}
              style={[
                styles.supermarketCard,
                isSelected && styles.selectedCard,
              ]}
              onPress={() => setSelectedSupermarket(supermarket.id)}
            >
              <View style={styles.supermarketInformation}>
                <Text style={styles.supermarketName}>{supermarket.name}</Text>

                <Text style={styles.address}>{supermarket.address}</Text>
              </View>

              <Text style={styles.distance}>{supermarket.distance}</Text>
            </Pressable>
          );
        })}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8EE",
    padding: 24,
    paddingTop: 60,
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

  supermarketInformation: {
    flex: 1,
  },

  supermarketName: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "700",
  },

  address: {
    color: "#777777",
    fontSize: 14,
    marginTop: 5,
  },

  distance: {
    color: "#EA5B36",
    fontSize: 15,
    fontWeight: "600",
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
});
