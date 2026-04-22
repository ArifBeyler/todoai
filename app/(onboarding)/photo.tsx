import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp, ZoomIn } from "react-native-reanimated";
import { Camera, CheckCircle } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { useFTUEStore } from "@state/useFTUEStore";
import { uploadPhotoToBackend } from "@/src/services/photoUpload";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

const PHOTO_SIZE = 200;
const RING_PAD = 8;
const RING_SIZE = PHOTO_SIZE + RING_PAD * 2;

export default function PhotoScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const { setProfilePhoto, isPremium } = useSessionStore();
  const paywallInteraction = useFTUEStore((s) => s.paywallInteraction);
  const { setPhotoUploadStatus } = useFTUEStore();
  const { triggerExit, exitStyle } = useOnboardingExit();

  // Premium-only screen: redirect non-premium users away so they never see
  // photo/avatar copy. This is the single source of truth for the guard.
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current) return;
    const premiumUnlocked = isPremium || paywallInteraction === "subscribed";
    if (!premiumUnlocked) {
      redirectedRef.current = true;
      router.replace("/(onboarding)/free-intro");
    }
  }, [isPremium, paywallInteraction]);

  const handlePickImage = async () => {
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
      setProfilePhoto(uri);
    }
  };

  const handleContinue = async () => {
    if (!photo || isUploading) return;
    setIsUploading(true);

    const result = await uploadPhotoToBackend(photo);

    setIsUploading(false);

    if (result.success) {
      triggerExit("forward", () => router.push("/(onboarding)/processing"));
    } else {
      Alert.alert(
        "Yükleme Başarısız",
        `Fotoğraf yüklenirken bir sorun oluştu.\n\n(${result.error ?? "bilinmeyen hata"})`,
        [{ text: "Tamam" }],
      );
    }
  };

  const handleSkip = () => {
    setPhotoUploadStatus("skipped");
    if (isPremium) {
      triggerExit("forward", () => router.push("/(onboarding)/processing"));
    } else {
      triggerExit("forward", () => router.push("/(onboarding)/free-intro"));
    }
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const titleStr = "Avatar fotoğrafını\nseç";
  const subStr =
    "Premium üyeliğinle kişisel AI görsellerinde yüz hatlarını korumak için bu fotoğrafı kullanıyoruz. Üretim tamamlandıktan sonra otomatik siliniyor.";
  const st = 30;
  const titleSteps = countStaggerSteps(titleStr);

  return (
    <Animated.View style={[styles.container, exitStyle]} testID="photo-upload-screen">
      <View>
        <OnboardingStaggeredParagraph
          text={titleStr}
          style={styles.title}
          staggerMs={st}
        />
        <OnboardingStaggeredParagraph
          text={subStr}
          style={styles.sub}
          startDelay={titleSteps * st + 71}
          staggerMs={20}
          containerStyle={{ marginTop: 10 }}
        />
      </View>

      <Animated.View
        entering={FadeInUp.delay(214).duration(286)}
        style={styles.photoSection}
      >
        <TouchableOpacity
          onPress={handlePickImage}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Fotoğraf seç"
        >
          <View style={styles.photoRing}>
            {photo ? (
              <Animated.Image
                entering={ZoomIn.duration(300)}
                source={{ uri: photo }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.placeholder}>
                <Camera size={34} color={semantic.textSecondary} />
                <Text style={styles.placeholderText}>Fotoğraf Seç</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={preHomeMotion.ctaEnter(357)} style={styles.actions}>
        {photo && (
          <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.consentBlock}>
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setConsentChecked(!consentChecked)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentChecked }}
              accessibilityLabel="Yüz işleme onayı"
            >
              <View
                style={[
                  styles.checkbox,
                  consentChecked && styles.checkboxChecked,
                ]}
              >
                {consentChecked && (
                  <CheckCircle
                    size={18}
                    color={semantic.textOnDark}
                    weight="fill"
                  />
                )}
              </View>
              <Text style={styles.consentText}>
                Fotoğrafımın yapay zekâ tarafından işlenmesini kabul ediyorum.
              </Text>
            </TouchableOpacity>
            <Text style={styles.deletionNote}>
              Bu fotoğraf yalnızca görsel üretimi için kullanılır ve üretim
              tamamlandıktan sonra otomatik olarak silinir.
            </Text>
          </Animated.View>
        )}

        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextDisabled={!photo || !consentChecked || isUploading}
          nextLabel={isUploading ? "Yükleniyor…" : "Devam Et"}
          showBack
        />
        <TouchableOpacity
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Şimdilik atla"
        >
          <Text style={styles.skip}>Şimdilik Atla</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: 74,
    paddingBottom: 50,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.7,
  },
  sub: {
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 23,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    maxWidth: "92%",
  },
  photoSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: "#DDD5CC",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3A2E28",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: semantic.appBackground,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  placeholder: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  placeholderText: { color: semantic.textSecondary, fontSize: 14, fontFamily: font.regular },
  consentBlock: {
    gap: 8,
    marginBottom: 4,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: semantic.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: semantic.heroStart,
    borderColor: semantic.heroStart,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  deletionNote: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: font.regular,
    color: "#A89888",
    paddingHorizontal: 4,
    paddingLeft: 36,
  },
  actions: { gap: spacing.sm },
  button: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  buttonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
  skip: { textAlign: "center", color: semantic.textSecondary, fontSize: 14, fontFamily: font.regular },
  disabled: { opacity: 0.5 },
});
