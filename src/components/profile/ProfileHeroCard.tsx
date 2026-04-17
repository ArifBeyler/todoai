import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Crown, CaretRight } from "phosphor-react-native";
import { radius, shadow, spacing } from "@/src/ui/tokens";

type ProfileHeroCardProps = {
  profilePhoto: string | null | undefined;
  profileName: string | null | undefined;
  isPremium: boolean;
  badgeText: string;
  aiStatusText: string;
};

export const ProfileHeroCard = ({
  profilePhoto,
  profileName,
  isPremium,
  badgeText,
  aiStatusText,
}: ProfileHeroCardProps) => (
  <Animated.View entering={FadeIn.duration(300)} style={[styles.heroCard, shadow.soft]}>
    {profilePhoto ? (
      <View style={styles.heroAvatarWrap}>
        <Image source={{ uri: profilePhoto }} style={styles.heroAvatar} />
      </View>
    ) : (
      <View style={[styles.heroAvatarWrap, styles.heroAvatarPlaceholder]}>
        <Text style={styles.heroAvatarInitial}>
          {(profileName || "A")[0].toUpperCase()}
        </Text>
      </View>
    )}
    <View style={styles.heroInfo}>
      <Text style={styles.heroName} numberOfLines={1}>{profileName || "Kullanıcı"}</Text>
      <View style={[styles.planBadge, isPremium && styles.planBadgePro]}>
        {isPremium && <Crown size={11} color="#FFFFFF" weight="fill" />}
        <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextPro]}>
          {badgeText}
        </Text>
      </View>
      <Text style={styles.heroStatusText} numberOfLines={1}>{aiStatusText}</Text>
    </View>
    <CaretRight size={15} color="#C8BDB5" />
  </Animated.View>
);

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.xl,
    backgroundColor: "#FDFAF6",
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroAvatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#EDE5D8",
    overflow: "hidden",
  },
  heroAvatar: {
    width: "100%",
    height: "100%",
  },
  heroAvatarPlaceholder: {
    backgroundColor: "#EDE5D8",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarInitial: {
    color: "#3A2E28",
    fontSize: 28,
    fontWeight: "700",
  },
  heroInfo: {
    flex: 1,
    gap: 5,
  },
  heroName: {
    fontSize: 22,
    lineHeight: 26,
    color: "#3A2E28",
    fontWeight: "700",
  },
  planBadge: {
    alignSelf: "flex-start",
    borderRadius: 100,
    backgroundColor: "#F2EEE8",
    paddingHorizontal: 10,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  planBadgePro: {
    backgroundColor: "#202126",
  },
  planBadgeText: {
    color: "#6B5B52",
    fontSize: 11,
    fontWeight: "600",
  },
  planBadgeTextPro: {
    color: "#FFFFFF",
  },
  heroStatusText: {
    fontSize: 12,
    color: "#9E8E84",
    fontWeight: "400",
  },
});
