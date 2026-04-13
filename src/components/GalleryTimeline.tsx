import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { radius, semantic, spacing } from "@/src/ui/tokens";

type TimelineItem = {
  id: string;
  imageUrl: string;
  todoTitles: string[];
  createdAt: string;
  type: "avatar" | "visual" | "daily";
};

type GalleryTimelineProps = {
  items: TimelineItem[];
  onItemPress: (item: TimelineItem) => void;
};

const TYPE_COLORS: Record<string, string> = {
  avatar: "#C4962A",
  visual: semantic.accent,
  daily: "#5C7CAA",
};

const TYPE_LABELS: Record<string, string> = {
  avatar: "Portre",
  visual: "Görev Görseli",
  daily: "Günlük",
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const TimelineEntry = ({
  item,
  index,
  onPress,
}: {
  item: TimelineItem;
  index: number;
  onPress: () => void;
}) => {
  const dotColor = TYPE_COLORS[item.type] ?? "#8A7A70";

  return (
    <Animated.View entering={FadeInLeft.delay(index * 80).duration(300)} style={styles.entry}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {index < 999 && <View style={styles.line} />}
      </View>

      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.typeLabel, { color: dotColor }]}>
              {TYPE_LABELS[item.type]}
            </Text>
            <Text style={styles.dateLabel}>{formatDate(item.createdAt)}</Text>
          </View>
          {item.todoTitles.length > 0 && (
            <Text style={styles.todoTitle} numberOfLines={2}>
              {item.todoTitles.join(", ")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const GalleryTimeline = ({ items, onItemPress }: GalleryTimelineProps) => {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Zaman Çizelgesi</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TimelineEntry item={item} index={index} onPress={() => onItemPress(item)} />
        )}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3A2E28",
    paddingLeft: 4,
  },
  entry: {
    flexDirection: "row",
    minHeight: 80,
  },
  timeline: {
    width: 24,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 16,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#F2EEE8",
  },
  card: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    marginBottom: 8,
    borderRadius: radius.lg,
    backgroundColor: "#FDFAF6",
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dateLabel: {
    fontSize: 11,
    color: "#8A7A70",
  },
  todoTitle: {
    fontSize: 13,
    color: "#5C4E46",
    fontWeight: "500",
    lineHeight: 18,
  },
});
