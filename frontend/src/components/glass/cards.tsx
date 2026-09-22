// PAUSE — Glass design system: primitive INTERATTIVE e di sfondo.
//
//   • GlassBackdrop  — fondo "dark cinematic": bokeh notturno sfocato (luci
//                      cyan/blu a destra, calde in basso) su blu notte
//   • GlassPressable — card vetro selezionabile: tinta blu-notte traslucida,
//                      bordo azzurrino, sheen; da attiva la luce d'accento
//                      attraversa il vetro (bordo + glow esterno + luce interna)
//   • GlassCheck     — selettore: anello sottile → disco cyan con check animato
//   • GlassCTA       — pulsante primario premium: vetro + gradiente cyan/viola
//
// Stesso linguaggio del pulsante "Ascolta" della reading screen.

import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleProp, ViewStyle, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Ellipse } from "react-native-svg";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  ZoomIn,
  ZoomOut,
  Easing,
} from "react-native-reanimated";

import { withAlpha, spacing, typography } from "@/src/theme";
import { useGlassPalette } from "@/src/components/glass";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// Bordo bianco sopra superfici colorate: identico in tema chiaro e scuro.
const WHITE_BORDER = "rgba(255,255,255,0.30)";
const BOKEH = require("../../../assets/images/glass-bokeh.jpg");

function Sheen({ radius: r, strength = 1 }: { radius: number; strength?: number }) {
  const { colors } = useGlassPalette();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[colors.glassSheen, "transparent"]}
      locations={[0, 0.62]}
      style={[StyleSheet.absoluteFill, { borderRadius: r, opacity: strength }]}
    />
  );
}

// --- GlassBackdrop --------------------------------------------------------

export function GlassBackdrop({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors, isDark } = useGlassPalette();
  if (isDark) {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden", backgroundColor: colors.surface }, style]}>
        <Image source={BOKEH} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" transition={300} />
        {/* Scrim leggero: tiene i testi leggibili senza spegnere il bokeh. */}
        <LinearGradient
          colors={[withAlpha(colors.surface, 0.70), withAlpha(colors.surface, 0.38), withAlpha(colors.surface, 0.50)]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }
  // Tema chiaro: luce ambientale diffusa su superficie chiara.
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }, style]}>
      <LinearGradient colors={[colors.surface, colors.surfaceDeep, colors.surface]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="pause-bd-cyan" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.cyan} stopOpacity={0.12} />
            <Stop offset="1" stopColor={colors.cyan} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="pause-bd-violet" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.brandSecondary} stopOpacity={0.10} />
            <Stop offset="1" stopColor={colors.brandSecondary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="92" cy="8" rx="85" ry="42" fill="url(#pause-bd-cyan)" />
        <Ellipse cx="4" cy="60" rx="80" ry="40" fill="url(#pause-bd-violet)" />
      </Svg>
    </View>
  );
}

// --- GlassPressable -------------------------------------------------------

type GlassPressableProps = {
  onPress?: () => void;
  active?: boolean;
  accentColor?: string;      // colore di bordo/glow da attiva (default cyan)
  activeStrength?: number;   // 1 = card modalità / "tutto"; ~0.75 tile categorie
  accentIdle?: boolean;      // anche da inattiva: bordo e glow nel colore dell'icona
  lightFrom?: string;        // luce laterale costante che entra da sinistra (icona luminosa)
  radius?: number;
  blur?: boolean;            // backdrop blur reale (costoso: usare su poche card)
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
  accessibilityRole?: "button" | "checkbox" | "switch";
  accessibilityState?: { checked?: boolean; disabled?: boolean };
  accessibilityLabel?: string;
};

export function GlassPressable({
  onPress,
  active = false,
  accentColor,
  activeStrength = 1,
  accentIdle = false,
  lightFrom,
  radius: r = 22,
  blur = false,
  disabled,
  style,
  contentStyle,
  children,
  testID,
  accessibilityRole = "button",
  accessibilityState,
  accessibilityLabel,
}: GlassPressableProps) {
  const { colors, tint, isDark } = useGlassPalette();
  const accent = accentColor ?? colors.cyan;
  const k = activeStrength;
  const scale = useSharedValue(1);
  const sel = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    sel.value = withTiming(active ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [active, sel]);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const selStyle = useAnimatedStyle(() => ({ opacity: sel.value }));

  const onIn = () => { scale.value = withTiming(0.965, { duration: 90 }); };
  const onOut = () => { scale.value = withSpring(1, { damping: 14, stiffness: 260 }); };

  return (
    <View style={[{ borderRadius: r }, style]}>
      {/* Glow esterno nel colore d'accento: dietro la card, così non viene tagliato. */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: r,
            boxShadow: `0px 0px 26px 2px ${withAlpha(accent, (isDark ? 0.42 : 0.26) * k)}, 0px 12px 30px ${withAlpha(accent, (isDark ? 0.26 : 0.14) * k)}` as any,
          },
          selStyle,
        ]}
      />
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        disabled={disabled}
        testID={testID}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        accessibilityLabel={accessibilityLabel}
        style={[
          {
            borderRadius: r,
            overflow: "hidden",
            boxShadow: accentIdle
              ? (`0px 0px 18px ${withAlpha(accent, isDark ? 0.22 : 0.14)}, 0px 12px 28px ${colors.glassShadow}` as any)
              : (`0px 12px 28px ${colors.glassShadow}` as any),
          },
          scaleStyle,
        ]}
      >
        {blur ? (
          <BlurView
            intensity={14}
            tint={tint}
            experimentalBlurMethod="dimezisBlurView"
            style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          />
        ) : null}
        {/* Vetro smerigliato: opacatura frosted (tinta blu-notte + velo bianco), poca sfocatura. */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: r, backgroundColor: colors.glassTint }]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[colors.glassFrost, withAlpha(colors.surface, isDark ? 0.22 : 0)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
        />
        <Sheen radius={r} strength={1} />
        {lightFrom ? (
          <LinearGradient
            pointerEvents="none"
            colors={[withAlpha(lightFrom, isDark ? 0.22 : 0.16), withAlpha(lightFrom, 0)]}
            locations={[0, 0.55]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          />
        ) : null}
        {/* Strato "attivo": luce d'accento che attraversa il vetro + bordo luminoso. */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, selStyle]}>
          <LinearGradient
            colors={[withAlpha(accent, (isDark ? 0.40 : 0.26) * k), withAlpha(accent, (isDark ? 0.16 : 0.10) * k), withAlpha(accent, (isDark ? 0.22 : 0.14) * k)]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          />
          {/* Luce che risale dal basso: "illuminata dall'interno". */}
          <LinearGradient
            colors={["transparent", withAlpha(accent, (isDark ? 0.30 : 0.16) * k)]}
            locations={[0.5, 1]}
            style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          />
          <View
            style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1.5, borderColor: withAlpha(accent, isDark ? 0.92 : 0.7) }]}
          />
        </Animated.View>
        {accentIdle ? (
          // Luce del colore dell'icona che entra dal bordo (in alto a sinistra) e sfuma.
          <LinearGradient
            pointerEvents="none"
            colors={[withAlpha(accent, isDark ? 0.16 : 0.10), withAlpha(accent, 0)]}
            locations={[0, 0.7]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          />
        ) : null}
        {/* Bordo base (sempre presente, sotto quello attivo): azzurrino, o nel colore dell'icona. */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1, borderColor: accentIdle ? withAlpha(accent, isDark ? 0.45 : 0.35) : colors.glassTintBorder }]}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute", top: 0, left: 16, right: 16, height: 1,
            backgroundColor: colors.glassHighlight, opacity: isDark ? 0.9 : 0.9, borderRadius: 1,
          }}
        />
        <View style={contentStyle}>{children}</View>
      </AnimatedPressable>
    </View>
  );
}

// --- GlassCheck -----------------------------------------------------------
// Da inattivo: anello sottile semi-trasparente (o chevron discreto). Da attivo:
// disco cyan luminoso con check bianco che "sboccia" con una piccola animazione.

export function GlassCheck({
  active,
  color,
  size = 22,
  idle = "ring",
  testID,
}: { active: boolean; color?: string; size?: number; idle?: "ring" | "chevron"; testID?: string }) {
  const { colors, isDark } = useGlassPalette();
  const c = color ?? colors.cyan;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} testID={testID}>
      {active ? (
        <Animated.View
          key="on"
          entering={ZoomIn.duration(220).easing(Easing.out(Easing.back(1.6)))}
          exiting={ZoomOut.duration(140)}
          style={{
            width: size, height: size, borderRadius: size / 2, overflow: "hidden",
            alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: WHITE_BORDER,
            boxShadow: `0px 0px 14px ${withAlpha(c, isDark ? 0.7 : 0.4)}` as any,
          }}
        >
          <LinearGradient colors={[withAlpha("#FFFFFF", 0.35), withAlpha("#FFFFFF", 0)]} locations={[0, 0.6]} style={[StyleSheet.absoluteFill, { backgroundColor: c }]} />
          <Ionicons name="checkmark" size={Math.round(size * 0.62)} color="#FFFFFF" />
        </Animated.View>
      ) : idle === "chevron" ? (
        <Ionicons name="chevron-forward" size={Math.round(size * 0.78)} color={withAlpha(colors.onSurface, isDark ? 0.55 : 0.45)} />
      ) : (
        <View
          style={{
            width: size, height: size, borderRadius: size / 2,
            borderWidth: 1.5, borderColor: colors.glassRing,
          }}
        />
      )}
    </View>
  );
}

// --- GlassCTA -------------------------------------------------------------

type CTAProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string | null;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function GlassCTA({
  label, onPress, disabled, loading, icon = "arrow-forward", height = 54, style, testID,
}: CTAProps) {
  const { colors, tint, isDark } = useGlassPalette();
  const r = height / 2;
  const scale = useSharedValue(1);
  const on = useSharedValue(disabled ? 0 : 1);

  React.useEffect(() => {
    on.value = withTiming(disabled ? 0 : 1, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [disabled, on]);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: on.value }));
  const tintStyle = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * on.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: 0.55 + 0.45 * on.value }));

  const onIn = () => { scale.value = withTiming(0.97, { duration: 90 }); };
  const onOut = () => { scale.value = withSpring(1, { damping: 14, stiffness: 260 }); };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <View style={[{ borderRadius: r }, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute", top: 4, left: 6, right: 6, bottom: -2, borderRadius: r,
            boxShadow: `0px 0px 30px 2px ${colors.cyanGlow}, 0px 14px 30px ${withAlpha(colors.brandSecondary, isDark ? 0.32 : 0.2)}` as any,
          },
          glowStyle,
        ]}
      />
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={onIn}
        onPressOut={onOut}
        disabled={disabled || loading}
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        style={[{ height, borderRadius: r, overflow: "hidden" }, scaleStyle]}
      >
        <BlurView
          intensity={44}
          tint={tint}
          experimentalBlurMethod="dimezisBlurView"
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: r, backgroundColor: colors.glassTint }]}
        />
        {/* Vetro tinto: viola → blu → cyan; la luce attraversa il vetro scuro. */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, tintStyle]}>
          <LinearGradient
            colors={[
              withAlpha(colors.brandSecondary, isDark ? 0.52 : 0.74),
              withAlpha(colors.brandSecondary, isDark ? 0.30 : 0.56),
              withAlpha(colors.cyan, isDark ? 0.46 : 0.74),
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          />
          <LinearGradient
            colors={["transparent", withAlpha(colors.cyan, isDark ? 0.28 : 0.16)]}
            locations={[0.4, 1]}
            style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          />
        </Animated.View>
        <Sheen radius={r} strength={0.9} />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1.2, borderColor: withAlpha(colors.cyanSoft, isDark ? 0.55 : 0.5) }]}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute", top: 0, left: height * 0.5, right: height * 0.5, height: 1.2,
            backgroundColor: colors.glassHighlight, opacity: 0.9, borderRadius: 1,
          }}
        />
        <Animated.View
          style={[
            {
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: spacing.sm + 2, paddingHorizontal: spacing.lg,
            },
            contentStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.onGradient} />
          ) : (
            <>
              <Text style={{ color: colors.onGradient, fontFamily: typography.bodyBold, fontSize: 16, letterSpacing: 0.2, textShadowColor: colors.cyanGlow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                {label}
              </Text>
              {icon ? <Ionicons name={icon as any} size={18} color={colors.onGradient} /> : null}
            </>
          )}
        </Animated.View>
      </AnimatedPressable>
    </View>
  );
}
