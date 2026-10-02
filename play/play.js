"use strict";

// Page-local until the team introduces shared stack/audio helpers.
class Stack {
  constructor(capacity = 8) { this.items = []; this.capacity = capacity; }
  push(value) {
    if (this.isFull()) throw new Error("Stack Overflow");
    this.items.push(value);
  }
  pop() {
    if (this.isEmpty()) throw new Error("Stack Underflow");
    return this.items.pop();
  }
  peek() { return this.isEmpty() ? null : this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
  isFull() { return this.items.length >= this.capacity; }
  clear() { this.items = []; }
}

const SoundFX = {
  isMuted: (() => { try { return localStorage.getItem("sound_muted") === "true"; } catch { return false; } })(),
  missing: new Set(),
  play(filename, relativePrefix = "../") {
    if (this.isMuted || this.missing.has(filename)) return;
    try {
      const audio = new Audio(`${relativePrefix}assets/audio/${filename}`);
      audio.play().catch(error => {
        if (error.name === "NotSupportedError") this.missing.add(filename);
        console.warn(`Audio unavailable: ${filename}`, error);
      });
    } catch (error) { console.warn(`Audio unavailable: ${filename}`, error); }
  },
  toggleMute() {
    this.isMuted = !this.isMuted;
    try { localStorage.setItem("sound_muted", String(this.isMuted)); } catch { /* Storage is optional. */ }
  }
};

const stack = new Stack();
const history = [];
let busy = false;
let eventNumber = 0;
const $ = id => document.getElementById(id);
const node = (tag, classes, text) => {
  const element = document.createElement(tag);
  element.className = classes;
  if (text !== undefined) element.textContent = text;
  return element;
};
const CODE = {
  push: "push(value):\n  if isFull():\n    throw Stack Overflow\n  items.push(value)\n  TOP = size − 1",
  pop: "pop():\n  if isEmpty():\n    throw Stack Underflow\n  value = items.pop()\n  TOP = size − 1\n  return value",
  peek: "peek():\n  if isEmpty(): return null\n  return items[TOP]\n  // size and TOP stay unchanged",
  clear: "clear():\n  items = []\n  TOP = −1"
};

function renderStack() {
  const top = stack.items.length - 1;
  $("slots").replaceChildren();
  for (let index = stack.capacity - 1; index >= 0; index--) {
    const occupied = index <= top;
    const row = node("li", "grid grid-cols-[1.5rem_minmax(0,1fr)_4.5rem] items-center gap-2");
    row.append(node("span", "text-right font-mono text-xs text-slate-400", index));
    const slot = node("span", `flex h-11 min-w-0 items-center justify-center rounded-xl border-2 px-2 font-mono text-sm font-semibold ${occupied ? "border-indigo-400 bg-indigo-600 text-white" : "border-dashed border-slate-700 bg-slate-800/40 text-slate-500"}`);
    slot.id = `slot-${index}`;
    slot.append(node("span", "truncate", occupied ? stack.items[index] : "empty"));
    slot.title = occupied ? stack.items[index] : "Empty slot";
    if (index === top) slot.classList.add("ring-2", "ring-amber-400");
    row.append(slot, node("span", "font-mono text-xs font-bold text-amber-300", index === top ? "← TOP" : ""));
    $("slots").append(row);
  }
  $("occupancy").textContent = `${stack.items.length} / ${stack.capacity}`;
  $("emptyTop").hidden = !stack.isEmpty();
  $("state").replaceChildren();
  const values = [
    ["Size", stack.items.length], ["Capacity", stack.capacity],
    ["TOP index", top], ["Top value", stack.peek() ?? "None"],
    ["isEmpty()", `${stack.isEmpty()} · ${stack.isEmpty() ? "Empty" : "Not empty"}`],
    ["isFull()", `${stack.isFull()} · ${stack.isFull() ? "Full" : "Not full"}`]
  ];
  for (const [label, value] of values) {
    const cell = node("div", "min-w-0 rounded-lg border border-slate-700 bg-slate-800/60 p-3");
    cell.append(node("dt", "text-xs text-slate-400", label), node("dd", "mt-1 break-words font-mono text-sm font-semibold text-slate-100", value));
    $("state").append(cell);
  }
}

function explain(operation, title, message, steps, entry, tone = "success") {
  const colors = { success: "border-emerald-500/60 bg-emerald-500/10", error: "border-rose-500 bg-rose-500/10", peek: "border-amber-400/60 bg-amber-400/10", neutral: "border-slate-600 bg-slate-700/30" };
  $("feedback").className = `mt-4 break-words rounded-2xl border px-5 py-4 ${colors[tone]}`;
  $("resultTitle").textContent = title;
  $("result").textContent = message;
  $("operation").textContent = entry;
  $("trace").replaceChildren(...steps.map(text => node("li", "break-words", text)));
  $("code").textContent = CODE[operation];
  $("complexity").textContent = operation === "clear" ? "O(1) · replace array" : "O(1)";
  history.unshift({ number: ++eventNumber, entry, tone });
  history.splice(10);
  $("history").replaceChildren(...history.map(event => node("li", `break-words rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 ${event.tone === "error" ? "text-rose-300" : "text-slate-300"}`, `${event.number}. ${event.entry}`)));
}

// Only animation locks controls, never empty/full conditions. State commits first;
// animations are visual feedback and cannot change the source of truth.
async function animate(element, kind, delay = 0) {
  if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches || !element.animate) return;
  const frames = {
    push: [{ transform: "translateY(-28px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
    pop: [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-28px)", opacity: 0 }],
    clear: [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(8px)", opacity: 0 }],
    peek: [{ boxShadow: "0 0 0 0 #fbbf24" }, { boxShadow: "0 0 0 5px #fbbf24", offset: 0.5 }, { boxShadow: "0 0 0 0 #fbbf24" }],
    error: [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }]
  };
  try {
    await element.animate(frames[kind], {
      duration: kind === "peek" ? 320 : kind === "clear" ? 240 : 200,
      delay,
      easing: "ease-out",
      // Keep each cleared node faded until the whole stagger finishes.
      fill: kind === "clear" ? "forwards" : "none"
    }).finished;
  } catch { /* Animation cancellation is harmless. */ }
}

function cloneLeavingSlot(index) {
  const leaving = $(`slot-${index}`).cloneNode(true);
  leaving.removeAttribute("id");
  leaving.classList.remove("h-11");
  leaving.classList.add("absolute", "inset-0");
  leaving.setAttribute("aria-hidden", "true");
  return leaving;
}

function attachLeavingSlot(index, leaving) {
  const destination = $(`slot-${index}`);
  destination.classList.add("relative");
  destination.append(leaving);
}

async function perform(operation) {
  if (busy) return;
  busy = true;
  document.querySelectorAll("[data-operation]").forEach(button => { button.disabled = true; });
  try {
    const oldSize = stack.items.length;
    const oldTop = oldSize - 1;
    if (operation === "push") {
      const value = $("value").value.trim();
      if (!value || value.length > 32) {
        $("value").setAttribute("aria-invalid", "true");
        explain(operation, "Invalid value", "Enter a non-blank value of up to 32 characters. Stack unchanged.", ["Validate the input before pushing.", "No value was inserted; size and TOP remain unchanged."], "PUSH → Invalid value", "error");
        $("value").focus();
        SoundFX.play("error.mp3");
        await animate($("feedback"), "error");
        return;
      }
      $("value").removeAttribute("aria-invalid");
      if (stack.isFull()) {
        explain(operation, "Stack Overflow", `Cannot push ${value}: all ${stack.capacity} slots are occupied. Size ${oldSize}, TOP ${oldTop}; unchanged.`, ["Check isFull().", `size === capacity (${oldSize} === ${stack.capacity}).`, "No new element can be inserted: Stack Overflow.", `Stack unchanged: TOP = ${oldTop}, size = ${oldSize}.`], `PUSH ${value} → Stack Overflow`, "error");
        SoundFX.play("error.mp3");
        await animate($("feedback"), "error");
        return;
      }
      stack.push(value);
      renderStack();
      explain(operation, "Push successful", `Pushed ${value}. Size is ${stack.items.length}; TOP is ${oldTop + 1}.`, ["Check isFull(): false; capacity is available.", `Insert ${value} in slot ${oldTop + 1}, above the previous top.`, `TOP changes from ${oldTop} to ${oldTop + 1}.`, `Size changes from ${oldSize} to ${stack.items.length}.`], `PUSH ${value}`);
      $("value").value = "";
      SoundFX.play("push.mp3");
      await animate($(`slot-${oldTop + 1}`), "push");
    } else if (operation === "pop") {
      if (stack.isEmpty()) {
        explain(operation, "Stack Underflow", "Cannot pop: the stack is empty. Size 0 and TOP = -1 remain unchanged.", ["Check isEmpty(): true; size is 0.", "There is no element to remove: Stack Underflow.", "Stack unchanged: TOP = -1, size = 0."], "POP → Stack Underflow", "error");
        SoundFX.play("error.mp3");
        await animate($("feedback"), "error");
        return;
      }
      // Clone the old top as a temporary visual, then render the committed state.
      const leaving = cloneLeavingSlot(oldTop);
      const value = stack.pop();
      renderStack();
      attachLeavingSlot(oldTop, leaving);
      explain(operation, "Pop returned", `Returned ${value}. Size is ${stack.items.length}; TOP is ${oldTop - 1}.`, ["Check isEmpty(): false.", `Remove and return ${value} from slot ${oldTop}.`, `TOP changes from ${oldTop} to ${oldTop - 1}.`, `Size changes from ${oldSize} to ${stack.items.length}.`], `POP → ${value}`, "neutral");
      SoundFX.play("pop.mp3");
      await animate(leaving, "pop");
      renderStack();
    } else if (operation === "peek") {
      const value = stack.peek();
      explain(operation, value === null ? "No top element" : "Peek returned", value === null ? "Peek returns null: the stack is empty. Size 0 and TOP = -1 remain unchanged." : `Peek returns ${value} without removing it. Size ${oldSize} and TOP ${oldTop} remain unchanged.`, [value === null ? "Check isEmpty(): true; return null." : `Read ${value} at TOP = ${oldTop}.`, "Do not remove or insert any value.", `Size = ${oldSize} and TOP = ${oldTop} remain unchanged.`], `PEEK → ${value === null ? "null (empty)" : value}`, "peek");
      SoundFX.play("peek.mp3");
      await animate($(`slot-${oldTop}`), "peek");
    } else if (operation === "clear") {
      // Snapshot occupied nodes before clearing; empty slots and live state update
      // immediately while these decorative copies fade from top to bottom.
      const leavingSlots = Array.from({ length: oldSize }, (_, offset) => {
        const index = oldTop - offset;
        return { index, leaving: cloneLeavingSlot(index) };
      });
      stack.clear();
      renderStack();
      leavingSlots.forEach(({ index, leaving }) => attachLeavingSlot(index, leaving));
      explain(operation, "Stack cleared", `Cleared ${oldSize} value${oldSize === 1 ? "" : "s"}. Size is 0; TOP = -1.`, [`Replace the current stack containing ${oldSize} values with an empty array.`, `Size changes from ${oldSize} to 0.`, `TOP changes from ${oldTop} to -1.`, "All 8 slots are now available; history is retained."], `CLEAR → ${oldSize} removed`, "neutral");
      SoundFX.play("clear_stack.mp3");
      try {
        await Promise.all(leavingSlots.map(({ leaving }, offset) => animate(leaving, "clear", offset * 25)));
      } finally {
        renderStack();
      }
    }
  } finally {
    busy = false;
    document.querySelectorAll("[data-operation]").forEach(button => { button.disabled = false; });
  }
}

$("pushForm").addEventListener("submit", event => { event.preventDefault(); void perform("push"); });
for (const operation of ["pop", "peek", "clear"]) $(operation).addEventListener("click", () => { void perform(operation); });
$("value").addEventListener("input", () => $("value").removeAttribute("aria-invalid"));
function refreshSound() {
  $("sound").textContent = SoundFX.isMuted ? "Sound off" : "Sound on";
  $("sound").setAttribute("aria-pressed", String(!SoundFX.isMuted));
}
$("sound").addEventListener("click", () => { SoundFX.toggleMute(); refreshSound(); });
refreshSound();
renderStack();
$("code").textContent = CODE.push;
