// PAUSE — Identità visiva centralizzata delle categorie.
//
// Ogni categoria ha una coppia-gradiente e un glyph espressivo (Material Design
// Icons, riempiti, non "outline"). Tutto il resto dell'app risolve l'aspetto di
// una categoria da qui tramite `catVisual(id)` / `<CategoryOrb id=.. />`, così
// icone e colori restano coerenti ovunque (grid, home, cover storie, tag).
export type CatVisual = { gradient: [string, string]; glyph: string };

export const CATEGORY_VISUALS: Record<string, CatVisual> = {
  scienza: { gradient: ["#38E0FF", "#0066FF"], glyph: "atom-variant" },
  spazio: { gradient: ["#C56BFF", "#5B2BFF"], glyph: "rocket-launch" },
  tecnologia: { gradient: ["#2BE8B0", "#00A6FF"], glyph: "memory" },
  natura: { gradient: ["#5AE388", "#00A86B"], glyph: "leaf" },
  animali: { gradient: ["#FFC24D", "#FF6D00"], glyph: "paw" },
  storia: { gradient: ["#FFA24D", "#E24E00"], glyph: "bank" },
  psicologia: { gradient: ["#FF7FB2", "#B5179E"], glyph: "brain" },
  "corpo-umano": { gradient: ["#FF7285", "#FF006A"], glyph: "heart-pulse" },
  cultura: { gradient: ["#46CCFF", "#3A7BFF"], glyph: "drama-masks" },
  curiosita: { gradient: ["#D08BFF", "#7A3DFF"], glyph: "lightbulb-on" },
  economia: { gradient: ["#FFDA57", "#FF9E00"], glyph: "chart-line" },
  arte: { gradient: ["#FF86E8", "#B14BFF"], glyph: "palette" },
  geografia: { gradient: ["#5AC8FF", "#2E6BFF"], glyph: "compass" },
};

// Fallback neutro cyan (categorie aggiunte a runtime senza mappa dedicata).
const FALLBACK: CatVisual = { gradient: ["#3FE0FF", "#0B7FA6"], glyph: "shape-outline" };

export function catVisual(id?: string): CatVisual {
  return (id && CATEGORY_VISUALS[id]) || FALLBACK;
}
export function catGradient(id?: string): [string, string] {
  return catVisual(id).gradient;
}
export function catGlyph(id?: string): string {
  return catVisual(id).glyph;
}
