import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Страница не найдена</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>На главную</Text>
      </Link>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    color: colors.primary,
    fontSize: 16,
  },
});
