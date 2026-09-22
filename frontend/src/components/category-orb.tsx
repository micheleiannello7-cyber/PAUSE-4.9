// PAUSE — tassello-icona del design system. È l'unico contenitore-icona
// dell'app: quadrato arrotondato in VETRO tinto con l'accento della categoria
// (gradiente delicato semi-trasparente), riflesso frosted in alto, bordo
// sottile luminoso e glow morbido. Glyph outline bianco, stesso tratto ovunque.
// Usato in grid, tiles home, cover storie, card modalità e "qualsiasi argomento".
import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import Ionicons from "@react-native-vector-icons/ionicons";

import { withAlpha, useTheme } from "@/src/theme";
import { catVisual, IconSet } from "@/src/categories";

// Bordo/riflesso bianco: sta sopra un gradiente colorato, identico in ogni tema.
const EDGE = "rgba(255,255,255,0.38)";

// Glyph di categoria (senza contenitore): stesso set/tratto ovunque.
export function CatGlyph({ id, size, color }: { id?: string; size: number; color: string }) {
  const v = catVisual(id);
  return v.set === "ion" ? (
    <Ionicons name={v.glyph as any} size={size} color={color} />
  ) : (
    <MaterialDesignIcons name={v.glyph as any} size={size} color={color} />
  );
}

export function GradientOrb({
  gradient,
  glyph,
  set = "mdi",
  size = 46,
  radiusOverride,
  active = false,
  glyphColor = "#FFFFFF",
  glyphScale = 0.56,
  style,
}: {
  gradient: [string, string];
  glyph: string;
  set?: IconSet;
  size?: number;
  radiusOverride?: number;
  active?: boolean;
  glyphColor?: string;
  glyphScale?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { scheme } = useTheme();
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
          boxShadow: `0px ${Math.round(size * 0.12)}px ${Math.round(size * 0.44)}px ${withAlpha(
            gradient[1],
            active ? (isDark ? 0.72 : 0.42) : (isDark ? 0.55 : 0.28),
          )}` as any,
        },
        style,
      ]}
    >
      {/* Base: gradiente d'accento pieno e vivido, diagonale (icona iOS "squircle"). */}
      <LinearGradient
        colors={[gradient[0], gradient[1]]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Riflesso lucido concentrato in alto-sinistra: dà il volume "vetro liquido". */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.60)", "rgba(255,255,255,0.14)", "rgba(255,255,255,0)"]}
        locations={[0, 0.34, 0.56]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.55, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Profondità: ombra interna morbida in basso → l'icona "sporge". */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.24)"]}
        locations={[0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Bordo luminoso sottile + linea di riflesso sul bordo superiore. */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1, borderColor: EDGE }]}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute", top: 1, left: r * 0.55, right: r * 0.55, height: 1,
          backgroundColor: "rgba(255,255,255,0.65)", borderRadius: 1,
        }}
      />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {set === "ion" ? (
          <Ionicons name={glyph as any} size={iconSize} color={glyphColor} />
        ) : (
          <MaterialDesignIcons name={glyph as any} size={iconSize} color={glyphColor} />
        )}
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
      set={v.set}
      size={size}
      radiusOverride={radiusOverride}
      active={active}
      glyphScale={glyphScale}
      style={style}
    />
  );
}
