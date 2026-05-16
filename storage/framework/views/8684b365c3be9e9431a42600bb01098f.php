<?php $__env->startSection('title', 'কুরআন পাবলিশার — পেজ এডিটর'); ?>

<?php $__env->startSection('content'); ?>
<div class="editor-root" id="quran-editor" x-data="quranEditor()" x-cloak>

    <!-- ══ বাম প্যানেল: পেজ তালিকা ══ -->
    <aside class="panel-left">
        <div class="panel-header">
            <h2 class="panel-title">
                <svg class="icon" viewBox="0 0 16 16" style="margin-right:.25rem"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
                পেজ তালিকা
            </h2>
            <span class="panel-badge" x-text="pages.length + ' পেজ'">০</span>
        </div>
        <!-- Surah + Para filters -->
        <div class="left-filter-bar">
            <select class="filter-select" x-model="selectedSurah" @change="jumpToSurah()">
                <option value="0">— সূরা —</option>
                <template x-for="s in surahList" :key="s.number">
                    <option :value="s.number" x-text="s.number + '. ' + s.name"></option>
                </template>
            </select>
            <select class="filter-select" x-model="selectedPara" @change="jumpToPara()">
                <option value="0">— পারা —</option>
                <template x-for="p in paraList" :key="p.number">
                    <option :value="p.number" x-text="p.number + '. ' + p.name"></option>
                </template>
            </select>
        </div>

        <div class="page-list" id="page-list">
            <template x-if="isLoading">
                <div class="page-list-empty">
                    <div class="quran-ornament-sm">﷽</div>
                    <p>লোড হচ্ছে...</p>
                    <div class="mini-spinner"></div>
                </div>
            </template>
            <template x-if="!isLoading && pages.length === 0">
                <div class="page-list-empty">
                    <div class="empty-icon">📂</div>
                    <p>verses.json পাওয়া যায়নি</p>
                    <button class="btn-retry" @click="loadVerses()">🔄 আবার চেষ্টা</button>
                </div>
            </template>
            <template x-for="(page, idx) in pages" :key="idx">
                <div class="page-thumb"
                     :class="{ 'page-thumb--active': currentPage === idx, 'page-thumb--custom': !isPageLinked(idx) }"
                     @click="setPage(idx)">
                    <!-- Link status indicator -->
                    <div class="thumb-link-dot"
                         :class="isPageLinked(idx) ? 'thumb-link-dot--linked' : 'thumb-link-dot--unlinked'"
                         :title="isPageLinked(idx) ? 'টেমপ্লেটে লিঙ্ক করা' : 'কাস্টম লেআউট'"
                         @click.stop="isPageLinked(idx) ? unlinkPage(idx) : relinkPage(idx)">&#x1F517;</div>
                    <div class="page-thumb-num" x-text="idx + 1"></div>
                    <div class="page-thumb-body">
                        <div class="thumb-arabic" x-text="page[0] ? page[0].ar.substring(0,26)+'…' : ''"></div>
                        <div class="thumb-meta">
                            <span class="thumb-surah" x-text="page[0] ? (surahNames[page[0].surah] || '') : ''"></span>
                            <span x-show="!isPageLinked(idx)" class="thumb-custom-tag">কাস্টম</span>
                        </div>
                    </div>
                    <div class="thumb-actions">
                        <button class="thumb-edit-btn"
                                :class="isPageLinked(idx) ? 'thumb-edit-btn--linked' : 'thumb-edit-btn--custom'"
                                @click.stop="openPageOverride(idx)"
                                title="এই পেজের লেআউট এডিট করুন">✏</button>
                    </div>
                </div>
            </template>
        </div>

        <div class="panel-footer">
            <button class="btn-refresh" @click="loadVerses()">🔄 রিফ্রেশ</button>
            <span class="footer-stat" x-text="allVerses.length + ' আয়াত'"></span>
        </div>
    </aside>

    <!-- ══ মাঝ প্যানেল ══ -->
    <main class="panel-center">

        <!-- Template quick-info bar -->
        <div class="template-info-bar">
            <span class="tib-indicator">
                📐 <strong x-text="masterTemplate.name"></strong>
                — আরবি: <span x-text="arabicRowCount"></span> সারি
                — পেজ: <strong x-text="pages.length"></strong>
                <span x-show="!isPageLinked(currentPage)" class="tib-custom-badge">⚡ কাস্টম পেজ</span>
            </span>
            <div class="tib-actions">
                <button class="toolbar-btn tib-page-btn"
                        x-show="!isPageLinked(currentPage)"
                        @click="relinkPage(currentPage)"
                        title="মাস্টার টেমপ্লেটে ফিরে যান">🔗 রিলিঙ্ক</button>
                <button class="toolbar-btn tib-page-btn"
                        @click="openPageOverride(currentPage)"
                        title="এই পেজ আলাদাভাবে এডিট করুন">📌 এই পেজ</button>
                <button class="toolbar-btn tib-design-btn" @click="openBuilder()" title="মাস্টার টেমপ্লেট ডিজাইন করুন">
                    <svg class="icon" viewBox="0 0 16 16"><path d="M10 2l4 4-8 8H2v-4z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
                    মাস্টার
                </button>
            </div>
        </div>

        <div class="canvas-toolbar">
            <div class="toolbar-left">
                <button class="toolbar-btn" id="btn-zoom-out" @click="zoomOut()" title="জুম আউট (−)">−</button>
                <span class="zoom-label" x-text="Math.round(zoom*100)+'%'" @click="resetZoom()" title="ক্লিক বা (0) রিসেট"></span>
                <button class="toolbar-btn" id="btn-zoom-in" @click="zoomIn()" title="জুম ইন (+)">+</button>
                <button class="toolbar-btn" id="btn-fit-page" @click="fitPage()" title="পেজ ফিট (F)">⊠ ফিট</button>
            </div>
            <div class="toolbar-right">
                <!-- Edit Mode Toggle -->
                <button class="toolbar-btn"
                        :class="editMode ? 'toolbar-btn--editmode' : ''"
                        id="btn-edit-mode"
                        @click="toggleEditMode()"
                        :title="editMode ? 'Preview Mode এ যান (E বা Esc)' : 'Edit Mode — elements drag করুন (E)'">
                    <span x-show="!editMode">
                        <svg class="icon" viewBox="0 0 16 16" style="margin-right:.15rem"><path d="M10 2l4 4-8 8H2v-4z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg> Edit
                    </span>
                    <span x-show="editMode">
                        <svg class="icon" viewBox="0 0 16 16" style="margin-right:.15rem"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2M4 4l1.5 1.5M10.5 10.5L12 12M4 12l1.5-1.5M10.5 5.5L12 4" stroke="currentColor" stroke-width="1"/></svg> Preview
                    </span>
                </button>
                <button class="toolbar-btn" id="btn-export-png" @click="exportCurrentPage()" title="এই পেজ PNG (P)">📸 PNG</button>
                <button class="kb-hint-btn" id="btn-shortcuts" @click="showShortcuts=true" title="কিবোর্ড শর্টকাট (?)">
                    ⌨ ?
                </button>
            </div>
        </div>

        <!-- Canvas -->
        <div class="canvas-area" id="canvas-area">
            <div class="canvas-loading" x-show="isLoading">
                <div class="quran-ornament">﷽</div>
                <p>কুরআন লোড হচ্ছে...</p>
                <div class="loading-dots"><span></span><span></span><span></span></div>
            </div>
            <div class="canvas-wrapper" id="canvas-wrapper"
                 x-show="!isLoading">
                <canvas id="page-canvas"></canvas>
            </div>
            <div class="canvas-empty" x-show="!isLoading && pages.length === 0">
                <div class="empty-state">
                    <div style="font-size:3rem">📖</div>
                    <h3>verses.json যোগ করুন</h3>
                    <p><code>public/data/verses.json</code></p>
                    <label class="btn-primary">
                        <input type="file" accept=".json" hidden @change="loadVersesFromFile($event)">
                        📂 JSON খুলুন
                    </label>
                </div>
            </div>
        </div>

        <!-- Navigation -->
        <div class="canvas-nav">
            <button class="nav-btn" @click="prevPage()" :disabled="currentPage===0">◀ আগের</button>
            <div class="nav-info">
                <input type="number" class="page-input" :value="currentPage+1"
                       min="1" :max="pages.length"
                       @change="setPage($event.target.value-1)">
                <span class="nav-sep">/ <span x-text="pages.length"></span></span>
            </div>
            <button class="nav-btn" @click="nextPage()" :disabled="currentPage>=pages.length-1">পরের ▶</button>
        </div>
    </main>

    <!-- ══ ডান প্যানেল ══ -->
    <aside class="panel-right">
        <div class="tabs">
            <button class="tab-btn" :class="{'tab-btn--active':activeTab==='template'}" @click="activeTab='template'">
                <svg class="icon" viewBox="0 0 16 16"><path d="M2 2h12v12H2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 5h6M5 8h4M5 11h5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                টেমপ্লেট
            </button>
            <button class="tab-btn" :class="{'tab-btn--active':activeTab==='library'}"  @click="activeTab='library'">
                <svg class="icon" viewBox="0 0 16 16"><path d="M2 3h12v10H2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 1v2M11 1v2M5 7h6M5 10h3" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                লাইব্রেরি
            </button>
            <button class="tab-btn" :class="{'tab-btn--active':activeTab==='rules'}"    @click="activeTab='rules'">
                <svg class="icon" viewBox="0 0 16 16"><path d="M3 2v12l5-3 5 3V2z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
                রুলস
            </button>
            <button class="tab-btn" :class="{'tab-btn--active':activeTab==='fonts'}"    @click="activeTab='fonts'">
                <svg class="icon" viewBox="0 0 16 16"><path d="M4 13L8 3l4 10M5.5 9h5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                ফন্ট
            </button>
            <button class="tab-btn" :class="{'tab-btn--active':activeTab==='export'}"   @click="activeTab='export'">
                <svg class="icon" viewBox="0 0 16 16"><path d="M8 2v8M4 6l4 4 4-4M3 12v2h10v-2" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Export
            </button>
        </div>

        <!-- ══ EDIT MODE PANEL (appears above tabs when editMode=true) ══ -->
        <div class="edit-panel" x-show="editMode" x-cloak>
            <div class="edit-panel-header">
                <svg class="icon" viewBox="0 0 16 16"><path d="M10 2l4 4-8 8H2v-4z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
                Edit Mode
                <span class="edit-panel-badge" x-show="editPanelData" x-text="editPanelData?.field === 'ar' ? '▶ আরবি সারি' : (editPanelData?.field === 'pr' ? '▶ বাংলা উচ্চারণ' : '▶ বাংলা অর্থ')"></span>
            </div>

            <!-- No selection guidance -->
            <template x-if="!editPanelData">
                <div class="edit-panel-idle">
                    <div class="edit-panel-idle-icon">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".5">
                            <path d="M15 3l6 6-13 13H2v-6z"/>
                        </svg>
                    </div>
                    <p>Canvas এ যেকোনো <strong>আরবি</strong> বা <strong>বাংলা</strong> সারিতে ক্লিক করুন</p>
                    <p class="edit-panel-idle-hint">তারপর ফন্ট, স্পেসিং, রং পরিবর্তন করুন</p>
                </div>
            </template>

            <!-- Active selection controls -->
            <template x-if="editPanelData">
                <div class="edit-panel-controls">

                    <!-- Text content -->
                    <div class="ep-group">
                        <div class="ep-label">
                            <span x-text="editPanelData.field === 'ar' ? 'আরবি টেক্সট' : (editPanelData.field === 'pr' ? 'বাংলা উচ্চারণ' : 'বাংলা অর্থ')"></span>
                        </div>
                        <textarea class="ep-textarea"
                                  :dir="editPanelData.field === 'ar' ? 'rtl' : 'ltr'"
                                  x-model="editPanelData.text"
                                  rows="3"
                                  placeholder="টেক্সট লিখুন..."></textarea>
                    </div>

                    <!-- Font Size -->
                    <div class="ep-group">
                        <div class="ep-label">ফন্ট সাইজ (px)</div>
                        <div class="ep-slider-row">
                            <input type="range" class="ep-slider" min="6" max="60" step="0.5"
                                   x-model.number="editPanelData.fontSize"
                                   @input="liveUpdateEditPanel()">
                            <input type="number" class="ep-num" min="6" max="60" step="0.5"
                                   x-model.number="editPanelData.fontSize"
                                   @input="liveUpdateEditPanel()">
                        </div>
                    </div>

                    <!-- Letter Spacing (charSpacing) -->
                    <div class="ep-group">
                        <div class="ep-label">অক্ষর ফাঁক (spacing)</div>
                        <div class="ep-slider-row">
                            <input type="range" class="ep-slider" min="-100" max="400" step="1"
                                   x-model.number="editPanelData.charSpacing"
                                   @input="liveUpdateEditPanel()">
                            <input type="number" class="ep-num" min="-100" max="400" step="1"
                                   x-model.number="editPanelData.charSpacing"
                                   @input="liveUpdateEditPanel()">
                        </div>
                    </div>

                    <!-- Color -->
                    <div class="ep-group">
                        <div class="ep-label">রং</div>
                        <div class="ep-color-row">
                            <input type="color" class="ep-color-swatch"
                                   x-model="editPanelData.color"
                                   @input="liveUpdateEditPanel()">
                            <input type="text" class="ep-color-hex"
                                   x-model="editPanelData.color"
                                   @input="liveUpdateEditPanel()"
                                   maxlength="7" placeholder="#0d0d0d">
                        </div>
                    </div>

                    <!-- Apply button -->
                    <button class="ep-apply-btn" @click="applyEditPanel()">
                        <svg class="icon" viewBox="0 0 16 16"><path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        পরিবর্তন প্রয়োগ করুন
                    </button>
                    <button class="ep-reset-btn" @click="selectedCanvasObj=null; editPanelData=null; fabricCanvas && fabricCanvas.discardActiveObject && fabricCanvas.discardActiveObject(); fabricCanvas && fabricCanvas.requestRenderAll()">
                        সিলেকশন বাতিল
                    </button>
                </div>
            </template>
        </div>

        <!-- ══ TAB 1: TEMPLATE ══ -->
        <div class="tab-content" x-show="activeTab==='template'">


            <!-- Template name -->
            <div class="settings-group">
                <div class="settings-group-title">🎨 টেমপ্লেট নাম</div>
                <input type="text" class="setting-input" style="width:100%"
                       x-model="masterTemplate.name" @change="debouncedRender()">
            </div>

            <!-- Page size -->
            <div class="settings-group">
                <div class="settings-group-title">📄 পেজ সাইজ (px)</div>
                <div class="setting-row">
                    <label>প্রস্থ (W)</label>
                    <div class="input-spinner">
                        <button @click="masterTemplate.pageSize.w=Math.max(100,masterTemplate.pageSize.w-5);debouncedReprocess()">−</button>
                        <input type="number" class="setting-input" x-model.number="masterTemplate.pageSize.w" @change="debouncedReprocess()">
                        <button @click="masterTemplate.pageSize.w+=5;debouncedReprocess()">+</button>
                        <span class="unit">px</span>
                    </div>
                </div>
                <div class="setting-row">
                    <label>উচ্চতা (H)</label>
                    <div class="input-spinner">
                        <button @click="masterTemplate.pageSize.h=Math.max(100,masterTemplate.pageSize.h-5);debouncedReprocess()">−</button>
                        <input type="number" class="setting-input" x-model.number="masterTemplate.pageSize.h" @change="debouncedReprocess()">
                        <button @click="masterTemplate.pageSize.h+=5;debouncedReprocess()">+</button>
                        <span class="unit">px</span>
                    </div>
                </div>
            </div>

            <!-- Margins -->
            <div class="settings-group">
                <div class="settings-group-title">⬜ মার্জিন (px)</div>
                <div class="margins-grid">
                    <template x-for="side in ['top','right','bottom','left']" :key="side">
                        <div class="setting-row">
                            <label x-text="{'top':'উপর','right':'ডান','bottom':'নিচ','left':'বাম'}[side]"></label>
                            <input type="number" class="setting-input setting-input--sm"
                                   :value="masterTemplate.margins[side]"
                                   @change="masterTemplate.margins[side]=parseInt($event.target.value)||0; debouncedReprocess()">
                        </div>
                    </template>
                </div>
            </div>

            <!-- Design Elements Info -->
            <div class="settings-group">
                <div class="settings-group-title">🎨 ডিজাইন এলিমেন্ট</div>
                <div class="design-el-info-row">
                    <span class="design-el-count" x-text="(masterTemplate.designElements||[]).length + 'টি এলিমেন্ট'"></span>
                    <span class="design-el-hint">Template Builder থেকে যোগ করুন</span>
                </div>
                <div class="edit-mode-hint" x-show="(masterTemplate.designElements||[]).length > 0">
                    <span>✏ Edit Mode (E) চালু করে canvas এ drag করুন</span>
                </div>
            </div>

            <!-- Debug -->
            <div class="settings-group">
                <div class="settings-group-title">⚙ ডিবাগ</div>
                <div class="setting-row setting-row--toggle">
                    <label>Slot গাইড লাইন</label>
                    <label class="toggle">
                        <input type="checkbox" x-model="masterTemplate.showSlotGuides" @change="debouncedRender()">
                        <span class="toggle-sl"></span>
                    </label>
                </div>
            </div>

            <!-- ════════════════════════════════════════
                 GLOBAL FONT CONTROLS (Master Template)
            ════════════════════════════════════════ -->
            <div class="settings-group">
                <div class="settings-group-title">🔤 গ্লোবাল ফন্ট সাইজ</div>
                <div class="font-ctrl-hint">0 = অটো (টেমপ্লেট থেকে হিসাব হয়)</div>

                <!-- Rows per page -->
                <div class="setting-row">
                    <label>সারি / পেজ</label>
                    <div class="input-spinner">
                        <button @click="masterTemplate.rowsPerPage=Math.max(6,masterTemplate.rowsPerPage-1);debouncedReprocess()">−</button>
                        <input type="number" class="setting-input" min="6" max="15" step="1"
                               x-model.number="masterTemplate.rowsPerPage"
                               @change="debouncedReprocess()">
                        <button @click="masterTemplate.rowsPerPage=Math.min(15,(masterTemplate.rowsPerPage||9)+1);debouncedReprocess()">+</button>
                        <span class="unit">রো</span>
                    </div>
                </div>

                <!-- Arabic render font -->
                <div class="setting-row">
                    <label>আরবি ফন্ট (রেন্ডার)</label>
                    <div class="ep-slider-row">
                        <input type="range" class="ep-slider" min="0" max="50" step="0.5"
                               x-model.number="masterTemplate.globalArabicFontSize"
                               @input="debouncedReprocess()">
                        <input type="number" class="ep-num" min="0" max="50" step="0.5"
                               x-model.number="masterTemplate.globalArabicFontSize"
                               @input="debouncedReprocess()">
                        <span class="unit">px</span>
                    </div>
                </div>

                <!-- Measure/line-density font -->
                <div class="setting-row">
                    <label title="ছোট করলে প্রতি লাইনে বেশি শব্দ → পেজ কম">লাইন ঘনত্ব (পেজ সংখ্যা নিয়ন্ত্রণ)</label>
                    <div class="ep-slider-row">
                        <input type="range" class="ep-slider" min="0" max="40" step="0.5"
                               x-model.number="masterTemplate.globalMeasureFontSize"
                               @input="debouncedReprocess()">
                        <input type="number" class="ep-num" min="0" max="40" step="0.5"
                               x-model.number="masterTemplate.globalMeasureFontSize"
                               @input="debouncedReprocess()">
                        <span class="unit">px</span>
                    </div>
                    <div class="font-ctrl-hint" style="margin-top:.2rem">
                        বর্তমান: <strong x-text="arabicLines.length + ' লাইন → ' + pages.length + ' পেজ'"></strong>
                    </div>
                </div>

                <!-- Bangla font -->
                <div class="setting-row">
                    <label>বাংলা ফন্ট</label>
                    <div class="ep-slider-row">
                        <input type="range" class="ep-slider" min="0" max="20" step="0.5"
                               x-model.number="masterTemplate.globalBanglaFontSize"
                               @input="debouncedRender()">
                        <input type="number" class="ep-num" min="0" max="20" step="0.5"
                               x-model.number="masterTemplate.globalBanglaFontSize"
                               @input="debouncedRender()">
                        <span class="unit">px</span>
                    </div>
                </div>

                <!-- Quick presets -->
                <div class="font-preset-row">
                    <span style="font-size:.7rem;color:var(--t3);margin-right:.3rem">দ্রুত প্রিসেট:</span>
                    <button class="btn-sm" title="~807 পেজ (Kariana অনুযায়ী)"
                            @click="masterTemplate.rowsPerPage=9;masterTemplate.globalMeasureFontSize=0;masterTemplate.globalArabicFontSize=0;debouncedReprocess()">
                        9 রো / অটো
                    </button>
                    <button class="btn-sm" title="~600 পেজ (বড় ফন্ট ঘনত্ব)"
                            @click="masterTemplate.rowsPerPage=9;masterTemplate.globalMeasureFontSize=12;masterTemplate.globalArabicFontSize=0;debouncedReprocess()">
                        9 রো / বড়
                    </button>
                    <button class="btn-sm" title="~500 পেজ (সর্বোচ্চ ঘনত্ব)"
                            @click="masterTemplate.rowsPerPage=12;masterTemplate.globalMeasureFontSize=10;debouncedReprocess()">
                        12 রো
                    </button>
                </div>
            </div>


            <div class="settings-group">
                <div class="settings-group-title">🖼 সিস্টেম টেমপ্লেট (ব্যাকগ্রাউন্ড SVG)</div>

                <!-- Current template preview -->
                <div class="sys-tpl-preview-wrap">
                    <img class="sys-tpl-preview-img"
                         :src="(masterTemplate.svgFile || '/templates/default.svg') + '?v=' + Date.now()"
                         alt="Current template"
                         x-bind:src="(masterTemplate.svgFile || '/templates/default.svg') + '?cachebust=' + (new Date().getTime())"
                         onerror="this.style.opacity=0.2">
                    <div class="sys-tpl-preview-label">
                        <svg class="icon" viewBox="0 0 16 16"><path d="M2 2h12v12H2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 5h6M5 8h4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                        <span x-text="masterTemplate.svgFile ? masterTemplate.svgFile.split('/').pop() : 'default.svg'"></span>
                    </div>
                </div>

                <!-- Upload new SVG -->
                <label class="sys-tpl-upload-btn" title="নতুন SVG টেমপ্লেট আপলোড করুন">
                    <input type="file" accept=".svg" hidden @change="uploadSystemTemplate($event)">
                    <svg class="icon" viewBox="0 0 16 16"><path d="M8 2v8M4 5l4-3 4 3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12v2h12v-2" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>
                    নতুন টেমপ্লেট SVG আপলোড করুন
                </label>
                <div class="sys-tpl-hint">
                    SVG আপলোড করলে সব পেজের ব্যাকগ্রাউন্ড পরিবর্তন হবে।<br>
                    পেজ সাইজ, লাইন পজিশন <strong>একই থাকবে।</strong>
                </div>

                <!-- Reset to factory default -->
                <button class="sys-tpl-reset-btn" @click="resetSystemTemplate()">
                    <svg class="icon" viewBox="0 0 16 16"><path d="M2 8a6 6 0 1 0 1-3.5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M2 4v4h4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    ডিফল্ট টেমপ্লেটে ফিরে যান
                </button>
            </div>

            <!-- Open Builder -->
            <div class="settings-group">
                <button class="btn-open-builder" @click="openBuilder()">
                    🔧 টেমপ্লেট লেআউট ডিজাইন করুন
                </button>
                <div class="tpl-stats-bar">
                    <div class="tpl-stat"><span>আরবি সারি</span><strong x-text="arabicRowCount"></strong></div>
                    <div class="tpl-stat"><span>মোট পেজ</span><strong x-text="pages.length"></strong></div>
                    <div class="tpl-stat"><span>আয়াত লাইন</span><strong x-text="arabicLines.length"></strong></div>
                </div>
            </div>
        </div>

        <!-- ══ TAB: LIBRARY (Saved Templates) ══ -->
        <div class="tab-content" x-show="activeTab==='library'">

            <!-- Actions bar -->
            <div class="settings-group">
                <div class="settings-group-title">📁 টেমপ্লেট লাইব্রেরি</div>
                <div class="lib-action-row">
                    <button class="btn-lib-save" @click="createNewTemplate()">
                        <svg class="icon" viewBox="0 0 16 16"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
                        নতুন টেমপ্লেট
                    </button>
                    <button class="btn-lib-save" @click="saveCurrentTemplate()" style="background:var(--elevated);color:var(--t2);border:1px solid var(--border)">
                        💾 কপি সেভ
                    </button>
                </div>
                <div class="lib-action-row" style="margin-top:.3rem">
                    <label class="btn-lib-import" title="JSON ইম্পোর্ট">
                        <input type="file" accept=".json" hidden @change="importTemplateJSON($event)">
                        📂 Import JSON
                    </label>
                    <button class="btn-lib-import" @click="exportTemplateJSON()">⬇ Export All</button>
                </div>
            </div>

            <!-- Template cards -->
            <div class="settings-group" style="flex:1;overflow:auto;padding-top:.3rem">
                <template x-for="(tpl, ti) in savedTemplates" :key="tpl.id">
                    <div class="lib-card" :class="tpl.isMaster ? 'lib-card--master' : ''">

                        <!-- Master badge + name -->
                        <div class="lib-card-header">
                            <div style="display:flex;align-items:center;gap:.4rem;flex:1;min-width:0">
                                <span x-show="tpl.isMaster" class="lib-master-badge">
                                    <svg viewBox="0 0 16 16" width="10" height="10"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor"/></svg>
                                    MASTER
                                </span>
                                <span class="lib-card-name" x-text="tpl.name" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
                            </div>
                            <span class="lib-card-info" x-text="(tpl.assets||[]).length + ' asset'"></span>
                        </div>

                        <!-- Row chips visual -->
                        <div class="lib-card-rows">
                            <template x-for="row in tpl.rows.filter(r=>r.visible)" :key="row.id">
                                <div class="lib-row-chip"
                                     :style="'background:' + rowTypeColor(row.type) + '44; border-color:' + rowTypeColor(row.type)"
                                     :title="row.label + ' ' + row.heightPct.toFixed(1) + '%'">
                                    <span x-text="rowTypeIcon(row.type)"></span>
                                </div>
                            </template>
                        </div>

                        <!-- Action buttons -->
                        <div class="lib-card-actions">
                            <!-- Set as Master -->
                            <button class="lib-btn lib-btn--star" @click="setMasterTemplate(tpl.id)"
                                    :class="tpl.isMaster ? 'lib-btn--star-active' : ''"
                                    :disabled="tpl.isMaster"
                                    :title="tpl.isMaster ? 'বর্তমান Master' : '⭐ Master করুন'">
                                <svg viewBox="0 0 16 16" width="12" height="12"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor"/></svg>
                                <span x-text="tpl.isMaster ? 'Master' : '⭐ Set'"></span>
                            </button>
                            <!-- Edit in builder -->
                            <button class="lib-btn lib-btn--edit" @click="openBuilderForTemplate(tpl.id)" title="Builder এ Edit করুন">
                                ✏ Edit
                            </button>
                            <!-- Apply to current page -->
                            <button class="lib-btn lib-btn--page" @click="applyTemplateToPage(tpl, currentPage)" title="এই পেজে apply">
                                📌
                            </button>
                            <!-- Duplicate -->
                            <button class="lib-btn" @click="duplicateTemplate(tpl)" title="ডুপ্লিকেট">⧉</button>
                            <!-- Delete -->
                            <button class="lib-btn lib-btn--del" @click="deleteTemplate(ti)" title="মুছুন" :disabled="tpl.isMaster || savedTemplates.length===1">✕</button>
                        </div>
                    </div>
                </template>
            </div>
        </div>


        <!-- ══ TAB 2: RULES ══ -->
        <div class="tab-content" x-show="activeTab==='rules'">

            <!-- ══ বাংলা প্রদর্শন সুইচ ══ -->
            <div class="bangla-display-switches">
                <div class="bds-title">
                    <svg class="icon" viewBox="0 0 16 16"><path d="M3 4h10M3 8h7M3 12h9" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>
                    বাংলা প্রদর্শন
                </div>

                <!-- বাংলা অর্থ -->
                <div class="bds-row" :class="showBanglaMeaning ? 'bds-row--on' : ''">
                    <div class="bds-row-info">
                        <span class="bds-dot" style="background:#2d4a8a"></span>
                        <div>
                            <div class="bds-label">বাংলা অর্থ</div>
                            <div class="bds-hint">আয়াতের সরল অনুবাদ</div>
                        </div>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" id="toggle-bangla-meaning"
                               x-model="showBanglaMeaning"
                               @change="debouncedReprocess()">
                        <span class="toggle-sl"></span>
                    </label>
                </div>

                <!-- বাংলা উচ্চারণ -->
                <div class="bds-row" :class="showBanglaUccharon ? 'bds-row--on bds-row--pr' : ''">
                    <div class="bds-row-info">
                        <span class="bds-dot" style="background:#7a3e00"></span>
                        <div>
                            <div class="bds-label">বাংলা উচ্চারণ</div>
                            <div class="bds-hint">আরবির বাংলা উচ্চারণ</div>
                        </div>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" id="toggle-bangla-uccharon"
                               x-model="showBanglaUccharon"
                               @change="debouncedReprocess()">
                        <span class="toggle-sl"></span>
                    </label>
                </div>

                <!-- Layout preview indicator -->
                <div class="bds-layout-hint">
                    <template x-if="showBanglaMeaning && showBanglaUccharon">
                        <span class="bds-hint-chip bds-hint-chip--both">🔠 আরবি + অর্থ + উচ্চারণ</span>
                    </template>
                    <template x-if="showBanglaMeaning && !showBanglaUccharon">
                        <span class="bds-hint-chip bds-hint-chip--meaning">📖 আরবি + অর্থ</span>
                    </template>
                    <template x-if="!showBanglaMeaning && showBanglaUccharon">
                        <span class="bds-hint-chip bds-hint-chip--uccharon">🗣 আরবি + উচ্চারণ</span>
                    </template>
                    <template x-if="!showBanglaMeaning && !showBanglaUccharon">
                        <span class="bds-hint-chip bds-hint-chip--none">📜 শুধু আরবি (পূর্ণ পেজ)</span>
                    </template>
                </div>
            </div>

            <!-- ══ টপ সিম্বল রো (12 রুলস) ══ -->
            <div class="top-sym-panel">
                <!-- header row: title + master toggle -->
                <div class="tsp-header">
                    <div class="tsp-title-group">
                        <span class="tsp-icon">📐</span>
                        <div>
                            <div class="tsp-title">টপ সিম্বল রো</div>
                            <div class="tsp-hint">আরবি পংক্তির উপরে সিম্বল স্ট্রিপ</div>
                        </div>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" id="toggle-top-symbol-row"
                               x-model="showTopSymbolRow"
                               @change="debouncedReprocess()">
                        <span class="toggle-sl"></span>
                    </label>
                </div>

                <!-- expanded controls (only when row is active) -->
                <div class="tsp-body" x-show="showTopSymbolRow"
                     x-transition:enter="tsp-fade-enter"
                     x-transition:enter-start="tsp-fade-start"
                     x-transition:enter-end="tsp-fade-end"
                     x-transition:leave="tsp-fade-enter"
                     x-transition:leave-start="tsp-fade-end"
                     x-transition:leave-end="tsp-fade-start">

                    <!-- strip height control -->
                    <div class="tsp-height-row">
                        <span class="tsp-ctl-label">রো উচ্চতা</span>
                        <input type="range" class="setting-range" min="10" max="32" step="1"
                               x-model.number="topSymbolRowH"
                               @input="debouncedReprocess()">
                        <span class="range-val" x-text="topSymbolRowH + ' px'"></span>
                    </div>

                    <!-- quick bulk controls -->
                    <div class="tsp-bulk">
                        <button class="btn-sm"
                                @click="topSymbols.forEach(s=>s.enabled=true);debouncedReprocess()">সব চালু</button>
                        <button class="btn-sm btn-sm--off"
                                @click="topSymbols.forEach(s=>s.enabled=false);debouncedRender()">সব বন্ধ</button>
                    </div>

                    <!-- 12 symbol cards -->
                    <div class="sym-cards-grid">
                        <template x-for="(sym, si) in topSymbols" :key="sym.id">
                            <div class="sym-card" :class="sym.enabled ? 'sym-card--on' : ''">

                                <!-- top bar: rank badge + toggle -->
                                <div class="sym-card-topbar">
                                    <span class="sym-rank" x-text="sym.rank"></span>
                                    <label class="toggle toggle--sm">
                                        <input type="checkbox"
                                               x-model="sym.enabled"
                                               @change="debouncedRender()">
                                        <span class="toggle-sl"></span>
                                    </label>
                                </div>

                                <!-- preview glyph / SVG image -->
                                <div class="sym-preview-box">
                                    <template x-if="sym.svgData">
                                        <img :src="sym.svgData"
                                             class="sym-preview-img"
                                             :title="sym.name">
                                    </template>
                                    <template x-if="!sym.svgData">
                                        <span class="sym-preview-char"
                                              :style="'color:'+sym.color"
                                              x-text="sym.shortName"></span>
                                    </template>
                                </div>

                                <!-- name -->
                                <div class="sym-name" x-text="sym.name"></div>

                                <!-- description (expandable on hover) -->
                                <div class="sym-desc" x-text="sym.desc"></div>

                                <!-- controls row: color + upload + clear -->
                                <div class="sym-controls">
                                    <input type="color"
                                           class="sym-color-picker"
                                           :value="sym.color"
                                           :title="'রং পরিবর্তন'"
                                           @input="sym.color=$event.target.value;debouncedRender()">

                                    <label class="sym-upload-btn" :title="'SVG আপলোড'">
                                        <input type="file" accept=".svg" hidden
                                               @change="uploadSymbolSvg(si, $event)">
                                        📎 SVG
                                    </label>

                                    <button x-show="sym.svgData"
                                            class="sym-clear-btn"
                                            @click="clearSymbolSvg(si)"
                                            title="সরান">✕</button>
                                </div>

                            </div>
                        </template>
                    </div><!-- end sym-cards-grid -->

                    <!-- ══ TajweedSymbols Font Status Bar ══ -->
                    <div class="tf-status-bar">
                        <div class="tf-status-label">
                            <svg class="icon" viewBox="0 0 16 16"><path d="M4 13L8 3l4 10M5.5 9h5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            TajweedSymbols Font
                        </div>
                        <div class="tf-status-chip"
                             :class="{
                                'tf-chip--idle':     tajweedFontStatus === 'idle',
                                'tf-chip--building': tajweedFontStatus === 'building',
                                'tf-chip--ready':    tajweedFontStatus === 'ready',
                                'tf-chip--error':    tajweedFontStatus === 'error',
                             }">
                            <span x-show="tajweedFontStatus === 'idle'">⚪ তৈরি হয়নি</span>
                            <span x-show="tajweedFontStatus === 'building'">⏳ তৈরি হচ্ছে...</span>
                            <span x-show="tajweedFontStatus === 'ready'">✅ SVG-ready</span>
                            <span x-show="tajweedFontStatus === 'error'">❌ ত্রুটি</span>
                        </div>
                        <button class="tf-rebuild-btn"
                                :disabled="tajweedFontStatus === 'building'"
                                @click="
                                    if (typeof window.rebuildTajweedFont === 'function') {
                                        tajweedFontStatus = 'building';
                                        window.rebuildTajweedFont(topSymbols)
                                            .then(b64 => {
                                                tajweedFontStatus = b64 ? 'ready' : 'idle';
                                                if (b64) showToast('✅ TajweedSymbols font তৈরি হয়েছে!', 'success');
                                                else showToast('⚠ Font তৈরি হয়নি — SVG আপলোড করুন', 'error');
                                            })
                                            .catch(e => {
                                                tajweedFontStatus = 'error';
                                                showToast('❌ Font error: ' + e.message, 'error');
                                            });
                                    } else {
                                        showToast('❌ opentype.js লোড হয়নি', 'error');
                                    }
                                "
                                title="SVG থেকে TajweedSymbols.ttf তৈরি করুন">
                            🔤 Font Rebuild
                        </button>

                        <button class="tf-download-btn"
                                :disabled="tajweedFontStatus === 'building'"
                                @click="
                                    if (typeof window.downloadTajweedFont === 'function') {
                                        tajweedFontStatus = 'building';
                                        window.downloadTajweedFont(topSymbols)
                                            .then(() => {
                                                tajweedFontStatus = 'ready';
                                                showToast('⬇ TajweedSymbols.ttf ডাউনলোড হচ্ছে — FontLab দিয়ে খুলুন!', 'success');
                                            })
                                            .catch(e => {
                                                tajweedFontStatus = 'error';
                                                showToast('❌ Download error: ' + e.message, 'error');
                                            });
                                    } else {
                                        showToast('❌ Font generator লোড হয়নি', 'error');
                                    }
                                "
                                title="TajweedSymbols.ttf FontLab-এর জন্য ডাউনলোড করুন">
                            ⬇ TTF ডাউনলোড
                        </button>
                    </div><!-- end tf-status-bar -->
                    <p class="tf-hint">
                        Font তৈরি হলে SVG/PDF export-এ symbol গুলো editable &lt;text&gt; element হিসেবে render হবে।<br>
                        <strong>⬇ TTF ডাউনলোড</strong> করে FontLab-এ খুলুন — বাকি ১০টি slot পরে যোগ করুন।
                    </p>

                </div><!-- end tsp-body -->
            </div><!-- end top-sym-panel -->

            <div class="rules-header-bar" style="margin-top:.5rem">
                <p class="rules-desc">তাজওয়িদ সিম্বল চালু/বন্ধ করুন</p>
                <div class="rules-bulk">
                    <button class="btn-sm" @click="rules.forEach(r=>r.enabled=true);debouncedRender()">সব চালু</button>
                    <button class="btn-sm btn-sm--off" @click="rules.forEach(r=>r.enabled=false);debouncedRender()">সব বন্ধ</button>
                </div>
            </div>
            <template x-for="cat in ['madd','tajweed','waqf','special']" :key="cat">
                <div class="rules-cat">
                    <div class="rules-cat-title" x-text="{'madd':'🔵 মাদ্দ','tajweed':'🟢 তাজওয়িদ','waqf':'🔴 ওয়াকফ','special':'⭐ বিশেষ'}[cat]"></div>
                    <template x-for="rule in rules.filter(r=>r.category===cat)" :key="rule.id">
                        <div class="rule-item" :class="{'rule-item--on': rule.enabled}">
                            <label class="toggle toggle--sm">
                                <input type="checkbox" x-model="rule.enabled" @change="debouncedRender()">
                                <span class="toggle-sl"></span>
                            </label>
                            <span class="rule-sym" :style="'color:'+rule.color" x-text="rule.symbol"></span>
                            <span class="rule-name" x-text="rule.name"></span>
                            <input type="color" class="rule-color" :value="rule.color"
                                   @input="rule.color=$event.target.value;debouncedRender()">
                        </div>
                    </template>
                </div>
            </template>
        </div>

        <!-- ══ TAB 3: FONTS ══ -->
        <div class="tab-content" x-show="activeTab==='fonts'">
            <div class="settings-group">
                <div class="settings-group-title">সক্রিয় আরবি ফন্ট</div>
                <div class="font-active-chip">
                    <span class="font-active-icon">🕌</span>
                    <div>
                        <div class="font-active-name">ExcellentArabicWeb2.0.ttf</div>
                        <div class="font-active-size">ডিফল্ট আরবি ফন্ট</div>
                    </div>
                </div>
            </div>
            <div class="settings-group">
                <div class="settings-group-title">⬆ আরবি ফন্ট আপলোড</div>
                <div class="upload-zone" @dragover.prevent @drop.prevent="uploadFont($event)">
                    <div class="upload-zone-icon">🕌</div>
                    <p>.otf · .ttf ফাইল</p>
                    <label class="btn-upload">
                        <input type="file" accept=".otf,.ttf" hidden @change="uploadFont($event)">
                        ফাইল বেছে নিন
                    </label>
                </div>
            </div>
            <div class="settings-group" x-show="uploadedFonts.length > 0">
                <div class="settings-group-title">আপলোড করা ফন্ট</div>
                <template x-for="f in uploadedFonts" :key="f.name">
                    <div class="font-chip"><span>🔤</span><span x-text="f.name"></span></div>
                </template>
            </div>
            <div class="settings-group">
                <div class="settings-group-title">📂 verses.json লোড</div>
                <label class="btn-upload-json">
                    <input type="file" accept=".json" hidden @change="loadVersesFromFile($event)">
                    📂 JSON ফাইল খুলুন
                </label>
            </div>
        </div>

        <!-- ══ TAB 4: EXPORT ══ -->
        <div class="tab-content" x-show="activeTab==='export'">

            <!-- Summary stats -->
            <div class="settings-group">
                <div class="settings-group-title">📊 সারাংশ</div>
                <div class="export-stats">
                    <div class="estat-row"><span>মোট আয়াত</span><strong x-text="allVerses.length"></strong></div>
                    <div class="estat-row"><span>মোট পেজ</span><strong x-text="pages.length"></strong></div>
                    <div class="estat-row"><span>আরবি সারি/পেজ</span><strong x-text="arabicRowCount"></strong></div>
                    <div class="estat-row"><span>বর্তমান পেজ</span><strong x-text="currentPage+1"></strong></div>
                </div>
            </div>

            <!-- ── পেজ রেঞ্জ সিলেক্টর ── -->
            <div class="settings-group">
                <div class="settings-group-title">📑 পেজ পরিসর</div>
                <div class="export-range-row">
                    <label>থেকে</label>
                    <input type="number" class="setting-input setting-input--sm" x-model.number="exportRange.fromPage" min="1" :max="pages.length">
                    <label>পর্যন্ত</label>
                    <input type="number" class="setting-input setting-input--sm" x-model.number="exportRange.toPage" min="1" :max="pages.length">
                </div>
            </div>

            <!-- ── PNG Section ── -->
            <div class="settings-group">
                <div class="settings-group-title">🖼 PNG (প্রিভিউ)</div>
                <div class="setting-row">
                    <label>রেজোলিউশন</label>
                    <select class="setting-input" x-model.number="exportOpts.quality">
                        <option value="1">১× (দ্রুত)</option>
                        <option value="2">২× (ভালো)</option>
                        <option value="3">৩× (প্রিন্ট)</option>
                        <option value="4">৪× (প্রফেশনাল)</option>
                    </select>
                </div>
                <div class="export-btn-grid">
                    <button class="btn-export-sm" @click="exportCurrentPage()" :disabled="pages.length===0">
                        📸 এই পেজ PNG
                    </button>
                    <button class="btn-export-sm" @click="exportPageRange(exportRange.fromPage, exportRange.toPage)" :disabled="isExporting||pages.length===0">
                        ⬇ রেঞ্জ PNG
                    </button>
                    <button class="btn-export-sm" @click="exportAllPages()" :disabled="isExporting||pages.length===0">
                        🖼 সব PNG
                    </button>
                </div>
            </div>


            <!-- ══════════════════════════════════════════
                 ZIP PACKAGE — Illustrator / InDesign Ready
            ═══════════════════════════════════════════ -->
            <div class="settings-group export-section--zip">
                <!-- Section header -->
                <div class="settings-group-title zip-section-title">
                    <span>📦 ZIP Package — Illustrator / InDesign</span>
                    <button class="zip-guide-btn" @click="showFontGuide=true" title="ফন্ট ইনস্টল গাইড দেখুন">
                        ❓ গাইড
                    </button>
                </div>

                <!-- What's in the ZIP -->
                <div class="zip-contents-card">
                    <div class="zip-row">
                        <span class="zip-icon">📄</span>
                        <div class="zip-info">
                            <strong>page-001.svg, page-002.svg …</strong>
                            <span class="zip-sub">প্রতিটি পেজ আলাদা SVG ফাইল</span>
                        </div>
                    </div>
                    <div class="zip-row" :class="tajweedFontStatus==='ready' ? 'zip-row--ok' : 'zip-row--warn'">
                        <span class="zip-icon" x-text="tajweedFontStatus==='ready' ? '✅' : '⚠'"></span>
                        <div class="zip-info">
                            <strong>TajweedSymbols.ttf</strong>
                            <span class="zip-sub" x-text="tajweedFontStatus==='ready' ? 'ZIP-এ অন্তর্ভুক্ত হবে' : 'Font Rebuild করুন (Rules ট্যাব)'"></span>
                        </div>
                    </div>
                    <div class="zip-row">
                        <span class="zip-icon">📋</span>
                        <div class="zip-info">
                            <strong>READ_ME.txt</strong>
                            <span class="zip-sub">বাংলায় ইনস্টল ও ব্যবহার গাইড</span>
                        </div>
                    </div>
                </div>

                <!-- Layer structure info -->
                <div class="zip-layer-info">
                    <div class="zip-layer-title">📐 প্রতিটি SVG-এ ৩টি এডিটেবল টেক্সট লেয়ার:</div>
                    <div class="zip-layer-row"><span class="zl-dot" style="background:#1a5276"></span><strong>Arabic Text</strong><span class="zl-font">ExcellentArabic</span></div>
                    <div class="zip-layer-row"><span class="zl-dot" style="background:#1a7a3a"></span><strong>Bangla Text</strong><span class="zl-font">Hind Siliguri</span></div>
                    <div class="zip-layer-row"><span class="zl-dot" style="background:#7d3c98"></span><strong>Tajweed Symbols</strong><span class="zl-font">TajweedSymbols (PUA)</span></div>
                </div>

                <!-- Export buttons -->
                <div class="zip-btn-group">
                    <button class="btn-zip-sm" id="btn-zip-current"
                            @click="exportZipPackage(currentPage, currentPage)"
                            :disabled="isExporting||pages.length===0">
                        📦 এই পেজ ZIP
                    </button>
                    <button class="btn-zip-sm" id="btn-zip-range"
                            @click="exportZipPackage(exportRange.fromPage-1, exportRange.toPage-1)"
                            :disabled="isExporting||pages.length===0">
                        ⬇ রেঞ্জ ZIP
                        <span class="zip-range-badge" x-text="'পেজ '+exportRange.fromPage+'-'+exportRange.toPage"></span>
                    </button>
                    <button class="btn-zip-full" id="btn-zip-all"
                            @click="exportZipPackage(0, pages.length-1)"
                            :disabled="isExporting||pages.length===0">
                        <span x-show="!isExporting">📦 সব পেজ ZIP ডাউনলোড করুন</span>
                        <span x-show="isExporting">
                            ⏳ ZIP তৈরি হচ্ছে…
                            <span x-text="exportProgress+'%'"></span>
                        </span>
                    </button>
                </div>

                <!-- Progress bar -->
                <div class="export-progress" x-show="isExporting">
                    <div class="export-progress-fill" :style="'width:'+exportProgress+'%'"></div>
                </div>
            </div>

            <!-- ── SVG Section (single page / quick) ── -->
            <div class="settings-group export-section--svg">
                <div class="settings-group-title">📐 SVG — এককভাবে</div>
                <p class="export-hint">একটি বা একাধিক পেজ SVG (ZIP ছাড়া)। Illustrator-এ সরাসরি edit করা যাবে।</p>
                <div class="export-btn-grid">
                    <button class="btn-export-sm btn-export-sm--svg" @click="exportCurrentPageSVG()" :disabled="isExporting||pages.length===0">
                        📐 এই পেজ SVG
                    </button>
                    <button class="btn-export-sm btn-export-sm--svg" @click="exportSVGRange(exportRange.fromPage, exportRange.toPage)" :disabled="isExporting||pages.length===0">
                        ⬇ রেঞ্জ SVG
                    </button>
                    <button class="btn-export-sm btn-export-sm--svg" @click="exportAllPagesSVG()" :disabled="isExporting||pages.length===0">
                        📐 সব পেজ SVG
                    </button>
                </div>
            </div>

            <!-- ── Layered PDF Section ── -->
            <div class="settings-group export-section--pdf">
                <div class="settings-group-title">🗂 Layered PDF — Illustrator</div>
                <p class="export-hint">প্রতিটি পেজে আলাদা layer। Illustrator-এ open করলে Arabic/Bangla text editable থাকবে।</p>
                <div class="setting-row setting-row--toggle"><label>Crop Marks</label><label class="toggle"><input type="checkbox" x-model="exportOpts.cropMarks"><span class="toggle-sl"></span></label></div>
                <div class="setting-row setting-row--toggle"><label>Bleed Area</label><label class="toggle"><input type="checkbox" x-model="exportOpts.bleed"><span class="toggle-sl"></span></label></div>
                <div class="export-btn-grid">
                    <button class="btn-export-sm btn-export-sm--pdf" @click="exportLayeredPDFCurrent()" :disabled="isExporting||pages.length===0">
                        🗂 এই পেজ PDF
                    </button>
                    <button class="btn-export-sm btn-export-sm--pdf" @click="exportLayeredPDFRange(exportRange.fromPage, exportRange.toPage)" :disabled="isExporting||pages.length===0">
                        ⬇ রেঞ্জ PDF
                    </button>
                    <button class="btn-export-full btn-export-full--pdf" @click="exportLayeredPDFAll()" :disabled="isExporting||pages.length===0">
                        <span x-show="!isExporting">📥 সম্পূর্ণ Layered PDF</span>
                        <span x-show="isExporting">⏳ তৈরি হচ্ছে <span x-text="exportProgress+'%'"></span></span>
                    </button>
                </div>
                <div class="export-progress" x-show="isExporting">
                    <div class="export-progress-fill" :style="'width:'+exportProgress+'%'"></div>
                </div>
            </div>

            <!-- Legacy server PDF -->
            <div class="export-section">
                <div class="settings-group-title" style="font-size:10px;color:#888;margin-bottom:4px">⚙ Legacy Server PDF</div>
                <button class="btn-export-sm" @click="exportPDF()" :disabled="isExporting||pages.length===0">
                    📥 Server PDF (পুরনো)
                </button>
                <p class="export-note" x-text="pages.length + ' পেজ · আরবি সারি: ' + arabicRowCount + '/পেজ'"></p>
            </div>
        </div>
    </aside>

    <!-- ══ Template Builder Modal ══ -->
    <div class="bldr-overlay" x-show="showBuilder" x-cloak @click.self="closeBuilder()">
    <div class="bldr-modal">

        <!-- Builder Header -->
        <div class="bldr-header">
            <div class="bldr-header-left">
                <span class="bldr-icon" x-text="editingPageIdx !== null ? '📌' : (builderEditingTplId ? '✏' : '🔧')"></span>
                <div>
                    <div class="bldr-title"
                         x-text="editingPageIdx !== null
                            ? 'পেজ ' + (editingPageIdx+1) + ' এর কাস্টম লেআউট'
                            : (builderDraft?.name || 'মাস্টার টেমপ্লেট') + ' — লেআউট ডিজাইনার'"></div>
                    <div class="bldr-subtitle" x-text="'পেজ সাইজ: ' + (builderDraft?.pageSize?.w||0) + '×' + (builderDraft?.pageSize?.h||0) + 'px | মার্জিন: ' + (builderDraft?.margins?.top||0) + '/' + (builderDraft?.margins?.right||0) + '/' + (builderDraft?.margins?.bottom||0) + '/' + (builderDraft?.margins?.left||0)"></div>
                </div>
            </div>
            <div class="bldr-header-right">
                <div class="bldr-est-badge" x-show="editingPageIdx === null">
                    <span>আনুমানিক পেজ</span>
                    <strong x-text="builderEstimatedPages"></strong>
                </div>
                <div class="bldr-est-badge" x-show="editingPageIdx !== null" style="background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.4)">
                    <span style="color:#f87171">এই পেজ</span>
                    <strong style="color:#fca5a5" x-text="editingPageIdx !== null ? (editingPageIdx+1) + ' / ' + pages.length : ''">—</strong>
                </div>
                <!-- Preview page selector -->
                <div class="bldr-preview-page-sel" x-show="pages.length > 0">
                    <label style="font-size:.6rem;color:var(--t3)">প্রিভিউ পেজ:</label>
                    <input type="number" class="page-input" style="width:40px;font-size:.7rem;padding:.15rem .3rem"
                           min="1" :max="pages.length"
                           :value="builderPreviewPageIdx + 1"
                           @change="builderPreviewPageIdx = Math.max(0, Math.min(pages.length-1, parseInt($event.target.value)-1)); renderBuilderFabric()">
                    <span style="font-size:.6rem;color:var(--t3)" x-text="'/ ' + pages.length"></span>
                </div>
                <button class="bldr-apply-btn" @click="applyBuilder()"
                        x-text="editingPageIdx !== null ? '✅ পেজ এ সেভ করুন' : '✅ Apply করুন'"></button>
                <button class="bldr-close-btn" @click="closeBuilder()" title="বন্ধ (Esc)">✕</button>
            </div>
        </div>

        <!-- Builder Body: 3 columns -->
        <div class="bldr-body" x-show="builderDraft">

            <!-- ── Column 1: Row List + Design Tab ── -->
            <div class="bldr-col bldr-col-rows">
                <!-- Sub-tabs -->
                <div class="bldr-subtabs">
                    <button class="bldr-subtab" :class="builderActiveTab==='layout'?'bldr-subtab--active':''"
                            @click="builderActiveTab='layout'">
                        <svg class="icon" viewBox="0 0 16 16"><path d="M2 2h12v12H2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 6h12M2 10h12" stroke="currentColor" stroke-width=".8"/></svg>
                        সারি
                    </button>
                    <button class="bldr-subtab" :class="builderActiveTab==='design'?'bldr-subtab--active':''"
                            @click="builderActiveTab='design'">
                        <svg class="icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 2a6 6 0 010 12" fill="currentColor" opacity=".2"/></svg>
                        ডিজাইন
                    </button>
                    <button class="bldr-subtab" :class="builderActiveTab==='assets'?'bldr-subtab--active':''"
                            @click="builderActiveTab='assets'">
                        <svg class="icon" viewBox="0 0 16 16"><rect x="1" y="3" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="7" r="1.5" fill="currentColor" opacity=".5"/><path d="M1 11l4-3 3 2 3-4 4 5" stroke="currentColor" stroke-width="1" fill="none"/></svg>
                        Assets
                        <span x-show="(builderDraft?.assets||[]).length > 0" class="bldr-subtab-badge"
                              x-text="(builderDraft?.assets||[]).length"></span>
                    </button>
                </div>

                <!-- ── ASSETS TAB ── -->
                <div x-show="builderActiveTab==='assets'" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
                    <div class="bldr-col-title" style="border-top:1px solid var(--border)">
                        🖼 ডিজাইন Assets (SVG / PNG)
                    </div>
                    <!-- Upload zone -->
                    <div class="asset-upload-zone"
                         @dragover.prevent="$el.classList.add('asset-upload-zone--drag')"
                         @dragleave.prevent="$el.classList.remove('asset-upload-zone--drag')"
                         @drop.prevent="$el.classList.remove('asset-upload-zone--drag'); uploadTemplateAsset($event)">
                        <svg viewBox="0 0 48 36" width="36" height="27" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4">
                            <rect x="1" y="1" width="46" height="34" rx="4"/>
                            <circle cx="15" cy="14" r="4"/>
                            <path d="M1 26l12-10 7 8 8-12 19 15"/>
                        </svg>
                        <p>SVG বা PNG টানুন এখানে</p>
                        <label class="btn-asset-upload">
                            <input type="file" accept=".svg,.png,.jpg,.webp,image/*" multiple hidden @change="uploadTemplateAsset($event)">
                            ফাইল বেছে নিন
                        </label>
                    </div>

                    <!-- Asset list -->
                    <div style="flex:1;overflow-y:auto;padding:.35rem">
                        <template x-if="!(builderDraft?.assets?.length)">
                            <p style="font-size:.7rem;color:var(--t3);text-align:center;padding:.8rem;font-family:var(--font-bn)">কোনো asset নেই</p>
                        </template>
                        <template x-for="asset in (builderDraft?.assets||[])" :key="asset.id">
                            <div class="asset-item">
                                <div class="asset-thumb">
                                    <img :src="asset.data" style="max-width:32px;max-height:32px;object-fit:contain" :alt="asset.name">
                                </div>
                                <div class="asset-info">
                                    <div class="asset-name" x-text="asset.name"></div>
                                    <div style="display:flex;gap:.3rem;align-items:center;margin-top:.2rem">
                                        <label style="font-size:.6rem;color:var(--t3)">Layer:</label>
                                        <select class="asset-layer-sel" x-model="asset.zIndex" @change="builderPreviewUpdate()">
                                            <option value="back">পিছনে (Back)</option>
                                            <option value="front">সামনে (Front)</option>
                                        </select>
                                        <label style="font-size:.6rem;color:var(--t3)">Opacity:</label>
                                        <input type="range" min="0" max="1" step="0.05" x-model.number="asset.opacity"
                                               @input="builderPreviewUpdate()" style="width:50px">
                                    </div>
                                </div>
                                <button class="asset-del-btn" @click="removeTemplateAsset(asset.id)" title="সরান">✕</button>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- ── LAYOUT TAB ── -->
                <div x-show="builderActiveTab==='layout'" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
                    <div class="bldr-col-title" style="border-top:1px solid var(--border)">
                        📋 সারি তালিকা
                        <span class="bldr-pct-badge"
                              :class="Math.abs(builderTotalPct-100)<1 ? 'bldr-pct-ok' : 'bldr-pct-warn'"
                              x-text="builderTotalPct.toFixed(1) + '%'"></span>
                    </div>
                    <div class="bldr-row-list">
                        <template x-for="(row, ri) in builderDraft.rows" :key="row.id">
                            <div class="bldr-row-card"
                                 :class="{'bldr-row-card--selected': selectedRowId === row.id, 'bldr-row-card--hidden': !row.visible}"
                                 @click="selectedRowId = row.id; builderPreviewUpdate()">
                                <div class="bldr-row-card-side">
                                    <button class="bldr-move-btn" @click.stop="builderMoveRow(row.id,-1);builderPreviewUpdate()" :disabled="ri===0">↑</button>
                                    <button class="bldr-move-btn" @click.stop="builderMoveRow(row.id,+1);builderPreviewUpdate()" :disabled="ri===builderDraft.rows.length-1">↓</button>
                                </div>
                                <div class="bldr-row-type-badge"
                                     :style="'background:' + rowTypeColor(row.type)"
                                     x-text="rowTypeIcon(row.type)"></div>
                                <div class="bldr-row-info">
                                    <input class="bldr-row-label-input" type="text" x-model="row.label" @click.stop @input="builderPreviewUpdate()">
                                    <span class="bldr-row-type-tag" x-text="row.type"></span>
                                </div>
                                <div class="bldr-row-height">
                                    <button class="bldr-h-btn" @click.stop="row.heightPct=Math.max(1,row.heightPct-0.5);builderPreviewUpdate()">−</button>
                                    <input type="number" class="bldr-h-input" step="0.5" min="1" max="100"
                                           x-model.number="row.heightPct" @click.stop @input="builderPreviewUpdate()">
                                    <span class="bldr-h-unit">%</span>
                                    <button class="bldr-h-btn" @click.stop="row.heightPct=Math.min(100,row.heightPct+0.5);builderPreviewUpdate()">+</button>
                                </div>
                                <label class="bldr-vis-toggle" @click.stop>
                                    <input type="checkbox" x-model="row.visible" @change="builderPreviewUpdate()">
                                    <span class="bldr-vis-icon" x-text="row.visible ? '👁' : '🚫'"></span>
                                </label>
                                <div class="bldr-row-actions">
                                    <button class="bldr-action-btn" @click.stop="builderDuplicateRow(row.id);builderPreviewUpdate()" title="ডুপ্লিকেট">⧉</button>
                                    <button class="bldr-action-btn bldr-action-del" @click.stop="builderRemoveRow(row.id);builderPreviewUpdate()" title="মুছুন" :disabled="builderDraft.rows.length<=1">✕</button>
                                </div>
                            </div>
                        </template>
                    </div>
                    <!-- Add Row -->
                    <div class="bldr-add-row-bar">
                        <div class="bldr-add-row-label">+ সারি যোগ করুন:</div>
                        <div class="bldr-add-row-btns">
                            <template x-for="(rType, rKey) in rowTypes" :key="rKey">
                                <button class="bldr-add-type-btn"
                                        :style="'border-color:' + rType.color + ';color:' + rType.color"
                                        @click="builderAddRow(rKey);builderPreviewUpdate()"
                                        :title="rType.label">
                                    <span x-text="rType.icon"></span>
                                    <span x-text="rKey"></span>
                                </button>
                            </template>
                        </div>
                    </div>
                </div><!-- /layout tab -->

                <!-- ── DESIGN ELEMENTS TAB ── -->
                <div x-show="builderActiveTab==='design'" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
                    <div class="bldr-col-title" style="border-top:1px solid var(--border)">
                        🎨 ডিজাইন এলিমেন্ট
                        <span class="bldr-pct-badge bldr-pct-ok" x-text="(builderDraft?.designElements?.length || 0) + 'টি'"></span>
                    </div>

                    <!-- Add element buttons -->
                    <div class="bldr-design-toolbar">
                        <div class="bldr-design-toolbar-title">শেপ যোগ করুন:</div>
                        <div class="bldr-design-btns">
                            <button class="bldr-design-add-btn" @click="builderAddDesignEl('rect')" title="আয়তক্ষেত্র">□ আয়ত</button>
                            <button class="bldr-design-add-btn" @click="builderAddDesignEl('circle')" title="বৃত্ত">◯ বৃত্ত</button>
                            <button class="bldr-design-add-btn" @click="builderAddDesignEl('hline')" title="সরল রেখা">─ রেখা</button>
                            <button class="bldr-design-add-btn" @click="builderAddDesignEl('line')" title="তির্ছা রেখা">╱ তির্ছা</button>
                            <button class="bldr-design-add-btn" @click="builderAddDesignEl('text')" title="টেক্সট">🔤 টেক্সট</button>
                        </div>
                        <div class="bldr-design-btns" style="margin-top:.3rem">
                            <label class="bldr-design-upload-btn" title="SVG ইম্পোর্ট">
                                <input type="file" accept=".svg" hidden @change="builderUploadSvgEl($event)">
                                🎨 SVG ইম্পোর্ট
                            </label>
                            <label class="bldr-design-upload-btn" title="ছবি ইম্পোর্ট">
                                <input type="file" accept="image/*" hidden @change="builderUploadImgEl($event)">
                                🖼 ছবি
                            </label>
                        </div>
                    </div>

                    <!-- Design element list -->
                    <div class="bldr-design-el-list">
                        <template x-if="!builderDraft?.designElements?.length">
                            <div class="bldr-no-sel" style="padding:1rem">
                                উপরে বাটন থেকে শেপ যোগ করুন<br>
                                <span style="font-size:.6rem;opacity:.6">প্রতিটি পেজে ডিজাইন সার্ভার হবে</span>
                            </div>
                        </template>
                        <template x-for="el in (builderDraft?.designElements || [])" :key="el.id">
                            <div class="bldr-design-el-card"
                                 :class="selectedElId === el.id ? 'bldr-design-el-card--sel' : ''"
                                 @click="selectedElId = el.id; builderPreviewUpdate()">
                                <span class="bldr-design-el-icon">
                                    <span x-text="{rect:'□', circle:'◯', hline:'─', line:'╱', text:'🔤', svg:'🎨'}[el.type] || '□'"></span>
                                </span>
                                <div class="bldr-design-el-info">
                                    <span class="bldr-design-el-type" x-text="el.type.toUpperCase()"></span>
                                    <span class="bldr-design-el-pos" x-text="'x:' + Math.round(el.x) + ' y:' + Math.round(el.y) + ' ' + Math.round(el.w) + '×' + Math.round(el.h)"></span>
                                </div>
                                <input type="color" style="width:20px;height:20px;border:none;background:none;cursor:pointer;padding:0"
                                       :value="el.style?.stroke || el.style?.color || '#c8a96e'"
                                       @input="el.style.stroke=$event.target.value;el.style.color=$event.target.value;builderPreviewUpdate()">
                                <button class="bldr-action-btn bldr-action-del" @click.stop="builderRemoveDesignEl(el.id)" title="মুছুন">✕</button>
                            </div>
                        </template>
                    </div>
                </div><!-- /design tab -->

            </div><!-- /bldr-col-rows -->

            <!-- ── Column 2: Row Settings ── -->
            <div class="bldr-col bldr-col-settings">
                <div class="bldr-col-title">⚙ সারির সেটিংস</div>

                <template x-if="!selectedRow">
                    <div class="bldr-no-sel">বাম থেকে একটি সারি সিলেক্ট করুন</div>
                </template>

                <template x-if="selectedRow">
                    <div class="bldr-settings-panel">
                        <!-- Row type indicator -->
                        <div class="bldr-sel-type-header"
                             :style="'background:' + rowTypeColor(selectedRow.type) + '22; border-color:' + rowTypeColor(selectedRow.type)">
                            <span class="bldr-sel-type-icon" x-text="rowTypeIcon(selectedRow.type)"></span>
                            <div>
                                <div class="bldr-sel-type-name" x-text="rowTypeLabel(selectedRow.type)"></div>
                                <div class="bldr-sel-type-id"  x-text="selectedRow.id"></div>
                            </div>
                        </div>

                        <!-- Height -->
                        <div class="bldr-sg">
                            <div class="bldr-sg-title">📏 উচ্চতা (%)</div>
                            <div class="input-spinner">
                                <button @click="selectedRow.heightPct=Math.max(1,selectedRow.heightPct-0.5)">−</button>
                                <input type="number" class="setting-input" step="0.5" x-model.number="selectedRow.heightPct">
                                <button @click="selectedRow.heightPct=Math.min(100,selectedRow.heightPct+0.5)">+</button>
                                <span class="unit">%</span>
                            </div>
                            <div class="bldr-hint" x-text="'= ' + ((selectedRow.heightPct/100)*(builderDraft.pageSize.h-builderDraft.margins.top-builderDraft.margins.bottom)).toFixed(1) + 'px'"></div>
                        </div>

                        <!-- ── ARABIC ROW CONFIG ── -->
                        <template x-if="selectedRow.type === 'arabic'">
                            <div>
                                <div class="bldr-sg">
                                    <div class="bldr-sg-title">ع আরবি টেক্সট</div>
                                    <div class="setting-row setting-row--toggle">
                                        <label>অটো ফন্ট সাইজ</label>
                                        <label class="toggle"><input type="checkbox" x-model="selectedRow.config.autoFit"><span class="toggle-sl"></span></label>
                                    </div>
                                    <template x-if="!selectedRow.config.autoFit">
                                        <div class="setting-row">
                                            <label>ফন্ট সাইজ (px)</label>
                                            <input type="number" class="setting-input" x-model.number="selectedRow.config.fontSize">
                                        </div>
                                    </template>
                                    <div class="setting-row">
                                        <label>রং</label>
                                        <input type="color" class="setting-color" x-model="selectedRow.config.color">
                                        <input type="text" class="setting-input setting-input--hex" x-model="selectedRow.config.color">
                                    </div>
                                    <div class="setting-row">
                                        <label>অ্যালাইন</label>
                                        <div class="align-btn-group">
                                            <button class="align-btn" :class="(selectedRow.config.align||'right')==='left'?'align-btn--active':''"
                                                    @click="selectedRow.config.align='left'; builderPreviewUpdate()" title="বাম">
                                                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 3h12M2 7h8M2 11h10M2 15h6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                            </button>
                                            <button class="align-btn" :class="(selectedRow.config.align||'right')==='center'?'align-btn--active':''"
                                                    @click="selectedRow.config.align='center'; builderPreviewUpdate()" title="মাঝ">
                                                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 3h12M4 7h8M3 11h10M5 15h6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                            </button>
                                            <button class="align-btn" :class="(selectedRow.config.align||'right')==='right'?'align-btn--active':''"
                                                    @click="selectedRow.config.align='right'; builderPreviewUpdate()" title="ডান">
                                                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 3h12M6 7h8M4 11h10M8 15h6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="bldr-sg">
                                    <div class="bldr-sg-title">ব বাংলা অর্থ (এই সারির নিচে)</div>
                                    <div class="setting-row setting-row--toggle">
                                        <label>বাংলা দেখাবে</label>
                                        <label class="toggle"><input type="checkbox" x-model="selectedRow.config.showBangla"><span class="toggle-sl"></span></label>
                                    </div>
                                    <template x-if="selectedRow.config.showBangla">
                                        <div>
                                            <div class="setting-row setting-row--toggle">
                                                <label>অটো সাইজ</label>
                                                <label class="toggle"><input type="checkbox" x-model="selectedRow.config.banglaAutoFit"><span class="toggle-sl"></span></label>
                                            </div>
                                            <template x-if="!selectedRow.config.banglaAutoFit">
                                                <div class="setting-row">
                                                    <label>সাইজ (px)</label>
                                                    <input type="number" class="setting-input" x-model.number="selectedRow.config.banglaFontSize">
                                                </div>
                                            </template>
                                            <div class="setting-row">
                                                <label>রং</label>
                                                <input type="color" class="setting-color" x-model="selectedRow.config.banglaColor">
                                            </div>
                                            <div class="setting-row">
                                                <label>বাংলা অ্যালাইন</label>
                                                <div class="align-btn-group">
                                                    <button class="align-btn" :class="(selectedRow.config.banglaAlign||'right')==='left'?'align-btn--active':''"
                                                            @click="selectedRow.config.banglaAlign='left'; builderPreviewUpdate()" title="বাম">
                                                        <svg viewBox="0 0 16 16" width="12" height="12"><path d="M2 3h12M2 7h8M2 11h10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                                    </button>
                                                    <button class="align-btn" :class="(selectedRow.config.banglaAlign||'right')==='center'?'align-btn--active':''"
                                                            @click="selectedRow.config.banglaAlign='center'; builderPreviewUpdate()" title="মাঝ">
                                                        <svg viewBox="0 0 16 16" width="12" height="12"><path d="M2 3h12M4 7h8M3 11h10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                                    </button>
                                                    <button class="align-btn" :class="(selectedRow.config.banglaAlign||'right')==='right'?'align-btn--active':''"
                                                            @click="selectedRow.config.banglaAlign='right'; builderPreviewUpdate()" title="ডান">
                                                        <svg viewBox="0 0 16 16" width="12" height="12"><path d="M2 3h12M6 7h8M4 11h10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </template>

                        <!-- ── HEADER ROW CONFIG ── -->
                        <template x-if="selectedRow.type === 'header'">
                            <div class="bldr-sg">
                                <div class="bldr-sg-title">🏛 হেডার কনফিগ</div>
                                <div class="setting-row setting-row--toggle">
                                    <label>অটো সূরা নাম</label>
                                    <label class="toggle"><input type="checkbox" x-model="selectedRow.config.autoSurah"><span class="toggle-sl"></span></label>
                                </div>
                                <template x-if="!selectedRow.config.autoSurah">
                                    <div class="setting-row">
                                        <label>কাস্টম টেক্সট</label>
                                        <input type="text" class="setting-input" x-model="selectedRow.config.text" placeholder="বিসমিল্লাহ…">
                                    </div>
                                </template>
                                <div class="setting-row">
                                    <label>ফন্ট সাইজ</label>
                                    <input type="number" class="setting-input" x-model.number="selectedRow.config.fontSize">
                                </div>
                                <div class="setting-row">
                                    <label>রং</label>
                                    <input type="color" class="setting-color" x-model="selectedRow.config.color">
                                    <input type="text" class="setting-input setting-input--hex" x-model="selectedRow.config.color">
                                </div>
                                <div class="setting-row setting-row--toggle">
                                    <label>বোল্ড</label>
                                    <label class="toggle"><input type="checkbox" x-model="selectedRow.config.bold"><span class="toggle-sl"></span></label>
                                </div>
                                <div class="setting-row">
                                    <label>অ্যালাইন</label>
                                    <select class="setting-select" x-model="selectedRow.config.align">
                                        <option value="left">বাম</option>
                                        <option value="center">মাঝ</option>
                                        <option value="right">ডান</option>
                                    </select>
                                </div>
                            </div>
                        </template>

                        <!-- ── FOOTER ROW CONFIG ── -->
                        <template x-if="selectedRow.type === 'footer'">
                            <div>
                                <div class="bldr-sg">
                                    <div class="bldr-sg-title">▬ পেজ নম্বর</div>
                                    <div class="setting-row setting-row--toggle">
                                        <label>পেজ নম্বর দেখাবে</label>
                                        <label class="toggle"><input type="checkbox" x-model="selectedRow.config.showPageNum"><span class="toggle-sl"></span></label>
                                    </div>
                                    <template x-if="selectedRow.config.showPageNum">
                                        <div>
                                            <div class="setting-row">
                                                <label>সাইজ</label>
                                                <input type="number" class="setting-input" x-model.number="selectedRow.config.pageNumFontSize">
                                            </div>
                                            <div class="setting-row">
                                                <label>রং</label>
                                                <input type="color" class="setting-color" x-model="selectedRow.config.pageNumColor">
                                            </div>
                                        </div>
                                    </template>
                                </div>
                                <div class="bldr-sg">
                                    <div class="bldr-sg-title">✏ কাস্টম ফুটার টেক্সট</div>
                                    <div class="setting-row">
                                        <label>টেক্সট</label>
                                        <input type="text" class="setting-input" x-model="selectedRow.config.customText" placeholder="কাস্টম টেক্সট…">
                                    </div>
                                    <template x-if="selectedRow.config.customText">
                                        <div>
                                            <div class="setting-row">
                                                <label>সাইজ</label>
                                                <input type="number" class="setting-input" x-model.number="selectedRow.config.customFontSize">
                                            </div>
                                            <div class="setting-row">
                                                <label>রং</label>
                                                <input type="color" class="setting-color" x-model="selectedRow.config.customColor">
                                            </div>
                                            <div class="setting-row">
                                                <label>অ্যালাইন</label>
                                                <select class="setting-select" x-model="selectedRow.config.customAlign">
                                                    <option value="left">বাম</option>
                                                    <option value="center">মাঝ</option>
                                                    <option value="right">ডান</option>
                                                </select>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </template>

                        <!-- ── SYMBOL ROW CONFIG ── -->
                        <template x-if="selectedRow.type === 'symbol'">
                            <div class="bldr-sg">
                                <div class="bldr-sg-title">◉ সিম্বল কনফিগ</div>
                                <div class="setting-row">
                                    <label>টেক্সট/সিম্বল</label>
                                    <input type="text" class="setting-input" x-model="selectedRow.config.text" placeholder="بِسْمِ ٱللَّهِ…">
                                </div>
                                <div class="setting-row">
                                    <label>ফন্ট সাইজ</label>
                                    <input type="number" class="setting-input" x-model.number="selectedRow.config.fontSize">
                                </div>
                                <div class="setting-row">
                                    <label>রং</label>
                                    <input type="color" class="setting-color" x-model="selectedRow.config.color">
                                </div>
                            </div>
                        </template>

                        <!-- ── BORDER ROW CONFIG ── -->
                        <template x-if="selectedRow.type === 'border'">
                            <div class="bldr-sg">
                                <div class="bldr-sg-title">⬛ বর্ডার কনফিগ</div>
                                <div class="setting-row">
                                    <label>বর্ডার রং</label>
                                    <input type="color" class="setting-color" x-model="selectedRow.config.stroke">
                                </div>
                                <div class="setting-row">
                                    <label>ফিল রং</label>
                                    <input type="color" class="setting-color" x-model="selectedRow.config.fill">
                                </div>
                                <div class="setting-row">
                                    <label>বেধ (px)</label>
                                    <input type="number" class="setting-input" step="0.5" x-model.number="selectedRow.config.strokeWidth">
                                </div>
                                <div class="setting-row">
                                    <label>গোলাই (rx)</label>
                                    <input type="number" class="setting-input" x-model.number="selectedRow.config.rx">
                                </div>
                            </div>
                        </template>

                        <!-- ── GAP ROW ── -->
                        <template x-if="selectedRow.type === 'gap'">
                            <div class="bldr-sg">
                                <div class="bldr-no-sel" style="font-size:12px;padding:.5rem">ফাঁকা স্থান — উচ্চতা পরিবর্তন করুন উপরে</div>
                            </div>
                        </template>
                    </div>
                </template>
            </div>

            <!-- ── Column 3: Full-Page Live Preview ── -->
            <div class="bldr-col bldr-col-preview">
                <div class="bldr-col-title">
                    👁 লাইভ প্রিভিউ  &nbsp;
                    <span class="bldr-arc-count" x-text="'আরবি: ' + builderArabicCount + ' সারি | অনুমানিত পেজ: ' + builderEstimatedPages"></span>
                </div>

                <!-- Full-page Fabric.js interactive canvas -->
                <div class="bldr-preview-wrap" id="bldr-preview-wrap">
                    <canvas id="bldr-fabric-canvas"></canvas>
                </div>

                <!-- Bottom stats + settings strip -->
                <div class="bldr-preview-footer">
                    <!-- Quick stats -->
                    <div class="bldr-stats-mini">
                        <span :class="Math.abs(builderTotalPct-100)<1?'stat-ok':'stat-warn'"
                              x-text="'∑ ' + builderTotalPct.toFixed(1) + '%'"></span>
                        <span x-text="'সারি: ' + (builderDraft?.rows?.length||0)"></span>
                        <span x-text="'এলিমেন্ট: ' + (builderDraft?.designElements?.length||0)"></span>
                    </div>
                    <!-- Margin inputs -->
                    <div class="bldr-margin-strip">
                        <span class="bldr-margin-label">মার্জিন:</span>
                        <template x-for="side in ['top','right','bottom','left']" :key="side">
                            <div class="bldr-margin-input-wrap">
                                <label x-text="{'top':'↑','right':'→','bottom':'↓','left':'←'}[side]"></label>
                                <input type="number" class="bldr-margin-input"
                                       :value="builderDraft?.margins?.[side]"
                                       @change="builderDraft.margins[side]=parseInt($event.target.value)||0; builderPreviewUpdate()">
                            </div>
                        </template>
                    </div>
                    <!-- Global colors -->
                    <div class="bldr-color-strip">
                        <span class="bldr-margin-label">রং:</span>
                        <div class="bldr-color-pick">
                            <label>সূরা</label>
                            <input type="color" class="setting-color"
                                   x-model="builderDraft.surahColor"
                                   @change="builderPreviewUpdate()">
                        </div>
                        <div class="bldr-color-pick">
                            <label>আরবি</label>
                            <input type="color" class="setting-color"
                                   :value="builderDraft.arabicFont?.color"
                                   @change="builderDraft.arabicFont.color=$event.target.value; builderPreviewUpdate()">
                        </div>
                        <label class="toggle toggle--sm" title="Slot গাইড">
                            <input type="checkbox" x-model="builderDraft.showSlotGuides"
                                   @change="builderPreviewUpdate()">
                            <span class="toggle-sl"></span>
                        </label>
                        <span style="font-size:.6rem;color:var(--t3)">গাইড</span>
                    </div>
                </div>
            </div>

        </div><!-- /bldr-body -->

        <!-- Builder Footer -->
        <div class="bldr-footer">
            <span class="bldr-footer-info">
                📄 <span x-text="builderDraft?.pageSize?.w + '×' + builderDraft?.pageSize?.h + 'px'"></span>
                | মার্জিন: <span x-text="builderDraft?.margins?.top + '/' + builderDraft?.margins?.right + '/' + builderDraft?.margins?.bottom + '/' + builderDraft?.margins?.left"></span>
                | আরবি সারি: <span x-text="builderArabicCount"></span>
            </span>
            <div class="bldr-footer-actions">
                <button class="bldr-cancel-btn" @click="closeBuilder()">বাতিল</button>
                <button class="bldr-apply-btn" @click="applyBuilder()">✅ টেমপ্লেট Apply করুন</button>
            </div>
        </div>

    </div><!-- /bldr-modal -->
</div><!-- /bldr-overlay -->

<!-- ══ কিবোর্ড শর্টকাট প্যানেল ══ -->
<div class="kb-overlay" x-show="showShortcuts" x-cloak @click.self="showShortcuts=false">
    <div class="kb-panel">
        <div class="kb-header">
            <div class="kb-title">⌨ কিবোর্ড শর্টকাট</div>
            <button class="kb-close" @click="showShortcuts=false" title="বন্ধ করুন (Esc)">✕</button>
        </div>
        <div class="kb-grid">
            <div class="kb-section-title">🔍 জুম কন্ট্রোল</div>
            <div class="kb-row"><span class="kb-desc">জুম ইন</span><span class="kb-keys"><kbd class="kb-key">+</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">জুম আউট</span><span class="kb-keys"><kbd class="kb-key">−</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">জুম রিসেট</span><span class="kb-keys"><kbd class="kb-key">0</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">পেজ ফিট</span><span class="kb-keys"><kbd class="kb-key">F</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">Ctrl+Scroll জুম</span><span class="kb-keys"><kbd class="kb-key">Ctrl</kbd> + <kbd class="kb-key">🖱</kbd></span></div>
            <div class="kb-section-title">📄 পেজ নেভিগেশন</div>
            <div class="kb-row"><span class="kb-desc">পরের পেজ</span><span class="kb-keys"><kbd class="kb-key">→</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">আগের পেজ</span><span class="kb-keys"><kbd class="kb-key">←</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">প্রথম পেজ</span><span class="kb-keys"><kbd class="kb-key">Home</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">শেষ পেজ</span><span class="kb-keys"><kbd class="kb-key">End</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">১০ পেজ পিছনে</span><span class="kb-keys"><kbd class="kb-key">PgUp</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">১০ পেজ সামনে</span><span class="kb-keys"><kbd class="kb-key">PgDn</kbd></span></div>
            <div class="kb-section-title">📋 ট্যাব সুইচ</div>
            <div class="kb-row"><span class="kb-desc">টেমপ্লেট</span><span class="kb-keys"><kbd class="kb-key">1</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">রুলস</span><span class="kb-keys"><kbd class="kb-key">2</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">ফন্ট</span><span class="kb-keys"><kbd class="kb-key">3</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">Export</span><span class="kb-keys"><kbd class="kb-key">4</kbd></span></div>
            <div class="kb-section-title">⚡ দ্রুত অ্যাকশন</div>
            <div class="kb-row"><span class="kb-desc">Template Builder</span><span class="kb-keys"><kbd class="kb-key">B</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">PNG এক্সপোর্ট</span><span class="kb-keys"><kbd class="kb-key">P</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">শর্টকাট প্যানেল</span><span class="kb-keys"><kbd class="kb-key">?</kbd></span></div>
            <div class="kb-row"><span class="kb-desc">বন্ধ করুন</span><span class="kb-keys"><kbd class="kb-key">Esc</kbd></span></div>
        </div>
    </div>
</div>
    <!-- ══ Font Install Guide Modal ══ -->
    <div class="font-guide-overlay" x-show="showFontGuide" x-cloak
         @click.self="showFontGuide=false"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100">
        <div class="font-guide-modal">
            <div class="font-guide-header">
                <span class="font-guide-icon">📦</span>
                <div>
                    <div class="font-guide-title">ZIP Package — ব্যবহার ও ইনস্টল গাইড</div>
                    <div class="font-guide-sub">Illustrator ও InDesign-এ কীভাবে ব্যবহার করবেন</div>
                </div>
                <button class="font-guide-close" @click="showFontGuide=false">✕</button>
            </div>

            <div class="font-guide-body">

                <!-- What's inside -->
                <div class="fg-section">
                    <div class="fg-section-title">📦 ZIP-এ কী থাকবে?</div>
                    <div class="fg-item"><span class="fg-bullet">📄</span><div><strong>page-001.svg, page-002.svg …</strong><br><span class="fg-hint">প্রতিটি পেজ আলাদা SVG, ৫টি editable layer সহ</span></div></div>
                    <div class="fg-item" :class="tajweedFontStatus==='ready'?'fg-item--ok':'fg-item--warn'">
                        <span class="fg-bullet" x-text="tajweedFontStatus==='ready'?'✅':'⚠'"></span>
                        <div><strong>TajweedSymbols.ttf</strong><br>
                        <span class="fg-hint" x-text="tajweedFontStatus==='ready'?'ZIP-এ অন্তর্ভুক্ত — ইনস্টল করুন':'Font Rebuild করুন (Rules ট্যাব → টপ সিম্বল → Font Rebuild)'"></span></div>
                    </div>
                    <div class="fg-item"><span class="fg-bullet">📋</span><div><strong>READ_ME.txt</strong><br><span class="fg-hint">বাংলায় সম্পূর্ণ ইনস্টল ও ব্যবহার গাইড</span></div></div>
                </div>

                <!-- Layer structure -->
                <div class="fg-section">
                    <div class="fg-section-title">📐 প্রতিটি পেজের Layer কাঠামো</div>
                    <div class="fg-layers">
                        <div class="fg-layer"><span class="fg-layer-dot" style="background:#9b59b6"></span><span class="fg-layer-name">Background</span><span class="fg-layer-font">ব্যাকগ্রাউন্ড ডিজাইন</span></div>
                        <div class="fg-layer"><span class="fg-layer-dot" style="background:#1a5276"></span><span class="fg-layer-name">Arabic Text</span><span class="fg-layer-font">ExcellentArabic ফন্ট</span></div>
                        <div class="fg-layer"><span class="fg-layer-dot" style="background:#1a7a3a"></span><span class="fg-layer-name">Bangla Text</span><span class="fg-layer-font">Hind Siliguri ফন্ট</span></div>
                        <div class="fg-layer"><span class="fg-layer-dot" style="background:#7d3c98"></span><span class="fg-layer-name">Tajweed Symbols</span><span class="fg-layer-font">TajweedSymbols (PUA U+E001‐E00C)</span></div>
                        <div class="fg-layer"><span class="fg-layer-dot" style="background:#7d6608"></span><span class="fg-layer-name">Footer</span><span class="fg-layer-font">পেজ নম্বর ইত্যাদি</span></div>
                    </div>
                </div>

                <!-- Install steps -->
                <div class="fg-section">
                    <div class="fg-section-title">🔧 ধাপ ১: TajweedSymbols.ttf ইনস্টল করুন</div>
                    <div class="fg-steps">
                        <div class="fg-step"><span class="fg-step-num">১</span>ZIP থেকে <code>TajweedSymbols.ttf</code> বের করুন</div>
                        <div class="fg-step"><span class="fg-step-num">২</span>ফাইলে <strong>ডাবল ক্লিক</strong> করুন</div>
                        <div class="fg-step"><span class="fg-step-num">৩</span><strong>"Install"</strong> বা <strong>"Install for all users"</strong> চাপুন</div>
                        <div class="fg-step"><span class="fg-step-num">৪</span>Illustrator / InDesign <strong>রিস্টার্ট</strong> করুন</div>
                    </div>
                    <div class="fg-note">💡 ExcellentArabic ও Hind Siliguri ফন্ট ইতিমধ্যে আপনার PC-তে আছে।</div>
                </div>

                <!-- Illustrator -->
                <div class="fg-section">
                    <div class="fg-section-title">🎨 ধাপ ২: Adobe Illustrator-এ ব্যবহার</div>
                    <div class="fg-steps">
                        <div class="fg-step"><span class="fg-step-num">১</span>Illustrator → <strong>File → Open</strong> → <code>page-XXX.svg</code></div>
                        <div class="fg-step"><span class="fg-step-num">২</span><strong>Window → Layers (F7)</strong> খুলুন</div>
                        <div class="fg-step"><span class="fg-step-num">৩</span>পাঁচটি layer দেখা যাবে — যেটি দরকার select করুন</div>
                        <div class="fg-step"><span class="fg-step-num">৪</span>আরবি layer select → <strong>Type → Font</strong> থেকে ফন্ট/মাপ পরিবর্তন করুন</div>
                    </div>
                </div>

                <!-- InDesign -->
                <div class="fg-section">
                    <div class="fg-section-title">📄 ধাপ ৩: Adobe InDesign-এ ব্যবহার</div>
                    <div class="fg-method">
                        <div class="fg-method-label">পদ্ধতি ১ — সরাসরি Place:</div>
                        <div class="fg-step"><span class="fg-step-num">→</span>InDesign → <strong>File → Place</strong> → SVG ফাইল সিলেক্ট → পেজে রাখুন</div>
                    </div>
                    <div class="fg-method fg-method--recommended">
                        <div class="fg-method-label">⭐ পদ্ধতি ২ — সম্পূর্ণ Editable (প্রস্তাবিত):</div>
                        <div class="fg-step"><span class="fg-step-num">১</span>Illustrator-এ SVG খুলুন</div>
                        <div class="fg-step"><span class="fg-step-num">২</span><strong>File → Save As → Adobe Illustrator (.ai)</strong></div>
                        <div class="fg-step"><span class="fg-step-num">৩</span>InDesign → <strong>File → Place → .ai ফাইল</strong> রাখুন</div>
                        <div class="fg-step"><span class="fg-step-num">৪</span>এখন সব layer দৃশ্যমান ও সম্পূর্ণ editable ✅</div>
                    </div>
                </div>

                <!-- Quick action -->
                <div class="fg-action-row">
                    <button class="fg-rebuild-btn"
                            x-show="tajweedFontStatus !== 'ready'"
                            @click="
                                showFontGuide=false;
                                activeTab='rules';
                                if (typeof window.rebuildTajweedFont === 'function') {
                                    tajweedFontStatus='building';
                                    window.rebuildTajweedFont(topSymbols)
                                        .then(b64 => { tajweedFontStatus = b64 ? 'ready' : 'idle'; if(b64) showToast('✅ Font তৈরি হয়েছে!','success'); })
                                        .catch(() => { tajweedFontStatus='error'; });
                                }
                            ">
                        🔤 এখনই Font Rebuild করুন
                    </button>
                    <button class="fg-download-btn"
                            x-show="tajweedFontStatus === 'ready'"
                            @click="
                                showFontGuide=false;
                                if(typeof window.downloadTajweedFont==='function')
                                    window.downloadTajweedFont(topSymbols).then(()=>showToast('⬇ TajweedSymbols.ttf ডাউনলোড হচ্ছে','success'));
                            ">
                        ⬇ TajweedSymbols.ttf ডাউনলোড
                    </button>
                    <button class="fg-close-btn" @click="showFontGuide=false">বন্ধ করুন ✕</button>
                </div>

            </div>
        </div>
    </div>

</div><!-- /editor-root -->

<!-- Toast (pure JS — outside Alpine scope) -->
<div id="toast-container" class="toast-container"></div>
<!-- Loading (pure JS — outside Alpine scope) -->
<div class="loading-overlay" id="loading-overlay" style="display:none">
    <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text" id="loading-text">লোড হচ্ছে...</p>
        <div class="loading-progress-bar"><div class="loading-progress-fill" id="loading-progress-fill" style="width:0%"></div></div>
        <span class="loading-percent" id="loading-percent">0%</span>
    </div>
</div>
<!-- ─── jsPDF + svg2pdf (layered PDF export) ─── -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/svg2pdf.js@2.2.1/dist/svg2pdf.umd.min.js" crossorigin="anonymous"></script>
<!-- ─── JSZip — ZIP package export ─── -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" crossorigin="anonymous"></script>
<!-- ─── opentype.js — Tajweed Symbol Font Generator ─── -->
<script src="https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js" crossorigin="anonymous"></script>
<!-- ─── Tajweed Font Generator ─── -->
<script src="<?php echo e(asset('js/tajweed-font-generator.js')); ?>"></script>
<!-- ─── SVG Exporter (Illustrator layers) ─── -->
<script src="<?php echo e(asset('js/svg-exporter.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\xampp\htdocs\Quran Project\quran-publisher\resources\views/editor/index.blade.php ENDPATH**/ ?>