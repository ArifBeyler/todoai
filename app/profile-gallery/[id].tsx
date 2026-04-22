import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, UserCircle } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import {
  parseProfileGalleryCompositeId,
  resolveProfileGalleryItem,
  setActiveAvatarForCurrentUser,
} from "@/src/services/profileGalleryResolve";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function ProfileGalleryDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const compositeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const setProfilePhoto = useSessionStore((s) => s.setProfilePhoto);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<"avatar" | "visual" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingProfile, setSettingProfile] = useState(false);

  const load = useCallback(async () => {
    if (!compositeId) {
      setError("Geçersiz bağlantı");
      setLoading(false);
      return;
    }
    if (!parseProfileGalleryCompositeId(compositeId)) {
      setError("Geçersiz görsel");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const resolved = await resolveProfileGalleryItem(compositeId);
    if (!resolved) {
      setError("Görsel bulunamadı veya erişim yok.");
      setImageUrl(null);
      setKind(null);
    } else {
      setImageUrl(resolved.imageUrl);
      setKind(resolved.kind);
    }
    setLoading(false);
  }, [compositeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSetProfilePhoto = useCallback(async () => {
    if (!imageUrl || !compositeId || !kind) return;
    setSettingProfile(true);
    try {
      if (kind === "avatar") {
        const parsed = parseProfileGalleryCompositeId(compositeId);
        if (parsed?.kind === "avatar") {
          await setActiveAvatarForCurrentUser(parsed.uuid);
        }
      }
      setProfilePhoto(imageUrl);
      Alert.alert("Profil güncellendi", "Profil fotoğrafın ayarlandı.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    } finally {
      setSettingProfile(false);
    }
  }, [imageUrl, compositeId, kind, setProfilePhoto]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          hitSlop={12}
        >
          <ArrowLeft size={22} color="#3A2E28" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Görsel</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={semantic.heroStart} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => void load()} accessibilityRole="button">
            <Text style={styles.retryText}>Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      ) : imageUrl ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.imageCard, shadow.card]}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, shadow.soft, settingProfile && styles.btnDisabled]}
            onPress={() => void handleSetProfilePhoto()}
            disabled={settingProfile}
            accessibilityRole="button"
            accessibilityLabel="Profil fotoğrafı yap"
            testID="gallery-set-profile-photo"
          >
            {settingProfile ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <UserCircle size={20} color="#FFF" weight="duotone" />
                <Text style={styles.primaryBtnText}>Profil fotoğrafı yap</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: semantic.appBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3A2E28",
  },
  headerSpacer: { width: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 15,
    color: "#6B5B52",
    textAlign: "center",
  },
  retry: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: "#3A2E28",
  },
  retryText: {
    color: "#FFF",
    fontWeight: "700",
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  imageCard: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    overflow: "hidden",
    minHeight: 280,
  },
  image: {
    width: "100%",
    minHeight: 320,
    backgroundColor: "#EDE5D8",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#3A2E28",
    paddingVertical: 16,
    borderRadius: radius.lg,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
