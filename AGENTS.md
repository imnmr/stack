# AGENTS.md — Technical Guidelines & Contributor Standard

## 📌 Project Architecture & Philosophy

This project is a lightweight, zero-build, fully client-side interactive simulator and visualizer for the **Stack Data Structure**. It is designed to be hosted seamlessly on **GitHub Pages**.

### Core Philosophy
* **Zero-Build Dependency**: No Node.js, Webpack, Vite, or npm scripts are required. Every page runs directly in any modern browser.
* **Component-Free Vanilla Stack**: Pure HTML5, Tailwind CSS v4 (via CDN), and modern ES6+ JavaScript.
* **Interactive Educational Focus**: Visual feedback, state animations, sound effects, and step-by-step operation tracing are prioritized.

---

## 📁 Repository Directory Matrix

```
.
├── AGENTS.md                  # Instructions for AI agents & contributors
├── index.html                 # Landing page & hub for all visualizer modules
├── assets/
│   ├── audio/                 # Sound effects (.mp3 / .wav)
│   │   ├── push.mp3           # Triggered when element is added
│   │   ├── pop.mp3            # Triggered when element is removed
│   │   ├── error.mp3          # Triggered on underflow/overflow
│   │   └── reset.mp3          # Triggered on clear/reset
│   ├── image/                 # Static illustrations, logos, icons, OG images
│   ├── scripts/               # Shared logic & helper scripts
│   │   ├── audio.js           # Sound effect manager (handles volume, muting)
│   │   ├── common.js          # Shared UI (navbar rendering, theme management)
│   │   └── stack.js           # Reusable Stack data structure class
│   └── style.css              # Keyframes & non-Tailwind fallback animations
├── play/
│   └── index.html             # Main Interactive Stack Sandbox
├── rpn/
│   └── index.html             # Reverse Polish Notation (Postfix) Visualizer
└── misc/
    └── index.html             # Real-world applications (Call Stack, Undo/Redo)
```

---

## 🚨 MANDATORY AGENT CONSTRAINTS

### 1. Strict Relative Pathing Rule (GitHub Pages)

GitHub Pages places repositories under user subpaths (e.g., `https://<username>.github.io/<repo-name>/`).
Absolute paths starting with `/` **WILL BROKEN AND RETURN 404 ERRORS**.

#### Path Matrix Reference Table:

| Source File Location | Target Asset / Page | Correct Relative Path Syntax | WRONG Syntax (DO NOT USE) |
| :--- | :--- | :--- | :--- |
| `index.html` | Play Page | `./play/index.html` | `/play/index.html` or `/play/` |
| `index.html` | Sound Script | `./assets/scripts/audio.js` | `/assets/scripts/audio.js` |
| `play/index.html` | Homepage | `../index.html` | `/index.html` or `/` |
| `play/index.html` | Audio File | `../assets/audio/push.mp3` | `/assets/audio/push.mp3` |
| `rpn/index.html` | Shared Style | `../assets/style.css` | `/assets/style.css` |
| `misc/index.html` | Main Script | `../assets/scripts/common.js` | `/assets/scripts/common.js` |

* **Rule**: Always calculate relative paths based on the depth of the file invoking the resource.
* **Dynamic Scripts Note**: If a script in `assets/scripts/` injects DOM links (like a common header), it must compute relative paths or accept a base path parameter based on the host page depth.

---

## 🎨 Styling Standards (Tailwind CSS v4)

### CDN Configuration
Every HTML document must include the Tailwind CSS v4 browser script inside the `<head>` tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

### CSS Guidelines
1. **Utility-First**: Use inline Tailwind utility classes for layout, flexbox, grid, spacing, colors, and basic transitions.
2. **Custom CSS (`assets/style.css`)**: Reserved exclusively for:
   * `@keyframes` animations (e.g., stack element drop-in, pop-out physics, pointer pulses).
   * Custom dynamic canvas overlays or custom scrollbar styling.
3. **Color Theme Standards**:
   * Dark Mode Neutral Backgrounds: `bg-slate-900`, `bg-slate-800`
   * Stack Elements/Nodes: `bg-indigo-600`, `bg-violet-600`, with `border-indigo-400`
   * Accent/Highlight Colors: `emerald-500` (success/push), `rose-500` (error/overflow/pop), `amber-400` (peek/top indicator)

---

## 🧠 JavaScript & State Architecture

### Core Stack Class Design (`assets/scripts/stack.js`)
All pages simulating stacks should utilize a unified JavaScript `Stack` class or pattern:

```javascript
class Stack {
  constructor(capacity = 8) {
    this.items = [];
    this.capacity = capacity;
  }

  push(element) {
    if (this.isFull()) throw new Error("Stack Overflow");
    this.items.push(element);
  }

  pop() {
    if (this.isEmpty()) throw new Error("Stack Underflow");
    return this.items.pop();
  }

  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  isFull() {
    return this.items.length >= this.capacity;
  }

  clear() {
    this.items = [];
  }
}
```

### Audio Controller Pattern (`assets/scripts/audio.js`)
Audio elements should be created and played dynamically with safe promise handling:

```javascript
const SoundFX = {
  isMuted: localStorage.getItem('sound_muted') === 'true',

  play(filename, relativePrefix = './') {
    if (this.isMuted) return;
    const audio = new Audio(`${relativePrefix}assets/audio/${filename}`);
    audio.play().catch(err => {
      // Gracefully handle browser autoplay policies or missing files
      console.warn(`Audio play deferred or failed: ${filename}`, err);
    });
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('sound_muted', this.isMuted);
    return this.isMuted;
  }
};
```

---

## ♿ Accessibility (a11y) & UX Requirements

1. **Screen Reader Live Regions**: Use `aria-live="polite"` elements to state changes (e.g., *"Pushed element 42 onto stack. Current size: 3."*).
2. **Keyboard Navigability**:
   * All controls (buttons, inputs) must have explicit hover and focus states (`focus:ring-2 focus:ring-indigo-500`).
   * Support `Enter` key inside input fields to trigger `push()` directly.
3. **Responsive Visualizer**: Stack visualization containers must scroll gracefully or rescale when screen height/width is limited on mobile devices.

---

## 🧪 AI Agent Task Checklist

When generating or modifying code for this project, AI agents MUST verify:

- [ ] All file links (`<a href="...">`) use correct relative paths based on directory depth.
- [ ] All script imports (`<script src="...">`) and stylesheet links use relative paths.
- [ ] Tailwind CSS v4 browser CDN script is present in `<head>`.
- [ ] All audio invocations handle potential promise rejections (`.catch()`).
- [ ] No Node.js / NPM build commands or server-side scripts are introduced.
- [ ] The stack state correctly updates UI without breaking layout bounds.
