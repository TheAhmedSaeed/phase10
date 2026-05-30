# 🔟 Phase 10 Score Tracker

A simple, mobile-friendly web app to keep score for the card game **Phase 10**.
Add players, and after each round enter how many points each player has left in
hand and whether they completed their phase. The app tracks cumulative scores,
each player's current phase, and declares a winner.

No accounts, no backend — everything runs in your browser and saves
automatically (so a refresh won't lose your game).

## How scoring works

- **Lowest total score wins.** Points come from cards left in your hand when a
  round ends.
- A player only **advances to the next phase** if they completed their current
  phase that round — tick the **Done** box when they do.
- The game ends once a player completes **Phase 10**. If more than one player
  finishes in the same round, the lowest score wins.

### Card values

| Card | Points |
|------|--------|
| Number 1–9 | 5 |
| Number 10–12 | 10 |
| Skip | 15 |
| Wild | 25 |

## Using it

1. Add at least two players.
2. Press **Start Game**.
3. Each round: enter each player's leftover points, tick **Done** for anyone who
   completed their phase, then press **Save Round & Continue**.
4. Made a mistake? Use **Undo last round**.

## Deploying to GitHub Pages

This repo includes a workflow (`.github/workflows/deploy.yml`) that publishes
the site automatically.

1. Merge this branch into `main`.
2. In your repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Every push to `main` then deploys the site. Your URL will be
   `https://<your-username>.github.io/phase10/`.

> The app is plain HTML/CSS/JS with no build step, so you can also just enable
> Pages straight from a branch if you prefer.

## Files

- `index.html` — markup
- `styles.css` — styling
- `app.js` — game logic and persistence
