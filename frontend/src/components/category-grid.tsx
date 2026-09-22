import { useState } from "react";
import { View, Text, LayoutChangeEvent } from "react-native";
import { Category } from "@/src/api";
import { makeStyles, useTheme, spacing, typography } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { CategoryOrb, GradientOrb } from "@/src/components/category-orb";
import { catGradient } from "@/src/categories";
import { GlassPressable, GlassCheck } from "@/src/components/glass/cards";

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

const GAP = 10;
const COLS = 3;
const TILE_RADIUS = 22;

// Glass picker: a full-width "any topic" card on top, then a regular
// 3-column grid of frosted tiles (icon orb → name → count, chevron that turns
// into an animated check). Selection tints border/glow in the category colour.
// `compact` is accepted for API compatibility; the layout is the same everywhere.
export function CategoryGrid({
  categories, selected, onToggle, modes,
}: { categories: Category[]; selected: Set<string>; onToggle: (id: string) => void; compact?: boolean; modes?: ("stories" | "lessons")[] }) {
  const allActive = selected.has(ALL_ID);
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const [gridW, setGridW] = useState(0);
  const tileW = gridW > 0 ? Math.floor((gridW - GAP * (COLS - 1)) / COLS) : undefined;

  // Count label reflects which content modes are active (curiosities / lessons
  // / both) so the numbers match what the user will actually receive.
  const showStories = !modes || modes.includes("stories");
  const showLessons = !!modes && modes.includes("lessons");
  const countFor = (c: Category): string => {
    if (showStories && showLessons) return `${c.story_count + c.lesson_count} ${t.items_n}`;
    if (showLessons && !showStories) return `${c.lesson_count} ${t.lessons_n}`;
    return `${c.story_count} ${t.stories_n}`;
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w && w !== gridW) setGridW(w);
  };

  return (
    <View testID="category-grid" onLayout={onLayout}>
      <GlassPressable
        testID="chip-all"
        onPress={() => onToggle(ALL_ID)}
        active={allActive}
        accentColor={colors.cyan}
        blur
        radius={TILE_RADIUS}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: allActive }}
        accessibilityLabel={t.any_topic}
        style={styles.allCard}
        contentStyle={styles.allContent}
      >
        <GradientOrb gradient={[colors.cyanSoft, colors.cyan]} glyph="all-inclusive" size={48} radiusOverride={16} active={allActive} />
        <View style={{ flex: 1 }}>
          <Text style={styles.allName} numberOfLines={1}>{t.any_topic}</Text>
          <Text style={styles.allSub} numberOfLines={1}>{t.any_topic_sub}</Text>
        </View>
        <GlassCheck active={allActive} color={colors.cyanSoft} size={24} />
      </GlassPressable>

      <View style={styles.grid}>
        {categories.map((c) => {
          const active = selected.has(c.id);
          const accent = catGradient(c.id)[0];
          return (
            <GlassPressable
              key={c.id}
              testID={`chip-${c.id}`}
              onPress={() => onToggle(c.id)}
              active={active}
              accentColor={accent}
              radius={TILE_RADIUS}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${c.name}, ${countFor(c)}`}
              style={tileW ? { width: tileW } : styles.tileFallback}
              contentStyle={styles.tileContent}
            >
              <View style={styles.tileTop}>
                <CategoryOrb id={c.id} size={44} active={active} />
                <GlassCheck active={active} color={accent} size={20} idle="chevron" />
              </View>
              <Text style={[styles.tileName, active && { color: colors.onSurface }]} numberOfLines={2}>{c.name}</Text>
              <Text style={styles.tileCount} numberOfLines={1}>{countFor(c)}</Text>
            </GlassPressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  allCard: { marginBottom: spacing.md },
  allContent: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 78,
  },
  allName: { color: colors.onSurface, fontFamily: typography.bodyBold, fontSize: 16 },
  allSub: { color: colors.muted, fontFamily: typography.body, fontSize: 12.5, marginTop: 2 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tileFallback: { width: "31%" },
  tileContent: {
    minHeight: 132, padding: spacing.md, paddingBottom: spacing.md + 2, gap: 4,
  },
  tileTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: spacing.sm },
  tileName: { color: colors.onSurfaceSecondary, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 17 },
  tileCount: { color: colors.muted, fontFamily: typography.body, fontSize: 11, lineHeight: 14, marginTop: "auto" },
}));
