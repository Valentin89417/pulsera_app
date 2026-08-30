import { useState, useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';

interface MarkdownImageProps {
  uri: string;
  alt?: string;
  nodeKey?: string;
}

/**
 * Компонент для рендеринга изображений в Markdown.
 * Определяет реальные пропорции через Image.getSize()
 * и сохраняет их при рендере.
 */
export function MarkdownImage({ uri, alt, nodeKey }: MarkdownImageProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!uri) return;

    Image.getSize(
      uri,
      (w, h) => setDimensions({ width: w, height: h }),
      () => setDimensions({ width: 800, height: 800 }),
    );
  }, [uri]);

  const aspectRatio = dimensions ? dimensions.width / dimensions.height : 1;

  return (
    <Image
      key={nodeKey}
      source={{ uri }}
      style={[styles.image, { aspectRatio }]}
      resizeMode="contain"
      accessibilityLabel={alt}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: undefined,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#00000010',
  },
});
