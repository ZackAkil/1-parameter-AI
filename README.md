# 1-Parameter AI
[https://zackakil.github.io/1-parameter-AI/](https://zackakil.github.io/1-parameter-AI/)

An interactive demo contrasting **classic programming** (manually setting a threshold) with **machine learning** (learning a single-parameter decision boundary from labeled examples) using a 3D desk lamp and ambient sunlight simulation.

## Modes

- **Programmer Mode** — Manually set the ambient light threshold (`θ`) and rule direction (`< θ` or `>= θ`), inspect the generated conditional code, and test the rule live against the 3D lamp.
- **Machine Learning Mode** — Record training examples by toggling the lamp `ON` or `OFF` at different ambient light levels, then fit the optimal 1-parameter decision boundary (`θ`) from the captured data.

## Run Locally

Because the app uses ES modules, serve the directory over a local HTTP server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Files

- `index.html` — Layout and UI panels
- `styles.css` — Styling
- `app.js` — Application state and UI bindings
- `model.js` — 1-parameter threshold classifier and rule formatters
- `chart.js` — 1D decision boundary SVG chart
- `lamp3d.js` — Interactive Three.js desk lamp and sunlight scene
