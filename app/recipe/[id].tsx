import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type Ingredient = {
  name: string;
  amount: string;
  inPantry: boolean;
};

const MOCK_RECIPE = {
  id: '1',
  title: 'Spaghetti Carbonara',
  description: 'A classic Italian pasta dish with eggs, cheese, and pancetta.',
  cuisine: 'Italian',
  prepTime: 15,
  cookTime: 15,
  servings: 4,
  ingredients: [
    { name: 'Spaghetti', amount: '400g', inPantry: true },
    { name: 'Pancetta', amount: '200g', inPantry: true },
    { name: 'Eggs', amount: '4 large', inPantry: true },
    { name: 'Parmesan cheese', amount: '100g', inPantry: false },
    { name: 'Black pepper', amount: 'to taste', inPantry: false },
  ] as Ingredient[],
  steps: [
    'Bring a large pot of salted water to boil and cook spaghetti according to package directions.',
    'While pasta cooks, cut pancetta into small cubes and fry in a large pan until crispy.',
    'In a bowl, whisk together eggs and grated Parmesan cheese.',
    'When pasta is cooked, reserve 1 cup of pasta water and drain the rest.',
    'Add hot pasta to the pan with pancetta (heat off) and toss well.',
    'Quickly add egg mixture and toss vigorously to create a creamy sauce.',
    'Add pasta water as needed to reach desired consistency.',
    'Season with freshly ground black pepper and serve immediately.',
  ],
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const availableCount = MOCK_RECIPE.ingredients.filter((i) => i.inPantry).length;
  const totalCount = MOCK_RECIPE.ingredients.length;
  const progressPercent = (availableCount / totalCount) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderEmoji}>🍝</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{MOCK_RECIPE.title}</Text>
          <Text style={styles.description}>{MOCK_RECIPE.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaEmoji}>⏱️</Text>
              <Text style={styles.metaText}>{MOCK_RECIPE.prepTime + MOCK_RECIPE.cookTime} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaEmoji}>🍽️</Text>
              <Text style={styles.metaText}>{MOCK_RECIPE.servings} servings</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaEmoji}>🌍</Text>
              <Text style={styles.metaText}>{MOCK_RECIPE.cuisine}</Text>
            </View>
          </View>
        </View>

        <View style={styles.unlockCard}>
          <View style={styles.unlockHeader}>
            <Text style={styles.unlockTitle}>Unlock Progress</Text>
            <Text style={styles.unlockCount}>
              {availableCount}/{totalCount} ingredients
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          {progressPercent < 100 && (
            <Text style={styles.unlockHint}>
              Scan {totalCount - availableCount} more ingredient(s) to unlock this recipe!
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {MOCK_RECIPE.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Text style={styles.ingredientCheck}>{ingredient.inPantry ? '✓' : '○'}</Text>
              <Text
                style={[styles.ingredientText, ingredient.inPantry && styles.ingredientAvailable]}
              >
                {ingredient.amount} {ingredient.name}
              </Text>
              {!ingredient.inPantry && (
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {MOCK_RECIPE.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteButtonText}>♡ Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cookButton, progressPercent < 100 && styles.cookButtonDisabled]}
          disabled={progressPercent < 100}
        >
          <Text style={styles.cookButtonText}>
            {progressPercent < 100 ? 'Missing Ingredients' : 'Start Cooking'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 100,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderEmoji: {
    fontSize: 80,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaEmoji: {
    fontSize: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  unlockCard: {
    marginHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  unlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  unlockCount: {
    fontSize: 14,
    color: '#166534',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  unlockHint: {
    fontSize: 13,
    color: '#166534',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ingredientCheck: {
    fontSize: 18,
    width: 30,
    color: '#22c55e',
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#6b7280',
  },
  ingredientAvailable: {
    color: '#111827',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  addButtonText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  favoriteButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  favoriteButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  cookButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
  },
  cookButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  cookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
