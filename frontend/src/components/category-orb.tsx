// PAUSE — orb-squircle a gradiente per una categoria. È l'icona categoria del
// nuovo design: tassello arrotondato con gradiente brand, riflesso frosted in
// alto, bordo luminoso e glow morbido nel colore della categoria; glyph bianco
// (leggibile in tema chiaro e scuro). Usato in grid, tiles home e cover storie.
import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";

import { withAlpha } from "@/src/theme";
import { catVisual } from "@/src/categories";

export function GradientOrb({
  gradient,
  glyph,
  size = 46,
  radiusOverride,
  active = false,
  glyphColor = "#FFFFFF",
  glyphScale = 0.52,
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
  const r = radiusOverride ?? Math.round(size * 0.3);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: r,
          overflow: "hidden",
          boxShadow: `0px ${Math.round(size * 0.12)}px ${Math.round(size * 0.44)}px ${withAlpha(
            gradient[1],
            active ? 0.62 : 0.4,
          )}` as any,
        },
        style,
      ]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Riflesso frosted dall'alto — trasforma il tassello in "vetro illuminato". */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
        locations={[0, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      {/* Bordo interno luminoso sottile. */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" }]}
      />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <MaterialDesignIcons name={glyph as any} size={Math.round(size * glyphScale)} color={glyphColor} />
      </View>
    </View>
  );
}

export function CategoryOrb({
  id,
  size = 46,
  radiusOverride,
  active = false,
  glyphScale = 0.52,
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
