import { View, Text, StyleSheet } from 'react-native';

type ItemCounterProps = {
  count: number;
};

export function ItemCounter({ count }: ItemCounterProps) {
  if (count === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>{count === 1 ? 'item' : 'items'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
