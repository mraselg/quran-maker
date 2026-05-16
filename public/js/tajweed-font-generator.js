/* ═══════════════════════════════════════════════════════════════════
   কুরআন পাবলিশার — TajweedSymbols Font Generator  v2.0

   Builds a real TrueType font from the user's uploaded SVG symbol
   files.  Each of the 12 symbol slots is mapped to a Unicode Private
   Use Area code-point (U+E001 – U+E00C).

   v2.0 improvements over v1.0:
     • SVG <path d="…"> is parsed directly → smooth VECTOR outlines
       (no more pixel-tracing / blocky raster shapes)
     • The generated TTF is fully FontLab / Illustrator compatible
     • downloadTajweedFont() triggers a browser Save As download
     • Only slots that have an uploaded SVG contribute a real glyph;
       empty slots still get a placeholder diamond so the codepoint
       exists in the font (FontLab can fill it in later)

   Unicode PUA assignments (matching slot index):
     U+E001 → slot 0   U+E007 → slot 6
     U+E002 → slot 1   U+E008 → slot 7
     U+E003 → slot 2   U+E009 → slot 8
     U+E004 → slot 3   U+E00A → slot 9
     U+E005 → slot 4   U+E00B → slot 10
     U+E006 → slot 5   U+E00C → slot 11
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Font metric constants ── */
const TF_PUA_BASE = 0xE001;   // first Private Use Area codepoint
const TF_SLOTS    = 12;       // total symbol slot count
const TF_EM       = 1000;     // font units per em (standard)
const TF_ASCENT   = 800;      // ascender in font units
const TF_DESCENT  = -200;     // descender in font units

/* ── Module-level state ── */
window.TAJWEED_FONT_DATA = null;          // base64 TTF (set after build)
window.TAJWEED_FONT_NAME = 'TajweedSymbols';

/* ════════════════════════════════════════════════════
   PUBLIC API
════════════════════════════════════════════════════ */

/**
 * rebuildTajweedFont(topSymbols)
 * Builds the font from the current topSymbols state array.
 * Returns: Promise<string|null> — base64 TTF, or null on failure.
 *
 * After a successful build:
 *   • window.TAJWEED_FONT_DATA is set (base64)
 *   • A @font-face rule is injected into <head> so the font renders
 *     in the canvas preview immediately
 */
async function rebuildTajweedFont(topSymbols) {
    if (typeof opentype === 'undefined') {
        console.warn('[TajweedFont] opentype.js not loaded — font not built');
        return null;
    }
    if (!topSymbols || !topSymbols.length) return null;

    try {
        const font        = await _buildFont(topSymbols);
        const arrayBuffer = font.toArrayBuffer();

        if (!(arrayBuffer instanceof ArrayBuffer)) {
            throw new Error('opentype.js did not return an ArrayBuffer');
        }

        const b64 = _ab2b64(arrayBuffer);
        window.TAJWEED_FONT_DATA = b64;
        _injectFontFace(b64);

        console.log(
            '[TajweedFont] ✅ Font built —',
            _humanSize(arrayBuffer.byteLength),
            '— slots with real glyphs:',
            topSymbols.filter(s => s && s.svgData).length
        );

        return b64;
    } catch (e) {
        console.error('[TajweedFont] ❌ Build failed:', e);
        return null;
    }
}

/**
 * downloadTajweedFont(topSymbols)
 * Builds (or re-uses) the font and triggers a browser download of
 * TajweedSymbols.ttf — so the user can open it in FontLab.
 */
async function downloadTajweedFont(topSymbols) {
    // Re-build to ensure it's fresh; re-use cached data if already built
    let b64 = window.TAJWEED_FONT_DATA;
    if (!b64) {
        b64 = await rebuildTajweedFont(topSymbols);
    }
    if (!b64) {
        alert('❌ Font তৈরি হয়নি।  কমপক্ষে একটি SVG আপলোড করুন।');
        return;
    }

    // Decode base64 → Uint8Array → Blob
    const binary = atob(b64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const blob = new Blob([bytes], { type: 'font/truetype' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'TajweedSymbols.ttf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('[TajweedFont] ⬇ TajweedSymbols.ttf downloaded');
}

/**
 * getTajweedChar(slotIndex)   → Unicode char  (e.g. '\uE001')
 * getTajweedCharCode(slotIndex) → numeric code-point (e.g. 57345)
 * getTajweedHex(slotIndex)    → hex string    (e.g. 'E001')
 */
function getTajweedChar(slotIndex)    { return String.fromCodePoint(TF_PUA_BASE + slotIndex); }
function getTajweedCharCode(slotIndex){ return TF_PUA_BASE + slotIndex; }
function getTajweedHex(slotIndex)     { return (TF_PUA_BASE + slotIndex).toString(16).toUpperCase(); }


/* ════════════════════════════════════════════════════
   INTERNAL: Font assembly
════════════════════════════════════════════════════ */

async function _buildFont(topSymbols) {

    // ── .notdef (empty box outline) ─────────────────────────────
    const notdefPath = new opentype.Path();
    notdefPath.moveTo(50,  0);
    notdefPath.lineTo(450, 0);
    notdefPath.lineTo(450, 700);
    notdefPath.lineTo(50,  700);
    notdefPath.closePath();
    const notdefGlyph = new opentype.Glyph({
        name: '.notdef', unicode: 0,
        advanceWidth: 500,
        path: notdefPath
    });

    // ── space ────────────────────────────────────────────────────
    const spaceGlyph = new opentype.Glyph({
        name: 'space', unicode: 32,
        advanceWidth: 300,
        path: new opentype.Path()
    });

    // ── Symbol glyphs (one per slot) ────────────────────────────
    const symGlyphs = [];
    for (let i = 0; i < TF_SLOTS; i++) {
        const sym  = topSymbols[i];
        const cp   = TF_PUA_BASE + i;
        const name = 'sym' + String(i + 1).padStart(2, '0');  // sym01 … sym12

        let glyphPath;
        if (sym && sym.svgData) {
            try {
                glyphPath = await _svgDataToGlyphPath(sym.svgData);
            } catch (e) {
                console.warn('[TajweedFont] slot', i, 'path extraction failed:', e.message);
                glyphPath = _placeholderPath(i);
            }
        } else {
            // No SVG yet: insert placeholder so the codepoint exists in the font.
            // FontLab users can later draw/paste the real glyph.
            glyphPath = _placeholderPath(i);
        }

        symGlyphs.push(new opentype.Glyph({
            name,
            unicode:      cp,
            advanceWidth: TF_EM,
            path:         glyphPath
        }));
    }

    // ── Assemble ─────────────────────────────────────────────────
    return new opentype.Font({
        familyName:  'TajweedSymbols',
        styleName:   'Regular',
        unitsPerEm:  TF_EM,
        ascender:    TF_ASCENT,
        descender:   TF_DESCENT,
        glyphs:      [notdefGlyph, spaceGlyph, ...symGlyphs],
    });
}


/* ════════════════════════════════════════════════════
   SVG → Glyph Path  (VECTOR approach — no pixel tracing)
════════════════════════════════════════════════════ */

/**
 * _svgDataToGlyphPath(svgDataUri)
 *
 * Priority order:
 *   1. Parse <path d="…"> elements directly from the SVG XML → perfect vectors
 *   2. Parse <polygon> / <polyline> → convert to path
 *   3. Parse <rect> / <circle> / <ellipse> → approximate paths
 *   4. Fall back to pixel-tracing if no path elements found (unlikely)
 *
 * All coordinates are normalised from the SVG's viewBox into font units
 * (0 … TF_EM horizontally, TF_DESCENT … TF_ASCENT vertically).
 */
async function _svgDataToGlyphPath(svgDataUri) {

    // ── Decode SVG text ─────────────────────────────────────────
    let svgText;
    if (svgDataUri.startsWith('data:image/svg+xml;base64,')) {
        const b64 = svgDataUri.slice('data:image/svg+xml;base64,'.length);
        svgText   = decodeURIComponent(escape(atob(b64)));
    } else if (svgDataUri.startsWith('data:image/svg+xml,')) {
        svgText = decodeURIComponent(svgDataUri.slice('data:image/svg+xml,'.length));
    } else {
        // Might be a plain URL — fetch it
        const resp = await fetch(svgDataUri);
        svgText    = await resp.text();
    }

    const parser  = new DOMParser();
    const doc     = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl   = doc.querySelector('svg');

    if (!svgEl) throw new Error('No <svg> element found');

    // ── Determine viewBox for coordinate mapping ─────────────────
    let vbX = 0, vbY = 0, vbW = 0, vbH = 0;
    const vbAttr = svgEl.getAttribute('viewBox');
    if (vbAttr) {
        const parts = vbAttr.trim().split(/[\s,]+/).map(Number);
        [vbX, vbY, vbW, vbH] = parts;
    } else {
        vbW = parseFloat(svgEl.getAttribute('width')  || '100');
        vbH = parseFloat(svgEl.getAttribute('height') || '100');
    }

    if (!vbW || !vbH) throw new Error('Cannot determine SVG dimensions');

    // ── Collect all path-like elements ───────────────────────────
    const allPaths = [];
    _walkSvgForPaths(doc.documentElement || svgEl, allPaths, vbX, vbY, vbW, vbH);

    if (!allPaths.length) {
        console.warn('[TajweedFont] No path data found in SVG — using pixel trace fallback');
        return _pixelTraceFallback(svgDataUri);
    }

    // ── Merge into one opentype.Path ────────────────────────────
    const otPath = new opentype.Path();
    for (const { cmds } of allPaths) {
        for (const cmd of cmds) {
            switch (cmd.type) {
                case 'M': otPath.moveTo(cmd.x, cmd.y);                     break;
                case 'L': otPath.lineTo(cmd.x, cmd.y);                     break;
                case 'C': otPath.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y); break;
                case 'Q': otPath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);        break;
                case 'Z': otPath.closePath();                               break;
            }
        }
    }

    return otPath;
}

/* ── Walk the SVG DOM collecting all geometric elements ── */
function _walkSvgForPaths(el, out, vbX, vbY, vbW, vbH) {
    for (const child of el.children) {
        const tag = child.tagName.toLowerCase().replace(/^.*:/, ''); // strip namespace

        if (tag === 'path') {
            const d = child.getAttribute('d') || '';
            if (d.trim()) {
                const cmds = _parseSvgPathD(d, vbX, vbY, vbW, vbH);
                if (cmds.length) out.push({ cmds });
            }
        } else if (tag === 'polygon' || tag === 'polyline') {
            const pts = child.getAttribute('points') || '';
            const cmds = _parsePolyPoints(pts, tag === 'polygon', vbX, vbY, vbW, vbH);
            if (cmds.length) out.push({ cmds });
        } else if (tag === 'rect') {
            const cmds = _parseRect(child, vbX, vbY, vbW, vbH);
            if (cmds.length) out.push({ cmds });
        } else if (tag === 'circle' || tag === 'ellipse') {
            const cmds = _parseEllipse(child, tag, vbX, vbY, vbW, vbH);
            if (cmds.length) out.push({ cmds });
        } else if (tag !== 'defs' && tag !== 'style' && tag !== 'title') {
            // Recurse into groups / symbols
            _walkSvgForPaths(child, out, vbX, vbY, vbW, vbH);
        }
    }
}

/* ── Coordinate transform: SVG viewBox → font units ─────────────
   SVG: x goes right (same), y goes DOWN
   Font: x goes right, y goes UP (baseline near bottom)

   Map:
     fontX = ((svgX - vbX) / vbW) * TF_EM
     fontY = TF_ASCENT - ((svgY - vbY) / vbH) * (TF_ASCENT - TF_DESCENT)
──────────────────────────────────────────────────────────────── */
function _tx(svgX, vbX, vbW) {
    return ((svgX - vbX) / vbW) * TF_EM;
}
function _ty(svgY, vbY, vbH) {
    return TF_ASCENT - ((svgY - vbY) / vbH) * (TF_ASCENT - TF_DESCENT);
}


/* ════════════════════════════════════════════════════
   SVG <path d="…"> parser → opentype commands
   Supports: M m L l H h V v C c S s Q q T t A a Z z
════════════════════════════════════════════════════ */

function _parseSvgPathD(d, vbX, vbY, vbW, vbH) {
    const cmds = [];

    // Tokenise the d string
    const tokens = [];
    const re = /([MmLlHhVvCcSsQqTtAaZz])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;
    let m;
    while ((m = re.exec(d)) !== null) {
        tokens.push(m[0]);
    }

    let ti = 0;
    let cx = 0, cy = 0;      // current point
    let lx = 0, ly = 0;      // last control point (for S/s and T/t)
    let cmd = '';

    const num = () => {
        if (ti >= tokens.length) return 0;
        const t = tokens[ti++];
        if (/[MmLlHhVvCcSsQqTtAaZz]/.test(t)) { ti--; return 0; }
        return parseFloat(t) || 0;
    };
    const hasNum = () => ti < tokens.length && !/[MmLlHhVvCcSsQqTtAaZz]/.test(tokens[ti]);

    const px = x => _tx(x, vbX, vbW);
    const py = y => _ty(y, vbY, vbH);

    while (ti < tokens.length) {
        const tok = tokens[ti];

        if (/[MmLlHhVvCcSsQqTtAaZz]/.test(tok)) {
            cmd = tok;
            ti++;
        }

        switch (cmd) {
            case 'M': {
                cx = num(); cy = num();
                cmds.push({ type:'M', x: px(cx), y: py(cy) });
                lx = cx; ly = cy;
                cmd = 'L';  // implicit lineto after moveto
                break;
            }
            case 'm': {
                cx += num(); cy += num();
                cmds.push({ type:'M', x: px(cx), y: py(cy) });
                lx = cx; ly = cy;
                cmd = 'l';
                break;
            }
            case 'L': {
                cx = num(); cy = num();
                cmds.push({ type:'L', x: px(cx), y: py(cy) });
                lx = cx; ly = cy;
                break;
            }
            case 'l': {
                cx += num(); cy += num();
                cmds.push({ type:'L', x: px(cx), y: py(cy) });
                lx = cx; ly = cy;
                break;
            }
            case 'H': {
                cx = num();
                cmds.push({ type:'L', x: px(cx), y: py(cy) });
                break;
            }
            case 'h': {
                cx += num();
                cmds.push({ type:'L', x: px(cx), y: py(cy) });
                break;
            }
            case 'V': {
                cy = num();
                cmds.push({ type:'L', x: px(cx), y: py(cy) });
                break;
            }
            case 'v': {
                cy += num();
                cmds.push({ type:'L', x: px(cx), y: py(cy) });
                break;
            }
            case 'C': {
                const x1 = num(), y1 = num();
                const x2 = num(), y2 = num();
                const x  = num(), y  = num();
                cmds.push({ type:'C', x1: px(x1), y1: py(y1), x2: px(x2), y2: py(y2), x: px(x), y: py(y) });
                lx = x2; ly = y2;
                cx = x;  cy = y;
                break;
            }
            case 'c': {
                const x1 = cx + num(), y1 = cy + num();
                const x2 = cx + num(), y2 = cy + num();
                const x  = cx + num(), y  = cy + num();
                cmds.push({ type:'C', x1: px(x1), y1: py(y1), x2: px(x2), y2: py(y2), x: px(x), y: py(y) });
                lx = x2; ly = y2;
                cx = x;  cy = y;
                break;
            }
            case 'S': {
                // Smooth cubic: reflect previous control point
                const rx1 = 2*cx - lx, ry1 = 2*cy - ly;
                const x2  = num(), y2 = num();
                const x   = num(), y  = num();
                cmds.push({ type:'C', x1: px(rx1), y1: py(ry1), x2: px(x2), y2: py(y2), x: px(x), y: py(y) });
                lx = x2; ly = y2;
                cx = x;  cy = y;
                break;
            }
            case 's': {
                const rx1 = 2*cx - lx, ry1 = 2*cy - ly;
                const x2  = cx + num(), y2 = cy + num();
                const x   = cx + num(), y  = cy + num();
                cmds.push({ type:'C', x1: px(rx1), y1: py(ry1), x2: px(x2), y2: py(y2), x: px(x), y: py(y) });
                lx = x2; ly = y2;
                cx = x;  cy = y;
                break;
            }
            case 'Q': {
                const x1 = num(), y1 = num();
                const x  = num(), y  = num();
                cmds.push({ type:'Q', x1: px(x1), y1: py(y1), x: px(x), y: py(y) });
                lx = x1; ly = y1;
                cx = x;  cy = y;
                break;
            }
            case 'q': {
                const x1 = cx + num(), y1 = cy + num();
                const x  = cx + num(), y  = cy + num();
                cmds.push({ type:'Q', x1: px(x1), y1: py(y1), x: px(x), y: py(y) });
                lx = x1; ly = y1;
                cx = x;  cy = y;
                break;
            }
            case 'T': {
                const rx1 = 2*cx - lx, ry1 = 2*cy - ly;
                const x   = num(), y   = num();
                cmds.push({ type:'Q', x1: px(rx1), y1: py(ry1), x: px(x), y: py(y) });
                lx = rx1; ly = ry1;
                cx = x;  cy = y;
                break;
            }
            case 't': {
                const rx1 = 2*cx - lx, ry1 = 2*cy - ly;
                const x   = cx + num(), y  = cy + num();
                cmds.push({ type:'Q', x1: px(rx1), y1: py(ry1), x: px(x), y: py(y) });
                lx = rx1; ly = ry1;
                cx = x;  cy = y;
                break;
            }
            case 'A':
            case 'a': {
                // Arc — convert to cubic Bézier approximation
                const rx   = Math.abs(num()), ry = Math.abs(num());
                const xRot = num();
                const laf  = num(), sf  = num();
                const ex   = (cmd === 'A') ? num() : cx + num();
                const ey   = (cmd === 'A') ? num() : cy + num();
                const arcCmds = _arcToCubics(cx, cy, rx, ry, xRot, laf, sf, ex, ey);
                for (const ac of arcCmds) {
                    cmds.push({ type:'C',
                        x1: px(ac.x1), y1: py(ac.y1),
                        x2: px(ac.x2), y2: py(ac.y2),
                        x:  px(ac.x),  y:  py(ac.y)
                    });
                }
                lx = ex; ly = ey;
                cx = ex; cy = ey;
                break;
            }
            case 'Z':
            case 'z': {
                cmds.push({ type:'Z' });
                // Reset current point to start of subpath (approximate)
                if (cmds.length) {
                    const first = cmds.find(c => c.type === 'M');
                    if (first) { cx = 0; cy = 0; }  // simplified
                }
                if (!hasNum()) cmd = '';
                break;
            }
            default:
                ti++;   // skip unknown
        }
    }

    return cmds;
}

/* ── Arc to Cubic Bézier conversion (standard algorithm) ── */
function _arcToCubics(x1, y1, rx, ry, xRot, laf, sf, x2, y2) {
    try {
        const phi  = xRot * Math.PI / 180;
        const cosp = Math.cos(phi), sinp = Math.sin(phi);
        const mx   = (x1 - x2) / 2, my = (y1 - y2) / 2;
        const tx   = cosp*mx + sinp*my, ty = -sinp*mx + cosp*my;
        const tx2  = tx*tx, ty2 = ty*ty;
        let   rx2  = rx*rx, ry2 = ry*ry;
        const λ    = tx2/rx2 + ty2/ry2;
        if (λ > 1) { const s = Math.sqrt(λ); rx *= s; ry *= s; rx2 = rx*rx; ry2 = ry*ry; }
        const sign  = (laf === sf) ? -1 : 1;
        const sq    = Math.max(0, (rx2*ry2 - rx2*ty2 - ry2*tx2) / (rx2*ty2 + ry2*tx2));
        const coef  = sign * Math.sqrt(sq);
        const cx0   = coef * rx * ty / ry;
        const cy0   = -coef * ry * tx / rx;
        const cx_   = cosp*cx0 - sinp*cy0 + (x1+x2)/2;
        const cy_   = sinp*cx0 + cosp*cy0 + (y1+y2)/2;

        const u1 = (tx - cx0) / rx, v1 = (ty - cy0) / ry;
        const u2 = (-tx - cx0) / rx, v2 = (-ty - cy0) / ry;

        const theta1 = _vectorAngle(1, 0, u1, v1);
        let   dtheta = _vectorAngle(u1, v1, u2, v2);

        if (!sf && dtheta > 0)  dtheta -= 2*Math.PI;
        if (sf  && dtheta < 0)  dtheta += 2*Math.PI;

        const n    = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)));
        const step = dtheta / n;
        const out  = [];

        let   angle = theta1;
        for (let i = 0; i < n; i++) {
            const alpha = 4/3 * Math.tan(step/4);
            const a1    = angle, a2 = angle + step;
            const cos1  = Math.cos(a1), sin1 = Math.sin(a1);
            const cos2  = Math.cos(a2), sin2 = Math.sin(a2);
            const fx    = cx_ + cosp*rx*cos2 - sinp*ry*sin2;
            const fy    = cy_ + sinp*rx*cos2 + cosp*ry*sin2;
            out.push({
                x1: cx_ + cosp*(rx*(cos1 - alpha*sin1)) - sinp*(ry*(sin1 + alpha*cos1)),
                y1: cy_ + sinp*(rx*(cos1 - alpha*sin1)) + cosp*(ry*(sin1 + alpha*cos1)),
                x2: cx_ + cosp*(rx*(cos2 + alpha*sin2)) - sinp*(ry*(sin2 - alpha*cos2)),
                y2: cy_ + sinp*(rx*(cos2 + alpha*sin2)) + cosp*(ry*(sin2 - alpha*cos2)),
                x:  fx, y: fy
            });
            angle = a2;
        }
        return out;
    } catch (_) { return []; }
}

function _vectorAngle(ux, uy, vx, vy) {
    const dot = ux*vx + uy*vy;
    const len = Math.sqrt((ux*ux+uy*uy)*(vx*vx+vy*vy));
    const ang = Math.acos(Math.min(1, Math.max(-1, dot/len)));
    return (ux*vy - uy*vx < 0) ? -ang : ang;
}

/* ── Polygon / polyline ── */
function _parsePolyPoints(pts, closed, vbX, vbY, vbW, vbH) {
    const nums = pts.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const cmds = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
        const type = (i === 0) ? 'M' : 'L';
        cmds.push({ type, x: _tx(nums[i], vbX, vbW), y: _ty(nums[i+1], vbY, vbH) });
    }
    if (closed && cmds.length) cmds.push({ type:'Z' });
    return cmds;
}

/* ── Rect ── */
function _parseRect(el, vbX, vbY, vbW, vbH) {
    const x  = parseFloat(el.getAttribute('x')  || 0);
    const y  = parseFloat(el.getAttribute('y')  || 0);
    const w  = parseFloat(el.getAttribute('width')  || 0);
    const h  = parseFloat(el.getAttribute('height') || 0);
    if (!w || !h) return [];
    return [
        { type:'M', x: _tx(x,   vbX, vbW), y: _ty(y,   vbY, vbH) },
        { type:'L', x: _tx(x+w, vbX, vbW), y: _ty(y,   vbY, vbH) },
        { type:'L', x: _tx(x+w, vbX, vbW), y: _ty(y+h, vbY, vbH) },
        { type:'L', x: _tx(x,   vbX, vbW), y: _ty(y+h, vbY, vbH) },
        { type:'Z' }
    ];
}

/* ── Circle / Ellipse → 4-cubic Bézier approximation ── */
function _parseEllipse(el, tag, vbX, vbY, vbW, vbH) {
    let cx, cy, rx, ry;
    if (tag === 'circle') {
        cx = parseFloat(el.getAttribute('cx') || 0);
        cy = parseFloat(el.getAttribute('cy') || 0);
        rx = ry = parseFloat(el.getAttribute('r') || 0);
    } else {
        cx = parseFloat(el.getAttribute('cx') || 0);
        cy = parseFloat(el.getAttribute('cy') || 0);
        rx = parseFloat(el.getAttribute('rx') || 0);
        ry = parseFloat(el.getAttribute('ry') || 0);
    }
    if (!rx || !ry) return [];

    const k  = 0.5522847498;   // Bézier approximation constant
    const px = x => _tx(x, vbX, vbW);
    const py = y => _ty(y, vbY, vbH);

    return [
        { type:'M', x: px(cx),    y: py(cy-ry) },
        { type:'C', x1: px(cx+rx*k), y1: py(cy-ry),    x2: px(cx+rx), y2: py(cy-ry*k), x: px(cx+rx), y: py(cy) },
        { type:'C', x1: px(cx+rx),   y1: py(cy+ry*k),  x2: px(cx+rx*k), y2: py(cy+ry), x: px(cx),    y: py(cy+ry) },
        { type:'C', x1: px(cx-rx*k), y1: py(cy+ry),    x2: px(cx-rx),   y2: py(cy+ry*k), x: px(cx-rx), y: py(cy) },
        { type:'C', x1: px(cx-rx),   y1: py(cy-ry*k),  x2: px(cx-rx*k), y2: py(cy-ry),   x: px(cx),   y: py(cy-ry) },
        { type:'Z' }
    ];
}


/* ════════════════════════════════════════════════════
   Pixel-tracing fallback (only used when SVG has no path data)
════════════════════════════════════════════════════ */

const TF_GLYPH_SIZE = 64;

async function _pixelTraceFallback(svgDataUri) {
    const img    = await _loadImage(svgDataUri);
    const sz     = TF_GLYPH_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = sz;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, sz, sz);
    ctx.drawImage(img, 0, 0, sz, sz);
    const { data } = ctx.getImageData(0, 0, sz, sz);

    const grid = new Uint8Array(sz * sz);
    for (let i = 0; i < sz * sz; i++) {
        const r = data[i*4], g = data[i*4+1], b = data[i*4+2], a = data[i*4+3];
        const lum = (r*299 + g*587 + b*114) / 1000;
        grid[i] = (a > 64 && lum < 210) ? 1 : 0;
    }

    const path  = new opentype.Path();
    const scale = TF_EM / sz;
    for (let y = 0; y < sz; y++) {
        let rs = -1;
        for (let x = 0; x <= sz; x++) {
            const dark = x < sz && grid[y*sz+x];
            if (dark && rs < 0) { rs = x; }
            else if (!dark && rs >= 0) {
                const x0 = rs*scale, x1 = x*scale;
                const fy0 = TF_ASCENT - (y+1)*(TF_EM/sz);
                const fy1 = TF_ASCENT - y*(TF_EM/sz);
                path.moveTo(x0,fy0); path.lineTo(x1,fy0);
                path.lineTo(x1,fy1); path.lineTo(x0,fy1);
                path.closePath();
                rs = -1;
            }
        }
    }
    return path;
}


/* ════════════════════════════════════════════════════
   Placeholder glyph (empty slot — small diamond)
════════════════════════════════════════════════════ */
function _placeholderPath(slotIdx) {
    const path = new opentype.Path();
    const cx = TF_EM / 2, cy = (TF_ASCENT + TF_DESCENT) / 2, r = 80;
    path.moveTo(cx,     cy - r);
    path.lineTo(cx + r, cy);
    path.lineTo(cx,     cy + r);
    path.lineTo(cx - r, cy);
    path.closePath();
    return path;
}


/* ════════════════════════════════════════════════════
   @font-face injection
════════════════════════════════════════════════════ */
let _fontFaceStyle = null;

function _injectFontFace(base64TTF) {
    if (!_fontFaceStyle) {
        _fontFaceStyle    = document.createElement('style');
        _fontFaceStyle.id = 'tajweed-fontface';
        document.head.appendChild(_fontFaceStyle);
    }
    _fontFaceStyle.textContent =
        `@font-face{font-family:'TajweedSymbols';` +
        `src:url('data:font/truetype;base64,${base64TTF}') format('truetype');` +
        `font-weight:normal;font-style:normal;}`;
    console.log('[TajweedFont] @font-face injected');
}


/* ════════════════════════════════════════════════════
   Utilities
════════════════════════════════════════════════════ */
function _loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error('Image load: ' + src.slice(0, 60)));
        img.crossOrigin = 'anonymous';
        img.src = src;
    });
}

function _ab2b64(buf) {
    const bytes = new Uint8Array(buf);
    let   bin   = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
}

function _humanSize(bytes) {
    if (bytes < 1024)      return bytes + ' B';
    if (bytes < 1048576)   return (bytes/1024).toFixed(1)    + ' KB';
    return (bytes/1048576).toFixed(2) + ' MB';
}


/* ════════════════════════════════════════════════════
   Exports — attach to window for Alpine.js / SVG-exporter access
════════════════════════════════════════════════════ */
window.rebuildTajweedFont   = rebuildTajweedFont;
window.downloadTajweedFont  = downloadTajweedFont;
window.getTajweedChar       = getTajweedChar;
window.getTajweedCharCode   = getTajweedCharCode;
window.getTajweedHex        = getTajweedHex;
