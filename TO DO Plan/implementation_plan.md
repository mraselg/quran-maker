# Quran Publisher — Staged Implementation Plan
## Goal: Match Kariana Reference PDF Exactly (Stage by Stage)

> Work through **one stage at a time**. Each stage produces a visible, testable result before moving to the next.

---

## Reference: Kariana PDF vs Current App

| Element | Kariana PDF | Our App (Now) | Fix Stage |
|---|---|---|---|
| Surah opening rows | 5 rows (4-slot box) | 7 rows (2-slot box) | Stage 1 |
| Page background | Cream `#fdf8e0` | White | Stage 1 |
| Bangla text align | Right-aligned | Center-aligned | Stage 1 |
| Page numbers | Bengali ১ ২ ৩ | Arabic 1 2 3 | Stage 1 |
| Symbol strip | Bengali digits + arrows | Empty | Stage 2 |
| Row divider lines | Thin gold lines | None | Stage 2 |
| Footer content | Surah • Madani • Para • Ruku | `— 1 —` only | Stage 3 |
| Header layout | Para no. left, Surah right | Basic text | Stage 3 |
| Auto border switch | Ornate (pg 1-2), thin (rest) | Manual only | Stage 3 |
| PDF export | Not matching canvas | Broken | Stage 4 |
| Tajweed color coding | — | — | Stage 5 |
| Proofing grid | — | — | Stage 5 |

---

---
# STAGE 1 — Core Layout & Background
## "Make it look like a real Mushaf page"
---

**Files to change:** `public/js/quran-editor.js`, `public/templates/default.svg`

**What changes:**
- [ ] **1A** — Fix Surah opening page: change `OPENING_SLOT_COUNT` from `2` → `4` so the decorative Surah header takes 4 slots, leaving 5 content rows (matching Kariana pages 1 & 2)
- [ ] **1B** — Cream/yellow page background: `canvas.setBackgroundColor('#fdf8e0', ...)` everywhere white is used; update `default.svg` rect fill
- [ ] **1C** — Bangla translation right-align: change `textAlign: 'center'` → `textAlign: 'right'`, anchor to right edge
- [ ] **1D** — Bengali digit page numbers: add `_toBengaliDigits()` helper and apply to footer `— ১ —` instead of `— 1 —`

**Expected result after Stage 1:**
> - Page 1 = Surah Fatiha with decorative header + exactly 5 Arabic rows ✅
> - Page 2 = Surah Baqarah opening header + 5 rows (ayat 1–4) ✅
> - Page 3 onward = standard 9-row pages ✅
> - Background is cream, page numbers are Bengali ✅
> - Total page count drops from 1441 → ~807 ✅

**Verify by:** Comparing app pages 1, 2, 3 with Kariana PDF pages 12, 13, 14

---

---
# STAGE 2 — Tajweed Symbol Strip
## "Add the rule markers above every Arabic row"
---

**Files to change:** `public/js/quran-editor.js`

**What changes:**
- [ ] **2A** — Default Bengali digit markers in symbol strip: even without user-uploaded SVGs, the thin strip above each Arabic row should show Bengali line numbers (১ ২ ৩...) and standard directional arrows matching the Kariana format
- [ ] **2B** — Gold divider lines: draw a thin `#c8a96e` horizontal line `0.4px` thick at the bottom of each symbol strip zone to visually separate rows
- [ ] **2C** — Symbol strip height confirmation: verify `symH: 11.5` in `SVG_TEMPLATE_ROWS` is correctly proportioned; adjust if Arabic text is being clipped at top

**Expected result after Stage 2:**
> - Every Arabic row has a thin symbol strip above it with Bengali digits ✅
> - Gold horizontal lines cleanly separate each row section ✅
> - Layout matches the "striped" look of the Kariana PDF ✅

**Verify by:** Comparing any content page with Kariana PDF page 14

---

---
# STAGE 3 — Header, Footer & Auto Borders
## "Complete the page metadata and smart border logic"
---

**Files to change:** `public/js/quran-editor.js`, `public/templates/`

**What changes:**
- [ ] **3A** — Full SURAH_META table: add a JavaScript object with all 114 Surahs including `{ type, ayahCount, ruku, manzil }` data
- [ ] **3B** — Enriched footer bar: replace `— 1 —` with the full Kariana-style footer:
  `২ সূরাতুল বাক্বারাহ  ●  মাদানী  ●  ৮  ●  আয়াত ২৮৬ রুকু ৪০  ●  মঞ্জিল ১`
- [ ] **3C** — Three-zone header bar: Para number (left) | Center branding (configurable) | Surah name + ayah range (right)
- [ ] **3D** — Auto border switching: implement logic so the rendering engine automatically uses `ornate-border.svg` for Surah opening pages and `standard-border.svg` for all others (no manual page override needed)
- [ ] **3E** — Arabic font size fine-tuning: use `arZoneH × 0.73` for 9-row pages and `arZoneH × 0.65` for 5-row opening pages

**Expected result after Stage 3:**
> - Footer shows complete Surah info on every page ✅
> - Header shows Para number and Surah/ayah range ✅
> - Opening pages auto-apply ornate border, others get thin standard border ✅
> - Font sizes precisely match Kariana density ✅

**Verify by:** Full pass comparing pages 1–20 against the PDF

---

---
# STAGE 4 — PDF Export Pipeline
## "Export a print-ready PDF file that matches the canvas"
---

**Files to change:** `app/Http/Controllers/PdfExportController.php`, `resources/views/pdf/`

**What changes:**
- [ ] **4A** — Sync mPDF geometry with `SVG_TEMPLATE_ROWS`: the server-side renderer must use the exact same row coordinates, font sizes, and zone heights as the Fabric.js canvas
- [ ] **4B** — Apply cream background in mPDF: set page background color to `#fdf8e0`
- [ ] **4C** — RTL direction for Arabic in mPDF: ensure Arabic text uses `direction: rtl` and proper OpenType font features
- [ ] **4D** — Include Tajweed symbol strip in mPDF: render the symbol strip zone as a separate HTML element per row
- [ ] **4E** — Layered SVG export: update the SVG export with 5 named layers (Background, Symbols, Arabic Text, Bangla Text, Header/Footer) for Adobe InDesign/Illustrator compatibility
- [ ] **4F** — Automated PDF Bookmarks: inject mPDF Outlines (bookmarks) for each Surah, Para, and Manzil for professional digital navigation

**Expected result after Stage 4:**
> - "PDF রপ্তানি" button produces a print-ready PDF matching canvas ✅
> - PDF has navigable bookmarks (Surah → Para → Ayah) ✅
> - SVG export opens in Illustrator with editable named layers ✅

**Verify by:** Export PDF, open in Adobe Reader, compare with Kariana PDF side by side

---

---
# STAGE 5 — Future Features & UX Polish
## "Power-user tools for professional publishers"
---

**Files to change:** `public/js/quran-editor.js`, `resources/views/editor/index.blade.php`

**What changes:**
- [ ] **5A** — Tajweed color-coding (per character): load a Tajweed rules JSON and apply color overlays to specific Arabic letters (Red=Ikhfa, Green=Ghunna, Blue=Madd, etc.)
- [ ] **5B** — Advanced proofing grid: add `G` keyboard shortcut to toggle a millimeter-grid overlay on the canvas for pixel-level comparison with the reference PDF
- [ ] **5C** — Font ligature debugger: click any Arabic word to open an inspector showing which OpenType features fired, what glyphs were selected, and the final bounding box measurements
- [ ] **5D** — Per-page editing UI improvements:
  - Yellow dot indicator in page sidebar for pages with custom overrides
  - **"Reset to master"** button per page  
  - Keyboard shortcut `E` to open page override editor for current page
- [ ] **5E** — Slot guide shortcut: `G` to toggle `showSlotGuides` for row zone visualization without opening the builder panel
- [ ] **5F** — Live page count estimator: show the expected total page count update in real-time as font size or row count settings are changed

**Expected result after Stage 5:**
> - Full professional publisher toolkit available in the UI ✅
> - Tajweed color rules visible on canvas ✅
> - Designers can verify layout precision with the proofing grid ✅

---

## Summary of All Stages

```
STAGE 1 ─ Core Layout (pages look right: 5-row opening, cream bg, Bengali digits)
   ↓ done →
STAGE 2 ─ Tajweed Symbol Strip (markers above rows, gold divider lines)
   ↓ done →
STAGE 3 ─ Header / Footer / Auto Borders (full metadata, smart border logic)
   ↓ done →
STAGE 4 ─ PDF Export (print-ready file, bookmarks, layered SVG)
   ↓ done →
STAGE 5 ─ Future Features (Tajweed colors, proofing grid, inspector tools)
```

> [!IMPORTANT]
> Tell me **"Stage 1 শুরু করো"** and I will implement all Stage 1 items, take browser screenshots, compare with the Kariana PDF, and confirm results before you move to Stage 2.
