---
version: alpha
name: Marvel portfolio
description: Portfolio of Oluwayomi Marvellous, creative technologist, built as an engineer's workbench seen from above, with a live robot arm.
colors:
  mat: "#18513F"
  mat-deep: "#0F382B"
  paper: "#F2EEE3"
  ink: "#16150F"
  arm-orange: "#FF6B1A"
  steel: "#2A2D2E"
  tape: "#121212"
  tape-text: "#F4F1EA"
  lamp: "#FFD9A0"
  on-mat-muted: "#BFD3C7"
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: -0.025em
  heading:
    fontFamily: Bricolage Grotesque
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: Bricolage Grotesque
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  measure:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 500
rounded:
  base: 12px
  tape: 3px
spacing:
  section: 128px
  gutter: 24px
---

## Overview

The site is Marvel's workbench, seen from above: a green self-healing cutting mat under a warm desk lamp, with finished projects laid out as parts. A robot arm, drawn and solved live in code, follows the visitor in the first screen and reaches for whichever project they look at. The arm is the argument: design, motion and engineering in one object, pointing at what comes next, robotics.

## Colors

Mat green is the ground of the hero and the bench; paper is the ground for long reading. Text on the mat is paper; secondary text on the mat is on-mat-muted. Arm orange belongs to the robot arm and the primary action only. Label tape is tape black with tape-text. Lamp is light, never a fill.

## Typography

One family, Bricolage Grotesque, self-hosted as a variable font: display at optical size 96, width 75, weight 800; body at optical size 14, width 100. IBM Plex Mono is used only for measurements printed on the mat (ruler numbers, dimensions, specs). Project names on label tape are the only capitals on the page.

## Layout

Left-aligned on a 1200px width with 24px gutters (16px under 560px). The hero fills the first screen with the mat; the bench lays project parts out on an asymmetric grid with small rotations, like objects set down by hand. Reading sections (experience, contact) sit on paper.

## Elevation & Depth

One light source, the lamp, top left. Objects on the mat cast a soft shadow down and to the right; a picked-up object lifts and its shadow spreads.

## Shapes

Project parts use the 12px base radius; label tape uses the 3px tape radius. The arm is built from rounded links and circular joints.

## Components

Label tape: black strip, embossed-looking capitals, slightly rotated, one per project. Buttons: arm-orange fill with ink text for the primary action, paper outline on the mat for the secondary. Project dialogs open on paper.

## Do's and Don'ts

- Do keep the robot arm the only continuously moving element.
- Do say only what the projects actually do.
- Don't use gradients as decoration, glass panels, or icon-plus-heading card grids.
- Don't put label tape anywhere except project names and the brand.
