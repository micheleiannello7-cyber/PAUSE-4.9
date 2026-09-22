// PAUSE — cover of a story wherever a hero image appears (home card, preview,
// deep-dive, thumbnails). Uses the photo when the story has one, otherwise a
// branded gradient tinted with the category colour and its icon.
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { StoryPreview, hasHero, heroUrl } from "@/src/api";
import { makeStyles } from "@/src/theme";
import { CategoryOrb } from "@/src/components/category-orb";
import { catGradient } from "@/src/categories";

export function StoryHero({
  story, style, iconSize = 64, transition = 200,
}: {
  story: StoryPreview;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  transition?: number;
}) {
  const styles = useStyles();
  if (hasHero(story)) {
    return <Image source={{ uri: heroUrl(story) }} style={style} contentFit="cover" transition={transition} />;
  }
  const [g0, g1] = catGradient(story.category_id);
  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[g0 + "59", g1 + "26", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <CategoryOrb id={story.category_id} size={Math.round(iconSize * 1.7)} glyphScale={0.56} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.surfaceTertiary,
  },
}));
