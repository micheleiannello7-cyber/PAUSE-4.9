# PΛUSE — Preview attiva + Design System Glassmorphism

## Preview
- Codice PAUSE-4.7 completo copiato in `/app`; `.env` di sistema preservati
- Backend attivo su :8001, seed automatico **13 categorie · 437 storie**
- Expo/Metro attivo su :3000
- `EMERGENT_LLM_KEY` per TTS OpenAI + Object Storage; `ENFORCE_LIMIT=false`

## Bug fix — Badge minuti coerente col TTS reale
- **Prima**: badge "3 min" ma player 4:50 (seed hardcoded, non allineato al testo reale)
- **Ora**: `deep_dive_time_min` e `reading_time_min` calcolati a runtime da title+hook+capitoli+summary, con 12.5 char/s (Italian OpenAI TTS) + 1.5s pausa per capitolo + 1.5s intro, **CEIL** ai minuti pieni
- Precomputo al boot in `ensure_estimated_minutes()` → salvato come `audio_minutes_est: {it, en}` per non ripagare a ogni richiesta (i list endpoint escludono `chapters` dalla projection)
- `_localize()` fa override in output. Verificato via testing_agent: list ↔ detail coerenti IT/EN, ceil corretto su 6 storie campione

## Design System Glassmorphism
- Token vetro condivisi in `src/theme.ts`: `glassBg`, `glassBgStrong`, `glassBorder`, `glassHighlight`, `glassShadow`, `cyan`, `cyanGlow`
- Primitive in `src/components/glass/`: `GlassSurface`, `GlassPill`, `GlassIconButton`, `GlowButton` (con animazione morbida quando l'audio è attivo)
- Componenti aggiornati: reader-meta, reader-nav, home-button, IntroListenButton, gradient-button, tab bar, deep-dive top bar, story audio player styles

## Nuove UI (iterazione 2)
- **Continue Reading Ribbon**: barra vetro cyan in cima alla Home con thumbnail glow, percentuale letto e tasto Play — riprende in un tap l'ultima storia interrotta
- **Glass Home Cards**: card Discover con ring esterno vetro molto sottile + soft cyan shadow
- **Glass Explore Grid**: tessere Topics in vetro; quando attive, glow del colore della categoria (verde per Natura, viola per Spazio, arancio per Animali, ecc.) + tick colorato

## Regole rispettate
- Nessuna modifica a logica app, API, autenticazione, TTS, navigazione, DB schema
- Cyan luminoso come colore principale per azioni interattive
- Categorie mantengono il loro colore, integrato nel sistema glass
- Tutti i colori dal theme; hex literali solo dove servono uguali in light/dark

## Prossimi passi consigliati
- Ricomputo `audio_minutes_est` on-write per storie aggiunte a runtime
- Estendere lo stile glass anche a Profile / Stats / Playlist

## Ripristino progetto + Redesign icone categorie (glassmorphism completo)
- Progetto PAUSE ripristinato in `/app` da PAUSE-4.8 (frontend+backend), `.env` di sistema preservati; aggiunte `EMERGENT_LLM_KEY` e `ENFORCE_LIMIT=false`. Risolto il crash `502 /user/content-modes` (era solo backend non attivo + chiave mancante).
- **Nuova identità visiva categorie**: `src/categories.ts` (mappa centralizzata id → gradiente + glyph MaterialDesignIcons espressivo) + `src/components/category-orb.tsx` (`CategoryOrb`/`GradientOrb`: squircle a gradiente, sheen frosted, bordo luminoso, glow, glyph bianco leggibile in chiaro e scuro).
- Applicato ovunque: griglia Topics (Explore + onboarding), tile categorie Home, cover storie (`StoryHero`/`LessonCover`), `CategoryTag` del lettore, header sezioni Salvati.
- **Tema chiaro leggibile ovunque**: convertite a `useTheme()/makeStyles()` le uniche 2 schermate ancora su `colors` statici (dark fisso): `bookmarks.tsx` e `pause-limit.tsx`.
- Playlist portata a superfici vetro (card + righe).
- Verificato via screenshot in dark e light: Explore, Home, Profile, Saved.


## Iterazione — Schermata interessi (onboarding step 1) in Glass Design System
- Nuove primitive riutilizzabili in `frontend/src/components/glass/cards.tsx`: `GlassBackdrop` (fondo notte + bagliori ambientali), `GlassPressable` (card vetro selezionabile con bordo/glow animati nel colore d'accento), `GlassCheck` (anello/chevron → check animato), `GlassCTA` (CTA vetro cyan/viola con glow e stato disabilitato).
- `category-grid.tsx` riscritto: card "Qualsiasi argomento" grande + griglia 3 colonne (orb → nome → n° storie, chevron che diventa check). Usato sia in onboarding sia nel tab Esplora.
- `onboarding.tsx` step 1: titolo grande con ultima parola in cyan, card modalità Curiosità/Mini lezioni in vetro, footer sfumato con GlassCTA "Inizia a scoprire". Logica invariata (verificata da testing agent, iteration_21: PASS).
- Raffinamento (stesso layout): sfondo con luce ambientale diffusa (gradienti radiali SVG, niente blob), icone categorie unificate in un unico set outline MDI dentro tasselli vetro tinti (`GradientOrb` glass), tile più compatte (118) con chevron discreto, CTA più leggera (52) con vetro scuro + gradiente cyan/viola delicato e luce interna, dots luminosi, titolo con glow su "leggere?".
- Replica fedele del riferimento: sfondo bokeh notturno (asset `assets/images/glass-bokeh.jpg`, generato) con scrim leggero; card in vetro blu-notte traslucido (`glassTint`/`glassTintBorder` in theme) con luce d'accento forte da selezionate (bordo 1.5px, glow esterno, luce interna); tile compatte 3 colonne (gap 12, radius 22); mode card con orb cyan + anello/check (anello nascosto sotto 380dp); titolo responsive su una riga con "leggere?" azzurro pallido (`cyanPale`).
- Sfondo ora è una foto reale di città di notte (Unsplash, ritagliata, saturata, blur 20px, bokeh caldi/blu) con overlay scuro; Spazio = pianeta con anello (Ionicons planet-outline, via `CatGlyph`/`set`), Animali = zampa piena; gradienti icone saturi; ogni tile ha bordo+glow nel colore della propria icona (`accentIdle`).
