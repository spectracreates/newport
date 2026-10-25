---
version: alpha
name: Marvel portfolio
description: Portfolio of Oluwayomi Marvellous, creative technologist, built on a long-exposure night photograph of Lagos's Third Mainland Bridge.
colors:
  night: "#0B1A2E"
  lagoon: "#10263F"
  headlight: "#FFF4DC"
  taillight: "#FF4A3D"
  sodium: "#FFB23F"
  haze: "#A8B8CB"
  signal-teal: "#4FD1C5"
  led-blue: "#86B6FF"
  dusk-pink: "#FF8FB1"
typography:
  display:
    fontFamily: Archivo
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.02em
  heading:
    fontFamily: Archivo
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: Archivo
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
rounded:
  base: 14px
  pill: 999px
spacing:
  section: 136px
  gutter: 24px
---

## Overview

The site is Third Mainland Bridge at night, shot as a long exposure. Each of Marvel's disciplines is a stream of light crossing the bridge: motion graphics, websites, backend, systems and dashboards, AI automation and chatbots, and IT support. The page sells range and craft to companies, creative studios, remote teams and local businesses, so it must feel cinematic and still read cleanly.

## Colors

Night is the ground of every section; lagoon is the one raised surface. Headlight is the text colour. Taillight red is reserved for the primary action and the convergence point. Each discipline owns one light colour and uses it everywhere it appears: motion is sodium, websites headlight, backend taillight, systems signal-teal, AI and chatbots led-blue, IT support dusk-pink. Haze is for secondary text only.

## Typography

One family, Archivo, self-hosted as a variable font. Display and section titles are set at the expanded width (125) like film title credits, in sentence case. Body text is at normal width (100). Discipline names are headings at width 115. Numbers people compare use tabular figures.

## Layout

Left-aligned on a 1200px content width with 24px gutters (16px under 560px). The hero is the full-bleed bridge scene with the headline in its lower third. Sections run full-bleed on night, separated by space, not rules or cards. Work entries are wide rows with the discipline lights they used, not a card grid.

## Elevation & Depth

Depth comes from light, not shadow: glow around light sources and the dark lagoon surface. No drop shadows on boxes.

## Shapes

Buttons are pills. Video frames and the lagoon surface use the 14px base radius. Everything else is square.

## Components

The primary button is taillight red with night text; the secondary is a 1.5px headlight outline. The hero scene always has a visible pause control, pauses when off screen, and renders as one still long-exposure frame under reduced motion.

## Do's and Don'ts

- Do keep the bridge scene and the six-lane set-piece as the only animated moments.
- Don't use gradient text, glass panels, card grids or glowing blobs.
- Don't give a discipline any colour other than its own light.
