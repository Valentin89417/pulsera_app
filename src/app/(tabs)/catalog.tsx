import { View, Text, StyleSheet } from 'react-native';

// Экран каталога
export default function CatalogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Каталог</Text>
      <Text style={styles.subtitle}>Здесь будет контент</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
});