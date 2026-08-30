import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

export default function CommunityScreen() {
  const { colors } = useTheme();

  const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
  });

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Сообщество</Text>
      <Text style={styles.subtitle}>Скоро будет доступно</Text>
    </View>
  );
}
