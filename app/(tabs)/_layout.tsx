import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwipeableTabView, TabConfig } from '@/components/SwipeableTabView';

// Import screen components directly
import RecipesScreen from './recipes';
import PantryScreen from './pantry';
import CameraScreen from './index';
import ProfileScreen from './profile';
import SettingsScreen from './settings';

// Tab configuration
const TABS: TabConfig[] = [
  { key: 'recipes', title: 'Recipes', emoji: '📖', component: RecipesScreen },
  { key: 'pantry', title: 'Pantry', emoji: '🥫', component: PantryScreen },
  { key: 'camera', title: 'Camera', emoji: '📷', component: CameraScreen },
  { key: 'profile', title: 'Profile', emoji: '👤', component: ProfileScreen },
  { key: 'settings', title: 'Settings', emoji: '⚙️', component: SettingsScreen },
];

// Header component for non-camera screens
function Header({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SwipeableTabView tabs={TABS} initialIndex={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#AA4A44',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
