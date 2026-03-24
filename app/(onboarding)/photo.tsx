import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function PhotoScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const { setProfilePhoto } = useSessionStore();

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) {
      const uri = result.assets[0]?.uri;
      if (!uri) return;
      setPhoto(uri);
      setProfilePhoto(uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bir fotoğrafınızı ekleyin</Text>
      <Text style={styles.sub}>Yapay zekâ görselinizde yüz hatlarınızı korumak için bu fotoğrafı kullanır.</Text>

      <TouchableOpacity style={[styles.photoArea, shadow.card]} onPress={handlePickImage} activeOpacity={0.85}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={styles.placeholder}>
            <Camera size={34} color={semantic.textSecondary} />
            <Text style={styles.placeholderText}>Fotoğraf Seç</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, !photo && styles.disabled, shadow.soft]} onPress={() => router.push("/(onboarding)/style")} disabled={!photo}>
          <Text style={styles.buttonText}>Devam Et</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(onboarding)/style")}><Text style={styles.skip}>Şimdilik Atla</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: semantic.appBackground, paddingHorizontal: spacing.xl, paddingTop: 74, paddingBottom: 50 },
  title: { fontSize: 36, lineHeight: 40, fontWeight: "700", color: semantic.textPrimary, letterSpacing: -0.7 },
  sub: { marginTop: spacing.sm, fontSize: 16, lineHeight: 23, color: semantic.textSecondary },
  photoArea: { marginTop: 34, alignSelf: "center", borderRadius: radius.pill, overflow: "hidden" },
  photo: { width: 192, height: 192, borderRadius: 96 },
  placeholder: { width: 192, height: 192, borderRadius: 96, borderWidth: 1, borderStyle: "dashed", borderColor: semantic.border, backgroundColor: semantic.screenSurface, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  placeholderText: { color: semantic.textSecondary, fontSize: 14 },
  actions: { marginTop: "auto", gap: spacing.sm },
  button: { borderRadius: radius.lg, backgroundColor: semantic.heroStart, alignItems: "center", paddingVertical: 17 },
  buttonText: { color: semantic.textOnDark, fontSize: 16, fontWeight: "700" },
  skip: { textAlign: "center", color: semantic.textSecondary, fontSize: 14 },
  disabled: { opacity: 0.5 },
});
