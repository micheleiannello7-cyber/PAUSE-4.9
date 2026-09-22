// PAUSE — tassello-icona del design system. È l'unico contenitore-icona
// dell'app: quadrato arrotondato in VETRO tinto con l'accento della categoria
// (gradiente delicato semi-trasparente), riflesso frosted in alto, bordo
// sottile luminoso e glow morbido. Glyph outline bianco, stesso tratto ovunque.
// Usato in grid, tiles home, cover storie, card modalità e "qualsiasi argomento".
import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";

import { withAlpha, useTheme } from "@/src/theme";
import { catVisual } from "@/src/categories";

// Bordo/riflesso bianco: sta sopra un gradiente colorato, identico in ogni tema.
const EDGE = "rgba(255,255,255,0.34)";
const SHEEN = "rgba(255,255,255,0.42)";

export function GradientOrb({
  gradient,
  glyph,
  size = 46,
  radiusOverride,
  active = false,
  glyphColor = "#FFFFFF",
  glyphScale = 0.56,
  style,
}: {
  gradient: [string, string];
  glyph: string;
  size?: number;
  radiusOverride?: number;
  active?: boolean;
  glyphColor?: string;
  glyphScale?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, scheme } = useTheme();
  const isDark = scheme === "dark";
  const r = radiusOverride ?? Math.round(size * 0.3);
  const iconSize = Math.round(size * glyphScale);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: r,
          overflow: "hidden",
          boxShadow: `0px ${Math.round(size * 0.1)}px ${Math.round(size * 0.4)}px ${withAlpha(
            gradient[1],
            active ? (isDark ? 0.42 : 0.3) : (isDark ? 0.26 : 0.18),
          )}` as any,
        },
        style,
      ]}
    >
      {/* Base vetro, poi tinta d'accento semi-trasparente: la luce attraversa il vetro. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBgStrong }]} />
      <LinearGradient
        colors={[withAlpha(gradient[0], isDark ? 0.86 : 0.92), withAlpha(gradient[1], isDark ? 0.72 : 0.85)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[SHEEN, "rgba(255,255,255,0)"]}
        locations={[0, 0.58]}
        style={StyleSheet.absoluteFill}
      />
      {/* Luce dal basso, molto leggera: "illuminato dall'interno". */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0)", withAlpha(gradient[0], active ? 0.35 : 0.18)]}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1, borderColor: EDGE }]}
      />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <MaterialDesignIcons name={glyph as any} size={iconSize} color={glyphColor} />
      </View>
    </View>
  );
}

export function CategoryOrb({
  id,
  size = 46,
  radiusOverride,
  active = false,
  glyphScale = 0.56,
  style,
}: {
  id?: string;
  size?: number;
  radiusOverride?: number;
  active?: boolean;
  glyphScale?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = catVisual(id);
  return (
    <GradientOrb
      gradient={v.gradient}
      glyph={v.glyph}
      size={size}
      radiusOverride={radiusOverride}
      active={active}
      glyphScale={glyphScale}
      style={style}
    />
  );
}
