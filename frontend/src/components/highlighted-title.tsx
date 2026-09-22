import { Text, TextStyle, StyleProp } from "react-native";
import { useTheme, typography } from "@/src/theme";

// Renders a title where matching words are colored with brand hue.
export function HighlightedTitle({
  title,
  highlight,
  style,
  highlightColor,
  highlightStyle,
  numberOfLines,
}: {
  title: string;
  highlight: string[];
  style?: StyleProp<TextStyle>;
  highlightColor?: string;
  highlightStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  const hc = highlightColor ?? colors.brand;
  const set = new Set(highlight.map((w) => w.toLowerCase()));
  const tokens = title.split(/(\s+)/); // keep spaces
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {tokens.map((t, i) => {
        const stripped = t.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        const isMatch = stripped.length > 0 && set.has(stripped);
        return (
          <Text
            key={i}
            style={isMatch ? [{ color: hc, fontFamily: typography.displayBold }, highlightStyle] : undefined}
          >
            {t}
          </Text>
        );
      })}
    </Text>
  );
}
