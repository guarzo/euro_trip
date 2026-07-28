# Design

<!-- impeccable:design-schema 1 -->

## The world

**The Argument Wall.** A public theater street poster in the Scher lineage:
condensed wood-type capitals at architectural scale, baselines cut on diagonals,
words butted against each other and cropped by the frame so the eye finishes the
shout. Taxi yellow and paper white grounds, dense black ink, one signal
red-orange held exclusively for the active call to action.

Why this product: the site's subject is not a trip, it is an *argument* about a
trip. Every page states a position and invites contradiction. A poster wall is
what argument looks like when it is made physical — competing claims at scale,
pasted over each other, each demanding you take a side. Eleven cities and ten
open questions are eleven and ten posters. The teenagers are the audience, and a
wall that yells is legible from across a room and from the top of a phone
screen.

The form also solves the hard content problem honestly: a theater poster has
always paired a monumental shout with a dense letterpress credit block. That is
exactly the site's structure — a claim, then the fine-print facts (January high,
December sunset, suggested nights, journey time) that support or undercut it.
The tables are not an exception to the world; they are the world's own bottom
third.

## Palette

Color is **Full palette**, four named roles, committed at page scale. Fields own
whole regions; nothing here is an accent scattered on neutral.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#131110` | Wood-type black. Body text, rules, most display type. The dense one. |
| `--yellow` | `#f5c518` | Taxi yellow. Poster ground for shouting regions: hero, section walls, active nav. |
| `--paper` | `#f4f1e9` | Paper white, faintly warm and stocky. Ground for reading regions. |
| `--signal` | `#e5471d` | Red-orange. **Reserved for the active call to action and the current state.** Never decorative. |
| `--signal-deep` | `#bf3410` | The action's resting state — 5.3:1 on paper, so it survives a phone in daylight. `--signal` is its hover. |
| `--ink-mute` | `#5b5449` | Fine-print and credit-block text on paper. |
| `--yellow-deep` | `#d9a800` | Rules and hairlines on yellow ground; pressed state. |

`--signal` is a scarcity token. If more than one signal-colored element is
visible in a viewport, the region is wrong. This is the rule most likely to be
violated during a later pass.

Dark or light: read on a phone at night, on a couch, by a teenager who was sent
a link. Paper and yellow read as *lit* rather than as glare because the ground is
warm and the ink is dense — a poster is a lit object in a dark street. There is
no dark mode; a poster does not have one, and inverting it (white out of black)
is already the world's own selected state.

## Type

The whole site is set in **Archivo** (variable, weight 400–900, width 62–125%),
self-hosted at `site/assets/fonts/`. The width axis *is* the wood-type mechanism:
one family covers the architectural shout and the letterpress fine print, so
there is no second face to go stale.

- **Shout** — weight 900, width 64–70%, line-height 0.82–0.88, tracking −0.015em
  to −0.025em. Caps only. `text-wrap: balance`.
- **Body** — weight 400–500 at 1.0625rem/1.65, capped at `66ch`.
- **Credit block** — weight 700, width 88%, 0.64–0.7rem, tracking 0.13em, caps.
  Every fact block, table header, tag, and metadata row uses this.

No lowercase display type. **No italics anywhere** — wood type has no italic, so
`em` renders as weight 700 over a yellow highlight bar instead.

## Composition

- **Diagonals are structural, not decoration.** Rotation lives on a small set of
  fixed angles (`-4deg`, `-2deg`, `2deg`); arbitrary values are a smell.
- **Crop at the frame, for real.** A shout escapes its column (`width:
  max-content`, `white-space: nowrap` per line) and is sized off the viewport or
  the wall's own inline size, so the longest word genuinely exits the right edge
  at every width. This is measured, not assumed — a shout whose right edge sits
  inside the viewport has failed. The crop must never orphan meaning: it takes
  a glyph or two, and the readable remainder still says the thing. City titles
  size from their own character count (`--name-len`) so ROME runs huge and
  AMSTERDAM runs smaller, and both lose the same sliver.
- **Scale contrast inside one block.** A connective word (`.line-small`) drops
  to ~0.26em of its neighbours and locks against them rather than sitting as
  another same-size line. Credit blocks butt hard against the shout above them.
- **Paste-up, not stacking.** The element immediately after a hero wall is
  pulled up over the wall's bottom edge so it sits half on yellow and half on
  paper. One deliberate overlap is what makes the page read as a wall.
- **Ornament is the running order.** Bill stacks carry a CSS-counter ordinal
  (`01`, `02`, …) set large in `--yellow-deep` behind each name and cropped by
  the bill's own edge. Generated, so adding a city never renumbers anything.
- **One spacing rhythm** across the whole site, with more space above a heading
  than below it.
- **Pacing:** a shouting region earns a quiet one. Yellow poster wall → paper
  reading column → yellow again. **Every page ends anchored on a closing wall**
  (`_includes/close-wall.html`) carrying that page's single action — never on a
  reading column.

## Components in this world

- **Nav** is a strip of postered words; the current page is reversed type (ink
  on yellow), not underlined or tinted.
- **Buttons and links** are set as poster call-outs. `.action` is the signal
  button, and **every page carries exactly one**, in its closing wall.
  `.action-quiet` is its ink sibling for a second action in a region. Prose
  links carry a 2px signal rule that floods the full word on hover.
- **Fact blocks** (weather, sunset, journey time, nights) are letterpress credit
  blocks: tracked-out uppercase labels, tabular figures, hairline rules.
- **Bills** (`.bill` in a `.bill-stack`) are the site's list primitive — a city
  or a question pasted up as its own poster, name shouted, credit line beneath,
  stack gapped by 3px of ink so the grid reads as separate sheets.
- **Alerts** are stamped notices: a full 3px ink frame with the title reversed
  out in a solid ink band across the top. Never a tinted card with an accent
  edge — that reads as generic UI, not as paper.
- **Activity entries** hang off a 2px top rule rather than a left border, the
  way a poster sets a running order.
- **The interest toggle** is a stamped mark, three states, 44px minimum, with
  its three-way `aria-pressed` mapping. On a yellow ground the unset state gets
  a paper field so the stamp does not vanish into the wall.
- **Winter viability and question status** stay text-first. Weight and color are
  reinforcement; the word carries the meaning.
- **Hero photography** is posterized into the palette rather than shown as
  full-color stock: `grayscale(1) contrast(1.4) brightness(1.08)` in
  `mix-blend-mode: multiply` over a yellow frame, so a Wikimedia photograph
  joins the wall instead of interrupting it.

## Motion

The wall's native motion is **the slam** — a poster goes up in one beat, on a
`260ms cubic-bezier(0.16, 0.9, 0.2, 1)`. Entrances are a single fast settle from
`translateY(16px) rotate(2deg)`, never a fade-and-rise. Hover tilts words onto a
diagonal.

Content is visible by default: `app.js` adds the `js-slam` hiding class only
after confirming both `IntersectionObserver` support and a non-reduced motion
preference, so no-JS and reduced-motion readers never meet a blank column.

## Prohibitions

- No lowercase display type, no italics, no drop shadows, no gradients on type.
- No rounded corners above 2px; this world is cut, not softened.
- `--signal` is never used for decoration, borders, or more than one element per
  region.
- No full-color photography; imagery enters the palette or it does not enter.
- Emoji may reinforce a state but may never be its only carrier.

## Constraints inherited from the product

Content is settled and is not rewritten. `script/check.sh` must pass. Touch
targets stay ≥44px. The site must read correctly with Giscus disabled. No cost,
budget, itinerary, or booking content is introduced.
