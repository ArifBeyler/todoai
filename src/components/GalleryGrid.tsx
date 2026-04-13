import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { ArrowDown, X, Share } from "phosphor-react-native";
import * as MediaLibrary from "expo-media-library";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { supabase } from "@/src/services/supabase";

type GalleryItem = {
  id: string;
  type: "avatar" | "visual" | "daily";
  imageUrl: string;
  thumbnailUrl?: string;
  todoTitles: string[];
  createdAt: string;
  month: string;
};

type GalleryGroup = {
  month: string;
  label: string;
  items: GalleryItem[];
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_GAP = 10;
const ITEM_WIDTH = (SCREEN_WIDTH - 28 - ITEM_GAP) / 2;

const MONTH_LABELS: Record<string, string> = {
  "01": "Ocak", "02": "Şubat", "03": "Mart", "04": "Nisan",
  "05": "Mayıs", "06": "Haziran", "07": "Temmuz", "08": "Ağustos",
  "09": "Eylül", "10": "Ekim", "11": "Kasım", "12": "Aralık",
};

const formatMonth = (monthKey: string): string => {
  const [year, month] = monthKey.split("-");
  return `${MONTH_LABELS[month] ?? month} ${year}`;
};

const TYPE_LABELS: Record<string, string> = {
  avatar: "Portre",
  visual: "Görev Görseli",
  daily: "Günlük Görsel",
};

export const GalleryGrid = () => {
  const [groups, setGroups] = useState<GalleryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.functions.invoke("get-gallery", {
        method: "GET",
      });

      if (data?.grouped) {
        const sortedMonths = Object.keys(data.grouped).sort().reverse();
        const g: GalleryGroup[] = sortedMonths.map((month) => ({
          month,
          label: formatMonth(month),
          items: data.grouped[month],
        }));
        setGroups(g);
      }
    } catch {
      setError(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleSaveToPhotos = useCallback(async (item: GalleryItem) => {
    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Fotoğrafları kaydetmek için izin vermelisin.");
        setIsSaving(false);
        return;
      }

      await MediaLibrary.saveToLibraryAsync(item.imageUrl);
      Alert.alert("Kaydedildi", "Görsel fotoğraf albümüne kaydedildi.");
    } catch {
      Alert.alert("Hata", "Görsel kaydedilemedi. Tekrar dene.");
    }
    setIsSaving(false);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator size="small" color="#3A2E28" />
        <Text style={styles.stateText}>Galeri yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateText}>Görseller yüklenemedi.</Text>
        <TouchableOpacity onPress={loadGallery} style={styles.retryButton} accessibilityRole="button">
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (groups.length === 0 || groups.every((g) => g.items.length === 0)) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateText}>
          Henüz görselin yok. Görevlerini tamamla ve ilk görselini oluştur!
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {groups.map((group) => (
          <View key={group.month} style={styles.group}>
            <Text style={styles.monthLabel}>{group.label}</Text>
            <View style={styles.grid}>
              {group.items.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInUp.delay(index * 60).duration(300)}
                >
                  <TouchableOpacity
                    style={[styles.card, shadow.card]}
                    onPress={() => setSelectedItem(item)}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={`${TYPE_LABELS[item.type]} görseli`}
                  >
                    <Image
                      source={{ uri: item.thumbnailUrl ?? item.imageUrl }}
                      style={styles.image}
                    />
                    <View style={styles.meta}>
                      <Text style={styles.typeLabel}>{TYPE_LABELS[item.type]}</Text>
                      {item.todoTitles.length > 0 && (
                        <Text style={styles.todoTitle} numberOfLines={1}>
                          {item.todoTitles[0]}
                        </Text>
                      )}
                      <Text style={styles.dateLabel}>
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.detailOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.detailBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setSelectedItem(null)}
              activeOpacity={1}
            />
          </Animated.View>

          {selectedItem && (
            <View style={styles.detailContent}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailType}>{TYPE_LABELS[selectedItem.type]}</Text>
                <TouchableOpacity
                  onPress={() => setSelectedItem(null)}
                  accessibilityRole="button"
                >
                  <X size={24} color="#FFFFFF" weight="regular" />
                </TouchableOpacity>
              </View>

              <Image
                source={{ uri: selectedItem.imageUrl }}
                style={styles.detailImage}
                resizeMode="contain"
              />

              {selectedItem.todoTitles.length > 0 && (
                <View style={styles.detailTodos}>
                  {selectedItem.todoTitles.map((title, i) => (
                    <Text key={i} style={styles.detailTodoText}>{title}</Text>
                  ))}
                </View>
              )}

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => handleSaveToPhotos(selectedItem)}
                  disabled={isSaving}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                >
                  <ArrowDown size={18} color="#FFFFFF" weight="bold" />
                  <Text style={styles.saveText}>
                    {isSaving ? "Kaydediliyor..." : "Kaydet"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  stateCard: { borderRadius: radius.lg, backgroundColor: "#FDFAF6", paddingVertical: spacing.lg, paddingHorizontal: spacing.md, alignItems: "center", gap: 10 },
  stateText: { fontSize: 14, color: "#5C4E46", fontWeight: "500", textAlign: "center" },
  retryButton: { borderRadius: radius.md, backgroundColor: "#3A2E28", paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  group: { gap: spacing.sm },
  monthLabel: { fontSize: 16, fontWeight: "700", color: "#3A2E28", paddingLeft: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: ITEM_GAP },
  card: { width: ITEM_WIDTH, borderRadius: radius.lg, backgroundColor: "#FDFAF6", overflow: "hidden" },
  image: { width: "100%", aspectRatio: 1 },
  meta: { paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  typeLabel: { fontSize: 11, fontWeight: "700", color: semantic.accent, textTransform: "uppercase", letterSpacing: 0.3 },
  todoTitle: { fontSize: 13, fontWeight: "600", color: "#3A2E28" },
  dateLabel: { fontSize: 11, color: "#8A7A70" },
  detailOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  detailBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.9)" },
  detailContent: { flex: 1, width: "100%", justifyContent: "center", paddingHorizontal: 20, gap: 20, paddingTop: 60, paddingBottom: 40 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailType: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  detailImage: { width: "100%", flex: 1, borderRadius: radius.lg },
  detailTodos: { gap: 4 },
  detailTodoText: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  detailActions: { flexDirection: "row", justifyContent: "center", gap: 16 },
  saveButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: semantic.accent, borderRadius: radius.pill, paddingHorizontal: 24, paddingVertical: 14 },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
