# Project Context – Home Screen Recreation

## Objective
Recreate the provided iOS home screen reference as closely as possible in React Native.

This is NOT a redesign task.
This is a visual recreation task.

The final result must preserve:
- layout structure
- spacing rhythm
- rounded geometry
- visual hierarchy
- floating navigation feeling
- soft premium pastel aesthetic

---

## Platform
- iOS-first
- React Native
- SafeArea-aware
- Phosphor Icons
- Mock data only
- No backend yet

---

## Main UX Goal
The screen should feel:
- premium
- soft
- editorial
- modern iOS
- playful but clean
- collectible-card-like
- airy and balanced

Not:
- generic
- Android-like
- boxy
- flat
- overcrowded
- overly brown
- visually harsh

---

## Required Screen Structure

### 1. Header
Top area with:
- Large greeting: `Günaydın, Arif 👋`
- Smaller date below: `17 Mart`

Style:
- strong headline
- warm brown text
- generous spacing from safe area
- left aligned

---

### 2. Hero Visual Card
A large rounded card under the header.

Contains:
- dreamy pastel visual background
- small label: `Arif`
- huge score: `25,982`
- subtitle: `günlük üretim puanı`
- larger supporting line: `Günün görsel kartı`

Rules:
- the hero should feel immersive
- text overlays the image
- image should fill the card elegantly
- rounded corners must be large
- no awkward tiny image inside a box

---

### 3. Overlapping Today Sheet
A large white content sheet overlaps the bottom of the hero.

Top row:
- left: `Bugün`
- right: pale circular icon button

This must visually sit on top of the hero with proper z-index and rounded corners.

---

### 4. Segmented Tabs
Two large pill segments:
- `Günlük alışkanlıklar`
- `Hedefler`

Rules:
- active = muted teal
- inactive = very light warm gray
- thick height
- large corner radius
- equal width
- centered text
- premium spacing

---

### 5. Tasks Section
Below segmented tabs:

Header row:
- left: `Görevler`
- right: small rounded badge with `0`

Then an empty-state card:
- dashed subtle border
- rounded corners
- centered title: `Henüz görev eklenmedi`
- supporting text: `Aşağıdaki + ile ilk görevinizi oluşturun.`

---

### 6. Floating Add Button
A circular floating `+` button:
- lower-right
- above tab bar
- muted teal background
- white plus icon
- elevated but subtle
- should not overlap awkwardly with content or tab bar

---

### 7. Bottom Navigation
Custom floating rounded tab bar.

Tabs:
- Ana Sayfa
- Galeri
- Profil

Rules:
- use Phosphor icons
- icon above label
- active color = muted teal
- inactive = warm brown-gray
- very rounded container
- floating dock feeling
- no default tab bar style
- no hard border
- no generic Android appearance

---

## Color Direction
Suggested palette:
- page background: warm cream
- headline brown: warm earthy brown
- body text: muted brown-gray
- active accent: dusty teal / muted blue-green
- icon circle accent: pale gold / beige
- content sheet: soft white
- hero overlay text: white / off-white

Avoid:
- saturated colors
- black-heavy UI
- random mixed tones
- overuse of dark brown

---

## Typography Direction
- bold large display headline for greeting and section titles
- very large number for daily score
- softer secondary text
- clear scale hierarchy
- consistent font weights
- elegant spacing between text blocks

---

## Layout & Spacing Rules
- respect safe area
- use generous horizontal padding
- use large corner radii
- use layered composition, not stacked generic blocks
- maintain breathing room between sections
- hero-to-sheet overlap must be intentional and polished
- bottom area must leave enough room for floating action button and tab bar

---

## Componentization
Create reusable components:
- `HomeHeader`
- `HeroCard`
- `TodaySheet`
- `SegmentedTabs`
- `TasksSection`
- `EmptyTasksCard`
- `FloatingAddButton`
- `CustomBottomTabBar`

Also define:
- `colors.ts`
- `spacing.ts`
- `mockHomeData.ts`

---

## Absolute Requirements
- Do not redesign
- Do not simplify composition
- Do not replace custom tab bar with default one
- Do not use flat boring cards
- Do not make corners too small
- Do not compress spacing
- Do not use standard generic shadows
- Do not change Turkish labels
- Do not invent a different screen hierarchy

---

## Acceptance Criteria
The implementation is correct only if:
1. At first glance it feels very close to the reference.
2. The hero card and white sheet relationship matches the reference.
3. The tab bar feels floating and premium.
4. The segmented control looks thick, soft, and high quality.
5. The screen looks iOS-native and polished.
6. The current “wrong” version is fully replaced.

---

## Output Request
Return clean React Native code for:
- `HomeScreen`
- `CustomBottomTabBar`
- all supporting reusable components
- mock data/constants

Focus on UI fidelity first.
No backend.
No extra features.
No redesign.