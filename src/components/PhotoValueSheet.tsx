import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  ShieldCheck,
  Trash,
  UserFocus,
  X,
} from "phosphor-react-native";
import { useFTUEStore } from "@state/useFTUEStore";
import { uploadPhotoToBackend } from "@/src/services/photoUpload";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type PhotoValueSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPhotoUploaded?: () => void;
};

const PRIVACY_POINTS = [
  {
    icon: ShieldCheck,
    text: "Fotoğrafın yalnızca senin görsellerini üretmek için kullanılır.",
  },
  {
    icon: UserFocus,
    text: "Fotoğraf güvenli sunucularda şifrelenerek saklanır.",
  },
  {
    icon: Trash,
    text: "İstediğin zaman profilinden fotoğrafını silebilirsin.",
  },
];

export const PhotoValueSheet = ({
  visible,
  onClose,
  onPhotoUploaded,
}: PhotoValueSheetProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { setPhotoUploadStatus, markPhotoValueSheetShown } = useFTUEStore();

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      if (!uri) return;
      setPhoto(uri);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!photo) return;

    setIsUploading(true);
    // uploadPhotoToBackend sets "uploading" then final status + avatar job on server
    try {
      const result = await uploadPhotoToBackend(photo);

      if (!result.success) {
        Alert.alert(
          "Yükleme başarısız",
          result.error
            ? `Fotoğraf sunucuya gönderilemedi.\n\n(${result.error})`
            : "Fotoğraf sunucuya gönderilemedi. Lütfen tekrar dene.",
          [{ text: "Tamam" }],
        );
        return;
      }

      // uploadPhotoToBackend already set photoUploadStatus + profilePhoto + avatar processing
      onPhotoUploaded?.();
      onClose();
    } catch {
      setPhotoUploadStatus("failed");
      Alert.alert(
        "Yükleme başarısız",
        "Beklenmeyen bir hata oluştu. Lütfen tekrar dene.",
        [{ text: "Tamam" }],
      );
    } finally {
      setIsUploading(false);
    }
  }, [photo, setPhotoUploadStatus, onPhotoUploaded, onClose]);

  const handleSkip = useCallback(() => {
    setPhotoUploadStatus("skipped");
    markPhotoValueSheetShown();
    onClose();
  }, [setPhotoUploadStatus, markPhotoValueSheetShown, onClose]);

  const handleDismiss = useCallback(() => {
    markPhotoValueSheetShown();
    onClose();
  }, [markPhotoValueSheetShown, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <X size={18} color={semantic.textSecondary} />
          </TouchableOpacity>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Kişisel görsellerini aç</Text>
          <Text style={styles.subtitle}>
            Bir fotoğrafın yükle, AI seni andıran motivasyon görselleri
            üretsin.
          </Text>

          <Pressable
            style={[styles.photoArea, shadow.card]}
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Fotoğraf seç"
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={34} color={semantic.textSecondary} />
                <Text style={styles.photoPlaceholderText}>Fotoğraf Seç</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.exampleRow}>
            <View style={styles.exampleDot} />
            <Text style={styles.exampleText}>
              Net bir selfie en iyi sonucu verir
            </Text>
          </View>

          <View style={styles.privacySection}>
            <Text style={styles.privacySectionTitle}>
              Gizlilik ve güvenlik
            </Text>
            {PRIVACY_POINTS.map((point) => (
              <View key={point.text} style={styles.privacyRow}>
                <point.icon
                  size={18}
                  color={semantic.success}
                  weight="fill"
                />
                <Text style={styles.privacyText}>{point.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!photo || isUploading) && styles.disabled,
              shadow.soft,
            ]}
            onPress={handleUpload}
            disabled={!photo || isUploading}
            accessibilityRole="button"
            accessibilityLabel="Fotoğrafı yükle"
          >
            <Text style={styles.uploadButtonText}>
              {isUploading ? "Yükleniyor..." : "Fotoğrafı Yükle"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Daha sonra yükle"
          >
            <Text style={styles.skipButtonText}>Daha Sonra</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: semantic.border,
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: "absolute",
    right: spacing.xl,
    top: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1,
    borderColor: semantic.border,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: semantic.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 16,
    lineHeight: 22,
    color: semantic.textSecondary,
  },
  photoArea: {
    marginTop: spacing.lg,
    alignSelf: "center",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  photoImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  photoPlaceholderText: {
    color: semantic.textSecondary,
    fontSize: 14,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    marginTop: spacing.sm,
  },
  exampleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.success,
  },
  exampleText: {
    fontSize: 13,
    color: semantic.textSecondary,
  },
  privacySection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  privacySectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: semantic.textPrimary,
    marginBottom: spacing.xxs,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: semantic.textSecondary,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    gap: spacing.sm,
  },
  uploadButton: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  uploadButtonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  skipButtonText: {
    color: semantic.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  disabled: { opacity: 0.5 },
});
