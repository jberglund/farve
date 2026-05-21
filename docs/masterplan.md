This is meant to be a tool for making color palettes.

Here the gist of it:

- colorjs.io to do the color math
- OKLCH will be the means to explain the system
- We'll use no framework. Just Typescript and HTML. Maybe a web component or two.

# Terminology

- Steps - The backbone of the system. Because lightness is uniform across hues, this is what gives this system it's value.
- Steps editor: This is where we'll set global lightness for all palettes.
- Palette(s) - A palette is a hue + a set of chroma values. We'll be able to have several palettes.
- Chroma Editor - This lets us edit the chroma value inside of a palette. We'll have one per step.

# OKLCH

Here's the deal:

- We'll start with steps, these can have any name but I'm suggesting 50 to 950 – incrementing by 50.
- For these steps we'll want to map lightness. This won't be a linear scale though, so we'll have to make it flexible:
- If lightness either has to be 0% to 100% or 0 to 1, we'll use 0 to 1. Otherwise, do percentage.

```
// The ish shape. Open for suggestions
const steps = new Map([50, 0.98], [100, 0.96], [150, 0.94] /* ... and so on */]);

const steps = [{name: 50, value: 0.98}, {name: 100, value: 0.96}];

const palettes = [
 {name: 'blue', hue: 20, chroma: [0.1, 0.2, 0.222, 0.23]}
]

```
