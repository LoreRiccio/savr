import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { recipeList } from "@/data/recipes";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Savr</Text>

      <Text style={styles.title}>Cosa vuoi mangiare oggi?</Text>

      <Text style={styles.subtitle}>
        Scegli un piatto e ti accompagnerò dalla spesa alla cucina.
      </Text>

      <View style={styles.recipeList}>
        {recipeList.map((recipe) => (
          <Pressable
            key={recipe.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/recipe/[id]",
                params: { id: String(recipe.id) },
              })
            }
          >
            <Text style={styles.emoji}>{recipe.emoji}</Text>

            <View>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <Text style={styles.recipeTime}>{recipe.time}</Text>
            </View>
          </Pressable>
        ))}
      </View>
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
    marginTop: 12,
  },

  recipeList: {
    gap: 16,
    marginTop: 32,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  emoji: {
    fontSize: 42,
  },

  recipeName: {
    color: "#171717",
    fontSize: 18,
    fontWeight: "600",
  },

  recipeTime: {
    color: "#777777",
    fontSize: 14,
    marginTop: 5,
  },
});
