import { Modal, View, StyleSheet, TouchableOpacity, Text, Platform, Image } from 'react-native';
import { X } from 'lucide-react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { fontFamily } from '@/lib/typography';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props {
  visible: boolean;
  imageUri: string | null;
  title?: string;
  onClose: () => void;
}

export function ReceiptImageViewer({ visible, imageUri, title, onClose }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(4, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + e.translationX;
        translateY.value = savedY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const resetTransform = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={resetTransform}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title ?? 'Fotografija računa'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X size={24} color={colors.textInverse} />
            </TouchableOpacity>
          </View>

          {imageUri ? (
            Platform.OS === 'web' ? (
              <View style={styles.webImageWrap}>
                <Image source={{ uri: imageUri }} style={styles.webImage} resizeMode="contain" />
                <Text style={styles.webHint}>Koristite zoom pregledača (Ctrl + točkić miša)</Text>
              </View>
            ) : (
              <GestureDetector gesture={composed}>
                <Animated.View style={[styles.imageWrap, imageStyle]}>
                  <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
                </Animated.View>
              </GestureDetector>
            )
          ) : null}

          <Text style={styles.hint}>Prevucite prstima za pomeranje · uštipnite za zum</Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 43, 95, 0.95)',
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: fontFamily.semibold,
    color: colors.textInverse,
  },
  closeBtn: {
    padding: 8,
  },
  imageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  webImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webImage: {
    width: '100%',
    height: '80%',
    maxHeight: 700,
  },
  webHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
});
