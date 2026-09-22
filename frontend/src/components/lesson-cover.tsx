// PAUSE — Visual cover for Mini lessons. Lessons have no photo hero, so we
// render a branded gradient tinted with the category colour plus its icon.
// Reused wherever a story hero image would appear (home card, preview,
// deep-dive, saved thumbnails) so lessons stay visually coherent with stories
// while being instantly recognisable.
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@react-native-vector-icons/ionicons";
import { makeStyles, useTheme, radius, typography, spacing } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { CategoryOrb } from "@/src/components/category-orb";
import { catGradient } from "@/src/categories";

export function LessonCover({
  color,
  icon,
  categoryId,
  style,
  iconSize = 64,
  showBadge = true,
}: {
  color: string;
  icon: string;
  categoryId?: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  showBadge?: boolean;
}) {
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const [g0, g1] = catGradient(categoryId);
  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[g0 + "4D", g1 + "1A", colors.surfaceSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <CategoryOrb id={categoryId} size={Math.round(iconSize * 1.7)} glyphScale={0.56} />
      {showBadge ? (
        <View style={[styles.badge, { borderColor: color + "66", backgroundColor: colors.surface + "CC" }]}>
          <Ionicons name="school" size={12} color={color} />
          <Text style={[styles.badgeText, { color }]}>{t.lesson_badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
  },
  badge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeText: { fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.5 },
}));
