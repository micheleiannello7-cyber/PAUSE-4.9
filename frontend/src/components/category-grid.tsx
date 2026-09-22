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

const GAP = 12;
const COLS = 3;
const TILE_RADIUS = 20;
const TILE_H = 104;
// Nessun blur sulle tile: vetro limpido, il fondo passa nitido.
const TILE_BLUR = false;

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
        lightFrom={colors.cyan}
        radius={TILE_RADIUS}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: allActive }}
        accessibilityLabel={t.any_topic}
        style={styles.allCard}
        contentStyle={styles.allContent}
      >
        <GradientOrb gradient={[colors.cyanSoft, colors.cyan]} glyph="all-inclusive" size={44} radiusOverride={14} active={allActive} />
        <View style={{ flex: 1 }}>
          <Text style={styles.allName} numberOfLines={1}>{t.any_topic}</Text>
          <Text style={styles.allSub} numberOfLines={1}>{t.any_topic_sub}</Text>
        </View>
        <GlassCheck active={allActive} color={colors.cyanSoft} size={22} />
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
              activeStrength={0.7}
              accentIdle
              blur={TILE_BLUR}
              radius={TILE_RADIUS}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${c.name}, ${countFor(c)}`}
              style={tileW ? { width: tileW } : styles.tileFallback}
              contentStyle={styles.tileContent}
            >
              <CategoryOrb id={c.id} size={36} radiusOverride={11} active={active} />
              <View style={styles.tileTexts}>
                <Text style={styles.tileName} numberOfLines={2}>{c.name}</Text>
                <Text style={styles.tileCount} numberOfLines={1}>{countFor(c)}</Text>
              </View>
              {active ? (
                <View style={styles.tileBadge}>
                  <GlassCheck active color={accent} size={16} />
                </View>
              ) : null}
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
    paddingHorizontal: spacing.md + 2, paddingVertical: spacing.md, minHeight: 72,
  },
  allName: { color: colors.onSurface, fontFamily: typography.bodyBold, fontSize: 15.5 },
  allSub: { color: colors.muted, fontFamily: typography.body, fontSize: 12.5, marginTop: 2 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tileFallback: { width: "31%" },
  // Altezza FISSA: tutte le tile identiche anche se il nome va su due righe.
  tileContent: {
    height: TILE_H, paddingHorizontal: 8, paddingTop: 10, paddingBottom: 9,
    alignItems: "center", justifyContent: "flex-start",
  },
  tileTexts: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 5, gap: 1 },
  tileName: { color: colors.onSurface, fontFamily: typography.bodyBold, fontSize: 12.5, lineHeight: 15, textAlign: "center" },
  tileCount: { color: colors.muted, fontFamily: typography.body, fontSize: 10.5, lineHeight: 13, textAlign: "center" },
  tileBadge: { position: "absolute", top: 7, right: 7 },
}));
