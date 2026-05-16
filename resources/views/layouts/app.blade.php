<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'কুরআন পাবলিশিং সফটওয়্যার')</title>
    <meta name="description" content="প্রফেশনাল কুরআন পাবলিশিং সফটওয়্যার — আরবি RTL, তাজওয়িদ সিম্বল ও PDF Export সহ">

    <!-- Arabic Font — font-display:block prevents invisible-text flash -->
    <style>
        @font-face {
            font-family: 'ExcellentArabic';
            src: url('{{ asset('fonts/ExcellentArabicWeb2.0.ttf') }}') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: block;  /* wait for font — critical for Fabric.js canvas rendering */
        }

        /* Enable Arabic OpenType shaping features so Fabric.js Canvas 2D
           inherits correct ligatures, cursive joining & diacritic positioning.
           These features MUST be on for Arabic to render as connected script. */
        .arabic-canvas-font,
        canvas {
            font-family: 'ExcellentArabic', 'Traditional Arabic', serif;
            font-feature-settings:
                "calt" 1,   /* contextual alternates — Arabic joining forms */
                "liga" 1,   /* standard ligatures */
                "rlig" 1,   /* required ligatures (lam-alef etc.) */
                "curs" 1,   /* cursive attachment */
                "kern" 1,   /* kerning */
                "mark" 1,   /* mark-to-base positioning (diacritics) */
                "mkmk" 1;   /* mark-to-mark positioning */
            text-rendering: optimizeLegibility;
            -webkit-font-feature-settings:
                "calt" 1, "liga" 1, "rlig" 1, "curs" 1, "kern" 1, "mark" 1, "mkmk" 1;
        }
    </style>
    <link rel="preload" href="{{ asset('fonts/ExcellentArabicWeb2.0.ttf') }}" as="font" type="font/ttf" crossorigin>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    <!-- Fabric.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>

    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/quran-editor.css') }}">

    @stack('head')
    <script>
        // Inject Laravel APP_URL so static JS files can build correct paths under any subfolder
        window.APP_BASE = '{{ rtrim(config('app.url'), '/') }}';
    </script>
</head>
<body>
    <!-- Top Navigation Bar -->
    <header class="app-header" id="app-header">
        <div class="header-left">
            <div class="app-logo">
                <span class="logo-icon">☪</span>
                <div class="logo-text">
                    <span class="logo-title">কুরআন পাবলিশার</span>
                    <span class="logo-sub">Professional Publishing Suite</span>
                </div>
            </div>
        </div>

        <div class="header-center">
            <nav class="header-nav">
                <a href="{{ route('editor') }}" class="nav-link {{ request()->routeIs('editor') ? 'active' : '' }}">
                    <span class="nav-icon">✏️</span> এডিটর
                </a>
            </nav>
        </div>

        <div class="header-right">
            <div class="header-stats" id="header-stats">
                <span class="stat-badge" id="stat-verse-count">০ আয়াত</span>
                <span class="stat-badge" id="stat-page-count">০ পেজ</span>
            </div>
            <button class="btn-export-header" id="btn-header-export" onclick="window.quranApp && window.quranApp.exportPDF()">
                <span>📥</span> PDF রপ্তানি
            </button>
        </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
        @yield('content')
    </main>

    <!-- Toast Notifications -->
    <div class="toast-container" id="toast-container"></div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loading-overlay" style="display:none;">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-text" id="loading-text">লোড হচ্ছে...</p>
            <div class="loading-progress-bar">
                <div class="loading-progress-fill" id="loading-progress-fill"></div>
            </div>
            <span class="loading-percent" id="loading-percent">0%</span>
        </div>
    </div>

    <!-- Custom JS — version-busted so browser always loads the latest file -->
    <script src="{{ asset('js/quran-editor.js') }}?v={{ filemtime(public_path('js/quran-editor.js')) }}"></script>

    @stack('scripts')
</body>
</html>
