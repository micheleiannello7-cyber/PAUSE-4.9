import { View, Text, Pressable } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Category } from "@/src/api";
import { makeStyles, useTheme, spacing, radius, typography } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { CategoryOrb, GradientOrb } from "@/src/components/category-orb";
import { catGradient } from "@/src/categories";

export const ALL_ID = "all";

// Shared toggle logic: "all" is exclusive with specific categories.
export function toggleInterest(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (id === ALL_ID) {
    return next.has(ALL_ID) ? new Set() : new Set([ALL_ID]);
  }
  next.delete(ALL_ID);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

// A clean, centred 3-column picker: a full-width "any topic" card on top, then
// uniform category tiles (icon in a coloured disc, name, count). Selecting a
// tile tints its border/disc and drops a check badge on the icon — no loose
// radio dots, so the grid stays tidy. `compact` is accepted for API
// compatibility; the layout is the same everywhere.
export function CategoryGrid({
  categories, selected, onToggle, modes,
}: { categories: Category[]; selected: Set<string>; onToggle: (id: string) => void; compact?: boolean; modes?: ("stories" | "lessons")[] }) {
  const allActive = selected.has(ALL_ID);
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();

  // Count label reflects which content modes are active (curiosities / lessons
  // / both) so the numbers match what the user will actually receive.
  const showStories = !modes || modes.includes("stories");
  const showLessons = !!modes && modes.includes("lessons");
  const countFor = (c: Category): string => {
    if (showStories && showLessons) return `${c.story_count + c.lesson_count} ${t.items_n}`;
    if (showLessons && !showStories) return `${c.lesson_count} ${t.lessons_n}`;
    return `${c.story_count} ${t.stories_n}`;
  };

  return (
    <View testID="category-grid">
      <Pressable
        testID="chip-all"
        onPress={() => onToggle(ALL_ID)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: allActive }}
        accessibilityLabel={t.any_topic}
        style={[
          styles.allCard,
          allActive && { borderColor: colors.cyan + "80", backgroundColor: colors.cyanGlowSoft, boxShadow: `0px 0px 18px ${colors.cyanGlow}` as any },
        ]}
      >
        <View pointerEvents="none" style={styles.tileHighlight} />
        <GradientOrb gradient={[colors.cyanSoft, colors.cyan]} glyph="all-inclusive" size={46} radiusOverride={16} active={allActive} />
        <View style={{ flex: 1 }}>
          <Text style={styles.allName} numberOfLines={1}>{t.any_topic}</Text>
          <Text style={styles.allSub} numberOfLines={1}>{t.any_topic_sub}</Text>
        </View>
        <Check active={allActive} color={colors.cyan} size={22} />
      </Pressable>

      <View style={styles.grid}>
        {categories.map((c) => {
          const active = selected.has(c.id);
          return (
            <Pressable
              key={c.id}
              testID={`chip-${c.id}`}
              onPress={() => onToggle(c.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${c.name}, ${countFor(c)}`}
              style={[
                styles.tile,
                active && {
                  borderColor: c.color + "AA",
                  backgroundColor: c.color + "18",
                  boxShadow: `0px 0px 18px ${c.color}55, 0px 8px 22px ${c.color}33` as any,
                },
              ]}
            >
              <View pointerEvents="none" style={styles.tileHighlight} />
              <View style={styles.orbWrap}>
                <CategoryOrb id={c.id} size={50} active={active} />
                {active ? (
                  <View style={[styles.badge, { backgroundColor: catGradient(c.id)[1], borderColor: colors.surface }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <Text style={styles.tileName} numberOfLines={2}>{c.name}</Text>
              <Text style={styles.tileCount} numberOfLines={1}>{countFor(c)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Check({ active, color, size = 18 }: { active: boolean; color: string; size?: number }) {
  const styles = useStyles();
  return active ? (
    <Ionicons name="checkmark-circle" size={size} color={color} />
  ) : (
    <View style={[styles.emptyCheck, { width: size, height: size, borderRadius: size / 2 }]} />
  );
}

const useStyles = makeStyles((colors) => ({
  allCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 68,
    borderRadius: radius.lg, marginBottom: spacing.md,
    backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder,
    boxShadow: `0px 6px 18px ${colors.glassShadow}` as any,
  },
  allOrb: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  allName: { color: colors.onSurface, fontFamily: typography.bodyBold, fontSize: 16 },
  allSub: { color: colors.muted, fontFamily: typography.body, fontSize: 12, marginTop: 2 },
  emptyCheck: { borderWidth: 1.5, borderColor: colors.borderStrong },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    width: "31.5%", alignItems: "center", justifyContent: "flex-start", gap: 6,
    minHeight: 104, paddingVertical: spacing.md, paddingHorizontal: 6,
    borderRadius: radius.lg,
    backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder,
    boxShadow: `0px 8px 20px ${colors.glassShadow}` as any,
  },
  tileHighlight: {
    position: "absolute", top: 0, left: 12, right: 12, height: 1.2,
    backgroundColor: colors.glassHighlight, opacity: 0.5, borderRadius: 1,
  },
  tileOrb: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  orbWrap: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center", borderWidth: 2,
  },
  tileName: { color: colors.onSurface, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 15, textAlign: "center" },
  tileCount: { color: colors.muted, fontFamily: typography.body, fontSize: 10, lineHeight: 12, textAlign: "center", marginTop: "auto" },
}));
