import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Страница не найдена</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>На главную</Text>
      </Link>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    color: '#6c63ff',
    fontSize: 16,
  },
});