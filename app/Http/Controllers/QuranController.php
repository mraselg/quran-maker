<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QuranController extends Controller
{
    /**
     * মেইন এডিটর পেজ
     */
    public function index()
    {
        return view('editor.index');
    }

    /**
     * verses.json থেকে আয়াত লোড করে JSON রিটার্ন করে
     */
    public function verses()
    {
        $path = public_path('data/verses.json');

        if (!file_exists($path)) {
            return response()->json([
                'error' => 'verses.json পাওয়া যায়নি। public/data/ ফোল্ডারে রাখুন।'
            ], 404);
        }

        $content = file_get_contents($path);
        $verses  = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json([
                'error' => 'verses.json পার্স করতে সমস্যা হচ্ছে: ' . json_last_error_msg()
            ], 422);
        }

        return response()->json($verses);
    }

    /**
     * কাস্টম ফন্ট আপলোড
     */
    public function uploadFont(Request $request)
    {
        $request->validate([
            'font' => 'required|file|mimes:ttf,otf|max:10240',
            'type' => 'required|in:arabic,bangla,meaning'
        ]);

        $file     = $request->file('font');
        $filename = $request->input('type') . '-' . time() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('fonts'), $filename);

        return response()->json([
            'success'   => true,
            'filename'  => $filename,
            'path'      => asset('fonts/' . $filename)
        ]);
    }

    /**
     * বর্ডার SVG/PNG আপলোড
     */
    public function uploadBorder(Request $request)
    {
        $request->validate([
            'border' => 'required|file|mimes:svg,png,jpg|max:5120'
        ]);

        $file     = $request->file('border');
        $filename = 'border-' . time() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('uploads/borders'), $filename);

        return response()->json([
            'success'  => true,
            'filename' => $filename,
            'path'     => asset('uploads/borders/' . $filename)
        ]);
    }

    /**
     * আপলোড করা ফন্টের তালিকা
     */
    public function listFonts()
    {
        $fontsDir = public_path('fonts');
        $fonts    = [];

        if (is_dir($fontsDir)) {
            $files = glob($fontsDir . '/*.{ttf,otf}', GLOB_BRACE);
            foreach ($files as $file) {
                $name    = basename($file);
                $fonts[] = ['name' => $name, 'path' => asset('fonts/' . $name)];
            }
        }

        return response()->json($fonts);
    }
    /**
     * Template SVG আপলোড → public/templates/
     */
    public function uploadTemplate(Request $request)
    {
        $request->validate([
            'svg' => 'required|file|mimes:svg,xml|max:5120'
        ]);

        $file     = $request->file('svg');
        $filename = 'template-' . time() . '.svg';
        $dest     = public_path('templates');

        if (!is_dir($dest)) mkdir($dest, 0755, true);
        $file->move($dest, $filename);

        return response()->json([
            'success'  => true,
            'filename' => $filename,
            'path'     => asset('templates/' . $filename),
        ]);
    }

    /**
     * Top Symbol SVG আপলোড → public/topsymbol/slot-{index}.svg
     * Also handles delete when X-Delete-Slot header is present.
     */
    public function uploadTopSymbol(Request $request)
    {
        $dest  = public_path('topsymbol');
        $index = (int) $request->input('index', $request->query('index', -1));

        // ── Delete mode ──────────────────────────────────────
        if ($request->hasHeader('X-Delete-Slot') || $request->query('_method') === 'DELETE') {
            if ($index >= 0 && $index <= 11) {
                $file = $dest . '/slot-' . $index . '.svg';
                if (file_exists($file)) unlink($file);
            }
            return response()->json(['success' => true, 'deleted' => $index]);
        }

        // ── Upload mode ──────────────────────────────────────
        $request->validate([
            'svg'   => 'required|file|mimes:svg,xml|max:2048',
            'index' => 'required|integer|min:0|max:11',
        ]);

        if (!is_dir($dest)) mkdir($dest, 0755, true);

        $index    = (int) $request->input('index');
        $filename = 'slot-' . $index . '.svg';

        // Remove old file for this slot
        $old = $dest . '/' . $filename;
        if (file_exists($old)) unlink($old);

        $request->file('svg')->move($dest, $filename);

        return response()->json([
            'success'  => true,
            'index'    => $index,
            'filename' => $filename,
            'path'     => asset('topsymbol/' . $filename) . '?v=' . time(),
        ]);
    }

    /**
     * Top Symbol তালিকা → যে স্লটগুলোতে SVG সেভ আছে সেগুলো রিটার্ন করে
     * Returns [{ index: 0, path: '/topsymbol/slot-0.svg' }, ...]
     */
    public function listTopSymbols()
    {
        $dir  = public_path('topsymbol');
        $list = [];

        if (is_dir($dir)) {
            foreach (glob($dir . '/slot-*.svg') as $file) {
                $base    = basename($file, '.svg');
                $index   = (int) str_replace('slot-', '', $base);
                $list[]  = [
                    'index' => $index,
                    'path'  => asset('topsymbol/' . basename($file)) . '?v=' . filemtime($file),
                ];
            }
        }

        return response()->json($list);
    }

    /**
     * সিস্টেম টেমপ্লেট SVG আপলোড → public/templates/default.svg (overwrite)
     * This replaces the master page background for ALL pages.
     */
    public function uploadSystemTemplate(Request $request)
    {
        $request->validate([
            'svg' => 'required|file|mimes:svg,xml|max:10240',
        ]);

        $dest = public_path('templates');
        if (!is_dir($dest)) mkdir($dest, 0755, true);

        // Keep a backup of the current default
        $defaultPath = $dest . '/default.svg';
        if (file_exists($defaultPath)) {
            copy($defaultPath, $dest . '/default-backup-' . date('Ymd-His') . '.svg');
        }

        // Save as new default
        $request->file('svg')->move($dest, 'default.svg');

        return response()->json([
            'success' => true,
            'path'    => asset('templates/default.svg'),
        ]);
    }
}
