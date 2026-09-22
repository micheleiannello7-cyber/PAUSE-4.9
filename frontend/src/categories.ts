// PAUSE — Identità visiva centralizzata delle categorie.
//
// Un solo linguaggio iconografico: glyph OUTLINE (stesso spessore di tratto,
// stessa geometria) dentro un tassello vetro arrotondato con accento cromatico
// per categoria. Tutto il resto dell'app risolve l'aspetto di una categoria da
// qui tramite `catVisual(id)` / `<CategoryOrb id=.. />`, così icone e colori
// restano coerenti ovunque (grid, home, cover storie, tag).
export type IconSet = "mdi" | "ion";
export type CatVisual = { gradient: [string, string]; glyph: string; set?: IconSet };

export const CATEGORY_VISUALS: Record<string, CatVisual> = {
  scienza: { gradient: ["#3B9BFF", "#1E4BFF"], glyph: "atom" },
  spazio: { gradient: ["#B45CFF", "#6A2BFF"], glyph: "planet-outline", set: "ion" },
  tecnologia: { gradient: ["#22E0FF", "#0A8CFF"], glyph: "memory" },
  natura: { gradient: ["#4CE07A", "#0FA958"], glyph: "sprout-outline" },
  animali: { gradient: ["#FFB347", "#FF6A00"], glyph: "paw" },
  storia: { gradient: ["#FF9F3D", "#E0561A"], glyph: "bank-outline" },
  psicologia: { gradient: ["#FF6FC0", "#C21FA8"], glyph: "brain" },
  "corpo-umano": { gradient: ["#FF5F7E", "#F0005E"], glyph: "heart-pulse" },
  cultura: { gradient: ["#4FC3FF", "#2A6CFF"], glyph: "book-open-variant-outline" },
  curiosita: { gradient: ["#B47CFF", "#6A2BFF"], glyph: "lightbulb-on-outline" },
  economia: { gradient: ["#FFD23F", "#FF9500"], glyph: "chart-line" },
  arte: { gradient: ["#FF7AE0", "#B33BFF"], glyph: "palette-outline" },
  geografia: { gradient: ["#4FC3FF", "#2A6CFF"], glyph: "compass-outline" },
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
