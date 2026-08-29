import { View, Text, StyleSheet } from 'react-native';

// Главный экран
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pulsera App</Text>
      <Text style={styles.subtitle}>Добро пожаловать!</Text>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#999',
  },
});