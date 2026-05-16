<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Mpdf\Mpdf;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;

class PdfExportController extends Controller
{
    public function export(Request $request)
    {
        $data = $request->json()->all();

        if (empty($data['pages']) || empty($data['template'])) {
            return response()->json(['error' => 'পেজ বা টেমপ্লেট ডেটা নেই'], 422);
        }

        $pages    = $data['pages'];
        $template = $data['template'];
        $rules    = $data['rules'] ?? [];

        try {
            // mPDF কনফিগারেশন
            $pageW    = $template['pageSize']['width'];
            $pageH    = $template['pageSize']['height'];
            $bleed    = $template['pageSize']['bleed'];

            // মার্জিন (mm)
            $mTop     = $template['margins']['top'];
            $mBottom  = $template['margins']['bottom'];
            $mInner   = $template['margins']['inner'];
            $mOuter   = $template['margins']['outer'];

            // ফন্ট কনফিগারেশন
            $defaultConfig = (new ConfigVariables())->getDefaults();
            $fontDirs = $defaultConfig['fontDir'];
            $fontDirs[] = public_path('fonts');

            $defaultFontConfig = (new FontVariables())->getDefaults();
            $fontData = $defaultFontConfig['fontdata'];
            $fontData += [
                'arabicfont' => [
                    'R' => file_exists(public_path('fonts/arabic.otf')) ? 'arabic.otf' : '',
                ],
                'banglafont' => [
                    'R' => file_exists(public_path('fonts/bangla.ttf')) ? 'bangla.ttf' : '',
                ],
            ];

            $mpdf = new Mpdf([
                'mode'          => 'utf-8',
                'format'        => [$pageW + $bleed * 2, $pageH + $bleed * 2],
                'margin_top'    => $mTop,
                'margin_bottom' => $mBottom,
                'margin_left'   => $mOuter + $bleed,
                'margin_right'  => $mInner + $bleed,
                'fontDir'       => $fontDirs,
                'fontdata'      => $fontData,
                'default_font'  => 'dejavusans',
                'autoScriptToLang' => true,
                'autoLangToFont'   => true,
            ]);

            // মেটাডেটা
            $mpdf->SetTitle('পবিত্র কুরআনুল কারিম');
            $mpdf->SetAuthor('কুরআন পাবলিশার');
            $mpdf->SetSubject('Holy Quran — Bengali Translation');

            // ক্রপ মার্ক
            $mpdf->SetCropMarks(true);
            $mpdf->SetDisplayMode('fullpage');

            // ফন্ট সিলেকশন
            $arabicFontFamily = file_exists(public_path('fonts/arabic.otf')) ? 'arabicfont' : 'dejavusans';
            $banglaFontFamily  = file_exists(public_path('fonts/bangla.ttf'))  ? 'banglafont'  : 'dejavusans';

            $arabicSize  = $template['arabicFont']['size']  ?? 15;
            $banglaSize   = $template['banglaFont']['size']   ?? 7;
            $meaningSize  = $template['meaningFont']['size']  ?? 6;
            $showBangla   = $template['banglaFont']['show']   ?? true;
            $showMeaning  = $template['meaningFont']['show']  ?? false;
            $showBorder   = $template['border']['show']       ?? true;
            $showPageNum  = $template['pageNumber']['show']   ?? true;
            $arabicColor  = $template['arabicFont']['color']  ?? '#000000';

            // ── প্রতিটি পেজ রেন্ডার ─────────────────────────────────
            foreach ($pages as $pageIndex => $pageVerses) {

                if ($pageIndex > 0) $mpdf->AddPage();

                // পেজ বর্ডার
                $borderHtml = '';
                if ($showBorder) {
                    $borderHtml = '
                    <div style="
                        position: fixed;
                        top: 6mm; left: 6mm; right: 6mm; bottom: 6mm;
                        border: 1px solid #8B7355;
                        border-radius: 2mm;
                        z-index: -1;
                    "></div>
                    <div style="
                        position: fixed;
                        top: 8mm; left: 8mm; right: 8mm; bottom: 8mm;
                        border: 0.5px solid #C9A22760;
                    "></div>';
                }

                // আয়াত HTML তৈরি
                $versesHtml = '';
                $lastSurah  = -1;

                foreach ($pageVerses as $verse) {
                    // সূরা হেডার
                    if ($verse['s'] !== $lastSurah) {
                        $surahNames = $this->getSurahNames();
                        $surahName  = $surahNames[$verse['s']] ?? ('সূরা ' . $verse['s']);
                        $versesHtml .= '
                        <div style="text-align: center; margin: 3mm 0 2mm; font-size: 7pt; color: #8B7355; font-family: dejavusans;">
                            ── সূরা ' . htmlspecialchars($surahName) . ' ──
                        </div>
                        <hr style="border: none; border-top: 0.5pt solid #C9A22740; margin: 0 10mm 2mm;">';
                        $lastSurah = $verse['s'];
                    }

                    // আয়াত আরবি
                    $versesHtml .= '
                    <div style="
                        direction: rtl;
                        text-align: right;
                        font-family: ' . $arabicFontFamily . ';
                        font-size: ' . $arabicSize . 'pt;
                        line-height: ' . ($template['arabicFont']['lineHeight'] ?? 28) . 'pt;
                        color: ' . $arabicColor . ';
                        margin-bottom: 1mm;
                    ">' . htmlspecialchars($verse['ar']) . '
                    <span style="
                        display: inline-block;
                        width: 14pt;
                        height: 14pt;
                        border: 0.5pt solid #C9A227;
                        border-radius: 50%;
                        text-align: center;
                        line-height: 14pt;
                        font-size: 7pt;
                        color: #8B7355;
                        margin-right: 2pt;
                        font-family: dejavusans;
                    ">' . $verse['v'] . '</span>
                    </div>';

                    // বাংলা উচ্চারণ
                    if ($showBangla && !empty($verse['bn'])) {
                        $versesHtml .= '
                        <div style="
                            direction: ltr;
                            text-align: left;
                            font-family: ' . $banglaFontFamily . ';
                            font-size: ' . $banglaSize . 'pt;
                            line-height: ' . ($banglaSize * 1.6) . 'pt;
                            color: #444444;
                            margin-bottom: 1mm;
                        ">' . htmlspecialchars($verse['bn']) . '</div>';
                    }

                    // বাংলা অর্থ
                    if ($showMeaning && !empty($verse['t_bn'])) {
                        $versesHtml .= '
                        <div style="
                            direction: ltr;
                            text-align: left;
                            font-family: ' . $banglaFontFamily . ';
                            font-size: ' . $meaningSize . 'pt;
                            line-height: ' . ($meaningSize * 1.8) . 'pt;
                            color: #666666;
                            font-style: italic;
                            margin-bottom: 1.5mm;
                            padding-left: 2mm;
                            border-left: 1pt solid #C9A22740;
                        ">' . htmlspecialchars($verse['t_bn']) . '</div>';
                    }

                    $versesHtml .= '<div style="margin-bottom: 2mm;"></div>';
                }

                // পেজ নম্বর
                $pageNumHtml = '';
                if ($showPageNum) {
                    $pageNumHtml = '
                    <div style="
                        position: fixed;
                        bottom: 5mm;
                        left: 0;
                        right: 0;
                        text-align: center;
                        font-size: 7pt;
                        color: #8B7355;
                        font-family: dejavusans;
                    ">— ' . ($pageIndex + 1) . ' —</div>';
                }

                // সম্পূর্ণ পেজ HTML
                $html = '<!DOCTYPE html>
                <html dir="rtl">
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { margin: 0; padding: 0; }
                        @font-face {
                            font-family: BanglaFont;
                            src: url("' . public_path('fonts/bangla.ttf') . '");
                        }
                    </style>
                </head>
                <body>
                    ' . $borderHtml . '
                    ' . $pageNumHtml . '
                    <div style="padding: 0;">
                        ' . $versesHtml . '
                    </div>
                </body>
                </html>';

                $mpdf->WriteHTML($html);

                // Progress tracking (large exports)
                if ($pageIndex % 50 === 0) {
                    // Could emit progress here in future
                }
            }

            // PDF Output
            $pdfContent = $mpdf->Output('', 'S');

            return response($pdfContent, 200, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="quran-' . date('Y-m-d') . '.pdf"',
                'Content-Length'      => strlen($pdfContent),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'PDF তৈরিতে সমস্যা হয়েছে: ' . $e->getMessage(),
                'details' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * সূরার বাংলা নাম তালিকা
     */
    private function getSurahNames(): array
    {
        return [
            1  => 'আল-ফাতিহা',   2  => 'আল-বাকারা',   3  => 'আল-ইমরান',
            4  => 'আন-নিসা',     5  => 'আল-মায়িদা',   6  => 'আল-আনআম',
            7  => 'আল-আরাফ',     8  => 'আল-আনফাল',    9  => 'আত-তাওবাহ',
            10 => 'ইউনুস',       11 => 'হুদ',           12 => 'ইউসুফ',
            13 => 'আর-রাদ',      14 => 'ইবরাহিম',      15 => 'আল-হিজর',
            16 => 'আন-নাহল',     17 => 'আল-ইসরা',      18 => 'আল-কাহফ',
            19 => 'মারইয়াম',    20 => 'তা-হা',         21 => 'আল-আম্বিয়া',
            22 => 'আল-হাজ্জ',    23 => 'আল-মুমিনুন',   24 => 'আন-নূর',
            25 => 'আল-ফুরকান',   26 => 'আশ-শুআরা',     27 => 'আন-নামল',
            28 => 'আল-কাসাস',    29 => 'আল-আনকাবুত',   30 => 'আর-রুম',
            31 => 'লুকমান',      32 => 'আস-সাজদাহ',    33 => 'আল-আহযাব',
            34 => 'সাবা',         35 => 'ফাতির',         36 => 'ইয়াসিন',
            37 => 'আস-সাফফাত',   38 => 'সাদ',           39 => 'আয-যুমার',
            40 => 'গাফির',        41 => 'ফুসসিলাত',     42 => 'আশ-শুরা',
            43 => 'আয-যুখরুফ',   44 => 'আদ-দুখান',     45 => 'আল-জাসিয়া',
            46 => 'আল-আহকাফ',    47 => 'মুহাম্মাদ',    48 => 'আল-ফাতহ',
            49 => 'আল-হুজুরাত',  50 => 'কাফ',           51 => 'আয-যারিয়াত',
            52 => 'আত-তুর',      53 => 'আন-নাজম',       54 => 'আল-কামার',
            55 => 'আর-রহমান',    56 => 'আল-ওয়াকিয়া', 57 => 'আল-হাদিদ',
            58 => 'আল-মুজাদালা', 59 => 'আল-হাশর',       60 => 'আল-মুমতাহানা',
            61 => 'আস-সাফ',      62 => 'আল-জুমুআ',      63 => 'আল-মুনাফিকুন',
            64 => 'আত-তাগাবুন',  65 => 'আত-তালাক',     66 => 'আত-তাহরিম',
            67 => 'আল-মুলক',     68 => 'আল-কলম',        69 => 'আল-হাক্কা',
            70 => 'আল-মাআরিজ',   71 => 'নূহ',            72 => 'আল-জিন',
            73 => 'আল-মুযযাম্মিল', 74 => 'আল-মুদ্দাস্সির', 75 => 'আল-কিয়ামাহ',
            76 => 'আল-ইনসান',    77 => 'আল-মুরসালাত',   78 => 'আন-নাবা',
            79 => 'আন-নাযিআত',   80 => 'আবাসা',          81 => 'আত-তাকভির',
            82 => 'আল-ইনফিতার',  83 => 'আল-মুতাফফিফিন', 84 => 'আল-ইনশিকাক',
            85 => 'আল-বুরুজ',    86 => 'আত-তারিক',      87 => 'আল-আলা',
            88 => 'আল-গাশিয়া',  89 => 'আল-ফাজর',       90 => 'আল-বালাদ',
            91 => 'আশ-শামস',     92 => 'আল-লাইল',       93 => 'আদ-দুহা',
            94 => 'আশ-শারহ',     95 => 'আত-তিন',         96 => 'আল-আলাক',
            97 => 'আল-কদর',      98 => 'আল-বাইয়্যিনাহ', 99 => 'আয-যালযালাহ',
            100 => 'আল-আদিয়াত', 101 => 'আল-কারিআহ',   102 => 'আত-তাকাসুর',
            103 => 'আল-আসর',    104 => 'আল-হুমাযা',    105 => 'আল-ফিল',
            106 => 'কুরাইশ',    107 => 'আল-মাউন',      108 => 'আল-কাওসার',
            109 => 'আল-কাফিরুন', 110 => 'আন-নাসর',     111 => 'আল-মাসাদ',
            112 => 'আল-ইখলাস',  113 => 'আল-ফালাক',     114 => 'আন-নাস',
        ];
    }
}
