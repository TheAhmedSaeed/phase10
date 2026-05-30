/* ============================================================
   Phase 10 Score Tracker
   - Pure client-side, persists to localStorage.
   - Rules implemented:
       * Lowest total score wins.
       * Players advance a phase only when they finish it that round.
       * A player who completes Phase 10 ends the game.
       * Tie-break among finishers: lowest total score.
   ============================================================ */

const PHASES = [
  "2 sets of 3",
  "1 set of 3 + 1 run of 4",
  "1 set of 4 + 1 run of 4",
  "1 run of 7",
  "1 run of 8",
  "1 run of 9",
  "2 sets of 4",
  "7 cards of one color",
  "1 set of 5 + 1 set of 2",
  "1 set of 5 + 1 set of 3",
];
const FINAL_PHASE = 10;
const STORAGE_KEY = "phase10-tracker-v1";

/* ---------- State ---------- */
// state.players: [{ id, name, phase, score }]
// state.history: [{ player_id: { points, done } }] per saved round
// state.started: bool
let state = loadState() || { players: [], history: [], started: false };

/* ---------- Persistence ---------- */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/* ---------- Element refs ---------- */
const el = (id) => document.getElementById(id);
const setupEl = el("setup");
const gameEl = el("game");
const playerListEl = el("player-list");
const startBtn = el("start-game");
const scoreboardBody = el("scoreboard-body");
const winnerBanner = el("winner-banner");
const undoBtn = el("undo-round");

/* ---------- Setup screen ---------- */
el("add-player-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = el("player-name");
  const name = input.value.trim();
  if (!name) return;
  state.players.push({ id: crypto.randomUUID(), name, phase: 1, score: 0 });
  input.value = "";
  input.focus();
  saveState();
  renderSetup();
});

function renderSetup() {
  playerListEl.innerHTML = "";
  state.players.forEach((p) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = p.name;
    const btn = document.createElement("button");
    btn.className = "remove";
    btn.setAttribute("aria-label", `Remove ${p.name}`);
    btn.textContent = "✕";
    btn.onclick = () => {
      state.players = state.players.filter((x) => x.id !== p.id);
      saveState();
      renderSetup();
    };
    li.append(span, btn);
    playerListEl.appendChild(li);
  });
  startBtn.disabled = state.players.length < 2;
  el("setup-hint").textContent =
    state.players.length < 2
      ? "Add at least 2 players to start."
      : `${state.players.length} players ready.`;
}

startBtn.addEventListener("click", () => {
  state.started = true;
  saveState();
  showGame();
});

/* ---------- Game screen ---------- */
el("submit-round").addEventListener("click", submitRound);
undoBtn.addEventListener("click", undoRound);
el("new-game").addEventListener("click", () => {
  if (!confirm("Start a brand new game? This clears all players and scores.")) return;
  state = { players: [], history: [], started: false };
  saveState();
  showSetup();
});

function showSetup() {
  gameEl.classList.add("hidden");
  setupEl.classList.remove("hidden");
  renderSetup();
}
function showGame() {
  setupEl.classList.add("hidden");
  gameEl.classList.remove("hidden");
  renderGame();
}

function winnerInfo() {
  // Game ends when at least one player has finished phase 10
  // (their phase counter pushed past FINAL_PHASE).
  const finishers = state.players.filter((p) => p.phase > FINAL_PHASE);
  if (finishers.length === 0) return null;
  // Among finishers, lowest score wins.
  const best = Math.min(...finishers.map((p) => p.score));
  const winners = finishers.filter((p) => p.score === best);
  return { winners };
}

function renderGame() {
  el("round-num").textContent = state.history.length + 1;
  undoBtn.disabled = state.history.length === 0;

  const win = winnerInfo();
  const lowest = Math.min(...state.players.map((p) => p.score));

  scoreboardBody.innerHTML = "";
  // Display order: keep entry order, but mark current leader(s).
  state.players.forEach((p) => {
    const tr = document.createElement("tr");
    if (p.score === lowest) tr.classList.add("row-leader");

    // Name (with in-game remove button)
    const nameTd = document.createElement("td");
    nameTd.className = "left p-name";
    const nameWrap = document.createElement("div");
    nameWrap.className = "name-wrap";
    const nameText = document.createElement("span");
    nameText.textContent = p.name;
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove";
    removeBtn.type = "button";
    removeBtn.setAttribute("aria-label", `Remove ${p.name}`);
    removeBtn.textContent = "✕";
    removeBtn.onclick = () => removePlayer(p.id);
    nameWrap.append(nameText, removeBtn);
    nameTd.appendChild(nameWrap);

    // Phase
    const phaseTd = document.createElement("td");
    phaseTd.className = "p-phase";
    const badge = document.createElement("span");
    badge.className = "badge";
    if (p.phase > FINAL_PHASE) {
      phaseTd.classList.add("finished");
      badge.textContent = "✓";
      phaseTd.title = "Finished all phases";
    } else {
      badge.textContent = p.phase;
      phaseTd.title = PHASES[p.phase - 1];
    }
    phaseTd.appendChild(badge);

    // Total
    const totalTd = document.createElement("td");
    totalTd.className = "p-total";
    totalTd.textContent = p.score;

    // Round input
    const roundTd = document.createElement("td");
    if (win) {
      roundTd.textContent = "—";
    } else {
      const wrap = document.createElement("div");
      wrap.className = "round-inputs";

      const num = document.createElement("input");
      num.type = "number";
      num.min = "0";
      num.step = "5";
      num.placeholder = "0";
      num.dataset.pid = p.id;
      num.className = "round-points";
      num.inputMode = "numeric";

      const label = document.createElement("label");
      label.className = "done-toggle";
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.dataset.pid = p.id;
      chk.className = "round-done";
      if (p.phase > FINAL_PHASE) chk.disabled = true;
      label.append(chk, document.createTextNode("Done"));

      wrap.append(num, label);
      roundTd.appendChild(wrap);
    }

    tr.append(nameTd, phaseTd, totalTd, roundTd);
    scoreboardBody.appendChild(tr);
  });

  // Winner banner
  if (win) {
    const names = win.winners.map((w) => w.name).join(" & ");
    const verb = win.winners.length > 1 ? "tie for the win" : "wins";
    winnerBanner.textContent = `🏆 ${names} ${verb} with ${win.winners[0].score} points!`;
    winnerBanner.classList.remove("hidden");
    el("submit-round").classList.add("hidden");
    el("round-header").textContent = "Final";
  } else {
    winnerBanner.classList.add("hidden");
    el("submit-round").classList.remove("hidden");
    el("round-header").textContent = "This round";
  }
}

function submitRound() {
  const roundEntry = {};
  document.querySelectorAll(".round-points").forEach((input) => {
    const pid = input.dataset.pid;
    const points = parseInt(input.value, 10) || 0;
    const done = document.querySelector(`.round-done[data-pid="${pid}"]`).checked;
    roundEntry[pid] = { points, done };
  });

  // Apply to player state
  state.players.forEach((p) => {
    const entry = roundEntry[p.id];
    if (!entry) return;
    p.score += entry.points;
    if (entry.done && p.phase <= FINAL_PHASE) p.phase += 1;
  });

  state.history.push(roundEntry);
  saveState();
  renderGame();
}

function removePlayer(id) {
  const player = state.players.find((p) => p.id === id);
  if (!player) return;
  if (!confirm(`Remove ${player.name} from the game? Their scores will be deleted.`)) return;
  state.players = state.players.filter((p) => p.id !== id);
  // Drop their entries from saved rounds so undo stays consistent.
  state.history.forEach((round) => delete round[id]);
  saveState();
  if (state.players.length === 0) {
    // No one left — go back to setup so a fresh game can be started.
    state.started = false;
    saveState();
    showSetup();
    return;
  }
  renderGame();
}

function undoRound() {
  const last = state.history.pop();
  if (!last) return;
  state.players.forEach((p) => {
    const entry = last[p.id];
    if (!entry) return;
    p.score -= entry.points;
    if (entry.done && p.phase > 1) p.phase -= 1;
  });
  saveState();
  renderGame();
}

/* ---------- Phase reference ---------- */
function renderReference() {
  const ol = el("phase-reference");
  ol.innerHTML = "";
  PHASES.forEach((desc) => {
    const li = document.createElement("li");
    li.textContent = desc;
    ol.appendChild(li);
  });
}

/* ---------- Init ---------- */
renderReference();
if (state.started && state.players.length >= 2) {
  showGame();
} else {
  showSetup();
}
