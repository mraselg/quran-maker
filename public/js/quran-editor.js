/* ═══════════════════════════════════════════════════════════
   কুরআন পাবলিশার v7.0 — Visual Template Builder + Drag & Drop
   Default: clean white page — 9 Arabic rows, no SVG background
   Template Builder: full-page Fabric.js interactive preview
   Main Editor:      Edit Mode for draggable design elements
═══════════════════════════════════════════════════════════ */

/* ── Base URL helper — resolves paths under any subfolder (XAMPP subfolder support) ── */
function _url(path) {
    const base = (window.APP_BASE || '').replace(/\/$/, '');
    return base + path;
}

/* ── Universal download helper — ensures proper extension & cross-browser support ──
   Works for SVG strings, Blob objects, and Data URLs.
   Always appends the file to document.body then removes it (required in Firefox).
   IMPORTANT: Always pass an explicit mimeType so the browser honours `a.download`. */
function _downloadFile(content, filename, mimeType) {
    let url;
    let blobUrl = false;

    if (typeof content === 'string' && content.startsWith('data:')) {
        // Already a data URI — use as-is
        url = content;
    } else {
        // For Blob objects AND plain strings: always create a new Blob with
        // the explicit mimeType. Without this, browsers on localhost often
        // ignore a.download and save the file as a random UUID with no extension.
        let bytes;
        if (content instanceof Blob) {
            // Re-wrap with correct MIME type
            bytes = content;
        } else {
            // Plain text / SVG string
            bytes = new Blob([content], { type: mimeType || 'application/octet-stream' });
        }
        const typed = new Blob([bytes], { type: mimeType || 'application/octet-stream' });
        url = URL.createObjectURL(typed);
        blobUrl = true;
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;   // browser uses this name including extension
    document.body.appendChild(a);
    a.click();
    // Small delay before cleanup so the browser initiates the download
    setTimeout(() => {
        document.body.removeChild(a);
        if (blobUrl) URL.revokeObjectURL(url);
    }, 500);
}


/* ── Legacy wrapper kept so svg-exporter.js still compiles ── */
function downloadSVG(svgString, filename) {
    _downloadFile(svgString, filename, 'image/svg+xml;charset=utf-8');
}

/* ── Fonts ── */
const ARABIC_FONT = 'ExcellentArabic';
const BANGLA_FONT = 'Hind Siliguri, Arial';

/* ── Arabic Digit Reversal (Canvas 2D BiDi fix) ──
   In Fabric.js RTL canvas, digit bytes are drawn L→R on the canvas pixel buffer.
   So "١٥" (U+0661 U+0665) draws left=١, right=٥ → visually reads as "١٥" in LTR
   BUT the surrounding Arabic is RTL, so the whole word is right-anchored.
   When the numeral group is at the END of an Arabic phrase it visually appears
   BEFORE the phrase in RTL reading order — and Canvas 2D renders it byte-by-byte
   meaning 1→5 direction, so "١٥" looks like "51" (digit order reversed from reading).
   Fix: reverse the byte order of each numeral group so Canvas renders them correctly.
   "١٥" → stored as "٥١" → Canvas draws ٥ then ١ → visually reads R→L as ١٥ ✓ */
function reverseArabicDigits(text) {
    // Reverse each consecutive run of Arabic-Indic or Extended Arabic-Indic digits
    return text.replace(/[\u0660-\u0669\u06F0-\u06F9]+/g, m => m.split('').reverse().join(''));
}

/* ── Row Types ── */
const ROW_TYPES = {
    header: { label: 'হেডার (বিসমিল্লাহ/সূরা)', color: '#7c3aed', icon: '🏛' },
    symbol: { label: 'সিম্বল / চিহ্ন', color: '#9333ea', icon: '◉' },
    arabic: { label: 'আরবি টেক্সট', color: '#15803d', icon: 'ع' },
    bangla: { label: 'বাংলা অর্থ', color: '#1d4ed8', icon: 'ব' },
    gap: { label: 'ফাঁকা স্থান', color: '#6b7280', icon: '—' },
    footer: { label: 'ফুটার (পেজ নম্বর ইত্যাদি)', color: '#b45309', icon: '▬' },
    border: { label: 'বর্ডার / ডেকোরেশন', color: '#be185d', icon: '⬛' },
};

/* ── Tajweed Rules ── */
const DEFAULT_RULES = [
    { id: 'madd-1', name: 'মাদ্দ ১ আলিফ', symbol: '①', color: '#CC0000', enabled: true, category: 'madd' },
    { id: 'madd-2', name: 'মাদ্দ ২ আলিফ', symbol: '②', color: '#CC2200', enabled: true, category: 'madd' },
    { id: 'madd-4', name: 'মাদ্দ ৪-৫', symbol: '④', color: '#0000CC', enabled: true, category: 'madd' },
    { id: 'madd-6', name: 'মাদ্দ ৬', symbol: '⑥', color: '#006600', enabled: true, category: 'madd' },
    { id: 'ghunna', name: 'গুন্নাহ', symbol: 'غ', color: '#660066', enabled: true, category: 'tajweed' },
    { id: 'ikhfa', name: 'ইখফা', symbol: 'خ', color: '#994400', enabled: true, category: 'tajweed' },
    { id: 'idgham', name: 'ইদগাম', symbol: 'د', color: '#008888', enabled: true, category: 'tajweed' },
    { id: 'iqlab', name: 'ইকলাব', symbol: 'ق', color: '#880000', enabled: true, category: 'tajweed' },
    { id: 'waqf-laz', name: 'ওয়াকফ লাজিম', symbol: 'م', color: '#CC0000', enabled: true, category: 'waqf' },
    { id: 'waqf-jaiz', name: 'ওয়াকফ জায়িয', symbol: 'ج', color: '#006600', enabled: true, category: 'waqf' },
    { id: 'sajdah', name: 'সিজদার আয়াত', symbol: '◆', color: '#006622', enabled: true, category: 'special' },
    { id: 'ruku', name: 'রুকু চিহ্ন', symbol: 'ع', color: '#222222', enabled: true, category: 'special' },
    { id: 'hizb', name: 'হিযব', symbol: '۞', color: '#CC6600', enabled: true, category: 'special' },
];

/* ── Top Symbol Rules (12 standard Quran tajweed upper markers) ──
   These appear in a thin strip ABOVE each Arabic text row, matching
   the printed Quran format shown in the reference photo.
   Upload custom SVG for each slot via the Symbol tab in the right panel. */
const DEFAULT_TOP_SYMBOLS = [
    {
        id: 'ts01', rank: 1, name: 'হারকাতে ১ মাদ্দ', shortName: '১', symbol: '১',
        color: '#0d0d0d', enabled: false, svgData: null,
        desc: 'যে সব হরফের উপর ১ লেখা আছে সেখানে ১ আলিফ অবশ্যই টেনে পড়তে হবে। না টানলে তিলাওয়াত হারাম হবে। ৬ স্থানে ব্যবহার: যেরের বামে ইয়া সাকিন, খাড়া যের, পেশের বামে ওয়াও সাকিন, উল্টা পেশ, যবরের বামে আলিফ, খাড়া যবর।'
    },
    {
        id: 'ts02', rank: 2, name: 'সাকিনে ২ মাদ্দ', shortName: '২', symbol: '২',
        color: '#0d0d0d', enabled: false, svgData: null,
        desc: 'সাকিন অক্ষরের উপর ২: দম ফেললে ২ আলিফ টানতে হবে। দম না ফেললে টানতে হবে না। ی ও و -এর উপর সাকিন + ডানে যবর + বামে আরযী সাকিন হলে ২ আলিফ টানতে হয়।'
    },
    {
        id: 'ts03', rank: 3, name: 'হারকাতে ৩ (লম্বা হামযাহ)', shortName: '৩', symbol: '৩',
        color: '#0d0d0d', enabled: false, svgData: null,
        desc: 'মাদ্দে আছলীর বামে লম্বা হামযাহ্ থাকলে ৩ আলিফ টানতে হবে (দম ফেললে ১ আলিফ)। যে সব হারকতে ৩ আলিফ টানতে হবে সেখানে ৩ লেখা আছে।'
    },
    {
        id: 'ts04', rank: 4, name: 'হারকাতে ৪ (গোল হামযাহ)', shortName: '৪', symbol: '৪',
        color: '#0d0d0d', enabled: false, svgData: null,
        desc: 'মাদ্দে আছলীর বামে একই শব্দে গোল হামযাহ্ থাকলে ৪ আলিফ টানতে হবে। যে সব হারকতে ৪ আলিফ টানতে হবে সেখানে ৪ লেখা আছে।'
    },
    {
        id: 'ts05', rank: 5, name: 'তানউইনে ১ (ওয়াক্ফ)', shortName: '১̲', symbol: '১',
        color: '#333', enabled: false, svgData: null,
        desc: 'যে সব আয়াতের শেষে দুই যবর পাওয়া যায় এবং বামে ওয়াক্ফ চিহ্ন থাকবে — দম ফেললে ১ আলিফ টানতে হয়। দম না ফেললে মাদ্দ বাতিল।'
    },
    {
        id: 'ts06', rank: 6, name: 'আরযী ৩ মাদ্দ', shortName: '৩̣', symbol: '৩',
        color: '#444', enabled: false, svgData: null,
        desc: '৬ প্রকার মাদ্দে আছলীর বামে আরযী সাকিন: দম ফেললে ৩ আলিফ, না ফেললে ১ আলিফ। যের, যবর, পেশ অথবা ২ যের, ২ পেশ পাইলে।'
    },
    {
        id: 'ts07', rank: 7, name: 'গুন্নাহ (বাতি চিহ্ন)', shortName: '💡', symbol: '💡',
        color: '#e65c00', enabled: false, svgData: null,
        desc: 'নুন ও মীম অক্ষরে তাশদীদ থাকলে ওয়াজিব গুন্নাহ্। নাকে গুন গুন শব্দ। ১৫ স্থানে: মীম-নুন তাশদীদ, নুন সাকিনের বামে বা/ইয়া/ওয়াও, মীম সাকিনের বামে বা।'
    },
    {
        id: 'ts08', rank: 8, name: 'ক্বলক্বলাহ (মিনার চিহ্ন)', shortName: '⌂', symbol: '⌂',
        color: '#1a5e30', enabled: false, svgData: null,
        desc: '৫ অক্ষরে সুকুন: ب বা, ج জীম, د দাল, ط ত্ব, ق ক্বফ — প্রতিধ্বনি সৃষ্টি করে পড়তে হবে। আরযী সাকিনেও ক্বলক্বলাহ করতে হবে। সামনে পড়ে গেলে না।'
    },
    {
        id: 'ts09', rank: 9, name: 'তাফখিম (শাপলা চিহ্ন)', shortName: '✿', symbol: '✿',
        color: '#8b0033', enabled: false, svgData: null,
        desc: 'যবর থাকলেও আকার উচ্চারণ হবে না। ১০টি জায়গায়: ط ত্ব, ظ জ্ব, غ গঈন, ق ক্বফ, ص ছদ, ض দ্বদ, خ খ, ر র এবং আল্লাহ শব্দের লামের পূর্বে যবর বা পেশ থাকলে।'
    },
    {
        id: 'ts10', rank: 10, name: 'সাফির (পাতা চিহ্ন)', shortName: '❧', symbol: '❧',
        color: '#1a7a1a', enabled: false, svgData: null,
        desc: 'শিস দিয়ে উচ্চারণ। ৩ অক্ষর: ز যা, س সীন, ص ছদ। এই ৩ অক্ষর সর্ব অবস্থায় শিস দিয়ে উচ্চারণ করতে হবে।'
    },
    {
        id: 'ts11', rank: 11, name: 'ইখফা (ং চিহ্ন)', shortName: 'ং', symbol: 'ং',
        color: '#0d0d0d', enabled: false, svgData: null,
        desc: 'নুন সাকিন বা তানবীনের বামে ১৫ অক্ষর: ত থ জ দ ذ ز সীন ش ص ض ط ظ ফ ক্ব ك — নুনের মাখরাজ গোপন করে বাংলা ং এর মত আওয়াজ দিয়ে পড়তে হবে।'
    },
    {
        id: 'ts12', rank: 12, name: 'আরযী সাকিন (⊙ চিহ্ন)', shortName: '⊙', symbol: '⊙',
        color: '#0d0d0d', enabled: false, svgData: null,
        desc: 'দম ফেলার সময় যের/যবর/পেশ অথবা দুই যের/দুই পেশ থাকলে মনে মনে সাকিন ধরে পড়তে হয়। ৭ স্থানে: যের, যবর, পেশ, দুই যের, দুই পেশ ওয়ালা অক্ষরে দম ফেললে; গোল তা ও হা-এ দমির।'
    },
];



const SURAH_NAMES = ['', 'আল-ফাতিহা', 'আল-বাকারা', 'আল-ইমরান', 'আন-নিসা', 'আল-মায়িদা', 'আল-আনআম', 'আল-আরাফ', 'আল-আনফাল', 'আত-তাওবাহ', 'ইউনুস', 'হুদ', 'ইউসুফ', 'আর-রাদ', 'ইবরাহিম', 'আল-হিজর', 'আন-নাহল', 'আল-ইসরা', 'আল-কাহফ', 'মারইয়াম', 'তা-হা', 'আল-আম্বিয়া', 'আল-হাজ্জ', 'আল-মুমিনুন', 'আন-নূর', 'আল-ফুরকান', 'আশ-শুআরা', 'আন-নামল', 'আল-কাসাস', 'আল-আনকাবুত', 'আর-রুম', 'লুকমান', 'আস-সাজদাহ', 'আল-আহযাব', 'সাবা', 'ফাতির', 'ইয়াসিন', 'আস-সাফফাত', 'সাদ', 'আয-যুমার', 'গাফির', 'ফুসসিলাত', 'আশ-শুরা', 'আয-যুখরুফ', 'আদ-দুখান', 'আল-জাসিয়া', 'আল-আহকাফ', 'মুহাম্মাদ', 'আল-ফাতহ', 'আল-হুজুরাত', 'কাফ', 'আয-যারিয়াত', 'আত-তুর', 'আন-নাজম', 'আল-কামার', 'আর-রহমান', 'আল-ওয়াকিয়া', 'আল-হাদিদ', 'আল-মুজাদালা', 'আল-হাশর', 'আল-মুমতাহানা', 'আস-সাফ', 'আল-জুমুআ', 'আল-মুনাফিকুন', 'আত-তাগাবুন', 'আত-তালাক', 'আত-তাহরিম', 'আল-মুলক', 'আল-কলম', 'আল-হাক্কা', 'আল-মাআরিজ', 'নূহ', 'আল-জিন', 'আল-মুযযাম্মিল', 'আল-মুদ্দাস্সির', 'আল-কিয়ামাহ', 'আল-ইনসান', 'আল-মুরসালাত', 'আন-নাবা', 'আন-নাযিআত', 'আবাসা', 'আত-তাকভির', 'আল-ইনফিতার', 'আল-মুতাফফিফিন', 'আল-ইনশিকাক', 'আল-বুরুজ', 'আত-তারিক', 'আল-আলা', 'আল-গাশিয়া', 'আল-ফাজর', 'আল-বালাদ', 'আশ-শামস', 'আল-লাইল', 'আদ-দুহা', 'আশ-শারহ', 'আত-তিন', 'আল-আলাক', 'আল-কদর', 'আল-বাইয়্যিনাহ', 'আয-যালযালাহ', 'আল-আদিয়াত', 'আল-কারিআহ', 'আত-তাকাসুর', 'আল-আসর', 'আল-হুমাযা', 'আল-ফিল', 'কুরাইশ', 'আল-মাউন', 'আল-কাওসার', 'আল-কাফিরুন', 'আন-নাসর', 'আল-মাসাদ', 'আল-ইখলাস', 'আল-ফালাক', 'আন-নাস'];

// Para (Juz) — Surah start mapping (surah number where each para begins)
// Para N contains surqhs starting from SURAH_PARA_START[N]
const PARA_NAMES = ['', 'আলিফ-লাম-মিম', 'সায়াকুল', 'তিলকার রুসুল', 'লান-তানালুল', 'ওয়াল মুহসানাত', 'লা ইউহিব্বুল্লাহ', 'ওয়া ইযা সামিউ', 'ওয়া লাও আন্নানা', 'কালাল মালাউ', 'ওয়া আলামু', 'ইয়াতাযির্রুনা', 'ওয়ামা মিন দাব্বাহ', 'ওয়ামা উবার্রিউ', 'রুব্বামা', 'সুবহানাল্লাযি', 'কাল আলাম', 'ইকতারাবা', 'ওয়া কালাল্লাযিনা', 'ওয়ামান আহসানু', 'উতলু মা উহিয়া', 'ওয়ামাই-ইয়াকনুত', 'ওয়ামালি', 'ফামান আযলামু', 'ইলাইহি ইউরাদ্দু', 'হা মিম', 'কালা ফামা', 'কাদ সামিআল্লাহু', 'তাবারাকাল্লাযি', 'আম্মা ইয়াতাসাআলুন'];
// Surah number at which each Para starts (1-indexed, para 0 unused)
const PARA_SURAH_START = [0, 1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 12, 15, 17, 18, 21, 23, 25, 27, 29, 33, 36, 39, 41, 46, 51, 58, 67, 78];
// Exact [surah, verse] where each Para (Juz) begins (1-indexed, index 0 unused)
const PARA_START = [
    null,
    [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
    [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
    [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1]
];


/* ──────────────────────────────────────────────────────────
   DEFAULT TEMPLATE — exact geometry from
   "quran page qufoult template.svg"
   viewBox: 0 0 420.12 630.27
   9 content rows. Each row has 3 labelled rects:
     • top_symbol_of_the_line_arabic  (h=11.5)
     • arabic_text                    (h=39.72)
     • bangla_meaning                 (h=13.26)
   Content column: x=7.67, w=404.63
────────────────────────────────────────────────────────── */

/* Exact SVG row data — extracted from layer IDs */
const SVG_TEMPLATE_ROWS = [
    { symTop: 25.39, symH: 11.5, arTop: 36.89, arH: 39.72, bnTop: 76.61, bnH: 13.26 },
    { symTop: 89.87, symH: 11.5, arTop: 101.37, arH: 39.72, bnTop: 141.09, bnH: 13.26 },
    { symTop: 154.35, symH: 11.5, arTop: 165.85, arH: 39.72, bnTop: 205.57, bnH: 13.26 },
    { symTop: 219.00, symH: 11.5, arTop: 230.50, arH: 39.72, bnTop: 270.22, bnH: 13.26 },
    { symTop: 283.48, symH: 11.5, arTop: 294.98, arH: 39.72, bnTop: 334.70, bnH: 13.26 },
    { symTop: 347.96, symH: 11.5, arTop: 359.46, arH: 39.72, bnTop: 399.18, bnH: 13.26 },
    { symTop: 412.44, symH: 11.5, arTop: 423.94, arH: 39.72, bnTop: 463.66, bnH: 13.26 },
    { symTop: 477.10, symH: 11.5, arTop: 488.60, arH: 39.72, bnTop: 528.32, bnH: 13.26 },
    { symTop: 541.58, symH: 11.5, arTop: 553.08, arH: 39.72, bnTop: 592.80, bnH: 13.26 },
];
const SVG_CONTENT_X = 7.67;
const SVG_CONTENT_W = 404.63;
const SVG_PAGE_W = 420.12;
const SVG_PAGE_H = 630.27;
const SVG_HEADER_TOP = 7.50;
const SVG_HEADER_BOTTOM = 25.00;   // ornament / surah-name band

function makeDefaultTemplate() {
    const arCfg = {
        fontSize: 0, autoFit: true, color: '#0d0d0d', align: 'right',
        showBangla: true, banglaFontSize: 0, banglaAutoFit: true, banglaColor: '#333'
    };

    const rows = [
        {
            id: 'row-header', type: 'header', label: 'হেডার (সূরা নাম)',
            heightPct: 100 * (SVG_HEADER_BOTTOM - SVG_HEADER_TOP) / SVG_PAGE_H,
            visible: true,
            _absTop: SVG_HEADER_TOP,
            _absH: SVG_HEADER_BOTTOM - SVG_HEADER_TOP,
            config: {
                text: '', autoSurah: true, fontSize: 8, color: '#b3005a',
                align: 'center', fontFamily: 'Hind Siliguri, Arial', bold: false
            }
        },
    ];

    SVG_TEMPLATE_ROWS.forEach((r, i) => {
        // Full slot height = symbol zone + arabic zone + bangla zone (as designed in SVG)
        const totalH = r.symH + r.arH + r.bnH;  // 64.48 px

        rows.push({
            id: 'row-ar-' + (i + 1),
            type: 'arabic',
            label: 'আরবি ' + (i + 1),
            heightPct: 100 * totalH / SVG_PAGE_H,
            visible: true,
            // absolute positions — used by renderPage() to paint exactly inside each zone
            _absTop: r.symTop,   // slot starts at top-symbol zone
            _absH: totalH,
            // native SVG zone heights (renderer honours these when svgLayout=true)
            _svgSymH: r.symH,
            _svgArH: r.arH,
            _svgBnH: r.bnH,
            config: { ...arCfg },
        });
    });

    rows.push({
        id: 'row-footer', type: 'footer', label: 'ফুটার (পেজ নম্বর)',
        heightPct: 2, visible: true,
        _absTop: 606, _absH: 16.27,
        config: {
            showPageNum: true, pageNumFontSize: 7, pageNumColor: '#b3005a',
            pageNumAlign: 'center',
            customText: '', customFontSize: 6, customColor: '#888', customAlign: 'center'
        },
    });

    return {
        id: 'tpl-' + Date.now(),
        name: 'মাস্টার টেমপ্লেট',
        pageSize: { w: SVG_PAGE_W, h: SVG_PAGE_H },
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        svgFile: _url('/templates/default.svg'),

        designElements: [],
        rows: rows,
        surahColor: '#b3005a',
        showSlotGuides: false,
        banglaFont: { color: '#444444' },
        arabicFont: { color: '#0d0d0d', letterSpacing: 0 },

        // ── Global font-size overrides (0 = auto/ratio-based) ──
        // These are exposed in the master template panel so the user
        // can fine-tune font density without touching per-row configs.
        globalArabicFontSize: 0,    // px; 0 = auto (arZoneH × 0.73)
        globalBanglaFontSize: 0,    // px; 0 = auto (bnZoneH × 0.72)
        globalMeasureFontSize: 0,    // px; 0 = auto (arZoneH × 0.42) — controls line density
        rowsPerPage: 9,    // 7–12; rebuilds pagination when changed
    };
}

/* ──────────────────────────────────────────────────────────
   buildSlotsFromRows — Convert template rows[] → slot objects
   Uses _absTop/_absH from SVG coordinates when available
────────────────────────────────────────────────────────── */
function buildSlotsFromRows(tpl) {
    const { pageSize, margins, rows } = tpl;
    // Use SVG content area if svgFile is set, otherwise fall back to margins
    const useSvg = !!tpl.svgFile;
    const colX = useSvg ? SVG_CONTENT_X : margins.left;
    const colW = useSvg ? SVG_CONTENT_W : (pageSize.w - margins.left - margins.right);
    const areaH = pageSize.h - margins.top - margins.bottom;

    let y = margins.top;
    const slots = [];
    let arabicSlotIndex = 0;

    for (const row of rows) {
        if (!row.visible) continue;
        // Prefer absolute positions from SVG template
        const rowTop = row._absTop != null ? row._absTop : y;
        const rowH = row._absH != null ? row._absH : (row.heightPct / 100) * areaH;
        const slot = {
            id: row.id,
            type: row.type,
            label: row.label,
            config: row.config || {},
            top: rowTop,
            bottom: rowTop + rowH,
            height: rowH,
            arabicIdx: row.type === 'arabic' ? arabicSlotIndex++ : -1,
            visible: row.visible,
        };
        // ── Pass SVG-native zone heights for pixel-perfect alignment ──
        if (row._svgSymH !== undefined) slot._svgSymH = row._svgSymH;
        if (row._svgArH !== undefined) slot._svgArH = row._svgArH;
        if (row._svgBnH !== undefined) slot._svgBnH = row._svgBnH;
        slots.push(slot);
        y = rowTop + rowH;   // track running Y for ratio-based rows
    }

    return { slots, arabicRowCount: arabicSlotIndex, colX, colW, pageW: pageSize.w, pageH: pageSize.h };
}

/* ══════════════════════════════════════════════════════════
   MAIN ALPINE.JS APP
══════════════════════════════════════════════════════════ */
function quranEditor() {
    return {
        allVerses: [],
        arabicLines: [],
        pages: [],
        currentPage: 0,
        isLoading: true,
        isExporting: false,
        exportProgress: 0,
        activeTab: 'template',
        zoom: 0.72,   // will be overridden to fitPage on init
        _isPanning: false,  // space+drag pan mode
        selectedSurah: 0,
        selectedPara: 0,
        renderTimer: null,
        svgText: null,
        surahNames: SURAH_NAMES,
        paraNames: PARA_NAMES,
        showShortcuts: false,
        editMode: false,

        // ── বাংলা দেখানো নিয়ন্ত্রণ (Rules tab সুইচ) ──
        showBanglaMeaning: true,   // বাংলা অর্থ
        showBanglaUccharon: false,  // বাংলা উচ্চারণ

        // ── Edit Panel (appears in right panel when editMode=true + object selected) ──
        selectedCanvasObj: null,    // reference to the Fabric.js object
        editPanelData: null,    // { type, itemIdx, field, fontSize, charSpacing, color, text }

        // Template Builder state
        showBuilder: false,
        builderDraft: null,
        selectedRowId: null,
        rowTypes: ROW_TYPES,
        builderActiveTab: 'layout',
        editingPageIdx: null,
        builderEditingTplId: null,   // which saved template we're editing in builder
        builderPreviewPageIdx: 0,    // which page to preview in builder
        builderFabricCanvas: null,
        _bScale: 1,

        // Per-page overrides
        pageOverrides: {},

        // Design element selection (builder)
        selectedElId: null,

        // ── Multi-Template Library ─────────────────────────────
        // All templates live here. isMaster:true = the master template.
        savedTemplates: (() => {
            const def = makeDefaultTemplate();
            def.isMaster = true;
            def.assets = [];   // { id, name, type:'svg'|'png', data:base64 }
            return [def];
        })(),
        showTemplateLib: false,

        // Advanced export
        exportRange: { mode: 'all', fromPage: 1, toPage: 1 },
        showExportModal: false,
        showFontGuide: false,

        // Rules + export opts
        rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
        exportOpts: { cropMarks: true, bleed: true, cmyk: false, quality: 4 },
        fabricCanvas: null,
        uploadedFonts: [],

        // ── Top Symbol Row (12 tajweed marker slots) ──
        showTopSymbolRow: false,   // toggles the symbol strip above each Arabic row
        topSymbolRowH: 16,      // height in canvas-px of the symbol strip
        topSymbols: JSON.parse(JSON.stringify(DEFAULT_TOP_SYMBOLS)),
        tajweedFontStatus: 'idle',  // 'idle' | 'building' | 'ready' | 'error'

        /* ── Computed ── */

        // masterTemplate — always the isMaster:true entry in savedTemplates
        get masterTemplate() {
            return this.savedTemplates.find(t => t.isMaster) || this.savedTemplates[0];
        },
        get arabicRowCount() {
            return this.masterTemplate.rows.filter(r => r.visible && r.type === 'arabic').length;
        },
        get surahList() {
            return SURAH_NAMES.slice(1).map((name, i) => ({ number: i + 1, name }));
        },
        get paraList() {
            return Array.from({ length: 30 }, (_, i) => ({ number: i + 1, name: PARA_NAMES[i + 1] || ('পারা ' + (i + 1)) }));
        },
        get pageCountEstimate() {
            if (!this.arabicLines.length || !this.arabicRowCount) return 0;
            return Math.ceil(this.arabicLines.length / this.arabicRowCount);
        },

        /* ════════════════════════
           INIT
        ════════════════════════ */
        async init() {
            await this.preloadFont();
            await this.loadTopSymbolsFromServer();  // hydrate saved SVGs first
            await this.loadVerses();
            this.$nextTick(() => {
                this.initCanvas();
                this.renderPage();
                this.initKeyboard();
                // Default to fit-page after everything renders
                this.$nextTick(() => this.fitPage());
            });
        },

        /* ════════════════════════
           TOP SYMBOL PERSISTENT STORAGE
        ════════════════════════ */

        /* Fetch all saved slot SVGs from server → hydrate topSymbols state */
        async loadTopSymbolsFromServer() {
            try {
                const r = await fetch(_url('/api/topsymbols'));
                if (!r.ok) return;
                const list = await r.json();   // [{ index, path }, ...]

                // Fetch each SVG text and convert to base64 data URI so Fabric
                // can load it via loadSVGFromURL without any path/CORS issues
                await Promise.all(list.map(async item => {
                    const sym = this.topSymbols[item.index];
                    if (!sym) return;
                    try {
                        const svgRes = await fetch(item.path);
                        const svgText = await svgRes.text();
                        const b64 = btoa(unescape(encodeURIComponent(svgText)));
                        sym.svgPath = item.path;
                        sym.svgData = 'data:image/svg+xml;base64,' + b64;
                        sym.enabled = true;
                    } catch (_) {
                        // Fallback: use server path directly
                        sym.svgPath = item.path;
                        sym.svgData = item.path;
                        sym.enabled = true;
                    }
                }));

                // Auto-enable the symbol row if any slots have SVGs
                if (list.length > 0) {
                    this.showTopSymbolRow = true;
                    // ── Auto-build TajweedSymbols font from restored SVGs ──
                    if (typeof window.rebuildTajweedFont === 'function') {
                        this.tajweedFontStatus = 'building';
                        window.rebuildTajweedFont(this.topSymbols)
                            .then(b64 => {
                                this.tajweedFontStatus = b64 ? 'ready' : 'idle';
                                if (b64) console.log('[TajweedFont] ✅ Auto-built on page load');
                            })
                            .catch(e => {
                                this.tajweedFontStatus = 'error';
                                console.warn('[TajweedFont] Auto-build failed:', e);
                            });
                    }
                }
            } catch (e) {
                console.warn('Top symbol load error', e);
            }
        },


        /* Upload SVG for one symbol slot — saves to server, keeps in state */
        async uploadSymbolSvg(index, event) {

            const file = event.target?.files?.[0];
            if (!file) return;

            // 1) Read as Data URL for immediate in-memory rendering (no CORS issues)
            const dataUrl = await new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = e => res(e.target.result);
                reader.onerror = rej;
                reader.readAsDataURL(file);
            });

            const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
            const fd = new FormData();
            fd.append('svg', file);
            fd.append('index', index);

            try {
                const r = await fetch(_url('/api/upload-topsymbol'), {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrf },
                    body: fd,
                });
                if (!r.ok) throw new Error('HTTP ' + r.status);
                const data = await r.json();
                if (!data.success) throw new Error('Upload failed');

                // Store data URI for rendering + server path for persistence
                const sym = this.topSymbols[index];
                sym.svgPath = data.path;     // server URL (used on reload)
                sym.svgData = dataUrl;       // base64 data URI (used for rendering)
                sym.enabled = true;
                this.showTopSymbolRow = true;
                this.debouncedRender();
                this.showToast('✅ সিম্বল সেভ হয়েছে (slot ' + (index + 1) + ')', 'success');
            } catch (e) {
                // Even if server fails, show locally from the data URI
                const sym = this.topSymbols[index];
                sym.svgData = dataUrl;
                sym.enabled = true;
                this.showTopSymbolRow = true;
                this.debouncedRender();
                this.showToast('⚠ লোকাল প্রিভিউ দেখাচ্ছে (সার্ভার সেভ ব্যর্থ): ' + e.message, 'error');
            }

            // Reset file input so same file can be re-selected
            event.target.value = '';
        },


        /* Clear/remove a symbol slot — deletes from server if possible */
        async clearSymbolSvg(index) {
            const sym = this.topSymbols[index];
            if (!sym) return;

            // Optimistically clear UI
            sym.svgData = null;
            sym.svgPath = null;
            sym.enabled = false;
            this.debouncedRender();

            // Tell server to delete (best-effort — ignore failures)
            try {
                const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
                await fetch(_url('/api/upload-topsymbol') + '?index=' + index + '&_method=DELETE', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrf, 'X-Delete-Slot': '1' },
                });
            } catch (_) { }

            this.showToast('🗑 সিম্বল সরানো হয়েছে', 'info');
        },

        async preloadFont() {
            // Step 1: Wait for the browser's full FontFaceSet to be ready
            try { await document.fonts.ready; } catch (e) { }

            // Step 2: Explicitly request both fonts at the sizes we'll use
            const fontLoads = [
                document.fonts.load(`28px "${ARABIC_FONT}"`),
                document.fonts.load(`16px "${ARABIC_FONT}"`),
                document.fonts.load(`8px  "${ARABIC_FONT}"`),
                document.fonts.load('12px "Hind Siliguri"'),
                document.fonts.load('600 12px "Hind Siliguri"'),
            ];
            try { await Promise.all(fontLoads); } catch (e) { }

            // Step 3: Warmup render — draw Arabic & Bangla glyphs to a hidden canvas
            // so the browser's glyph cache is populated before Fabric.js renders.
            try {
                const wc = document.createElement('canvas');
                wc.width = 400; wc.height = 60;
                const ctx = wc.getContext('2d');
                // Arabic warmup — use a sample Quranic text
                ctx.font = `28px "${ARABIC_FONT}"`;
                ctx.direction = 'rtl';
                ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 400, 40);
                // Bangla warmup
                ctx.font = '12px "Hind Siliguri"';
                ctx.direction = 'ltr';
                ctx.fillText('পরম করুণাময় অসীম দয়ালু আল্লাহর নামে', 0, 56);
            } catch (e) { }
        },

        /* ════════════════════════
           SYSTEM TEMPLATE UPLOAD/RESET
        ════════════════════════ */
        async uploadSystemTemplate(event) {
            const file = event.target?.files?.[0];
            if (!file || !file.name.endsWith('.svg')) {
                this.showToast('❌ শুধুমাত্র .svg ফাইল চলবে', 'error'); return;
            }
            const fd = new FormData();
            fd.append('svg', file);
            try {
                const r = await fetch(_url('/api/upload-system-template'), { method: 'POST', body: fd });
                const json = await r.json();
                if (!r.ok || json.error) throw new Error(json.error || 'Upload failed');
                // Update masterTemplate to point to the new file (cache-bust with timestamp)
                this.masterTemplate.svgFile = json.path + '?v=' + Date.now();
                // Re-render all pages with the new background
                this.processLines();
                this.showToast('✅ সিস্টেম টেমপ্লেট আপডেট হয়েছে!', 'success');
            } catch (e) {
                this.showToast('❌ আপলোড ব্যর্থ: ' + e.message, 'error');
            }
            // Reset file input so same file can be re-uploaded
            event.target.value = '';
        },

        resetSystemTemplate() {
            this.masterTemplate.svgFile = _url('/templates/default.svg');
            this.processLines();
            this.showToast('🔄 ডিফল্ট টেমপ্লেটে ফিরে এসেছে', 'info');
        },


        /* ════════════════════════════════════════════════════
           ZOOM CONTROLS
        ═══════════════════════════════════════════════════ */
        zoomIn() { this.setCanvasZoom(Math.min(5.0, +(this.zoom + 0.1).toFixed(2))); this._flashZoom(); },
        zoomOut() { this.setCanvasZoom(Math.max(0.1, +(this.zoom - 0.1).toFixed(2))); this._flashZoom(); },
        resetZoom() { this.setCanvasZoom(1.0); this._flashZoom(); },

        fitPage() {
            const area = document.getElementById('canvas-area');
            if (!area || !this.fabricCanvas) return;
            const pw = this.masterTemplate.pageSize.w;
            const ph = this.masterTemplate.pageSize.h;
            const aW = area.clientWidth - 48;   // 24px padding each side
            const aH = area.clientHeight - 48;
            const fit = Math.min(aW / pw, aH / ph, 5.0);
            this.setCanvasZoom(Math.max(0.1, +fit.toFixed(3)));
            this._flashZoom();
            // Center the scroll after fit: canvas is narrower than area so scroll=0 centers via margin:0 auto
            this.$nextTick(() => {
                area.scrollTop = 0;
                area.scrollLeft = 0;
            });
        },

        /* ════════════════════════
           KEYBOARD SHORTCUTS + MOUSE WHEEL + SPACE PAN
        ════════════════════════ */
        initKeyboard() {
            const self = this;

            // ── Keyboard ─────────────────────────────────────────────
            document.addEventListener('keydown', (e) => {
                const tag = document.activeElement?.tagName;
                const isTyping = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');

                if (e.key === 'Escape') {
                    if (this.showShortcuts) { this.showShortcuts = false; e.preventDefault(); return; }
                    if (this.showBuilder) { this.closeBuilder(); e.preventDefault(); return; }
                    if (this.showFontGuide) { this.showFontGuide = false; e.preventDefault(); return; }
                    if (this.editMode) { this.editMode = false; this.renderPage(); return; }
                }
                if ((e.key === '?' || e.key === 'F1') && !isTyping) {
                    e.preventDefault(); this.showShortcuts = !this.showShortcuts; return;
                }

                // Space bar → pan mode (like Figma)
                if (e.key === ' ' && !isTyping) {
                    e.preventDefault();
                    this._enablePanMode();
                    return;
                }

                if (isTyping) return;

                if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomIn(); }
                if (e.key === '-') { e.preventDefault(); this.zoomOut(); }
                if (e.key === '0' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); this.resetZoom(); }
                if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this.fitPage(); }

                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); this.prevPage(); }
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.nextPage(); }
                if (e.key === 'Home') { e.preventDefault(); this.setPage(0); }
                if (e.key === 'End') { e.preventDefault(); this.setPage(this.pages.length - 1); }
                if (e.key === 'PageUp') { e.preventDefault(); this.setPage(Math.max(0, this.currentPage - 10)); }
                if (e.key === 'PageDown') { e.preventDefault(); this.setPage(Math.min(this.pages.length - 1, this.currentPage + 10)); }

                if (e.key === '1') { e.preventDefault(); this.activeTab = 'template'; }
                if (e.key === '2') { e.preventDefault(); this.activeTab = 'rules'; }
                if (e.key === '3') { e.preventDefault(); this.activeTab = 'fonts'; }
                if (e.key === '4') { e.preventDefault(); this.activeTab = 'export'; }

                if (e.key === 'p' || e.key === 'P') { e.preventDefault(); this.exportCurrentPage(); }
                if (e.key === 'b' || e.key === 'B') { e.preventDefault(); this.openBuilder(); }
                if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.loadVerses(); }
                if (e.key === 'e' || e.key === 'E') { e.preventDefault(); this.toggleEditMode(); }
            });

            // Release Space → exit pan mode
            document.addEventListener('keyup', (e) => {
                if (e.key === ' ') this._disablePanMode();
            });

            // ── Ctrl/Cmd + Wheel → zoom at mouse cursor ───────────────
            const canvasArea = document.getElementById('canvas-area');
            if (canvasArea) {
                canvasArea.addEventListener('wheel', (e) => {
                    if (e.ctrlKey || e.metaKey || e.altKey) {
                        e.preventDefault();
                        // Cursor position relative to the scroll container
                        const rect = canvasArea.getBoundingClientRect();
                        const mouseX = e.clientX - rect.left + canvasArea.scrollLeft;
                        const mouseY = e.clientY - rect.top + canvasArea.scrollTop;

                        const oldZoom = this.zoom;
                        const step = e.deltaY < 0 ? 0.1 : -0.1;
                        const newZoom = Math.max(0.1, Math.min(5.0, +(oldZoom + step).toFixed(2)));
                        if (newZoom === oldZoom) return;

                        // Apply zoom (canvas size changes)
                        this.setCanvasZoom(newZoom);
                        this._flashZoom();

                        // Re-center scroll so the point under the cursor stays fixed
                        this.$nextTick(() => {
                            const ratio = newZoom / oldZoom;
                            canvasArea.scrollLeft = mouseX * ratio - (e.clientX - rect.left);
                            canvasArea.scrollTop = mouseY * ratio - (e.clientY - rect.top);
                        });
                    }
                    // Normal scroll (no modifier) — let browser handle it naturally
                }, { passive: false });

                // ── Forward canvas-element wheel events to the scroll container ──
                // Fabric.js 5.x attaches its own wheel listeners to the <canvas>
                // element and can prevent them from bubbling. We attach a listener
                // directly on the canvas (capture phase) so we can re-dispatch the
                // scroll to the scrollable parent BEFORE Fabric swallows it.
                const canvasEl = document.getElementById('page-canvas');
                if (canvasEl) {
                    canvasEl.addEventListener('wheel', (e) => {
                        if (e.ctrlKey || e.metaKey || e.altKey) {
                            // Let our canvasArea zoom handler deal with it
                            return;
                        }
                        // Normal scroll — forward to the scroll container
                        e.preventDefault();
                        e.stopPropagation();
                        canvasArea.scrollTop += e.deltaY;
                        canvasArea.scrollLeft += e.deltaX;
                    }, { passive: false });
                }

                // ── Space + drag = pan ────────────────────────────────
                let panStartX = 0, panStartY = 0, panScrollX = 0, panScrollY = 0;

                canvasArea.addEventListener('mousedown', (e) => {
                    if (!this._isPanning) return;
                    e.preventDefault();
                    panStartX = e.clientX;
                    panStartY = e.clientY;
                    panScrollX = canvasArea.scrollLeft;
                    panScrollY = canvasArea.scrollTop;
                    canvasArea.classList.add('is-panning');

                    const onMove = (me) => {
                        canvasArea.scrollLeft = panScrollX - (me.clientX - panStartX);
                        canvasArea.scrollTop = panScrollY - (me.clientY - panStartY);
                    };
                    const onUp = () => {
                        canvasArea.classList.remove('is-panning');
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                });
            }
        },

        _enablePanMode() {
            this._isPanning = true;
            const area = document.getElementById('canvas-area');
            if (area) area.classList.add('pan-mode');
        },
        _disablePanMode() {
            this._isPanning = false;
            const area = document.getElementById('canvas-area');
            if (area) area.classList.remove('pan-mode', 'is-panning');
        },

        _flashZoom() {
            const el = document.querySelector('.zoom-label');
            if (!el) return;
            el.classList.remove('flashing'); void el.offsetWidth;
            el.classList.add('flashing');
            setTimeout(() => el.classList.remove('flashing'), 400);
        },

        async loadSvg() {
            if (!this.masterTemplate.svgFile) { this.svgText = null; return; }
            try {
                // svgFile already has the full public path e.g. '/templates/default.svg'
                const svgPath = this.masterTemplate.svgFile.split('?')[0]; // strip cache-bust
                const r = await fetch(svgPath);
                if (r.ok) {
                    this.svgText = await r.text();
                } else {
                    this.svgText = null;
                    console.warn('SVG not found:', svgPath);
                }
            } catch (e) { this.svgText = null; console.warn('SVG load error', e); }
        },

        /* ════════════════════════
           VERSE LOAD & PROCESS
        ════════════════════════ */
        async loadVerses() {
            this.isLoading = true;
            try {
                const r = await fetch(_url('/api/verses'));
                if (!r.ok) throw new Error('HTTP ' + r.status);
                const data = await r.json();
                if (data.error) throw new Error(data.error);
                this.allVerses = data;
                // Wait for all fonts (especially ExcellentArabic) to load before measuring
                await document.fonts.ready;
                this.processLines();
                this.showToast('✅ ' + data.length + ' আয়াত লোড হয়েছে', 'success');
            } catch (e) {
                this.showToast('❌ ' + e.message, 'error');
            } finally {
                this.isLoading = false;
                this.updateStats();
            }
        },

        loadVersesFromFile(event) {
            const file = event.target?.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    this.allVerses = JSON.parse(e.target.result);
                    this.isLoading = false;
                    this.processLines();
                    this.showToast('✅ ' + this.allVerses.length + ' আয়াত', 'success');
                    this.updateStats();
                    this.$nextTick(() => this.renderPage());
                } catch (err) { this.showToast('❌ JSON error', 'error'); }
            };
            reader.readAsText(file, 'utf-8');
        },

        /* ═══════════════════════════════════════════════════════════
           CONTINUOUS FLOW LAYOUT ENGINE
           Words from multiple verses share the same display line.
           Each display line = one arabic slot row.
           Like a real Quran book: short verse → next verse begins
           immediately after on the same line.
        ═══════════════════════════════════════════════════════════ */
        processLines() {
            this.arabicLines = [];
            this._globalFontPx = 0;
            this._globalBnPx = 0;
            this._globalPrPx = 0;
            this._arZoneRatio = 0.58;
            this._surahBanglaPool = {};   // surah# → { bn: fullMeaning, pr: fullPronun }
            this._surahLineIndex = {};   // surah# → first arabicLine index for that surah

            const layout = buildSlotsFromRows(this.masterTemplate);
            const arSlots = layout.slots.filter(s => s.type === 'arabic');
            if (!arSlots.length) return;

            // ── Zone calculation based on active toggles ──
            const showMeaning = this.showBanglaMeaning;
            const showUccharon = this.showBanglaUccharon;
            const showAnyBangla = showMeaning || showUccharon;
            const showBoth = showMeaning && showUccharon;

            const cfg0 = arSlots[0].config || {};
            const slot0 = arSlots[0];

            // ── Font sizing: SVG-native or ratio-based ──
            let arZoneH, eachBnH, arZoneRatio, symbolZoneH;

            if (slot0._svgArH !== undefined) {
                symbolZoneH = slot0._svgSymH || 0;
                arZoneH = slot0._svgArH;
                const bnH = slot0._svgBnH || 0;
                eachBnH = showBoth ? bnH / 2 : bnH;
                arZoneRatio = arZoneH / (slot0._svgSymH + arZoneH + bnH);
            } else {
                const slotH = slot0.height;
                symbolZoneH = (this.showTopSymbolRow && this.topSymbols.some(s => s.enabled))
                    ? this.topSymbolRowH : 0;
                const effH = slotH - symbolZoneH;
                arZoneRatio = showBoth ? 0.50 : showAnyBangla ? 0.56 : 0.90;
                arZoneH = effH * arZoneRatio;
                const bnZoneH = effH - arZoneH;
                eachBnH = showBoth ? bnZoneH / 2 : bnZoneH;
            }

            // ── Arabic font sizes ──
            // SINGLE ratio for BOTH measurement and rendering: 0.73 × arZoneH ≈ 29px.
            // This matches the Kariana reference PDF density (~5-8 words per line).
            // Using the SAME font for measuring and rendering means what you measure
            // is exactly what renders — no left-side overflow from size mismatch.
            //
            // Kariana PDF analysis (pages 14+):
            //   arZoneH = 39.72px  →  font = 29px  →  ratio = 0.73
            //   Words/line ≈ 5–8   →  Total pages ≈ 828–1050
            //
            // Global overrides (from master template panel sliders) take priority.
            const tplAr = this.masterTemplate.globalArabicFontSize || 0;
            const tplMeas = this.masterTemplate.globalMeasureFontSize || 0;
            const arabicPx = tplAr > 0 ? tplAr
                : cfg0.fontSize && !cfg0.autoFit ? cfg0.fontSize
                    : (slot0._svgArH !== undefined ? arZoneH * 0.73 : arZoneH * 0.68);
            // measureFontPx = SAME as render font so lines measured = lines rendered.
            // (Old split: measure=0.42, render=0.58 caused render to overflow the measured width)
            const measureFontPx = tplMeas > 0 ? tplMeas
                : cfg0.fontSize && !cfg0.autoFit ? cfg0.fontSize
                    : arabicPx;
            // ── GLOBAL Bangla font size — fixed, same for every row in the surah ──
            // We use eachBnH * 0.72 so even long Bangla chunks fit inside
            // the bangla zone without overflowing into adjacent rows.
            const tplBn = this.masterTemplate.globalBanglaFontSize || 0;
            const banglaPx = tplBn > 0 ? tplBn
                : cfg0.banglaFontSize && !cfg0.banglaAutoFit ? cfg0.banglaFontSize
                    : eachBnH * 0.72;

            this._globalFontPx = arabicPx;
            this._globalBnPx = banglaPx;
            this._globalPrPx = banglaPx;
            this._arZoneRatio = arZoneRatio;
            this._showBoth = showBoth;
            this._eachBnZoneH = eachBnH;
            this._symbolZoneH = symbolZoneH;

            // ── Build surahBanglaPool: full concatenated Bangla for every surah ──
            // Include verse numbers (e.g. "১.") as prefix — matches reference PDF format
            // where all ayah meanings are one continuous text with embedded verse numbers.
            for (const verse of this.allVerses) {
                const s = verse.s;
                const vNum = verse.v;  // verse number
                const meaning = (verse.t_bn || '').trim();
                const ucchar = (verse.bn || '').trim();
                if (!this._surahBanglaPool[s]) {
                    this._surahBanglaPool[s] = { bn: '', pr: '' };
                }
                if (meaning) {
                    // Prepend Bengali digit verse number: "১. অর্থ..." 
                    const vPrefix = this._toBengaliDigits(vNum) + '. ';
                    const entry = vPrefix + meaning;
                    this._surahBanglaPool[s].bn += (this._surahBanglaPool[s].bn ? ' ' : '') + entry;
                }
                if (ucchar) {
                    const vPrefix = this._toBengaliDigits(vNum) + '. ';
                    const entry = vPrefix + ucchar;
                    this._surahBanglaPool[s].pr += (this._surahBanglaPool[s].pr ? ' ' : '') + entry;
                }
            }

            // ── Canvas 2D measurement (accurate after document.fonts.ready) ──
            // Uses measureFontPx (smaller than render size) so line wrapping matches
            // the Kariana reference PDF's ~15 words/line density (→ ~807 pages at 9 rows).
            const mCanvas = document.createElement('canvas');
            mCanvas.width = 3000;
            mCanvas.height = 100;
            const mCtx = mCanvas.getContext('2d');
            mCtx.font = `${measureFontPx}px "${ARABIC_FONT}", Arial, serif`;

            const measureW = (text) => {
                const w = mCtx.measureText(text).width;
                return w > 0 ? w : measureFontPx * Math.max(1, text.length) * 0.55;
            };

            const spaceW = measureW(' ');
            // maxLineW: column width minus 6px total side padding (3px each side).
            // Since measure=render now use the same 0.73 ratio, padding is the sole
            // safety margin. 6px total ≈ 0.15×arabicPx breathing room.
            const maxLineW = layout.colW - 6;

            // ── Pack words into display lines ──
            let lineWords = [];
            let lineW = 0;
            let lineMarkers = [];
            let lineSurah = null;

            // Track per-surah: how many arabic display lines belong to each surah
            // so _renderGlobalBangla can distribute the Bangla pool proportionally.
            this._surahLineCount = {};  // surah# → number of arabic display lines

            const commitLine = () => {
                if (!lineWords.length) return;
                const fullText = lineWords.join(' ');
                const surahNum = lineSurah;
                if (surahNum != null) {
                    this._surahLineCount[surahNum] = (this._surahLineCount[surahNum] || 0) + 1;
                    // Record the first arabicLine index for each surah (for Bangla pool pointer)
                    if (this._surahLineIndex[surahNum] === undefined) {
                        this._surahLineIndex[surahNum] = this.arabicLines.length;
                    }
                }
                this.arabicLines.push({
                    text: fullText,
                    verseMarkers: lineMarkers,
                    surah: surahNum,
                    startVerse: lineStartVerse,   // first verse number on this display line
                    isLastOfVerse: lineMarkers.length > 0,
                    // Keep bn/pr as lightweight references — used only for edit panel sync
                    bn: '',
                    pr: '',
                });
                lineWords = [];
                lineW = 0;
                lineMarkers = [];
                lineSurah = null;
                lineStartVerse = null;
            };

            let prevVerseSurah = null;
            let lineStartVerse = null;  // verse number of the first word on this display line

            for (const verse of this.allVerses) {
                const ar = (verse.ar || '').trim();
                if (!ar) continue;

                if (prevVerseSurah !== null && verse.s !== prevVerseSurah) {
                    if (lineWords.length > 0) {
                        commitLine();
                        if (this.arabicLines.length > 0) {
                            this.arabicLines[this.arabicLines.length - 1].isLastOfSurah = true;
                        }
                    }
                }
                prevVerseSurah = verse.s;

                const words = ar.split(' ').filter(Boolean);

                for (let wi = 0; wi < words.length; wi++) {
                    const word = words[wi];
                    const wordW = measureW(word);
                    const gap = lineWords.length > 0 ? spaceW : 0;

                    if (lineWords.length > 0 && lineW + gap + wordW > maxLineW) {
                        commitLine();
                    }

                    if (lineSurah === null) lineSurah = verse.s;
                    if (lineStartVerse === null) lineStartVerse = verse.v;  // first verse on this line

                    lineWords.push(word);
                    lineW += (lineWords.length > 1 ? spaceW : 0) + wordW;

                    if (wi === words.length - 1) {
                        lineMarkers.push({ verse: verse.v, surah: verse.s });
                    }
                }
            }
            commitLine();

            this.generatePages();
            // Pre-compute exact Bangla word start index for every page.
            // Async so we can wait for the Bangla font to be loaded first.
            this._banglaFlowColW = layout.colW;
            this._banglaFlowReady = false;
            this._precomputeBanglaFlow(layout.colW);
        },

        /* ════════════════════════
           PAGE GENERATION
        ════════════════════════ */
        generatePages() {
            // ── rowsPerPage: use master template setting (default 9) ──
            const slotCount = (this.masterTemplate.rowsPerPage || this.arabicRowCount || 9);

            // ── Surah opening header box ──
            // The decorative box occupies OPENING_SLOT_COUNT arabic slots.
            // Remaining slots on the SAME page fill with content.
            // Special case: Surah 1 (Al-Fatiha) has only 7 verses; its
            // Bismillah IS verse 1, so we use 2-slot opening (same as all surahs).
            // The measureFontPx fix ensures all 7 verses fit in the remaining slots.
            const OPENING_SLOT_COUNT = 2;
            const OPENING_CONTENT_ROWS = slotCount - OPENING_SLOT_COUNT;

            const pages = [];
            let pageBuf = [];
            let contentRows = 0;
            let pageCapacity = slotCount;
            let pageHasOpening = false;

            const flushPage = () => {
                if (pageBuf.length > 0) {
                    pages.push([...pageBuf]);
                    pageBuf = [];
                    contentRows = 0;
                    pageCapacity = slotCount;
                    pageHasOpening = false;
                }
            };

            const beginSurahOpeningPage = (surahNum) => {
                for (let k = 0; k < OPENING_SLOT_COUNT; k++) {
                    pageBuf.push({ type: 'surah-opening', surah: Number(surahNum), slotIdx: k });
                }
                pageHasOpening = true;
                pageCapacity = OPENING_CONTENT_ROWS;
            };

            for (let i = 0; i < this.arabicLines.length; i++) {
                const line = this.arabicLines[i];
                const prevLine = this.arabicLines[i - 1];

                const isFirstLine = i === 0;
                const isNewSurah = isFirstLine ||
                    (prevLine && Number(line.surah) !== Number(prevLine.surah));

                if (isNewSurah) {
                    // Flush previous surah's remaining lines onto current page
                    // then start a fresh page with the new surah opening header
                    flushPage();
                    beginSurahOpeningPage(line.surah);
                }

                pageBuf.push(line);
                contentRows++;

                if (contentRows >= pageCapacity) {
                    flushPage();
                }
            }
            flushPage();

            this.pages = pages;
            if (this.currentPage >= pages.length) this.currentPage = 0;
            this.updateStats();
            this.$nextTick(() => this.renderPage());
        },



        /* Convert a number to Bengali digits (০১২৩৪৫৬৭৮৯) */
        _toBengaliDigits(n) {
            return String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[+d]);
        },

        /* ════════════════════════════════════════════════════════════
           BANGLA WORD-FLOW PRE-COMPUTATION
           Async — waits for Bangla font to load before measuring.
           Uses Canvas2D measureText (identical setup to _renderGlobalBangla)
           so page word-offsets are pixel-perfect.
        ════════════════════════════════════════════════════════════ */
        async _precomputeBanglaFlow(colW) {
            const bnFontSize = this._globalBnPx;
            if (!bnFontSize || !this.pages?.length) return;

            // ── Wait for Bangla font to be available ──
            // Without this, measureText uses a fallback font → wrong widths →
            // page 2+ start at wrong word index.
            const fontStr = `${bnFontSize}px "${BANGLA_FONT}"`;
            try {
                await document.fonts.load(fontStr);
            } catch (e) { /* ignore — proceed with best-effort */ }

            const showBoth = this._showBoth;
            const availW = colW - 8;   // 4px padding each side

            // Measurement canvas — MUST be identical to _renderGlobalBangla
            const mCanvas = document.createElement('canvas');
            mCanvas.width = 4000;
            mCanvas.height = 100;
            const mCtx = mCanvas.getContext('2d');
            mCtx.font = fontStr + ', sans-serif';
            const spaceW = mCtx.measureText(' ').width;

            // Reset caches
            this._banglaWords = {};
            this._pronunWords = {};
            this._pageBanglaWordStart = {};   // pageIdx → { surahNum → wordIdx }
            this._pagePronunWordStart = {};

            for (const [surahStr, surahPool] of Object.entries(this._surahBanglaPool || {})) {
                const surahNum = Number(surahStr);

                const bnWords = (surahPool.bn || '').split(/\s+/).filter(Boolean);
                const prWords = (surahPool.pr || '').split(/\s+/).filter(Boolean);
                // Store with both number and string key for safe lookup
                this._banglaWords[surahNum] = bnWords;
                this._pronunWords[surahNum] = prWords;

                let bnIdx = 0, prIdx = 0;

                for (let pageIdx = 0; pageIdx < this.pages.length; pageIdx++) {
                    const pageItems = this.pages[pageIdx];

                    // Type-safe comparison: Number(it.surah) handles string/number mismatch
                    // Exclude both surah-gap and surah-opening markers (not content rows)
                    const surahRows = pageItems.filter(
                        it => it && it.type !== 'surah-gap' && it.type !== 'surah-opening' && Number(it.surah) === surahNum
                    );
                    if (!surahRows.length) continue;

                    if (!this._pageBanglaWordStart[pageIdx]) this._pageBanglaWordStart[pageIdx] = {};
                    if (!this._pagePronunWordStart[pageIdx]) this._pagePronunWordStart[pageIdx] = {};
                    this._pageBanglaWordStart[pageIdx][surahNum] = bnIdx;
                    this._pagePronunWordStart[pageIdx][surahNum] = prIdx;

                    // Simulate one line per row
                    for (let r = 0; r < surahRows.length; r++) {
                        let lineW = 0;
                        while (bnIdx < bnWords.length) {
                            const ww = mCtx.measureText(bnWords[bnIdx]).width;
                            const gap = lineW > 0 ? spaceW : 0;
                            if (lineW > 0 && lineW + gap + ww > availW) break;
                            lineW += gap + ww;
                            bnIdx++;
                        }
                        if (showBoth) {
                            lineW = 0;
                            while (prIdx < prWords.length) {
                                const ww = mCtx.measureText(prWords[prIdx]).width;
                                const gap = lineW > 0 ? spaceW : 0;
                                if (lineW > 0 && lineW + gap + ww > availW) break;
                                lineW += gap + ww;
                                prIdx++;
                            }
                        }
                    }
                }
            }

            this._banglaFlowReady = true;
            // Re-render current page now that word positions are accurate
            this.renderPage();
        },

        /* ════════════════════════
           CANVAS INIT
        ════════════════════════ */
        initCanvas() {
            if (this.fabricCanvas) { this.fabricCanvas.dispose(); this.fabricCanvas = null; }
            const el = document.getElementById('page-canvas');
            if (!el) return;
            const pw = this.masterTemplate.pageSize.w;
            const ph = this.masterTemplate.pageSize.h;
            const z = this.zoom || 0.72;
            this.fabricCanvas = new fabric.Canvas('page-canvas', {
                width: Math.round(pw * z),
                height: Math.round(ph * z),
                backgroundColor: '#ffffff',
                selection: this.editMode,
                renderOnAddRemove: false,
                enableRetinaScaling: true,
            });
            this.fabricCanvas.setZoom(z);

            // ── Edit Panel: track selected object ──────────────────────────────
            this.fabricCanvas.on('selection:created', (e) => {
                if (this.editMode) this._onCanvasSelect(e.selected?.[0]);
            });
            this.fabricCanvas.on('selection:updated', (e) => {
                if (this.editMode) this._onCanvasSelect(e.selected?.[0]);
            });
            this.fabricCanvas.on('selection:cleared', () => {
                this.selectedCanvasObj = null;
                this.editPanelData = null;
            });

            // Track design element changes in edit mode
            this.fabricCanvas.on('object:modified', (e) => {
                const obj = e.target;
                if (obj._elId) {
                    const t = this.pageOverrides[this.currentPage] || this.masterTemplate;
                    const els = t.designElements || [];
                    const found = els.find(el => el.id === obj._elId);
                    if (found) {
                        found.x = obj.left;
                        found.y = obj.top;
                        found.w = obj.width * (obj.scaleX || 1);
                        found.h = obj.height * (obj.scaleY || 1);
                    }
                }
            });
        },

        // Native Fabric zoom — pixel-perfect at all zoom levels
        // Caller is responsible for restoring scroll position if needed (e.g. Ctrl+wheel).
        setCanvasZoom(newZoom) {
            const clamped = Math.max(0.1, Math.min(5.0, newZoom));
            this.zoom = clamped;
            if (!this.fabricCanvas) return;
            const pw = this.masterTemplate.pageSize.w;
            const ph = this.masterTemplate.pageSize.h;
            this.fabricCanvas.setZoom(clamped);
            this.fabricCanvas.setWidth(Math.round(pw * clamped));
            this.fabricCanvas.setHeight(Math.round(ph * clamped));
            this.fabricCanvas.requestRenderAll();
        },

        /* ════════════════════════
           EDIT MODE (main editor)
        ════════════════════════ */
        toggleEditMode() {
            this.editMode = !this.editMode;
            this.selectedCanvasObj = null;
            this.editPanelData = null;
            if (this.fabricCanvas) {
                this.fabricCanvas.selection = this.editMode;
                this.fabricCanvas.discardActiveObject && this.fabricCanvas.discardActiveObject();
            }
            this.renderPage();
            this.showToast(
                this.editMode ? '✏ Edit Mode — সারিতে ক্লিক করে text/spacing পরিবর্তন করুন' : '👁 Preview Mode',
                this.editMode ? 'info' : 'success'
            );
        },

        /* ════════════════════════
           CANVAS SELECTION → EDIT PANEL
        ════════════════════════ */
        _onCanvasSelect(obj) {
            if (!obj) { this.selectedCanvasObj = null; this.editPanelData = null; return; }
            this.selectedCanvasObj = obj;

            // Only populate panel for Arabic/Bangla text rows (tagged with _field)
            if (!obj._field) {
                this.editPanelData = null;
                return;
            }

            // Pull current properties from the Fabric object
            this.editPanelData = {
                field: obj._field,           // 'ar' or 'bn'
                itemIdx: obj._itemIdx ?? null,
                slotId: obj._slotId || '',
                text: obj.text || '',
                fontSize: Math.round(obj.fontSize || 14),
                charSpacing: Math.round(obj.charSpacing || 0),
                color: obj.fill || '#0d0d0d',
                scaleX: obj.scaleX || 1,
            };
        },

        /* Apply edits from panel → live canvas update + data sync */
        applyEditPanel() {
            const obj = this.selectedCanvasObj;
            const data = this.editPanelData;
            if (!obj || !data) return;

            // Apply text (re-reverse digits for RTL if Arabic field)
            let newText = data.text;
            if (data.field === 'ar') {
                newText = reverseArabicDigits(newText);
            }
            obj.set({
                text: newText,
                fontSize: data.fontSize,
                charSpacing: data.charSpacing,
                fill: data.color,
            });

            // Sync back into arabicLines data model if possible
            const idx = data.itemIdx;
            if (idx != null && idx >= 0 && idx < this.arabicLines.length) {
                if (data.field === 'ar') {
                    this.arabicLines[idx].text = data.text;
                } else if (data.field === 'bn') {
                    this.arabicLines[idx].bn = data.text;
                } else if (data.field === 'pr') {
                    this.arabicLines[idx].pr = data.text;
                }
            }

            this.fabricCanvas.requestRenderAll();
            this.showToast('✅ পরিবর্তন প্রয়োগ হয়েছে', 'success');
        },

        /* Live-preview as user types / drags sliders */
        liveUpdateEditPanel() {
            const obj = this.selectedCanvasObj;
            const data = this.editPanelData;
            if (!obj || !data) return;
            obj.set({
                fontSize: data.fontSize,
                charSpacing: data.charSpacing,
                fill: data.color,
            });
            this.fabricCanvas.requestRenderAll();
        },

        /* ════════════════════════
           RENDER PAGE
        ════════════════════════ */
        async renderPage() {
            if (!this.fabricCanvas) return;
            const canvas = this.fabricCanvas;
            const override = this.pageOverrides[this.currentPage];
            const t = override ? { ...this.masterTemplate, ...override } : this.masterTemplate;

            canvas.clear();
            canvas.setBackgroundColor('#ffffff', () => { });

            const layout = buildSlotsFromRows(t);
            const { slots, colX: _colX, colW: _colW, pageW, pageH } = layout;
            // COL_PAD: 2px breathing space on each side of every text column.
            // Arabic (RTL) anchor moves 2px from the right edge;
            // clip rects and Bangla text inset by 2px on both sides.
            const COL_PAD = 2;
            const colX = _colX + COL_PAD;   // effective left edge (after padding)
            const colW = _colW - COL_PAD * 2; // effective column width

            // ── 1. White page base (use canvas background color — no Rect needed)
            canvas.setBackgroundColor('#ffffff', () => { });

            // ── 2. SVG Template Background — loaded FIRST so all text sits on top ──
            if (t.svgFile) {
                // Strip any query-string cache-bust from the URL for Fabric
                const svgUrl = t.svgFile.split('?')[0];
                await new Promise(resolve => {
                    fabric.loadSVGFromURL(svgUrl + '?t=' + Date.now(), (objects, options) => {
                        if (objects && objects.length) {
                            const g = fabric.util.groupSVGElements(objects, options);
                            // Scale SVG to fill the page exactly
                            const nativeW = options.width || SVG_PAGE_W;
                            const nativeH = options.height || SVG_PAGE_H;
                            const scaleX = pageW / nativeW;
                            const scaleY = pageH / nativeH;
                            g.set({
                                left: 0, top: 0,
                                scaleX, scaleY,
                                selectable: false,
                                evented: false,
                                objectCaching: false,
                            });
                            // Add as FIRST object so everything else renders on top
                            canvas.add(g);
                        } else {
                            console.warn('[SVG BG] No objects loaded from:', svgUrl);
                        }
                        resolve();
                    });
                });
            }

            // ── 2b. Template assets — BACK layer (additional SVG/PNG) ──
            const assets = t.assets || [];
            for (const asset of assets.filter(a => a.zIndex === 'back')) {
                await this._renderAsset(canvas, asset, pageW, pageH);
            }

            // ── 2c. SVG text (legacy svgText field) ──────────────
            if (this.svgText && !t.svgFile && !(assets.length)) {
                await new Promise(resolve => {
                    fabric.loadSVGFromString(this.svgText, (objects, options) => {
                        const g = fabric.util.groupSVGElements(objects, options);
                        const scaleX = pageW / (options.width || pageW);
                        const scaleY = pageH / (options.height || pageH);
                        g.set({ left: 0, top: 0, scaleX, scaleY, selectable: false, evented: false });
                        canvas.add(g);
                        canvas.sendToBack(g);
                        resolve();
                    });
                });
            }

            // ── 4. Design Elements (from template) ──────────────────
            const designEls = t.designElements || [];
            for (const el of designEls) {
                let obj = null;
                const st = el.style || {};
                const x = el.x, y = el.y, w = el.w || 60, h = el.h || 30;

                if (el.type === 'rect') {
                    obj = new fabric.Rect({
                        left: x, top: y, width: w, height: h,
                        fill: st.fill || 'transparent',
                        stroke: st.stroke || '#c8a96e',
                        strokeWidth: st.strokeWidth || 1,
                        rx: st.rx || 0, ry: st.rx || 0,
                    });
                } else if (el.type === 'circle') {
                    obj = new fabric.Ellipse({
                        left: x, top: y, rx: w / 2, ry: h / 2,
                        fill: st.fill || 'transparent',
                        stroke: st.stroke || '#c8a96e',
                        strokeWidth: st.strokeWidth || 1,
                    });
                } else if (el.type === 'hline') {
                    obj = new fabric.Line([x, y + h / 2, x + w, y + h / 2], {
                        stroke: st.stroke || '#c8a96e',
                        strokeWidth: st.strokeWidth || 1,
                    });
                } else if (el.type === 'line') {
                    obj = new fabric.Line([x, y, x + w, y + h], {
                        stroke: st.stroke || '#c8a96e',
                        strokeWidth: st.strokeWidth || 1,
                    });
                } else if (el.type === 'text') {
                    obj = new fabric.IText(st.text || 'টেক্সট', {
                        left: x, top: y,
                        fontSize: st.fontSize || 12,
                        fill: st.color || '#0d0d0d',
                        fontFamily: st.fontFamily || BANGLA_FONT,
                    });
                } else if (el.type === 'svg' && el._imgUrl) {
                    await new Promise(res => {
                        fabric.Image.fromURL(el._imgUrl, (img) => {
                            img.set({
                                left: x, top: y,
                                scaleX: w / (img.width || w),
                                scaleY: h / (img.height || h),
                                selectable: this.editMode,
                                evented: this.editMode,
                                _elId: el.id,
                            });
                            canvas.add(img);
                            res();
                        });
                    });
                    continue;
                }

                if (obj) {
                    obj._elId = el.id;
                    obj.selectable = this.editMode;
                    obj.evented = this.editMode;
                    if (this.editMode) {
                        obj.set({ cornerColor: '#f59e0b', cornerSize: 8, transparentCorners: false });
                    }
                    canvas.add(obj);
                }
            }

            // ── 3. Slot guides (visual only, no labels) ─────────────────────────
            if (t.showSlotGuides) {
                slots.forEach(sl => {
                    const hue = sl.type === 'arabic' ? 120 : sl.type === 'header' ? 270 : sl.type === 'footer' ? 40 : 0;
                    canvas.add(new fabric.Rect({
                        left: colX, top: sl.top, width: colW, height: sl.height,
                        fill: `hsla(${hue},70%,60%,0.10)`,
                        stroke: `hsla(${hue},70%,50%,0.50)`, strokeWidth: 0.5,
                        selectable: false,
                    }));
                    // Labels removed — not needed in production view
                });
            }

            // ── 4. Page content (text) ─────────────────────────
            const pageNum = this.currentPage + 1;
            const slotItems = this.pages[this.currentPage] || [];
            let prevSurah = -1;
            let arabicItemIdx = 0;

            for (const sl of slots) {
                if (!sl.visible && sl.visible !== undefined) continue;
                const cfg = sl.config || {};

                // HEADER
                if (sl.type === 'header') {
                    let headerText = cfg.text || '';
                    if (cfg.autoSurah && slotItems.length) {
                        // Find the first real content item (skip opening markers)
                        const firstContent = slotItems.find(it => it && it.type !== 'surah-opening');
                        const surahNum = firstContent?.surah;
                        const surahName = SURAH_NAMES[surahNum] || '';

                        // First verse on this page: use startVerse from first content row
                        const firstVerse = firstContent?.startVerse ?? firstContent?.verseMarkers?.[0]?.verse;
                        if (this.currentPage === 0) {
                            console.log('[HDR-DEBUG] page=0 surahNum=' + surahNum + ' firstContent idx=' + slotItems.indexOf(firstContent) + ' startVerse=' + firstContent?.startVerse + ' markers=' + JSON.stringify(firstContent?.verseMarkers) + ' slotItems.length=' + slotItems.length);
                        }

                        // Last verse: max of all verseMarkers across content rows
                        const allMarkers = [];
                        for (const it of slotItems) {
                            if (!it || it.type === 'surah-opening') continue;
                            for (const m of (it.verseMarkers || [])) {
                                if (m.surah === surahNum) allMarkers.push(m.verse);
                            }
                        }
                        const lastVerse = allMarkers.length ? Math.max(...allMarkers) : firstVerse;

                        // Convert to Bengali digits
                        const toBn = (n) => n != null ? this._toBengaliDigits(n) : '';

                        // Para (Juz) number — find using exact verse-level PARA_START table
                        // Walk backwards: first para where PARA_START[p] <= [surahNum, firstVerse]
                        let paraNum = 1;
                        const _sv = surahNum, _vv = firstVerse ?? 1;
                        for (let p = PARA_START.length - 1; p >= 1; p--) {
                            const [ps, pv] = PARA_START[p];
                            if (_sv > ps || (_sv === ps && _vv >= pv)) {
                                paraNum = p; break;
                            }
                        }
                        const paraText = this._toBengaliDigits(paraNum);

                        const verseRange = firstVerse && lastVerse && firstVerse !== lastVerse
                            ? toBn(firstVerse) + '-' + toBn(lastVerse)
                            : toBn(firstVerse) || '';

                        headerText = '— সূরা ' + surahName +
                            (verseRange ? '  আয়াত ' + verseRange : '') +
                            '  | পারা ' + paraText + ' —';
                    }
                    if (headerText) {
                        canvas.add(new fabric.Text(headerText, {
                            left: pageW / 2, top: sl.top + sl.height / 2,
                            originX: 'center', originY: 'center',
                            fontFamily: cfg.fontFamily || BANGLA_FONT,
                            fontSize: cfg.fontSize || 8,
                            fill: cfg.color || t.surahColor,
                            fontWeight: cfg.bold ? 'bold' : 'normal',
                            textAlign: cfg.align || 'center',
                            selectable: false,
                        }));
                    }
                }

                else if (sl.type === 'arabic') {
                    const item = slotItems[arabicItemIdx++];
                    if (!item) continue;

                    // ── surah-opening slot — renders the Kariana-style Surah header ──
                    // The opening box spans OPENING_SLOT_COUNT slots.
                    // slotIdx=0: draw the full combined box (spanning both slots visually)
                    // slotIdx=1: skip (the box was already drawn by slotIdx=0)
                    if (item.type === 'surah-opening') {
                        const newSurahNum = item.surah;
                        const newSurahName = SURAH_NAMES[newSurahNum] || '';

                        // Only render the box on the first slot; subsequent slots are visual spacers
                        if (item.slotIdx === 0) {
                            // Peek ahead to find the bottom of all consecutive surah-opening slots
                            let boxSlotCount = 1;
                            for (let peek = arabicItemIdx; peek < slotItems.length; peek++) {
                                if (slotItems[peek]?.type === 'surah-opening' && slotItems[peek]?.surah === newSurahNum) {
                                    boxSlotCount++;
                                } else break;
                            }
                            // Find the matching arabic slot for the last surah-opening marker
                            const lastSlotIdx = Math.min(
                                slots.filter(s => s.type === 'arabic').indexOf(sl) + boxSlotCount - 1,
                                slots.filter(s => s.type === 'arabic').length - 1
                            );
                            const arSlotsAll = slots.filter(s => s.type === 'arabic');
                            const lastSl = arSlotsAll[Math.min(
                                arSlotsAll.indexOf(sl) + boxSlotCount - 1,
                                arSlotsAll.length - 1
                            )];
                            const boxTop = sl.top;
                            const boxBot = lastSl.top + lastSl.height;
                            const boxH = boxBot - boxTop;

                            const surahColor = t.surahColor || '#8b0000';
                            const goldColor = '#b8860b';

                            // ── Outer decorative border ──
                            canvas.add(new fabric.Rect({
                                left: colX, top: boxTop,
                                width: colW, height: boxH,
                                fill: '#fdf8ee',
                                stroke: goldColor, strokeWidth: 1.5,
                                rx: 3, ry: 3,
                                selectable: false, evented: false,
                            }));
                            // Inner double-border line
                            canvas.add(new fabric.Rect({
                                left: colX + 3.5, top: boxTop + 3.5,
                                width: colW - 7, height: boxH - 7,
                                fill: 'transparent',
                                stroke: goldColor, strokeWidth: 0.6,
                                rx: 2, ry: 2,
                                selectable: false, evented: false,
                            }));

                            // ── Arabic Surah name (right side) ──
                            // Arabic surah names are stored in a separate list
                            const ARABIC_SURAH_NAMES = ['', 'ٱلْفَاتِحَة', 'ٱلْبَقَرَة', 'آلِ عِمۡرَان', 'ٱلنِّسَاء', 'ٱلْمَائِدَة', 'ٱلْأَنْعَام', 'ٱلْأَعْرَاف', 'ٱلْأَنْفَال', 'ٱلتَّوْبَة', 'يُونُس', 'هُود', 'يُوسُف', 'ٱلرَّعْد', 'إِبْرَاهِيم', 'ٱلْحِجْر', 'ٱلنَّحْل', 'ٱلْإِسْرَاء', 'ٱلْكَهْف', 'مَرْيَم', 'طه', 'ٱلْأَنْبِيَاء', 'ٱلْحَج', 'ٱلْمُؤْمِنُون', 'ٱلنُّور', 'ٱلْفُرْقَان', 'ٱلشُّعَرَاء', 'ٱلنَّمْل', 'ٱلْقَصَص', 'ٱلْعَنْكَبُوت', 'ٱلرُّوم', 'لُقْمَان', 'ٱلسَّجْدَة', 'ٱلْأَحْزَاب', 'سَبَأ', 'فَاطِر', 'يس', 'ٱلصَّافَّات', 'ص', 'ٱلزُّمَر', 'غَافِر', 'فُصِّلَت', 'ٱلشُّورَى', 'ٱلزُّخْرُف', 'ٱلدُّخَان', 'ٱلْجَاثِيَة', 'ٱلْأَحْقَاف', 'مُحَمَّد', 'ٱلْفَتْح', 'ٱلْحُجُرَات', 'ق', 'ٱلذَّارِيَات', 'ٱلطُّور', 'ٱلنَّجْم', 'ٱلْقَمَر', 'ٱلرَّحْمَٰن', 'ٱلْوَاقِعَة', 'ٱلْحَدِيد', 'ٱلْمُجَادَلَة', 'ٱلْحَشْر', 'ٱلْمُمْتَحَنَة', 'ٱلصَّف', 'ٱلْجُمُعَة', 'ٱلْمُنَافِقُون', 'ٱلتَّغَابُن', 'ٱلطَّلَاق', 'ٱلتَّحْرِيم', 'ٱلْمُلْك', 'ٱلْقَلَم', 'ٱلْحَاقَّة', 'ٱلْمَعَارِج', 'نُوح', 'ٱلْجِن', 'ٱلْمُزَّمِّل', 'ٱلْمُدَّثِّر', 'ٱلْقِيَامَة', 'ٱلْإِنسَان', 'ٱلْمُرْسَلَات', 'ٱلنَّبَأ', 'ٱلنَّازِعَات', 'عَبَسَ', 'ٱلتَّكْوِير', 'ٱلْإِنفِطَار', 'ٱلْمُطَفِّفِين', 'ٱلْإِنشِقَاق', 'ٱلْبُرُوج', 'ٱلطَّارِق', 'ٱلْأَعْلَى', 'ٱلْغَاشِيَة', 'ٱلْفَجْر', 'ٱلْبَلَد', 'ٱلشَّمْس', 'ٱللَّيْل', 'ٱلضُّحَى', 'ٱلشَّرْح', 'ٱلتِّين', 'ٱلْعَلَق', 'ٱلْقَدْر', 'ٱلْبَيِّنَة', 'ٱلزَّلْزَلَة', 'ٱلْعَادِيَات', 'ٱلْقَارِعَة', 'ٱلتَّكَاثُر', 'ٱلْعَصْر', 'ٱلْهُمَزَة', 'ٱلْفِيل', 'قُرَيْش', 'ٱلْمَاعُون', 'ٱلْكَوْثَر', 'ٱلْكَافِرُون', 'ٱلنَّصْر', 'ٱلْمَسَد', 'ٱلْإِخْلَاص', 'ٱلْفَلَق', 'ٱلنَّاس'];
                            const arSurahName = ARABIC_SURAH_NAMES[newSurahNum] || '';

                            // Arabic surah name with decorative ﴿﴾ brackets — centered
                            if (arSurahName) {
                                canvas.add(new fabric.Text('سُوۡرَةُ  ' + arSurahName, {
                                    left: colX + colW / 2,
                                    top: boxTop + boxH * 0.28,
                                    originX: 'center',
                                    originY: 'center',
                                    fontFamily: ARABIC_FONT,
                                    fontSize: Math.min(boxH * 0.22, 18),
                                    fill: surahColor,
                                    direction: 'rtl',
                                    textAlign: 'center',
                                    selectable: false, evented: false,
                                }));
                            }

                            // ── Horizontal decorative divider ──
                            const divY = boxTop + boxH * 0.50;
                            canvas.add(new fabric.Line([colX + 8, divY, colX + colW - 8, divY], {
                                stroke: goldColor, strokeWidth: 0.8,
                                selectable: false, evented: false,
                            }));
                            // Small diamond ornament at center
                            const dSize = 3;
                            canvas.add(new fabric.Rect({
                                left: colX + colW / 2, top: divY,
                                width: dSize, height: dSize,
                                fill: goldColor,
                                originX: 'center', originY: 'center',
                                angle: 45,
                                selectable: false, evented: false,
                            }));

                            // ── Bismillah in Arabic (not shown for surah 1 — its verse 1 IS the Bismillah) ──
                            if (newSurahNum !== 1 && newSurahNum !== 9) {
                                canvas.add(new fabric.Text('بِسۡمِ اللّٰهِ الرَّحۡمٰنِ الرَّحِيۡمِ', {
                                    left: colX + colW / 2,
                                    top: boxTop + boxH * 0.70,
                                    originX: 'center',
                                    originY: 'center',
                                    fontFamily: ARABIC_FONT,
                                    fontSize: Math.min(boxH * 0.18, 15),
                                    fill: '#0d0d0d',
                                    direction: 'rtl',
                                    textAlign: 'center',
                                    selectable: false, evented: false,
                                }));
                            } else if (newSurahNum === 9) {
                                // Surah At-Tawbah has no Bismillah
                                canvas.add(new fabric.Text('لا بسملة', {
                                    left: colX + colW / 2, top: boxTop + boxH * 0.70,
                                    originX: 'center', originY: 'center',
                                    fontFamily: ARABIC_FONT,
                                    fontSize: Math.min(boxH * 0.14, 11),
                                    fill: '#888', direction: 'rtl', textAlign: 'center',
                                    selectable: false, evented: false,
                                }));
                            }

                            // ── Bengali surah name (bottom) ──
                            canvas.add(new fabric.Text('সূরা ' + newSurahName, {
                                left: colX + colW / 2,
                                top: boxTop + boxH * 0.88,
                                originX: 'center',
                                originY: 'center',
                                fontFamily: BANGLA_FONT,
                                fontSize: Math.min(boxH * 0.11, 9),
                                fill: surahColor,
                                fontWeight: 'bold',
                                selectable: false, evented: false,
                            }));
                        }
                        continue;
                    }

                    // ── Zone calculation ──
                    // Priority 1: use exact SVG zone heights from slot definition
                    // Priority 2: fall back to ratio-based calculation
                    const showMeaning = this.showBanglaMeaning;
                    const showUccharon = this.showBanglaUccharon;
                    const showAnyBangla = showMeaning || showUccharon;
                    const showBoth = showMeaning && showUccharon;

                    let symbolZoneH, arZoneH, eachBnH, bnZoneH;

                    if (sl._svgSymH !== undefined) {
                        // ── SVG-native layout: ALWAYS use exact SVG zone positions ──
                        symbolZoneH = sl._svgSymH;   // 11.5 px always
                        arZoneH = sl._svgArH;    // 39.72 px always
                        bnZoneH = sl._svgBnH;    // 13.26 px always
                        eachBnH = showBoth ? bnZoneH / 2 : bnZoneH;
                    } else {
                        // ── Ratio-based layout (fallback for custom templates) ──
                        symbolZoneH = this._symbolZoneH || 0;
                        const effectiveH = sl.height - symbolZoneH;
                        const arZoneRatio = this._arZoneRatio || (showAnyBangla ? 0.56 : 0.90);
                        arZoneH = effectiveH * arZoneRatio;
                        bnZoneH = effectiveH - arZoneH;
                        eachBnH = showBoth ? bnZoneH / 2 : bnZoneH;
                    }

                    // ── Arabic render font size (per-line) ──
                    // _globalFontPx = arZoneH × 0.73 ≈ 29px (matches Kariana PDF).
                    // Since measure and render now use the SAME font size, lines that
                    // fit at measurement time should also fit at render time.
                    // Per-line auto-shrink handles edge cases (e.g. very long single words).
                    let arabicPx = this._globalFontPx || (arZoneH * 0.73);
                    {
                        const _globalPx = arabicPx;
                        const _testArObj = new fabric.Text(reverseArabicDigits(item.text || ''), {
                            fontFamily: ARABIC_FONT,
                            fontSize: arabicPx,
                            lineHeight: 1,
                            charSpacing: 0,
                        });
                        let _shrinkPass = 0;
                        while ((_testArObj.width || 0) > colW && _shrinkPass++ < 12) {
                            arabicPx = arabicPx * (colW / Math.max(_testArObj.width || colW, 1)) * 0.97;
                            _testArObj.set({ fontSize: arabicPx });
                            _testArObj.initDimensions();
                        }
                        // Floor: never shrink below 88% of global (keeps page visually uniform)
                        arabicPx = Math.max(arabicPx, _globalPx * 0.88, arZoneH * 0.50);
                    }
                    const banglaPx = this._globalBnPx || (eachBnH * 0.85);

                    // ── Absolute sub-zone Y positions (always derived from SVG rect coords) ──
                    // sl.top     = symTop (e.g. 25.39 for row 1)
                    // arZoneTop  = arTop  (e.g. 36.89 for row 1) = sl.top + 11.5
                    // bnZoneStart = bnTop (e.g. 76.61 for row 1) = arZoneTop + 39.72
                    const arZoneTop = sl.top + symbolZoneH;

                    const isEditable = this.editMode;   // edit mode works regardless of slot guides
                    const TextClass = isEditable ? fabric.IText : fabric.Text;

                    prevSurah = item.surah;

                    // ── Top Symbol Strip ──
                    // Shows the 12 Kariana tajweed rule symbols (১ ২ ৩ ৪ 💡 ⌂ ✿ ❧ ং ⊙)
                    // ABOVE the Arabic text row, only when showTopSymbolRow is ON
                    // and individual symbols are enabled by the user.
                    // Symbols are spread evenly across the symbol zone width.
                    // If a symbol has an uploaded SVG, the SVG is shown; otherwise
                    // the shortName character (e.g. '১', '✿', '💡') is shown.
                    if (symbolZoneH > 0 && this.showTopSymbolRow) {
                        const enabledSyms = this.topSymbols.filter(s => s.enabled);
                        if (enabledSyms.length > 0) {
                            const symMidY = sl.top + symbolZoneH / 2;
                            const symH = Math.min(symbolZoneH * 0.82, 9);
                            const symClip = new fabric.Rect({
                                left: colX, top: sl.top,
                                width: colW, height: symbolZoneH,
                                absolutePositioned: true,
                            });

                            // Evenly distribute enabled symbols across the full column width
                            const gap = colW / (enabledSyms.length + 1);
                            enabledSyms.forEach((sym, si) => {
                                // RTL: first symbol at right side
                                const symX = colX + colW - gap * (si + 1);

                                if (sym.svgData) {
                                    // User-uploaded SVG image for this symbol slot
                                    const _x = symX, _clip = symClip;
                                    fabric.loadSVGFromURL(sym.svgData, (objs) => {
                                        if (!objs || !objs.length) return;
                                        const g = new fabric.Group(objs, {
                                            left: _x, top: symMidY,
                                            originX: 'center', originY: 'center',
                                            selectable: false, evented: false,
                                        });
                                        const sc = symH / Math.max(g.height || 1, g.width || 1);
                                        g.scale(sc);
                                        g.clipPath = _clip;
                                        canvas.add(g);
                                        canvas.requestRenderAll();
                                    });
                                } else {
                                    // Text character fallback: shortName of the symbol
                                    // e.g. '১', '২', '💡', '⌂', '✿', 'ং', '⊙'
                                    const lbl = new fabric.Text(sym.shortName || String(sym.rank), {
                                        left: symX, top: symMidY,
                                        originX: 'center', originY: 'center',
                                        fontSize: symH,
                                        fill: sym.color || '#0d0d0d',
                                        fontFamily: BANGLA_FONT,
                                        selectable: false, evented: false,
                                    });
                                    lbl.clipPath = symClip;
                                    canvas.add(lbl);
                                }
                            });
                        }
                    }



                    // Canvas 2D BiDi fix: reverse digit groups so RTL canvas renders correctly
                    const rawAr = item.text || '';
                    const displayText = reverseArabicDigits(rawAr);

                    const bnZoneStart = arZoneTop + arZoneH;

                    const arObj = new TextClass(displayText, {
                        left: colX + colW,
                        top: arZoneTop,          // top-anchored — we compute centre below
                        originX: 'right',
                        originY: 'top',
                        fontFamily: ARABIC_FONT,
                        fontSize: arabicPx,
                        fill: cfg.color || t.arabicFont?.color || '#0d0d0d',
                        charSpacing: 0,
                        lineHeight: 1,                  // no extra Fabric internal leading
                        textAlign: 'right',
                        direction: 'rtl',
                        selectable: isEditable,
                        editable: isEditable,
                    });
                    canvas.add(arObj);

                    // Vertically centre text within the arabic zone using actual measured height.
                    // If text is taller than zone (rare with 0.58 ratio) pin to top so overflow
                    // goes upward into the symbol strip rather than downward into bangla zone.
                    {
                        const txtH = arObj.height || arabicPx;
                        const topOffset = Math.max(0, (arZoneH - txtH) / 2);
                        arObj.set({ top: arZoneTop + topOffset });
                    }

                    // ── clipPath: 1px anti-alias pad only — no cross-row bleed ──
                    const TASHKEEL_PAD = 1;
                    arObj.clipPath = new fabric.Rect({
                        left: colX,
                        top: arZoneTop - TASHKEEL_PAD,
                        width: colW,
                        height: arZoneH + TASHKEEL_PAD * 2,
                        absolutePositioned: true,
                    });

                    // ── Arabic text justification ──
                    // RTL lines: text flows right→left. "Left side" = end of line.
                    // MIN_LEFT_GAP = 0.5× arabicPx ≈ half char-width of breathing room.
                    // Now that measure=render (both 0.73), text fills the column naturally;
                    // a small gap prevents the very last character touching the border.
                    const MIN_LEFT_GAP = arabicPx * 0.5;
                    const maxJustifiedW = colW - MIN_LEFT_GAP;

                    const arNaturalW = arObj.width || 1;
                    const arFillRatio = arNaturalW / maxJustifiedW;
                    const isLastLine = item.isLastOfVerse === true;

                    // Justify only lines that are ≥50% full and not the last line of a verse
                    if (!isLastLine && arFillRatio >= 0.50 && arNaturalW < maxJustifiedW) {
                        const slack = maxJustifiedW - arNaturalW;
                        const spaces = (displayText.match(/\s+/g) || []).length;

                        if (spaces > 0 && slack > 0) {
                            const extraPerSpace = slack / spaces;
                            const spaceWidth = arabicPx * 0.25;
                            const extraSpaces = Math.max(1, Math.round(extraPerSpace / spaceWidth));
                            const spacePad = '\u00A0'.repeat(Math.min(extraSpaces, 3));

                            const justifiedText = displayText.replace(/\s+/g, spacePad + ' ');
                            arObj.set({ text: justifiedText });

                            // Strict safety: revert if justified text exceeds maxJustifiedW
                            if ((arObj.width || 0) > maxJustifiedW) {
                                arObj.set({ text: displayText });
                            }
                        }
                    }

                    // ── Hard clamp: final overflow guard after justification ──
                    // If the text object is still wider than colW for any reason,
                    // shrink font 2% per pass (max 8 passes) until it fits cleanly.
                    {
                        let _clampPass = 0;
                        while ((arObj.width || 0) > maxJustifiedW && _clampPass++ < 8) {
                            arabicPx *= 0.98;
                            arObj.set({ fontSize: arabicPx });
                            arObj.initDimensions();
                        }
                    }

                    if (isEditable) {
                        arObj._slotId = sl.id;
                        arObj._itemIdx = arabicItemIdx - 1;
                        arObj._field = 'ar';
                    }

                    // ── Bangla zone: rendered via global flow (see _renderGlobalBangla below) ──
                    // Individual per-row Bangla rendering is intentionally removed.
                    // Instead, after all Arabic rows are painted, _renderGlobalBangla() runs a
                    // single pass that distributes the surah's full Bangla text evenly and with
                    // a UNIFORM font size across every bangla zone on this page.
                }

                // SYMBOL
                else if (sl.type === 'symbol') {
                    const symText = cfg.text || '';
                    if (symText) {
                        canvas.add(new fabric.Text(symText, {
                            left: pageW / 2, top: sl.top + sl.height / 2,
                            originX: 'center', originY: 'center',
                            fontFamily: ARABIC_FONT,
                            fontSize: cfg.fontSize || sl.height * 0.7,
                            fill: cfg.color || t.arabicFont.color,
                            selectable: false,
                        }));
                    }
                }

                // BANGLA standalone
                else if (sl.type === 'bangla') {
                    const item = slotItems[arabicItemIdx - 1];
                    if (item && item.bn) {
                        const banglaPx = cfg.autoFit ? sl.height * 0.72 : (cfg.fontSize || 7);
                        canvas.add(new fabric.Text(item.bn, {
                            left: colX, top: sl.top + (sl.height - banglaPx) / 2,
                            width: colW,
                            fontFamily: BANGLA_FONT,
                            fontSize: banglaPx,
                            fill: cfg.color || '#444',
                            textAlign: 'right',
                            selectable: false,
                        }));
                    }
                }

                // FOOTER
                else if (sl.type === 'footer') {
                    const fcY = sl.top + sl.height / 2;
                    if (cfg.showPageNum) {
                        canvas.add(new fabric.Text('— ' + pageNum + ' —', {
                            left: pageW / 2, top: fcY,
                            originX: 'center', originY: 'center',
                            fontFamily: BANGLA_FONT,
                            fontSize: cfg.pageNumFontSize || 7,
                            fill: cfg.pageNumColor || t.surahColor,
                            selectable: false,
                        }));
                    }
                    if (cfg.customText) {
                        const alignX = cfg.customAlign === 'right' ? colX + colW : cfg.customAlign === 'left' ? colX : pageW / 2;
                        const originX = cfg.customAlign === 'right' ? 'right' : cfg.customAlign === 'left' ? 'left' : 'center';
                        canvas.add(new fabric.Text(cfg.customText, {
                            left: alignX, top: fcY - 6,
                            originX, originY: 'center',
                            fontFamily: BANGLA_FONT,
                            fontSize: cfg.customFontSize || 6,
                            fill: cfg.customColor || '#888',
                            selectable: false,
                        }));
                    }
                }

                // BORDER
                else if (sl.type === 'border') {
                    canvas.add(new fabric.Rect({
                        left: colX, top: sl.top,
                        width: colW, height: sl.height,
                        fill: cfg.fill || 'transparent',
                        stroke: cfg.stroke || t.surahColor,
                        strokeWidth: cfg.strokeWidth || 1,
                        rx: cfg.rx || 0, ry: cfg.ry || 0,
                        selectable: false,
                    }));
                }
            }

            // ── Front assets (text overlays on top of everything) ──
            for (const asset of assets.filter(a => a.zIndex === 'front')) {
                await this._renderAsset(canvas, asset, pageW, pageH);
            }

            // ── Global Bangla render pass ──
            // Runs AFTER all Arabic rows are placed. Distributes the full surah Bangla text
            // continuously across all bangla zones on this page with a uniform font size.
            if (this.showBanglaMeaning || this.showBanglaUccharon) {
                this._renderGlobalBangla(canvas, slotItems, slots, t, colX, colW);
            }

            canvas.requestRenderAll();
        },

        /* ════════════════════════════════════════════════════════════
           GLOBAL BANGLA RENDERER  (word-flow engine)
           Each Arabic row gets exactly ONE Bangla line, filled greedily
           with words using Canvas2D measureText (same font/size as
           _precomputeBanglaFlow so page offsets match perfectly).
        ════════════════════════════════════════════════════════════ */
        _renderGlobalBangla(canvas, slotItems, slots, t, colX, colW) {
            const showMeaning = this.showBanglaMeaning;
            const showUccharon = this.showBanglaUccharon;
            if (!showMeaning && !showUccharon) return;

            const showBoth = showMeaning && showUccharon;

            // If precompute hasn't finished yet (font still loading), skip —
            // _precomputeBanglaFlow will call renderPage() when done.
            if (!this._banglaFlowReady) return;

            const words = this._banglaWords || {};
            const pwords = this._pronunWords || {};
            const pageMap = this._pageBanglaWordStart?.[this.currentPage] || {};
            const prMap = this._pagePronunWordStart?.[this.currentPage] || {};

            // Zone geometry — same calculation as processLines()
            const arSlots = slots.filter(s => s.type === 'arabic');
            if (!arSlots.length) return;
            const slot0 = arSlots[0];
            const symbolZoneH = slot0._svgSymH ?? 0;
            const arZoneH = slot0._svgArH ?? (slot0.height * 0.56);
            const bnZoneH = slot0._svgBnH ?? (slot0.height - symbolZoneH - arZoneH);
            const eachBnH = showBoth ? bnZoneH / 2 : bnZoneH;

            const bnFontSize = this._globalBnPx || (eachBnH * 0.72);
            const availW = colW - 8;
            // Font string MUST be identical to _precomputeBanglaFlow
            const fontStr = `${bnFontSize}px "${BANGLA_FONT}"`;

            // Measurement canvas
            const mCanvas = document.createElement('canvas');
            mCanvas.width = 4000;
            mCanvas.height = 100;
            const mCtx = mCanvas.getContext('2d');
            mCtx.font = fontStr + ', sans-serif';
            const spaceW = mCtx.measureText(' ').width;

            const banglaColor = t.banglaFont?.color || '#2d4a8a';
            const pronunColor = '#7a3e00';

            // Build page real items: mirror renderPage's arabicItemIdx walk.
            // slotItems is consumed sequentially (same order as arabic slots), with
            // surah-opening markers consuming one slot item but NOT one arSlot.
            // We replay that same pointer logic here to get correct sl ↔ item pairs.
            const pageRealItems = [];
            let slotItemIdx = 0;  // pointer into slotItems (mirrors arabicItemIdx in renderPage)
            for (let si = 0; si < arSlots.length; si++) {
                const item = slotItems[slotItemIdx++];
                if (!item) break;
                // surah-opening markers (can be multiple consecutive ones per opening box):
                // each consumes a slotItems entry and an arSlot, but is NOT a real content row.
                // Skip ALL consecutive opening/gap markers for this slot walk pass.
                if (item.type === 'surah-opening' || item.type === 'surah-gap') {
                    // Consume all subsequent opening/gap markers (they each eat one arSlot)
                    while (slotItemIdx < slotItems.length &&
                        (slotItems[slotItemIdx]?.type === 'surah-opening' ||
                            slotItems[slotItemIdx]?.type === 'surah-gap')) {
                        slotItemIdx++;
                        si++;  // advance arSlot index too (each marker consumes one slot)
                    }
                    continue;  // skip — no real content on these opening slots
                }
                pageRealItems.push({ sl: arSlots[si], item });
            }
            if (!pageRealItems.length) return;

            // Group rows by surah (handles pages that span two surahs)
            const surahGroups = {};
            for (const pair of pageRealItems) {
                const s = pair.item.surah;
                if (!surahGroups[s]) surahGroups[s] = [];
                surahGroups[s].push(pair);
            }

            // ── Render one field (meaning or pronunciation) for one surah's rows ──
            const renderField = (surahNum, rowPairs, allWords, startWordIdx, fillColor, isTop) => {
                if (!allWords?.length) return;
                let wordIdx = startWordIdx ?? 0;

                for (const { sl, item } of rowPairs) {
                    // Y positions for this slot's Bangla zone
                    const arZoneTop = sl.top + symbolZoneH;
                    const bnZoneStart = arZoneTop + arZoneH;
                    const zoneTop = isTop ? bnZoneStart : bnZoneStart + eachBnH;
                    const zoneMid = zoneTop + eachBnH / 2;

                    // Greedy word pack: fill this row's one Bangla line
                    const lineWords = [];
                    let lineW = 0;
                    while (wordIdx < allWords.length) {
                        const ww = mCtx.measureText(allWords[wordIdx]).width;
                        const gap = lineWords.length > 0 ? spaceW : 0;
                        if (lineWords.length > 0 && lineW + gap + ww > availW) break;
                        lineWords.push(allWords[wordIdx]);
                        lineW += gap + ww;
                        wordIdx++;
                    }
                    const chunk = lineWords.join(' ');
                    if (!chunk) continue;

                    const bnObj = new fabric.Text(chunk, {
                        left: colX + colW / 2,
                        top: zoneMid,
                        originX: 'center',
                        originY: 'center',
                        fontFamily: BANGLA_FONT,
                        fontSize: bnFontSize,     // UNIFORM — same every row, every page
                        fill: fillColor,
                        charSpacing: 0,
                        textAlign: 'center',
                        selectable: false,
                        evented: false,
                    });
                    canvas.add(bnObj);

                    // Clip to Bangla zone — prevents bleeding into adjacent rows
                    bnObj.clipPath = new fabric.Rect({
                        left: colX,
                        top: zoneTop,
                        width: availW,
                        height: eachBnH + 1,
                        absolutePositioned: true,
                    });
                }
            };

            // Render each surah group on this page
            for (const [surahStr, rowPairs] of Object.entries(surahGroups)) {
                const s = Number(surahStr);
                const bw = pageMap[s];         // undefined → default to 0 (start of surah)
                const pw = prMap[s];
                if (showMeaning || showBoth) {
                    renderField(s, rowPairs, words[s], bw, banglaColor, true);
                }
                if (showBoth) {
                    renderField(s, rowPairs, pwords[s], pw, pronunColor, false);
                } else if (showUccharon && !showMeaning) {
                    renderField(s, rowPairs, pwords[s], pw, pronunColor, true);
                }
            }
        },

        // Helper: render a single template asset (SVG or PNG) onto fabric canvas
        async _renderAsset(canvas, asset, pageW, pageH) {
            const scaleX = (asset.w || pageW) / pageW;
            const scaleY = (asset.h || pageH) / pageH;
            if (asset.type === 'svg') {
                await new Promise(resolve => {
                    fabric.loadSVGFromURL(asset.data, (objects, options) => {
                        if (!objects || !objects.length) { resolve(); return; }
                        const g = fabric.util.groupSVGElements(objects, options);
                        const sw = pageW / ((options.width || 1));
                        const sh = pageH / ((options.height || 1));
                        g.set({
                            left: asset.x || 0, top: asset.y || 0,
                            scaleX: sw, scaleY: sh,
                            opacity: asset.opacity ?? 1,
                            selectable: false, evented: false,
                        });
                        canvas.add(g);
                        resolve();
                    });
                });
            } else {
                // PNG / raster
                await new Promise(resolve => {
                    fabric.Image.fromURL(asset.data, (img) => {
                        if (!img) { resolve(); return; }
                        img.set({
                            left: asset.x || 0, top: asset.y || 0,
                            scaleX: (asset.w || pageW) / (img.width || 1),
                            scaleY: (asset.h || pageH) / (img.height || 1),
                            opacity: asset.opacity ?? 1,
                            selectable: false, evented: false,
                        });
                        canvas.add(img);
                        resolve();
                    }, { crossOrigin: 'anonymous' });
                });
            }
        },

        /* ════════════════════════════════════════════════
           TEMPLATE BUILDER
        ════════════════════════════════════════════════ */
        openBuilder() {
            this.editingPageIdx = null;
            this.builderEditingTplId = null;   // editing master directly
            this.builderDraft = JSON.parse(JSON.stringify(this.masterTemplate));
            if (!this.builderDraft.designElements) this.builderDraft.designElements = [];
            if (!this.builderDraft.assets) this.builderDraft.assets = [];
            this.selectedRowId = this.builderDraft.rows[0]?.id || null;
            this.selectedElId = null;
            this.builderActiveTab = 'layout';
            this.showBuilder = true;
            this.$nextTick(() => this.initBuilderFabric());
        },

        openPageOverride(pageIdx) {
            const idx = parseInt(pageIdx);
            if (!this.pageOverrides[idx]) {
                this.pageOverrides[idx] = {
                    rows: JSON.parse(JSON.stringify(this.masterTemplate.rows)),
                    designElements: JSON.parse(JSON.stringify(this.masterTemplate.designElements || [])),
                    _unlinked: true,
                };
            }
            this.editingPageIdx = idx;
            this.builderDraft = {
                ...JSON.parse(JSON.stringify(this.masterTemplate)),
                rows: JSON.parse(JSON.stringify(this.pageOverrides[idx].rows)),
                designElements: JSON.parse(JSON.stringify(this.pageOverrides[idx].designElements || [])),
            };
            this.selectedRowId = this.builderDraft.rows[0]?.id || null;
            this.selectedElId = null;
            this.builderActiveTab = 'layout';
            this.showBuilder = true;
            this.$nextTick(() => this.initBuilderFabric());
        },

        isPageLinked(idx) { return !this.pageOverrides[idx]?._unlinked; },
        unlinkPage(idx) {
            if (this.pageOverrides[idx]) return;
            this.pageOverrides[idx] = {
                rows: JSON.parse(JSON.stringify(this.masterTemplate.rows)),
                designElements: JSON.parse(JSON.stringify(this.masterTemplate.designElements || [])),
                _unlinked: true,
            };
            this.showToast('📌 পেজ ' + (idx + 1) + ' আনলিঙ্ক হয়েছে', 'info');
            this.renderPage();
        },
        relinkPage(idx) {
            delete this.pageOverrides[idx];
            this.showToast('🔗 পেজ ' + (idx + 1) + ' মাস্টার টেমপ্লেটে রিলিঙ্ক হয়েছে', 'success');
            this.renderPage();
        },

        closeBuilder() {
            this.showBuilder = false;
            this.builderDraft = null;
            this.selectedRowId = null;
            if (this.builderFabricCanvas) {
                this.builderFabricCanvas.dispose();
                this.builderFabricCanvas = null;
            }
        },

        applyBuilder() {
            if (this.editingPageIdx !== null) {
                // Per-page override
                const idx = this.editingPageIdx;
                this.pageOverrides[idx] = {
                    rows: JSON.parse(JSON.stringify(this.builderDraft.rows)),
                    designElements: JSON.parse(JSON.stringify(this.builderDraft.designElements || [])),
                    assets: JSON.parse(JSON.stringify(this.builderDraft.assets || [])),
                    margins: JSON.parse(JSON.stringify(this.builderDraft.margins)),
                    surahColor: this.builderDraft.surahColor,
                    arabicFont: JSON.parse(JSON.stringify(this.builderDraft.arabicFont || {})),
                    banglaFont: JSON.parse(JSON.stringify(this.builderDraft.banglaFont || {})),
                    showSlotGuides: this.builderDraft.showSlotGuides,
                    _unlinked: true,
                };
                this.renderPage();
            } else if (this.builderEditingTplId !== null) {
                // Editing a specific saved template
                const tplIdx = this.savedTemplates.findIndex(t => t.id === this.builderEditingTplId);
                if (tplIdx >= 0) {
                    const wasMaster = this.savedTemplates[tplIdx].isMaster;
                    this.savedTemplates[tplIdx] = {
                        ...JSON.parse(JSON.stringify(this.builderDraft)),
                        isMaster: wasMaster,
                    };
                    if (wasMaster) {
                        Object.keys(this.pageOverrides).forEach(k => {
                            if (!this.pageOverrides[k]?._unlinked) delete this.pageOverrides[k];
                        });
                        this.svgText = null;
                        this.initCanvas();
                        this.processLines();
                    }
                }
            } else {
                // Editing master directly (from toolbar) — save back into master slot
                const masterIdx = this.savedTemplates.findIndex(t => t.isMaster);
                if (masterIdx >= 0) {
                    this.savedTemplates[masterIdx] = {
                        ...JSON.parse(JSON.stringify(this.builderDraft)),
                        isMaster: true,
                    };
                }
                Object.keys(this.pageOverrides).forEach(k => {
                    if (!this.pageOverrides[k]?._unlinked) delete this.pageOverrides[k];
                });
                this.svgText = null;
                this.initCanvas();
                this.processLines();
            }
            if (this.builderFabricCanvas) {
                this.builderFabricCanvas.dispose();
                this.builderFabricCanvas = null;
            }
            this.showBuilder = false;
            this.builderEditingTplId = null;
            this.showToast('✅ টেমপ্লেট সেভ হয়েছে! পেজ: ' + this.pageCountEstimate, 'success');
        },

        /* ════════════════════════════════════════════════
           TEMPLATE LIBRARY MANAGEMENT
        ════════════════════════════════════════════════ */

        // Open builder for a specific saved template
        openBuilderForTemplate(tplId) {
            const tpl = this.savedTemplates.find(t => t.id === tplId);
            if (!tpl) return;
            this.builderEditingTplId = tplId;
            this.editingPageIdx = null;
            this.builderDraft = JSON.parse(JSON.stringify(tpl));
            if (!this.builderDraft.designElements) this.builderDraft.designElements = [];
            if (!this.builderDraft.assets) this.builderDraft.assets = [];
            this.selectedRowId = this.builderDraft.rows[0]?.id || null;
            this.selectedElId = null;
            this.builderActiveTab = 'layout';
            this.showBuilder = true;
            this.$nextTick(() => this.initBuilderFabric());
        },

        // Create a new blank template and immediately open in builder
        createNewTemplate() {
            const newTpl = makeDefaultTemplate();
            newTpl.name = 'নতুন টেমপ্লেট ' + (this.savedTemplates.length + 1);
            newTpl.isMaster = false;
            newTpl.assets = [];
            this.savedTemplates.push(newTpl);
            this.openBuilderForTemplate(newTpl.id);
        },

        // Set a saved template as the master — re-renders all pages
        setMasterTemplate(tplId) {
            let found = false;
            this.savedTemplates.forEach(t => {
                t.isMaster = (t.id === tplId);
                if (t.isMaster) found = true;
            });
            if (!found) return;
            Object.keys(this.pageOverrides).forEach(k => {
                if (!this.pageOverrides[k]?._unlinked) delete this.pageOverrides[k];
            });
            this.svgText = null;
            this.initCanvas();
            this.processLines();
            this.showToast('⭐ মাস্টার টেমপ্লেট পরিবর্তন হয়েছে — সব পেজ আপডেট!', 'success');
        },

        saveCurrentTemplate() {
            const name = prompt('টেমপ্লেটের নাম:', 'কাস্টম ' + this.savedTemplates.length);
            if (!name) return;
            const copy = JSON.parse(JSON.stringify(this.masterTemplate));
            copy.id = 'tpl-' + Date.now();
            copy.name = name;
            copy.isMaster = false;
            if (!copy.assets) copy.assets = [];
            this.savedTemplates.push(copy);
            this.showToast('✅ «' + name + '» লাইব্রেরিতে যোগ হয়েছে', 'success');
        },

        applyTemplateToAll(tpl) { this.setMasterTemplate(tpl.id); },

        applyTemplateToPage(tpl, pageIdx) {
            const idx = parseInt(pageIdx);
            this.pageOverrides[idx] = {
                rows: JSON.parse(JSON.stringify(tpl.rows)),
                designElements: JSON.parse(JSON.stringify(tpl.designElements || [])),
                assets: JSON.parse(JSON.stringify(tpl.assets || [])),
                margins: JSON.parse(JSON.stringify(tpl.margins)),
                surahColor: tpl.surahColor,
                arabicFont: JSON.parse(JSON.stringify(tpl.arabicFont || {})),
                _unlinked: true,
            };
            this.renderPage();
            this.showToast('✅ পেজ ' + (idx + 1) + ' তে «' + tpl.name + '» apply হয়েছে', 'success');
        },

        deleteTemplate(idx) {
            const tpl = this.savedTemplates[idx];
            if (this.savedTemplates.length === 1) { this.showToast('❌ শেষ template মুছা যাবে না', 'error'); return; }
            if (tpl?.isMaster) { this.showToast('❌ Master template মুছতে আগে অন্যটি master করুন', 'error'); return; }
            this.savedTemplates.splice(idx, 1);
        },

        duplicateTemplate(tpl) {
            const copy = JSON.parse(JSON.stringify(tpl));
            copy.id = 'tpl-' + Date.now();
            copy.name = tpl.name + ' (copy)';
            copy.isMaster = false;
            this.savedTemplates.push(copy);
            this.showToast('✅ «' + copy.name + '» তৈরি হয়েছে', 'success');
        },

        exportTemplateJSON() {
            const json = JSON.stringify({ savedTemplates: this.savedTemplates }, null, 2);
            const a = document.createElement('a');
            a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
            a.download = 'quran-templates.json'; a.click();
        },

        importTemplateJSON(event) {
            const file = event.target?.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    const tpls = data.savedTemplates || [data];
                    tpls.forEach(tpl => {
                        if (!tpl.rows) return;
                        tpl.id = 'tpl-' + Date.now() + Math.random();
                        tpl.isMaster = false;
                        if (!tpl.assets) tpl.assets = [];
                        this.savedTemplates.push(tpl);
                    });
                    this.showToast('✅ ' + tpls.length + 'টি template import হয়েছে', 'success');
                } catch (err) { this.showToast('❌ Invalid JSON', 'error'); }
            };
            reader.readAsText(file);
        },

        /* ── Asset Upload (SVG / PNG design assets for templates) ── */
        uploadTemplateAsset(event) {
            const files = event.target?.files || event.dataTransfer?.files;
            if (!files || !this.builderDraft) return;
            Array.from(files).forEach(file => {
                const isSvg = file.type.includes('svg') || file.name.endsWith('.svg');
                const type = isSvg ? 'svg' : 'png';
                const reader = new FileReader();
                reader.onload = e => {
                    if (!this.builderDraft.assets) this.builderDraft.assets = [];
                    this.builderDraft.assets.push({
                        id: 'asset-' + Date.now() + Math.random(),
                        name: file.name,
                        type,
                        data: e.target.result,  // base64 data URL
                        x: 0, y: 0,
                        w: this.builderDraft.pageSize?.w || 455,
                        h: this.builderDraft.pageSize?.h || 630,
                        opacity: 1,
                        zIndex: 'back',   // 'back' | 'front'
                    });
                    this.builderPreviewUpdate();
                    this.showToast('✅ ' + file.name + ' যোগ হয়েছে', 'success');
                };
                reader.readAsDataURL(file);
            });
            if (event.target) event.target.value = '';
        },

        removeTemplateAsset(assetId) {
            if (!this.builderDraft) return;
            this.builderDraft.assets = (this.builderDraft.assets || []).filter(a => a.id !== assetId);
            this.builderPreviewUpdate();
        },

        /* ════════════════════════════════════════════════
           BUILDER FABRIC CANVAS (Full-Page Interactive Preview)
        ════════════════════════════════════════════════ */
        async initBuilderFabric() {
            if (this.builderFabricCanvas) {
                this.builderFabricCanvas.dispose();
                this.builderFabricCanvas = null;
            }
            const wrapEl = document.getElementById('bldr-preview-wrap');
            if (!wrapEl || !this.builderDraft) return;

            const { pageSize } = this.builderDraft;
            const containerW = wrapEl.clientWidth || 320;
            const scale = containerW / pageSize.w;
            const canvasH = Math.round(pageSize.h * scale);

            this._bScale = scale;

            // Make sure canvas element exists
            const canvasEl = document.getElementById('bldr-fabric-canvas');
            if (!canvasEl) return;

            this.builderFabricCanvas = new fabric.Canvas('bldr-fabric-canvas', {
                width: containerW,
                height: canvasH,
                selection: false,
                backgroundColor: '#ffffff',
                renderOnAddRemove: false,
            });

            // Track design element modifications
            this.builderFabricCanvas.on('object:modified', (e) => {
                const obj = e.target;
                if (!obj._elId) return;
                const found = (this.builderDraft.designElements || []).find(el => el.id === obj._elId);
                if (found) {
                    found.x = obj.left / this._bScale;
                    found.y = obj.top / this._bScale;
                    found.w = (obj.width * (obj.scaleX || 1)) / this._bScale;
                    found.h = (obj.height * (obj.scaleY || 1)) / this._bScale;
                }
            });

            // Click on row zone → select that row in sidebar
            this.builderFabricCanvas.on('mouse:down', (e) => {
                if (!e.target) return;
                if (e.target._rowId) {
                    this.selectedRowId = e.target._rowId;
                    this.renderBuilderFabric();
                }
                if (e.target._elId) {
                    this.selectedElId = e.target._elId;
                }
            });

            await this.renderBuilderFabric();
        },

        async renderBuilderFabric() {
            const canvas = this.builderFabricCanvas;
            if (!canvas || !this.builderDraft) return;

            // Remember active element so we can restore selection indicator
            const prevSelElId = this.selectedElId;

            canvas.clear();
            const { pageSize, margins } = this.builderDraft;
            const s = this._bScale;
            const areaH = pageSize.h - margins.top - margins.bottom;
            const colX = margins.left;
            const colW = pageSize.w - margins.left - margins.right;

            // ── Page background ───────────────────────────────
            canvas.add(new fabric.Rect({
                left: 0, top: 0, width: pageSize.w * s, height: pageSize.h * s,
                fill: '#ffffff', stroke: '#e5e0d8', strokeWidth: 1,
                selectable: false, evented: false,
            }));

            // ── SVG overlay (if set) ─────────────────────────
            if (this.svgText) {
                await new Promise(res => {
                    fabric.loadSVGFromString(this.svgText, (objs, opts) => {
                        const g = fabric.util.groupSVGElements(objs, opts);
                        const sx = (pageSize.w * s) / (opts.width || pageSize.w);
                        const sy = (pageSize.h * s) / (opts.height || pageSize.h);
                        g.set({ left: 0, top: 0, scaleX: sx, scaleY: sy, selectable: false, evented: false, opacity: 0.25 });
                        canvas.add(g);
                        canvas.sendToBack(g);
                        res();
                    });
                });
            }

            // ── Row zones ────────────────────────────────────
            let y = margins.top;
            let arabicPreviewIdx = 0;
            for (const row of this.builderDraft.rows) {
                if (!row.visible) continue;
                const rowH = (row.heightPct / 100) * areaH;
                const color = ROW_TYPES[row.type]?.color || '#888';
                const isSel = row.id === this.selectedRowId;

                // Zone background
                const zoneRect = new fabric.Rect({
                    left: colX * s,
                    top: y * s,
                    width: colW * s,
                    height: rowH * s,
                    fill: color + (isSel ? '44' : '18'),
                    stroke: color,
                    strokeWidth: isSel ? 2 : 1,
                    selectable: true,
                    evented: true,
                    hasControls: false,
                    hasBorders: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    hoverCursor: 'pointer',
                    _rowId: row.id,
                });
                canvas.add(zoneRect);

                // Row label
                const fontSize = Math.max(6, Math.min(10, rowH * s * 0.3));
                canvas.add(new fabric.Text(
                    `${ROW_TYPES[row.type]?.icon || ''} ${row.label}  (${row.heightPct.toFixed(1)}%)`, {
                    left: (colX + 2) * s,
                    top: y * s + 2,
                    fontSize,
                    fontFamily: 'Arial',
                    fill: isSel ? '#fff' : color,
                    selectable: false,
                    evented: false,
                }));

                // Real verse text from builderPreviewPageIdx
                const previewPage = this.pages[this.builderPreviewPageIdx] || this.pages[this.currentPage] || [];
                if (row.type === 'arabic' && rowH * s > 16) {
                    const cfg = row.config || {};
                    const item = previewPage[arabicPreviewIdx++];
                    const arText = item?.ar || 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
                    const showBn = cfg.showBangla && item?.bn;
                    const arZoneH = showBn ? rowH * 0.62 : rowH * 0.92;
                    const aPx = cfg.autoFit !== false ? Math.max(7, Math.min(18, arZoneH * s * 0.42)) : ((cfg.fontSize || 14) * s * 0.3);
                    const arAlign = cfg.align || 'right';
                    const arLeftMap = { right: (colX + colW) * s - 4, center: (colX + colW / 2) * s, left: colX * s + 4 };

                    canvas.add(new fabric.Text(arText, {
                        left: arLeftMap[arAlign],
                        top: y * s + arZoneH * s * 0.25,
                        fontSize: aPx,
                        fontFamily: ARABIC_FONT,
                        fill: (cfg.color || '#0d0d0d') + '99',
                        originX: arAlign,
                        selectable: false, evented: false,
                    }));
                    if (showBn && rowH * s > 22) {
                        const bPx = Math.max(5, aPx * 0.5);
                        const bnAlign = cfg.banglaAlign || 'right';
                        const bnLeftMap = { right: (colX + colW) * s - 4, center: (colX + colW / 2) * s, left: colX * s + 4 };
                        canvas.add(new fabric.Text(item.bn, {
                            left: bnLeftMap[bnAlign],
                            top: y * s + rowH * s * 0.70,
                            fontSize: bPx,
                            fontFamily: BANGLA_FONT,
                            fill: (cfg.banglaColor || '#444') + '99',
                            originX: bnAlign,
                            selectable: false, evented: false,
                        }));
                    }
                } else if (row.type === 'header' && rowH * s > 10) {
                    const hdrItem = previewPage[0];
                    const hdrText = hdrItem ? '— সূরা ' + (SURAH_NAMES[hdrItem.surah] || '') + ' —' : '— সূরাতুল বাকারা —';
                    canvas.add(new fabric.Text(hdrText, {
                        left: (colX + colW / 2) * s,
                        top: y * s + rowH * s * 0.5,
                        fontSize: Math.max(6, rowH * s * 0.38),
                        fontFamily: BANGLA_FONT,
                        fill: (row.config?.color || '#b3005a') + 'cc',
                        originX: 'center', originY: 'center',
                        selectable: false, evented: false,
                    }));
                } else if (row.type === 'footer' && rowH * s > 8) {
                    const pgNum = (this.builderPreviewPageIdx || this.currentPage) + 1;
                    canvas.add(new fabric.Text('— ' + pgNum + ' —', {
                        left: (colX + colW / 2) * s,
                        top: y * s + rowH * s * 0.5,
                        fontSize: Math.max(6, rowH * s * 0.45),
                        fontFamily: BANGLA_FONT,
                        fill: '#b3005acc',
                        originX: 'center', originY: 'center',
                        selectable: false, evented: false,
                    }));
                }

                // Resize handle (drag bottom edge to resize row)
                const handleH = Math.max(4, 7 * s);
                const handle = new fabric.Rect({
                    left: (colX + colW * 0.25) * s,
                    top: (y + rowH) * s - handleH / 2,
                    width: colW * s * 0.5,
                    height: handleH,
                    fill: color + 'cc',
                    rx: handleH / 2,
                    selectable: true,
                    evented: true,
                    hasControls: false,
                    hasBorders: false,
                    lockMovementX: true,
                    hoverCursor: 'ns-resize',
                    _rowId: row.id,
                    _isResizeHandle: true,
                    _rowY: y,
                    _areaH: areaH,
                });

                handle.on('moving', () => {
                    const newBottom = (handle.top + handle.height / 2) / s;
                    const newRowH = newBottom - row._startY;
                    const newPct = (newRowH / areaH) * 100;
                    row.heightPct = Math.max(2, Math.min(60, newPct));
                });

                // Store starting Y for drag calculation
                row._startY = y;

                handle.on('mousedown', () => { row._startY = y; });
                handle.on('mouseup', () => {
                    // Normalize so total stays ≤100
                    this.renderBuilderFabric();
                });

                canvas.add(handle);
                y += rowH;
            }

            // ── Margin guides ────────────────────────────────
            const marginColor = 'rgba(100,150,255,0.3)';
            // Top margin
            canvas.add(new fabric.Rect({ left: 0, top: 0, width: pageSize.w * s, height: margins.top * s, fill: marginColor, selectable: false, evented: false }));
            // Bottom margin
            canvas.add(new fabric.Rect({ left: 0, top: (pageSize.h - margins.bottom) * s, width: pageSize.w * s, height: margins.bottom * s, fill: marginColor, selectable: false, evented: false }));
            // Left margin
            canvas.add(new fabric.Rect({ left: 0, top: 0, width: margins.left * s, height: pageSize.h * s, fill: marginColor, selectable: false, evented: false }));
            // Right margin
            canvas.add(new fabric.Rect({ left: (pageSize.w - margins.right) * s, top: 0, width: margins.right * s, height: pageSize.h * s, fill: marginColor, selectable: false, evented: false }));

            // ── Design Elements (interactive, draggable) ─────
            for (const el of (this.builderDraft.designElements || [])) {
                let obj = null;
                const st = el.style || {};
                const x = el.x * s, ey = el.y * s;
                const w = (el.w || 60) * s, h = (el.h || 30) * s;
                const isSelEl = el.id === prevSelElId;

                if (el.type === 'rect') {
                    obj = new fabric.Rect({
                        left: x, top: ey, width: w, height: h,
                        fill: st.fill || 'transparent',
                        stroke: st.stroke || '#c8a96e',
                        strokeWidth: (st.strokeWidth || 1),
                        rx: (st.rx || 0) * s,
                    });
                } else if (el.type === 'circle') {
                    obj = new fabric.Ellipse({
                        left: x, top: ey, rx: w / 2, ry: h / 2,
                        fill: st.fill || 'transparent', stroke: st.stroke || '#c8a96e',
                        strokeWidth: st.strokeWidth || 1,
                    });
                } else if (el.type === 'hline') {
                    obj = new fabric.Line([x, ey + h / 2, x + w, ey + h / 2], { stroke: st.stroke || '#c8a96e', strokeWidth: st.strokeWidth || 1 });
                } else if (el.type === 'line') {
                    obj = new fabric.Line([x, ey, x + w, ey + h], { stroke: st.stroke || '#c8a96e', strokeWidth: st.strokeWidth || 1 });
                } else if (el.type === 'text') {
                    obj = new fabric.IText(st.text || 'টেক্সট', {
                        left: x, top: ey, fontSize: (st.fontSize || 12) * s,
                        fill: st.color || '#333', fontFamily: st.fontFamily || BANGLA_FONT,
                    });
                } else if (el.type === 'svg' && el._imgUrl) {
                    await new Promise(res => {
                        fabric.Image.fromURL(el._imgUrl, (img) => {
                            img.set({
                                left: x, top: ey, scaleX: w / (img.width || w), scaleY: h / (img.height || h),
                                selectable: true, evented: true, _elId: el.id,
                                cornerColor: '#f59e0b', cornerSize: 8 * s, transparentCorners: false
                            });
                            img.on('modified', () => {
                                el.x = img.left / s; el.y = img.top / s;
                                el.w = img.width * (img.scaleX || 1) / s; el.h = img.height * (img.scaleY || 1) / s;
                            });
                            canvas.add(img);
                            res();
                        });
                    });
                    continue;
                }

                if (obj) {
                    obj._elId = el.id;
                    obj.set({
                        selectable: true, evented: true,
                        cornerColor: '#f59e0b', cornerSize: 8 * s, transparentCorners: false,
                        borderColor: isSelEl ? '#f59e0b' : '#999',
                    });
                    // Sync position back to builderDraft on move/resize
                    obj.on('modified', () => {
                        el.x = obj.left / s;
                        el.y = obj.top / s;
                        el.w = obj.width * (obj.scaleX || 1) / s;
                        el.h = obj.height * (obj.scaleY || 1) / s;
                    });
                    canvas.add(obj);
                    if (isSelEl) canvas.setActiveObject(obj);
                }
            }

            canvas.requestRenderAll();
        },

        builderPreviewUpdate() {
            clearTimeout(this._previewTimer);
            this._previewTimer = setTimeout(() => this.renderBuilderFabric(), 150);
        },

        /* ── Row operations ── */
        builderAddRow(type) {
            const id = 'row-' + Date.now();
            const cfg = this._defaultRowConfig(type);
            this.builderDraft.rows.push({ id, type, label: ROW_TYPES[type]?.label || type, heightPct: 7, visible: true, config: cfg });
            this.selectedRowId = id;
            this.builderPreviewUpdate();
        },

        _defaultRowConfig(type) {
            switch (type) {
                case 'arabic': return { fontSize: 0, autoFit: true, color: '#0d0d0d', align: 'right', showBangla: true, banglaFontSize: 0, banglaAutoFit: true, banglaColor: '#333' };
                case 'bangla': return { fontSize: 0, autoFit: true, color: '#444444', align: 'right' };
                case 'symbol': return { text: '', fontSize: 0, autoFit: true, color: '#0d0d0d', align: 'center' };
                case 'header': return { text: '', autoSurah: true, fontSize: 8, color: '#b3005a', align: 'center', fontFamily: 'Hind Siliguri, Arial', bold: false };
                case 'footer': return { showPageNum: true, pageNumFontSize: 7, pageNumColor: '#b3005a', pageNumAlign: 'center', customText: '', customFontSize: 6, customColor: '#888', customAlign: 'center' };
                case 'gap': return {};
                case 'border': return { fill: 'transparent', stroke: '#c8a96e', strokeWidth: 1, rx: 0 };
                default: return {};
            }
        },

        builderRemoveRow(rowId) {
            const idx = this.builderDraft.rows.findIndex(r => r.id === rowId);
            if (idx < 0) return;
            this.builderDraft.rows.splice(idx, 1);
            this.selectedRowId = this.builderDraft.rows[0]?.id || null;
            this.builderPreviewUpdate();
        },

        builderMoveRow(rowId, dir) {
            const rows = this.builderDraft.rows;
            const idx = rows.findIndex(r => r.id === rowId);
            if (idx < 0) return;
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= rows.length) return;
            [rows[idx], rows[newIdx]] = [rows[newIdx], rows[idx]];
            this.builderPreviewUpdate();
        },

        builderDuplicateRow(rowId) {
            const src = this.builderDraft.rows.find(r => r.id === rowId);
            if (!src) return;
            const copy = JSON.parse(JSON.stringify(src));
            copy.id = 'row-' + Date.now();
            copy.label += ' (কপি)';
            const idx = this.builderDraft.rows.findIndex(r => r.id === rowId);
            this.builderDraft.rows.splice(idx + 1, 0, copy);
            this.selectedRowId = copy.id;
            this.builderPreviewUpdate();
        },

        get selectedRow() {
            if (!this.builderDraft || !this.selectedRowId) return null;
            return this.builderDraft.rows.find(r => r.id === this.selectedRowId) || null;
        },

        get builderArabicCount() {
            if (!this.builderDraft) return 0;
            return this.builderDraft.rows.filter(r => r.visible && r.type === 'arabic').length;
        },

        get builderEstimatedPages() {
            if (!this.arabicLines.length || !this.builderArabicCount) return '—';
            return Math.ceil(this.arabicLines.length / this.builderArabicCount).toLocaleString('bn-BD');
        },

        get builderTotalPct() {
            if (!this.builderDraft) return 0;
            return this.builderDraft.rows.reduce((s, r) => s + (r.visible ? (r.heightPct || 0) : 0), 0);
        },

        // Legacy: Alpine x-for slot list (kept for any remaining template references)
        get builderPreviewSlots() {
            if (!this.builderDraft) return [];
            const areaH = 100; // percent space
            return this.builderDraft.rows
                .filter(r => r.visible)
                .map(r => ({
                    id: r.id,
                    type: r.type,
                    label: r.label,
                    pctH: r.heightPct || 0,
                }));
        },

        get selectedEl() {
            if (!this.builderDraft || !this.selectedElId) return null;
            return (this.builderDraft.designElements || []).find(e => e.id === this.selectedElId) || null;
        },

        /* ── Design Elements ── */
        builderAddDesignEl(type) {
            const { pageSize } = this.builderDraft;
            if (!this.builderDraft.designElements) this.builderDraft.designElements = [];
            const el = {
                id: 'el-' + Date.now(),
                type,
                x: (pageSize.w / 2) - 60,
                y: (pageSize.h / 2) - 20,
                w: type === 'hline' ? pageSize.w * 0.7 : (type === 'text' ? 160 : 120),
                h: type === 'hline' ? 4 : (type === 'text' ? 20 : 40),
                style: {
                    fill: 'transparent', stroke: '#c8a96e', strokeWidth: 1,
                    text: type === 'text' ? 'বিসমিল্লাহ...' : '',
                    fontSize: 12, fontFamily: BANGLA_FONT, color: '#0d0d0d', opacity: 1, rx: 0,
                },
            };
            this.builderDraft.designElements.push(el);
            this.selectedElId = el.id;
            this.builderPreviewUpdate();
        },

        builderRemoveDesignEl(elId) {
            if (!this.builderDraft.designElements) return;
            this.builderDraft.designElements = this.builderDraft.designElements.filter(e => e.id !== elId);
            if (this.selectedElId === elId) this.selectedElId = null;
            this.builderPreviewUpdate();
        },

        async builderUploadSvgEl(event) {
            const file = event.target?.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                if (!this.builderDraft.designElements) this.builderDraft.designElements = [];
                const el = {
                    id: 'el-' + Date.now(), type: 'svg',
                    x: 20, y: 20, w: 120, h: 80,
                    _svgContent: e.target.result,
                    _imgUrl: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(e.target.result))),
                    style: { opacity: 1 },
                };
                this.builderDraft.designElements.push(el);
                this.selectedElId = el.id;
                this.builderPreviewUpdate();
            };
            reader.readAsText(file, 'utf-8');
        },

        async builderUploadImgEl(event) {
            const file = event.target?.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                if (!this.builderDraft.designElements) this.builderDraft.designElements = [];
                const el = {
                    id: 'el-' + Date.now(), type: 'svg',
                    x: 20, y: 20, w: 120, h: 80,
                    _imgUrl: e.target.result,
                    style: { opacity: 1 },
                };
                this.builderDraft.designElements.push(el);
                this.selectedElId = el.id;
                this.builderPreviewUpdate();
            };
            reader.readAsDataURL(file);
        },

        /* ════════════════════════
           TEMPLATE SETTINGS (live controls)
        ════════════════════════ */
        debouncedRender() {
            clearTimeout(this.renderTimer);
            this.renderTimer = setTimeout(() => this.renderPage(), 280);
        },
        debouncedReprocess() {
            clearTimeout(this.renderTimer);
            this.renderTimer = setTimeout(() => this.processLines(), 400);
        },

        async onSvgUpload(event) {
            const file = event.target?.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('svg', file);
            fd.append('_token', document.querySelector('meta[name="csrf-token"]').content);
            try {
                const res = await fetch('/api/upload-template', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.success) {
                    this.masterTemplate.svgFile = data.filename;
                    const r = await fetch('/templates/' + data.filename);
                    this.svgText = await r.text();
                    this.uploadedSvgs.push(data.filename);
                    this.renderPage();
                    this.showToast('✅ SVG আপলোড: ' + data.filename, 'success');
                }
            } catch (e) { this.showToast('❌ Upload error', 'error'); }
        },

        /* ── Upload SVG for a single Top Symbol slot ── */
        uploadSymbolSvg(idx, event) {
            const file = event.target?.files?.[0];
            if (!file || !file.name.endsWith('.svg')) {
                this.showToast('❌ শুধুমাত্র SVG ফাইল সাপোর্টেড', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = async e => {
                this.topSymbols[idx].svgData = e.target.result;
                this.debouncedRender();
                this.showToast('✅ সিম্বল আপলোড: ' + this.topSymbols[idx].name, 'success');
                // ── Rebuild Tajweed font with new glyph ──────────────
                if (typeof window.rebuildTajweedFont === 'function') {
                    this.tajweedFontStatus = 'building';
                    this.showToast('⚙ TajweedSymbols font তৈরি হচ্ছে...', 'info');
                    try {
                        const b64 = await window.rebuildTajweedFont(this.topSymbols);
                        if (b64) {
                            this.tajweedFontStatus = 'ready';
                            this.showToast('✅ TajweedSymbols font ready — SVG export-এ <text> ব্যবহার হবে', 'success');
                        } else {
                            this.tajweedFontStatus = 'idle';
                        }
                    } catch (fe) {
                        this.tajweedFontStatus = 'error';
                        console.warn('[Font] rebuild failed:', fe);
                    }
                }
            };
            reader.readAsDataURL(file);
            event.target.value = '';   // reset input so same file can be re-uploaded
        },

        /* ── Clear SVG for a single Top Symbol slot ── */
        clearSymbolSvg(idx) {
            this.topSymbols[idx].svgData = null;
            this.debouncedRender();
            // Rebuild font with placeholder diamond for this slot
            if (typeof window.rebuildTajweedFont === 'function') {
                this.tajweedFontStatus = 'building';
                window.rebuildTajweedFont(this.topSymbols)
                    .then(b64 => { this.tajweedFontStatus = b64 ? 'ready' : 'idle'; })
                    .catch(() => { this.tajweedFontStatus = 'idle'; });
            }
        },


        async uploadFont(event) {
            const file = event.target?.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('font', file); fd.append('type', 'arabic');
            fd.append('_token', document.querySelector('meta[name="csrf-token"]').content);
            try {
                const r = await fetch('/api/upload-font', { method: 'POST', body: fd });
                const d = await r.json();
                if (d.success) {
                    this.uploadedFonts.push({ name: d.filename });
                    this.showToast('✅ ফন্ট আপলোড: ' + d.filename, 'success');
                }
            } catch (e) { this.showToast('❌ Font upload error', 'error'); }
        },

        /* ════════════════════════
           NAVIGATION
        ════════════════════════ */
        setPage(idx) {
            const i = parseInt(idx);
            if (isNaN(i) || i < 0 || i >= this.pages.length) return;
            this.currentPage = i;
            this.renderPage();
            const el = document.querySelectorAll('.page-thumb')[i];
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        },
        prevPage() { this.setPage(this.currentPage - 1); },
        nextPage() { this.setPage(this.currentPage + 1); },

        zoomIn() { this.setCanvasZoom(Math.min(3.0, +(this.zoom + 0.1).toFixed(1))); },
        zoomOut() { this.setCanvasZoom(Math.max(0.2, +(this.zoom - 0.1).toFixed(1))); },
        resetZoom() { this.setCanvasZoom(0.72); },
        fitPage() {
            const a = document.getElementById('canvas-area');
            if (!a) return;
            const pw = this.masterTemplate.pageSize.w;
            const ph = this.masterTemplate.pageSize.h;
            const r = Math.min((a.clientWidth - 80) / pw, (a.clientHeight - 60) / ph);
            this.setCanvasZoom(Math.max(0.2, Math.min(3, +r.toFixed(2))));
        },

        jumpToSurah() {
            const n = parseInt(this.selectedSurah);
            if (!n) return;
            const idx = this.pages.findIndex(pg => pg.some(item => item.surah === n));
            if (idx >= 0) this.setPage(idx);
        },

        jumpToPara() {
            const p = parseInt(this.selectedPara);
            if (!p || p < 1 || p > 30) return;
            // Para starts at surah PARA_SURAH_START[p]
            const startSurah = PARA_SURAH_START[p];
            // Find the page that first contains startSurah
            let idx = this.pages.findIndex(pg => pg.some(item => item.surah >= startSurah));
            if (idx < 0 && startSurah > 1) {
                idx = this.pages.findIndex(pg => pg.some(item => item.surah >= startSurah - 1));
            }
            if (idx >= 0) {
                this.setPage(idx);
                this.showToast('পারা ' + p + ': ' + (PARA_NAMES[p] || ''), 'info');
            } else {
                this.showToast('পারা ' + p + ' পাওয়া যায়নি', 'error');
            }
        },

        /* ════════════════════════════════════════════════════════════
           EXPORT ENGINE
           ─ PNG  : canvas raster (quick preview)
           ─ SVG  : Adobe Illustrator–compatible layered vector
           ─ PDF  : multi-page layered PDF via jsPDF + svg2pdf
        ═══════════════════════════════════════════════════════════ */

        /* ── PNG (legacy) ── */
        exportCurrentPage() { this.exportCurrentPagePNG(); },

        exportCurrentPagePNG() {
            if (!this.fabricCanvas) return;
            if (this.editMode) this.fabricCanvas.discardActiveObject?.();
            const mult = this.exportOpts.quality || 4;
            const pg = this.currentPage + 1;
            const url = this.fabricCanvas.toDataURL({ format: 'png', multiplier: mult });
            _downloadFile(url, 'quran-page-' + pg + '.png', 'image/png');
            this.showToast('✅ PNG পেজ-' + pg + ' (×' + mult + ') সেভ হয়েছে', 'success');
        },

        async exportPageRange(fromPage, toPage) {
            const from = Math.max(0, (parseInt(fromPage) || 1) - 1);
            const to = Math.min(this.pages.length - 1, (parseInt(toPage) || 1) - 1);
            if (from > to) { this.showToast('❌ Invalid range', 'error'); return; }
            const saved = this.currentPage;
            const mult = this.exportOpts.quality || 4;
            for (let i = from; i <= to; i++) {
                this.currentPage = i; await this.renderPage();
                await new Promise(r => setTimeout(r, 120));
                const url = this.fabricCanvas.toDataURL({ format: 'png', multiplier: mult });
                _downloadFile(url, 'quran-page-' + (i + 1) + '.png', 'image/png');
                await new Promise(r => setTimeout(r, 200));
            }
            this.currentPage = saved; await this.renderPage();
            this.showToast('✅ ' + (to - from + 1) + 'টি PNG export সম্পন্ন', 'success');
        },

        async exportAllPages() { await this.exportPageRange(1, this.pages.length); },

        /* ── SVG Export (Adobe Illustrator–friendly) ── */

        /* Export current page as layered SVG */
        async exportCurrentPageSVG() {
            if (!this.pages.length) return;
            const pg = this.currentPage + 1;
            this.showLoading('SVG তৈরি হচ্ছে...', 10);
            try {
                const svgStr = await buildPageSVG(this.currentPage, this, { embedFonts: true });
                _downloadFile(svgStr, 'quran-page-' + pg + '.svg', 'image/svg+xml;charset=utf-8');
                this.showToast('✅ SVG পেজ-' + pg + ' (Illustrator layers) সেভ হয়েছে', 'success');
            } catch (e) {
                this.showToast('❌ SVG Error: ' + e.message, 'error');
            } finally { this.hideLoading(); }
        },

        /* Export page range as single multi-artboard SVG */
        async exportSVGRange(fromPage, toPage) {
            const from = Math.max(0, (parseInt(fromPage) || 1) - 1);
            const to = Math.min(this.pages.length - 1, (parseInt(toPage) || this.pages.length) - 1);
            if (from > to) { this.showToast('❌ Invalid range', 'error'); return; }

            this.isExporting = true; this.exportProgress = 5;
            this.showLoading('SVG তৈরি হচ্ছে... (' + (to - from + 1) + ' পেজ)', 5);
            try {
                const tick = setInterval(() => {
                    if (this.exportProgress < 85) { this.exportProgress += 3; this.updateLoadingProgress(this.exportProgress); }
                }, 300);
                const svgStr = await buildMultiPageSVG(from, to, this, { embedFonts: true });
                clearInterval(tick);
                this.exportProgress = 100; this.updateLoadingProgress(100);
                const pageLabel = (from === to) ? ('page-' + (from + 1)) : ('pages-' + (from + 1) + '-to-' + (to + 1));
                _downloadFile(svgStr, 'quran-' + pageLabel + '.svg', 'image/svg+xml;charset=utf-8');
                this.showToast('✅ SVG ' + (to - from + 1) + ' পেজ (Illustrator layers) সেভ হয়েছে', 'success');
            } catch (e) {
                this.showToast('❌ SVG Error: ' + e.message, 'error');
            } finally { this.isExporting = false; this.hideLoading(); }
        },

        async exportAllPagesSVG() {
            await this.exportSVGRange(1, this.pages.length);
        },

        /* ── Layered PDF (jsPDF + svg2pdf) ── */

        async exportLayeredPDFRange(fromPage, toPage) {
            const from = Math.max(0, (parseInt(fromPage) || 1) - 1);
            const to = Math.min(this.pages.length - 1, (parseInt(toPage) || this.pages.length) - 1);
            if (from > to) { this.showToast('❌ Invalid range', 'error'); return; }

            // Check dependencies
            if (typeof window.jspdf === 'undefined' || typeof window.svg2pdf === 'undefined') {
                this.showToast('❌ jsPDF/svg2pdf এখনো লোড হয়নি — কিছুক্ষণ পর আবার চেষ্টা করুন', 'error');
                return;
            }

            this.isExporting = true; this.exportProgress = 0;
            this.showLoading('Layered PDF তৈরি হচ্ছে... (' + (to - from + 1) + ' পেজ)', 0);
            try {
                const tick = setInterval(() => {
                    if (this.exportProgress < 80) { this.exportProgress += 2; this.updateLoadingProgress(this.exportProgress); }
                }, 400);

                const pdf = await exportLayeredPDF(from, to, this, { embedFonts: true });
                clearInterval(tick);
                this.exportProgress = 100; this.updateLoadingProgress(100);
                const pageLabel = (from === to) ? ('page-' + (from + 1)) : ('pages-' + (from + 1) + '-to-' + (to + 1));
                pdf.save('quran-' + pageLabel + '.pdf');
                this.showToast('✅ Layered PDF ' + (to - from + 1) + ' পেজ সেভ হয়েছে!', 'success');
            } catch (e) {
                this.showToast('❌ PDF Error: ' + e.message, 'error');
            } finally { this.isExporting = false; this.hideLoading(); }
        },

        async exportLayeredPDFCurrent() {
            await this.exportLayeredPDFRange(this.currentPage + 1, this.currentPage + 1);
        },

        async exportLayeredPDFAll() {
            await this.exportLayeredPDFRange(1, this.pages.length);
        },

        /* ════════════════════════════════════════════════
           ZIP PACKAGE EXPORT
           Wraps exportZipSVG() from svg-exporter.js.
           Produces: per-page SVG + TajweedSymbols.ttf + READ_ME.txt
        ════════════════════════════════════════════════ */
        async exportZipPackage(fromPageIdx, toPageIdx) {
            if (this.isExporting || !this.pages.length) return;

            // Validate and clamp range
            const from = Math.max(0, parseInt(fromPageIdx) || 0);
            const to = Math.min(this.pages.length - 1, parseInt(toPageIdx) || 0);
            if (from > to) { this.showToast('❌ পেজ রেঞ্জ সঠিক নয়', 'error'); return; }

            // Warn if Tajweed font not built
            if (this.tajweedFontStatus !== 'ready') {
                const go = confirm(
                    'TajweedSymbols ফন্ট এখনো তৈরি হয়নি।\n' +
                    'ZIP-এ TajweedSymbols.ttf থাকবে না।\n\n' +
                    'তবুও export করবেন?'
                );
                if (!go) return;
            }

            if (typeof window.exportZipSVG !== 'function') {
                this.showToast('❌ ZIP exporter লোড হয়নি — পেজ রিফ্রেশ করুন', 'error');
                return;
            }

            this.isExporting = true;
            this.exportProgress = 0;
            const pageCount = to - from + 1;
            this.showLoading(
                '📦 ZIP তৈরি হচ্ছে… (' + pageCount + ' পেজ)',
                0
            );

            // Animate progress bar while building
            const tick = setInterval(() => {
                if (this.exportProgress < 85) {
                    this.exportProgress += Math.ceil(90 / pageCount);
                    this.updateLoadingProgress(this.exportProgress);
                }
            }, 350);

            try {
                await window.exportZipSVG(from, to, this, { embedFonts: true });
                clearInterval(tick);
                this.exportProgress = 100;
                this.updateLoadingProgress(100);
                this.showToast(
                    '✅ ZIP ডাউনলোড হচ্ছে — ' + pageCount + 'টি পেজ' +
                    (window.TAJWEED_FONT_DATA ? ' + TajweedSymbols.ttf' : ''),
                    'success'
                );
            } catch (e) {
                clearInterval(tick);
                this.showToast('❌ ZIP Error: ' + e.message, 'error');
            } finally {
                this.isExporting = false;
                this.hideLoading();
            }
        },

        /* ── Legacy server-side PDF (kept for backward compat) ── */
        async exportPDF() {
            if (this.isExporting || !this.pages.length) return;
            this.isExporting = true; this.exportProgress = 0;
            this.showLoading('PDF তৈরি হচ্ছে...', 0);
            try {
                const tick = setInterval(() => { if (this.exportProgress < 80) { this.exportProgress += 4; this.updateLoadingProgress(this.exportProgress); } }, 400);
                const res = await fetch(_url('/api/export-pdf'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
                    body: JSON.stringify({ pages: this.pages, masterTemplate: this.masterTemplate, exportOpts: this.exportOpts, rules: this.rules.filter(r => r.enabled) }),
                });
                clearInterval(tick);
                if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Error' })); throw new Error(e.error); }
                this.exportProgress = 100; this.updateLoadingProgress(100);
                const blob = await res.blob();
                _downloadFile(blob, 'quran-full.pdf', 'application/pdf');
                this.showToast('✅ PDF ডাউনলোড হয়েছে!', 'success');
            } catch (e) {
                this.showToast('❌ PDF Error: ' + e.message, 'error');
            } finally { this.isExporting = false; this.hideLoading(); }
        },

        /* ════════════════════════
           HELPERS
        ════════════════════════ */
        updateStats() {
            const vc = document.getElementById('stat-verse-count');
            const pc = document.getElementById('stat-page-count');
            if (vc) vc.textContent = this.allVerses.length + ' আয়াত';
            if (pc) pc.textContent = this.pages.length + ' পেজ';
        },

        showToast(msg, type = 'info') {
            const c = document.getElementById('toast-container'); if (!c) return;
            const t = document.createElement('div');
            t.className = 'toast toast--' + type; t.innerHTML = msg; c.appendChild(t);
            setTimeout(() => { t.style.opacity = 0; t.style.transform = 'translateX(100%)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 4000);
        },
        showLoading(msg, p) { document.getElementById('loading-overlay').style.display = 'flex'; document.getElementById('loading-text').textContent = msg; this.updateLoadingProgress(p); },
        updateLoadingProgress(p) { const f = document.getElementById('loading-progress-fill'); const pn = document.getElementById('loading-percent'); if (f) f.style.width = p + '%'; if (pn) pn.textContent = p + '%'; },
        hideLoading() { document.getElementById('loading-overlay').style.display = 'none'; },

        rowTypeColor(type) { return ROW_TYPES[type]?.color || '#555'; },
        rowTypeIcon(type) { return ROW_TYPES[type]?.icon || '?'; },
        rowTypeLabel(type) { return ROW_TYPES[type]?.label || type; },
    };
}

document.addEventListener('alpine:init', () => { Alpine.data('quranEditor', quranEditor); });
