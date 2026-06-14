# Studio — Design System (v2, aligned to build)

**Supersedes v1.** This codifies the design in the actual app (the Base44 build), not the earlier petrol/paper direction. Hex values are read from the screenshot and are *approximate* — your Base44 project is the source of truth; pull exact tokens from there and replace below.

Direction: **clean, light, neutral modern-SaaS.** White surfaces, lots of whitespace, one teal accent, a single typeface, restrained status colors. Quiet and familiar — the tree and the For-you list do the work; nothing competes with them.

---

## 1. Color (approximate — confirm against build)

### Surfaces & text
| Role | Approx | Use |
|---|---|---|
| `app-bg` | `#FFFFFF` | app background (near-white) |
| `surface` | `#FFFFFF` | cards, panels |
| `surface-2` | `#F6F8F7` | hover wells, insets |
| `border` | `#E8EBEA` | hairline borders (cards, dividers) |
| `ink` | `#1B2522` | titles, primary text (near-black, faint green cast) |
| `muted` | `#6B736F` | secondary text, meta |
| `faint` | `#9CA39E` | tertiary, placeholders, eyebrows |

### Accent & status
| Role | Approx | Use |
|---|---|---|
| `accent` (teal) | `#0E8A7C` | brand wordmark, icons, links, primary actions |
| `accent-soft` | `#E6F4F1` | accent tint (selected, halos) |
| `badge` (dark) | `#1E3A36` | **count badges** on tree nodes & bell — dark pill, white numerals |
| `green` / `green-bg` | `#15803D` / `#DCFCE7` | done / on track (e.g. **DONE** pill) |
| `amber` | `#D97706` | watch / attention (study dot) |
| `red` | `#DC2626` | at risk / **Overdue** (study dot, overdue text) |
| `neutral` | `muted` on `surface-2` | open / not-started / due-date meta |

**Three meanings, three colors — never blur them:** *accent/teal* = brand & interactive; *status* = green/amber/red; *count badges* = dark. (No risk color on a count badge; a count is "how many", not "how urgent".)

---

## 2. Typography

**One clean neutral sans throughout** (the build reads like Inter / a geometric grotesque — match whatever Base44 uses). No display serif, no second face. Hierarchy comes from weight + size + color, not a font switch.

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `title` | 26 / 1.15 | 700 | page/stage title ("Pre-Study") |
| `card-title` | 16 / 1.3 | 600 | section card label ("Emails") |
| `body` | 14 / 1.45 | 400–500 | default text, list item titles |
| `meta` | 13 / 1.4 | 400 | study/stage subtext, "0 items", dates |
| `eyebrow` | 11 / 1.2 | 600, UPPERCASE, +0.06em | section labels ("STAGE", "CLIENTS") in `faint` |
| `badge-num` | 12 | 600 | count badges, tabular figures |

Numbers (counts, due dates) use tabular figures. Sentence case everywhere except eyebrows.

---

## 3. Spacing, radius, elevation

- **8pt grid**, 4 as the half-step. Card padding ~20–24; gaps between cards ~12–16; section gaps ~24–32. Generous whitespace is part of the look — don't crowd.
- **Radius:** ~10–12px on cards and pills; full on avatars/dots; pill on status chips and count badges.
- **Elevation:** essentially **flat** — cards are border-only at rest; a barely-there shadow on hover. No heavy shadows anywhere except overlays/menus.

---

## 4. Iconography
Thin line icons, single consistent stroke, tinted `accent` (teal) or `muted`. Sizes 16 (list/tree), 20 (cards). Examples in build: clock (for-you items), envelope/bell/document (sections), flask (study), building (client), chevron (expand). Pick one set, use it exclusively.

---

## 5. Components (as built)

- **Breadcrumb** — `muted` crumbs, chevron separators, current crumb in `ink`/bold. Bell at the right with a **dark count badge** (e.g. "9").
- **For-you list item** — clock icon · bold title (truncates) · status on the right (`In progress` / `Open` / `Due Jan 18` / `Overdue` — overdue in `red`) · study/stage subtext in `muted` below. Whole row clickable.
- **Tree node** — chevron · type icon · name · optional **status dot** (amber/red) · **dark count badge**. Active node = `accent-soft` background. Eyebrow section headers ("CLIENTS").
- **Section card** (stage page) — white, bordered, rounded; teal icon top-left · `card-title` · "`N` items" in `muted`. Three across, generous padding, hover lift.
- **Status pill** — small, rounded, light bg + colored text. `DONE` = `green` on `green-bg`. One per context.
- **Count badge** — dark `badge` pill, white numerals; on tree nodes and the bell. Represents quantity, not status.
- **Avatar** — round; user initials; teal when it's you, neutral for others.

---

## 6. States & motion
- **Navigation** instant; no spinners on tree expand/select. Subtle ~120ms content fade only.
- **Hover** — `surface-2` well on rows, faint lift on cards.
- **Active/selected** — `accent-soft` background (tree node), bold current crumb.
- **Empty** — "0 items" stated plainly on the card; no heavy empty-state art.
- Minimal, functional motion; respect reduced-motion.

---

## 7. Accessibility floor
Text contrast ≥ 4.5:1 (verify `muted` on white and colored pill text on tints); visible keyboard focus; status never by color alone (dot + text); touch targets ≥ 40px; reduced-motion honored.

---

## 8. Signature
The product's identity is the **left rail** — the For-you list over the client tree — kept crisp, fast, badge-aware. The teal accent and dark count badges are the two recognizable marks. Everything else stays white, quiet, and out of the way.

---

*Note: the rest of the spec set (`studio-frd.md`, `studio-ui-spec.md`) is unaffected — they describe behavior and structure, which the build matches. Only the visual layer changed; this v2 is the visual source of truth.*
