<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QuranController;
use App\Http\Controllers\PdfExportController;

// হোম → এডিটরে রিডাইরেক্ট
Route::get('/', fn() => redirect('/editor'));

// মেইন এডিটর পেজ
Route::get('/editor', [QuranController::class, 'index'])->name('editor');

// verses.json থেকে আয়াত লোড (AJAX)
Route::get('/api/verses', [QuranController::class, 'verses'])->name('api.verses');

// PDF Export (POST)
Route::post('/api/export-pdf', [PdfExportController::class, 'export'])->name('api.export');

// ফন্ট আপলোড
Route::post('/api/upload-font', [QuranController::class, 'uploadFont'])->name('api.upload-font');

// বর্ডার SVG আপলোড
Route::post('/api/upload-border', [QuranController::class, 'uploadBorder'])->name('api.upload-border');

// Template SVG আপলোড
Route::post('/api/upload-template', [QuranController::class, 'uploadTemplate'])->name('api.upload-template');

// ফন্ট তালিকা
Route::get('/api/fonts', [QuranController::class, 'listFonts'])->name('api.fonts');

// Top Symbol SVG আপলোড → public/topsymbol/slot-{index}.svg
Route::post('/api/upload-topsymbol', [QuranController::class, 'uploadTopSymbol'])->name('api.upload-topsymbol');

// সেভ হওয়া Top Symbol তালিকা
Route::get('/api/topsymbols', [QuranController::class, 'listTopSymbols'])->name('api.topsymbols');

// সিস্টেম টেমপ্লেট SVG আপলোড → public/templates/default.svg (overwrite)
Route::post('/api/upload-system-template', [QuranController::class, 'uploadSystemTemplate'])->name('api.upload-system-template');
