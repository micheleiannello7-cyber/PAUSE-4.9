import { useState, useCallback, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, Easing,
} from "react-native-reanimated";

import { api, StoryPreview, Category } from "@/src/api";
import { makeStyles, useTheme, spacing, radius, typography } from "@/src/theme";
import { useUserId } from "@/src/session";
import { LimitBadge } from "@/src/components/limit-badge";
import { getReadingProgress, ReadingProgress } from "@/src/reading-progress";
import { HighlightedTitle } from "@/src/components/highlighted-title";
import { PauseLogo } from "@/src/components/pause-logo";
import { GradientButton } from "@/src/components/gradient-button";
import { StoryHero } from "@/src/components/story-hero";
import { CategoryTag, MetaPill } from "@/src/components/reader-meta";
import { KindBadge } from "@/src/components/kind-badge";
import { PagerDots } from "@/src/components/pager";
import { GlassSurface, GlassIconButton, GlassPill } from "@/src/components/glass";
import { CategoryOrb } from "@/src/components/category-orb";
import { catGradient } from "@/src/categories";
import { useI18n } from "@/src/i18n";
import { CoachTip } from "@/src/coach-tips";

const { width } = Dimensions.get("window");
// Soglie swipe: più permissive per un riconoscimento facile e affidabile.
// Basta uno spostamento breve OPPURE un flick veloce per cambiare curiosità.
const SWIPE_THRESHOLD = 55;
const SWIPE_VELOCITY = 450;
// Card dietro (mazzo): leggermente più piccola e spostata in basso così spunta sotto.
const DECK_SCALE = 0.95;
const DECK_OFFSET = 28;
// Deck position dots: cap the row so a long skipping streak stays tidy.
const MAX_DOTS = 8;

function safeHaptic() {
  try {
    Haptics.selectionAsync().catch(() => {});
  } catch {}
}

export default function Discover() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useUserId();
  const { t, lang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();

  const { data: userState } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.user(userId!),
    enabled: !!userId,
  });

  const interests = useMemo(
    () => userState?.interests?.filter((i) => i !== "all") ?? [],
    [userState?.interests],
  );
  // Tap a category tile under the deck to focus the surprises on it only.
  const [focusCat, setFocusCat] = useState<string | null>(null);
  const deckInterests = useMemo(() => (focusCat ? [focusCat] : interests), [focusCat, interests]);
  const interestsKey = deckInterests.join(",");
  const ready = !!userId && !!userState;

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.categories });

  // --- Resume reading card -------------------------------------------------
  const [resume, setResume] = useState<ReadingProgress | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      getReadingProgress(userId).then(setResume);
    }, [userId]),
  );
  const completedIds = userState?.completed_story_ids ?? [];
  const showResume =
    !!resume && resume.progress < 0.95 && !completedIds.includes(resume.story.id);

  // --- Story deck (history with forward / back) ----------------------------
  const [deck, setDeck] = useState<StoryPreview[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  // Reset the deck when the audience (user / interests / language) changes.
  useEffect(() => {
    if (!ready) return;
    setDeck([]);
    setCursor(0);
    setExhausted(false);
    setError(false);
  }, [ready, userId, interestsKey, lang]);

  const loadMore = useCallback(
    async (excludeIds: string[]) => {
      if (!userId) return;
      setLoading(true);
      try {
        const s = await api.discoverNext(userId, deckInterests, excludeIds);
        setDeck((prev) => (prev.some((x) => x.id === s.id) ? prev : [...prev, s]));
        setError(false);
      } catch {
        if (excludeIds.length === 0) setError(true);
        else setExhausted(true);
      } finally {
        setLoading(false);
      }
    },
    [userId, deckInterests],
  );

  // Keep exactly one story prefetched ahead so "next" feels instant.
  useEffect(() => {
    if (!ready || exhausted || loading || error) return;
    if (deck.length === 0 || cursor >= deck.length - 1) {
      void loadMore(deck.map((s) => s.id));
    }
  }, [ready, exhausted, loading, error, deck, cursor, loadMore]);

  const current = deck[cursor];
  const canPrev = cursor > 0;
  const canNext = cursor < deck.length - 1;

  // --- Animated swap -------------------------------------------------------
  // La card corrente scorre via; sotto c'è già la prossima (o la precedente)
  // che cresce fino a piena dimensione: effetto "mazzo di carte". A fine
  // animazione il cursore cambia e tx torna a 0 senza slide-in.
  const tx = useSharedValue(0);
  const pressed = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.08,
    transform: [
      { translateX: tx.value },
      { rotateZ: `${(tx.value / width) * 3}deg` },
    ],
  }));
  const nextBehindStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.abs(tx.value) / width, 1);
    return {
      opacity: tx.value <= 0 ? 0.75 + 0.25 * p : 0,
      transform: [{ translateY: (1 - p) * DECK_OFFSET }, { scale: DECK_SCALE + (1 - DECK_SCALE) * p }],
    };
  });
  const prevBehindStyle = useAnimatedStyle(() => {
    const p = Math.min(Math.abs(tx.value) / width, 1);
    return {
      opacity: tx.value > 0 ? 0.75 + 0.25 * p : 0,
      transform: [{ translateY: (1 - p) * DECK_OFFSET }, { scale: DECK_SCALE + (1 - DECK_SCALE) * p }],
    };
  });

  const swap = useCallback(
    (dir: number, action: () => void) => {
      tx.value = withTiming(
        -dir * width,
        { duration: 200, easing: Easing.in(Easing.quad) },
        (finished) => {
          "worklet";
          if (finished) runOnJS(action)();
        },
      );
    },
    [tx],
  );

  const doNext = useCallback(() => {
    if (cursor >= deck.length - 1) return;
    safeHaptic();
    swap(1, () => { setCursor((c) => c + 1); tx.value = 0; });
  }, [cursor, deck.length, swap, tx]);

  const doPrev = useCallback(() => {
    if (cursor <= 0) return;
    safeHaptic();
    swap(-1, () => { setCursor((c) => c - 1); tx.value = 0; });
  }, [cursor, swap, tx]);

  const springBack = useCallback(() => {
    tx.value = withSpring(0, { damping: 18, stiffness: 200 });
  }, [tx]);

  const openCurrent = useCallback(() => {
    if (current) router.push(`/deep-dive/${current.id}?start=1`);
  }, [current, router]);

  // Swipe (Pan) e tap (Tap) sono in Race: appena il dito si sposta di 8px in
  // orizzontale il Pan vince e il tap viene annullato, quindi uno swipe non
  // apre più la storia per errore. Nessun Pressable nativo dentro la card:
  // il vecchio Pressable riceveva comunque il "release" a fine swipe.
  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-8, 8])
      .onUpdate((e) => {
        let x = e.translationX;
        if ((x > 0 && !canPrev) || (x < 0 && !canNext)) x = x * 0.25;
        tx.value = x;
      })
      .onEnd((e) => {
        const goNext =
          canNext &&
          (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -SWIPE_VELOCITY);
        const goPrev =
          canPrev &&
          (e.translationX > SWIPE_THRESHOLD || e.velocityX > SWIPE_VELOCITY);
        if (goNext) runOnJS(doNext)();
        else if (goPrev) runOnJS(doPrev)();
        else runOnJS(springBack)();
      })
      .onFinalize((_e, success) => {
        // Pan annullato (es. lo scroll verticale ha preso il tocco): rimetti a posto la card.
        if (!success) runOnJS(springBack)();
      });

    const tap = Gesture.Tap()
      .maxDistance(10)
      .maxDuration(400)
      .onBegin(() => { pressed.value = withTiming(1, { duration: 80 }); })
      .onFinalize(() => { pressed.value = withTiming(0, { duration: 120 }); })
      .onEnd((_e, success) => {
        if (success) runOnJS(openCurrent)();
      });

    return Gesture.Race(pan, tap);
  }, [canPrev, canNext, tx, pressed, doNext, doPrev, springBack, openCurrent]);

  const restart = () => {
    setDeck([]);
    setCursor(0);
    setExhausted(false);
    setError(false);
  };

  const firstLoading = deck.length === 0 && loading;
  const showEmpty = deck.length === 0 && (exhausted || (error && !loading));
  // Tiles under the deck: the reader's chosen categories (all of them if none picked).
  const tileCats = useMemo(() => {
    const all = categories ?? [];
    const mine = interests.length ? all.filter((c) => interests.includes(c.id)) : all;
    return mine.length ? mine : all;
  }, [categories, interests]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PauseLogo />
        <LimitBadge testID="home-limit-badge" />
      </View>

      <View style={styles.scroll}>
        {showResume && resume ? (
          <ResumeCard
            progress={resume}
            onPress={() => router.push(`/deep-dive/${resume.story.id}`)}
          />
        ) : null}

        {firstLoading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.brand} /></View>
        ) : showEmpty ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={44} color={colors.success} />
            <Text style={styles.emptyTitle}>{t.explored_all}</Text>
            <Text style={styles.emptyText}>{t.explored_all_sub}</Text>
            <GradientButton label={t.restart} icon="refresh" onPress={restart} testID="reset-skipped" style={styles.resetBtn} />
          </View>
        ) : current ? (
          <>
            <View style={styles.deckWrap}>
              {deck[cursor + 1] ? (
                <Animated.View style={[styles.behindCard, nextBehindStyle]}>
                  <FeaturedCard story={deck[cursor + 1]} behind />
                </Animated.View>
              ) : null}
              {deck[cursor - 1] ? (
                <Animated.View style={[styles.behindCard, prevBehindStyle]}>
                  <FeaturedCard story={deck[cursor - 1]} behind />
                </Animated.View>
              ) : null}
              <GestureDetector gesture={gesture}>
                <Animated.View style={[styles.currentCard, cardStyle]}>
                  <FeaturedCard story={current} />
                </Animated.View>
              </GestureDetector>
              <CoachTip id="home" text={t.tip_home} icon="hand-left-outline" style={{ top: spacing.md }} />
            </View>

            <View style={styles.navRow}>
              <NavButton
                icon="arrow-back"
                disabled={!canPrev}
                onPress={doPrev}
                testID="discover-prev"
                accessibilityLabel="previous-story"
              />
              <View style={styles.navHint}>
                <PagerDots
                  count={Math.min(deck.length, MAX_DOTS)}
                  index={cursor - Math.max(0, Math.min(cursor - (MAX_DOTS - 2), deck.length - MAX_DOTS))}
                  testID="discover-deck-dots"
                />
                <Text style={styles.navHintText}>{t.swipe_hint}</Text>
              </View>
              <NavButton
                icon="arrow-forward"
                disabled={!canNext}
                onPress={doNext}
                testID="discover-next"
                accessibilityLabel="next-story"
              />
            </View>
          </>
        ) : (
          <View style={styles.loading}><ActivityIndicator color={colors.brand} /></View>
        )}

        {tileCats.length ? (
          <View style={styles.catsSection} testID="home-categories">
            <View style={styles.catsHead}>
              <Text style={styles.catsTitle}>{t.your_categories}</Text>
              <Pressable onPress={() => router.push("/(tabs)/explore")} hitSlop={8} style={styles.seeAll} testID="home-see-all">
                <Text style={styles.seeAllText}>{t.see_all}</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
              {tileCats.map((c) => (
                <CategoryTile
                  key={c.id}
                  cat={c}
                  active={focusCat === c.id}
                  onPress={() => { safeHaptic(); setFocusCat((f) => (f === c.id ? null : c.id)); }}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Piccola tile nello stesso stile delle card categoria dell'onboarding
// (orb tinta + nome); tap = il mazzo propone solo quella categoria.
function CategoryTile({ cat, active, onPress }: { cat: Category; active: boolean; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} testID={`home-cat-${cat.id}`} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
      <GlassPill
        height={64}
        tone={active ? "accent" : "neutral"}
        accentColor={cat.color}
        style={{ width: 78, paddingHorizontal: 4, borderRadius: radius.md, flexDirection: "column", gap: 4, alignItems: "center", justifyContent: "center" }}
      >
        <View style={styles.tileOrb}>
          <CategoryOrb id={cat.id} size={30} radiusOverride={10} active={active} />
          {active ? (
            <View style={[styles.tileCheck, { backgroundColor: catGradient(cat.id)[1] }]}>
              <Ionicons name="checkmark" size={8} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <Text style={styles.tileName} numberOfLines={1}>{cat.name}</Text>
      </GlassPill>
    </Pressable>
  );
}

// Arrow button used to step forward / back through the story deck.
function NavButton({
  icon, disabled, onPress, testID, accessibilityLabel,
}: { icon: string; disabled: boolean; onPress: () => void; testID: string; accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <GlassIconButton
      onPress={onPress}
      disabled={disabled}
      size={46}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Ionicons name={icon as any} size={20} color={disabled ? colors.muted : colors.onSurface} />
    </GlassIconButton>
  );
}

function ResumeCard({ progress, onPress }: { progress: ReadingProgress; onPress: () => void }) {
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const pct = Math.round(progress.progress * 100);
  return (
    <Pressable
      onPress={onPress}
      testID="resume-reading-card"
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, marginBottom: spacing.lg }]}
    >
      <GlassSurface intensity="strong" glow glowColor={colors.cyanGlow} radiusOverride={radius.lg}>
        <View style={styles.resumeInner}>
          <View style={styles.resumeThumbWrap}>
            <StoryHero story={progress.story} style={styles.resumeThumb} iconSize={26} />
            <View style={styles.resumeThumbGlow} />
          </View>
          <View style={styles.resumeInfo}>
            <View style={styles.resumeEyebrowRow}>
              <Ionicons name="book" size={11} color={colors.cyan} />
              <Text style={styles.resumeEyebrow}>{t.resume_eyebrow}</Text>
              <View style={styles.resumePctPill}>
                <Text style={styles.resumePctText}>{pct}%</Text>
              </View>
            </View>
            <Text style={styles.resumeTitle} numberOfLines={1}>{progress.story.title}</Text>
            <View style={styles.resumeTrack}>
              <LinearGradient
                colors={[colors.cyan, colors.cyanSoft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.resumeFill, { width: `${Math.max(pct, 4)}%` }]}
              />
            </View>
          </View>
          <View style={styles.resumePlayWrap}>
            <Ionicons name="play" size={16} color={colors.cyan} />
          </View>
        </View>
      </GlassSurface>
    </Pressable>
  );
}

// Card puramente visiva: tap e swipe sono gestiti dal GestureDetector padre.
// Stesso linguaggio del lettore: la copertina riempie TUTTA la card e sfuma in
// basso in un velo scuro; sopra stanno categoria, durata, il solo titolo
// (niente descrizione) e la CTA. Il titolo non viene mai troncato: sopra una
// certa lunghezza scende di corpo e va su 3 righe.
function titleSize(title: string): { fontSize: number; lineHeight: number } {
  if (title.length <= 34) return { fontSize: 30, lineHeight: 35 };
  if (title.length <= 52) return { fontSize: 26, lineHeight: 31 };
  return { fontSize: 22, lineHeight: 27 };
}
function FeaturedCard({ story, behind }: { story: StoryPreview; behind?: boolean }) {
  const { t } = useI18n();
  const styles = useStyles();
  return (
    <View style={styles.card} testID={behind ? undefined : `story-card-${story.id}`}>
      <StoryHero story={story} style={styles.cardImg} iconSize={72} transition={250} />
      <LinearGradient
        colors={["rgba(5,7,12,0)", "rgba(5,7,12,0.25)", "rgba(5,7,12,0.7)", "rgba(5,7,12,0.96)"]}
        locations={[0.2, 0.42, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Glass ring esterno molto sottile: dà profondità e stacca la card dal fondo */}
      <View pointerEvents="none" style={styles.cardRing} />
      <View pointerEvents="none" style={styles.cardHighlight} />
      <KindBadge story={story} overlay style={styles.kindBadge} />
      <View style={styles.cardBody}>
        <View style={styles.cardMeta}>
          <CategoryTag name={story.category_name} icon={story.category_icon} color={story.category_color} categoryId={story.category_id} />
          <View style={{ flex: 1 }} />
          <MetaPill icon="time-outline" label={`${story.reading_time_min} ${t.min}`} />
        </View>
        <HighlightedTitle
          title={story.title}
          highlight={story.highlight_words}
          style={[styles.cardTitle, titleSize(story.title)]}
          numberOfLines={3}
        />
        <View style={{ pointerEvents: "none", marginTop: spacing.xs }}>
          <GradientButton label={t.read_story} icon="book-outline" onPress={() => {}} testID={behind ? undefined : "approfondisci-home"} />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  // Niente scroll: la card riempie lo spazio che resta e i tasti avanti/indietro
  // sono sempre visibili sotto, su qualsiasi telefono.
  scroll: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  catsSection: { marginTop: spacing.sm },
  catsHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  catsTitle: { color: colors.onSurface, fontFamily: typography.displayBold, fontSize: 14 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 4 },
  seeAllText: { color: colors.muted, fontFamily: typography.bodyMedium, fontSize: 12 },
  catsRow: { gap: spacing.sm, paddingRight: spacing.xl },
  tileOrb: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  tileCheck: {
    position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: 7,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.surface,
  },
  tileName: { color: colors.onSurface, fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 12, textAlign: "center" },
  loading: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  resumeInner: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: spacing.sm, paddingRight: spacing.md,
  },
  resumeThumbWrap: { position: "relative" },
  resumeThumb: { width: 58, height: 58, borderRadius: radius.md, overflow: "hidden" },
  resumeThumbGlow: {
    position: "absolute", top: -1, left: -1, right: -1, bottom: -1,
    borderRadius: radius.md + 1, borderWidth: 1, borderColor: colors.cyan + "55",
    boxShadow: `0px 0px 10px ${colors.cyanGlowSoft}` as any,
  },
  resumeInfo: { flex: 1, gap: 6 },
  resumeEyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  resumeEyebrow: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 9, letterSpacing: 1.5 },
  resumePctPill: {
    marginLeft: "auto", paddingHorizontal: 8, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.cyanGlowSoft, borderWidth: 1, borderColor: colors.cyan + "40",
  },
  resumePctText: { color: colors.cyan, fontFamily: typography.bodyBold, fontSize: 10 },
  resumeTitle: { color: colors.onSurface, fontFamily: typography.bodyBold, fontSize: 14, lineHeight: 18 },
  resumeTrack: { height: 4, borderRadius: 2, backgroundColor: colors.track, overflow: "hidden" },
  resumeFill: { height: "100%", borderRadius: 2 },
  resumePlayWrap: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.cyanGlowSoft, borderWidth: 1, borderColor: colors.cyan + "55",
    marginLeft: spacing.xs,
    boxShadow: `0px 0px 12px ${colors.cyanGlowSoft}` as any,
  },
  deckWrap: { flex: 1, maxHeight: 640, overflow: "hidden", paddingBottom: 18 },
  behindCard: { position: "absolute", top: 0, left: 0, right: 0, bottom: 18, pointerEvents: "none" },
  currentCard: { flex: 1 },
  card: {
    flex: 1, borderRadius: radius.lg + 4, overflow: "hidden", justifyContent: "flex-end",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.glassBorder,
    boxShadow: `0px 12px 32px ${colors.glassShadow}, 0px 0px 20px ${colors.cyanGlowSoft}` as any,
  },
  cardRing: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: radius.lg + 4, borderWidth: 1, borderColor: colors.glassBorderStrong,
  },
  cardHighlight: {
    position: "absolute", top: 0, left: 24, right: 24, height: 1.2,
    backgroundColor: colors.glassHighlight, opacity: 0.55, borderRadius: 1,
  },
  cardImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  kindBadge: { position: "absolute", top: spacing.md, left: spacing.md },
  cardBody: { padding: spacing.lg, gap: spacing.md },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { color: colors.onGradient, fontFamily: typography.displayBold, letterSpacing: -0.4, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 10 },
  navRow: {
    marginTop: spacing.sm,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  navHint: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  navHintText: { color: colors.muted, fontFamily: typography.bodyMedium, fontSize: 11 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: spacing.md },
  emptyTitle: { color: colors.onSurface, fontFamily: typography.displayBold, fontSize: 18 },
  emptyText: { color: colors.muted, fontFamily: typography.body, fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: spacing.lg },
  resetBtn: { alignSelf: "stretch", marginTop: spacing.sm },
}));
