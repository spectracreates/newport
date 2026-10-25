---
version: alpha
name: Marvel portfolio
description: Personal portfolio of Oluwayomi Marvellous, built on the visual language of the Lagos danfo bus.
colors:
  danfo-yellow: "#F4C300"
  ink: "#000000"
  asphalt: "#232220"
  paint-white: "#FFF8E6"
  route-green: "#0E8A4F"
  ink-soft: "#2B2400"
typography:
  display:
    fontFamily: Archivo
    fontWeight: 900
    letterSpacing: -0.01em
    lineHeight: 0.92
  heading:
    fontFamily: Archivo
    fontWeight: 800
    lineHeight: 1.05
  body:
    fontFamily: Archivo
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
rounded:
  base: 10px
  plate: 4px
spacing:
  section: 128px
  gutter: 24px
---

## Overview

The site is a danfo route. Marvel turns messy, manual work into systems with fixed stops, the way a danfo route turns Lagos traffic into Ketu to Mile 12 to Obalende. The page should feel loud, local and confident, and still read as easily as a bus destination board.

## Colors

Danfo yellow is the ground of the hero, the contact section and the stops; ink black carries all text on yellow and the side stripe. Asphalt is the road: the pinned route section and the route-board plates sit on it, with yellow and paint-white text. Paint-white is the ground for long reading (experience, projects). Route-green marks an arrived or completed state only, never decoration and never text.

## Typography

One family, Archivo, self-hosted as a variable font. Display headlines are set extra-condensed (width axis 62) at weight 900 in capitals, like painted bus lettering; that is the only place capitals are used. Headings use width 75 at weight 800 in sentence case. Body text is width 100, sentence case, never condensed. Numbers people compare use tabular figures.

## Layout

Left-aligned throughout, with a 1180px content width and 24px gutters (16px under 560px). Sections are full-bleed bands of a single ground colour separated by the black side stripe, never by cards or hairlines. The pinned route is the page's one set-piece: horizontal and scroll-driven on wide screens, a vertical route on phones, a plain list with reduced motion.

## Shapes

Route-board plates and stickers use the 4px plate radius; buttons use the 10px base radius. Stops on the route are circles. No other rounding.

## Components

Buttons are solid ink on yellow or solid yellow on asphalt, with a 2px ink outline for the secondary action, press scale 0.97, and the focus ring in the opposite ground colour. The back-of-bus sticker appears once per page.

## Do's and Don'ts

- Do keep exactly one sticker and one pinned set-piece per page.
- Don't use gradients, glass, drop-shadow cards, emoji or eyebrow labels.
- Don't set body text in capitals or in the condensed width.
- Don't animate anything outside the route section except button press feedback.
