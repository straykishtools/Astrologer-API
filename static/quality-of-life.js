// ================================================================
//  QUALITY OF LIFE QUESTIONNAIRE — SF-20 / AIMS-2SF / SCBS
//  بر اساس مقاله: بررسی ارتباط بین کیفیت زندگی، وضعیت سلامت و رفتارهای خودمراقبتی
//  منبع: https://sjimu.medilam.ac.ir/article-1-425-fa.html
// ================================================================

var QualityOfLife = (function () {
    'use strict';

    var STORAGE_KEY = 'qol_results';
    var ANSWERS_KEY = 'qol_answers';

    // ─── پرسش‌ها ───
    var QUESTIONS = {
        demographics: [
            { id: 'age', label: 'سن شما', type: 'number', placeholder: 'مثلاً ۴۵' },
            { id: 'gender', label: 'جنسیت', type: 'select', options: ['مرد', 'زن'] },
            { id: 'marital', label: 'وضعیت تأهل', type: 'select', options: ['مجرد', 'متاهل', 'مطلقه', 'بیوه'] },
            { id: 'education', label: 'سطح تحصیلات', type: 'select', options: ['زیر دیپلم', 'دیپلم', 'کارشناسی', 'کارشناسی ارشد', 'دکترا'] },
            { id: 'income', label: 'درآمد ماهیانه خانوار', type: 'select', options: ['زیر ۵ میلیون', '۵ تا ۱۰ میلیون', '۱۰ تا ۲۰ میلیون', '۲۰ تا ۳۰ میلیون', 'بالای ۳۰ میلیون'] },
            { id: 'years_illness', label: 'سال‌های ابتلا به بیماری', type: 'number', placeholder: 'مثلاً ۳' }
        ],
        sf20: [
            {
                id: 'sf20_1',
                label: 'در یک ماه گذشته، چقدر از درد بدنی خود رنج برده‌اید؟',
                options: [
                    { value: 1, text: 'همیشه' },
                    { value: 2, text: 'اغلب' },
                    { value: 3, text: 'گاهی' },
                    { value: 4, text: 'به ندرت' },
                    { value: 5, text: 'هرگز' }
                ]
            },
            {
                id: 'sf20_2',
                label: 'آیا به دلیل وضعیت جسمانی، در انجام کارهای روزمره، شغل یا وظایف خود محدودیت داشته‌اید؟',
                options: [
                    { value: 1, text: 'همیشه' },
                    { value: 2, text: 'اغلب' },
                    { value: 3, text: 'گاهی' },
                    { value: 4, text: 'به ندرت' },
                    { value: 5, text: 'هرگز' }
                ]
            },
            {
                id: 'sf20_3',
                label: 'آیا در یک ماه گذشته احساس افسردگی، اضطراب یا کاهش روحیه داشته‌اید؟',
                options: [
                    { value: 1, text: 'همیشه' },
                    { value: 2, text: 'اغلب' },
                    { value: 3, text: 'گاهی' },
                    { value: 4, text: 'به ندرت' },
                    { value: 5, text: 'هرگز' }
                ]
            }
        ],
        aims: [
            {
                id: 'aims_1',
                label: 'توانایی راه رفتن، خم شدن و انجام فعالیت‌های فیزیکی (مانند بالا رفتن از پله) چقدر است؟',
                options: [
                    { value: 1, text: 'بدون مشکل' },
                    { value: 2, text: 'کمی مشکل' },
                    { value: 3, text: 'متوسط' },
                    { value: 4, text: 'زیاد مشکل' },
                    { value: 5, text: 'ناتوانی کامل' }
                ]
            },
            {
                id: 'aims_2',
                label: 'توانایی مراقبت از خود (لباس پوشیدن، غذا خوردن، استحمام) چقدر است؟',
                options: [
                    { value: 1, text: 'بدون مشکل' },
                    { value: 2, text: 'کمی مشکل' },
                    { value: 3, text: 'متوسط' },
                    { value: 4, text: 'زیاد مشکل' },
                    { value: 5, text: 'ناتوانی کامل' }
                ]
            },
            {
                id: 'aims_3',
                label: 'میزان حمایت دریافتی از طرف خانواده و دوستان در زندگی روزمره چقدر است؟',
                options: [
                    { value: 1, text: 'بسیار زیاد' },
                    { value: 2, text: 'زیاد' },
                    { value: 3, text: 'متوسط' },
                    { value: 4, text: 'کم' },
                    { value: 5, text: 'هیچ' }
                ]
            }
        ],
        scbs: [
            {
                id: 'scbs_1',
                label: 'آیا طبق دستور پزشک، داروهای خود را به طور منظم مصرف می‌کنید؟',
                options: [
                    { value: 0, text: 'هرگز' },
                    { value: 1, text: 'به ندرت' },
                    { value: 2, text: 'گاهی اوقات' },
                    { value: 3, text: 'اغلب' },
                    { value: 4, text: 'همیشه' }
                ]
            },
            {
                id: 'scbs_2',
                label: 'آیا از ورزش‌های مناسب (مانند شنا، حرکات کششی، پیاده‌روی) برای کاهش درد استفاده می‌کنید؟',
                options: [
                    { value: 0, text: 'هرگز' },
                    { value: 1, text: 'به ندرت' },
                    { value: 2, text: 'گاهی اوقات' },
                    { value: 3, text: 'اغلب' },
                    { value: 4, text: 'همیشه' }
                ]
            },
            {
                id: 'scbs_3',
                label: 'آیا از کیسه آب گرم، دوش آب گرم یا کمپرس سرد برای تسکین درد استفاده می‌کنید؟',
                options: [
                    { value: 0, text: 'هرگز' },
                    { value: 1, text: 'به ندرت' },
                    { value: 2, text: 'گاهی اوقات' },
                    { value: 3, text: 'اغلب' },
                    { value: 4, text: 'همیشه' }
                ]
            }
        ]
    };

    // ─── سطوح تفسیر ───
    var LEVELS = [
        { min: 0,  max: 20,  name: 'بحرانی',      emoji: '🚨', color: '#e74c3c', bg: 'rgba(231,76,60,0.1)',  message: 'وضعیت شما نیاز به مداخله تخصصی فوری دارد. لطفاً در اولین فرصت با پزشک معالج خود تماس بگیرید. مصرف داروها را به هیچ عنوان قطع نکنید. در این مرحله، فعالیت بدنی فقط با نظر پزشک و حرکات بسیار سبک (مثل تنفس عمیق) مجاز است. از خانواده بخواهید در امور روزمره به شما کمک کنند.' },
        { min: 21, max: 35,  name: 'خیلی ضعیف',   emoji: '⚠️', color: '#e67e22', bg: 'rgba(230,126,34,0.1)', message: 'وضعیت سلامت شما به شدت تحت تاثیر رفتارهای خودمراقبتی است. برنامه‌ی مصرف دارو و استفاده از کیسه آب گرم/دوش آب گرم را به صورت روزانه در برنامه خود بگنجانید. به جای ورزش‌های سنگین، شنا یا حرکات کششی بسیار ملایم را شروع کنید. احساس تنهایی و افسردگی خود را با خانواده در میان بگذارید.' },
        { min: 36, max: 50,  name: 'ضعیف',         emoji: '🔸', color: '#f39c12', bg: 'rgba(243,156,18,0.1)', message: 'حیطه‌ی «درد» و «عملکرد نقش» بیشترین ضعف شما را تشکیل می‌دهند. برای بهبود کیفیت زندگی، تمرکز خود را بر روی تکنیک‌های تسکین درد (کمپرس گرم/سرد) و تنظیم برنامه کاری/استراحت بگذارید. مصرف مکمل‌های غذایی توصیه‌شده توسط پزشک را جدی بگیرید.' },
        { min: 51, max: 65,  name: 'متوسط',        emoji: '🟡', color: '#f1c40f', bg: 'rgba(241,196,15,0.1)', message: 'شما پایه‌های خوبی دارید، اما بی‌نظمی در برخی رفتارها مانع پیشرفت شما می‌شود. وضعیت سلامت شما می‌تواند به عنوان پلی برای ارتقای کیفیت زندگی عمل کند. ورزش منظم (حداقل ۳ جلسه در هفته) و شرکت در دورهمی‌های خانوادگی را به برنامه اضافه کنید تا حمایت اجتماعی‌تان تقویت شود.' },
        { min: 66, max: 80,  name: 'خوب',          emoji: '🟢', color: '#27ae60', bg: 'rgba(39,174,96,0.1)',  message: 'کیفیت زندگی شما در حال ارتقا است! چون خودmanaged care شما قوی است، وضعیت سلامت شما نیز مستقیماً بهبود یافته و این موضوع کیفیت زندگی‌تان را بالا برده است. برای حفظ این روند، استمرار در مصرف دارو و تمرینات کششی را حفظ کنید و مراقب فشارهای روانی (اضطراب) باشید.' },
        { min: 81, max: 90,  name: 'خیلی خوب',     emoji: '🏆', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)', message: 'شما الگوی مناسبی از خودمراقبتی هستید. ارتباط مستقیم و قوی بین وضعیت سلامت و کیفیت زندگی در شما کاملاً مشهود است. توصیه می‌شود این سطح از فعالیت بدنی و رژیم غذایی را حفظ کرده و تجربیات خود را با سایر بیماران به اشتراک بگذارید.' },
        { min: 91, max: 100, name: 'عالی (بهینه)',  emoji: '🌟', color: '#00b894', bg: 'rgba(0,184,148,0.1)', message: 'شما به تعادل کامل بین ذهن و بدن رسیده‌اید. نمره‌ی بالا در خودمراقبتی نه تنها وضعیت سلامت بلکه کیفیت زندگی را نیز تضمین می‌کند. تنها کاری که باید بکنید، پیشگیری از عود بیماری با حفظ همین روال عالی و مراجعه‌ی دوره‌ای به پزشک است.' }
    ];

    var currentStep = 0;
    var totalSteps = 4;
    var answers = {};
    var _inited = false;

    // ─── محاسبه نمرات ───
    function calcScores() {
        // SF-20: 3 questions, 1-5 scale, LOWER = BETTER
        var sf20Sum = 0;
        QUESTIONS.sf20.forEach(function (q) { sf20Sum += (answers[q.id] || 3); });
        var sf20Pct = Math.round(((sf20Sum - 3) / (15 - 3)) * 100); // normalize to 0-100
        sf20Pct = 100 - sf20Pct; // INVERT: lower raw = higher quality

        // AIMS-2SF: 3 questions, 1-5 scale, LOWER = BETTER
        var aimsSum = 0;
        QUESTIONS.aims.forEach(function (q) { aimsSum += (answers[q.id] || 3); });
        var aimsPct = Math.round(((aimsSum - 3) / (15 - 3)) * 100);
        aimsPct = 100 - aimsPct; // INVERT

        // SCBS: 3 questions, 0-4 scale, HIGHER = BETTER
        var scbsSum = 0;
        QUESTIONS.scbs.forEach(function (q) { scbsSum += (answers[q.id] || 0); });
        var scbsPct = Math.round((scbsSum / 12) * 100);

        // Total average
        var totalPct = Math.round((sf20Pct + aimsPct + scbsPct) / 3);

        return { sf20: sf20Pct, aims: aimsPct, scbs: scbsPct, total: totalPct };
    }

    function getLevel(pct) {
        for (var i = 0; i < LEVELS.length; i++) {
            if (pct >= LEVELS[i].min && pct <= LEVELS[i].max) return LEVELS[i];
        }
        return LEVELS[LEVELS.length - 1];
    }

    // ─── رندر UI ───
    function render() {
        var el = document.getElementById('qolContainer');
        if (!el) return;

        var html = '<div class="qol-page">';
        html += '<div class="qol-head">';
        html += '<h2>📋 پرسشنامه کیفیت زندگی</h2>';
        html += '<p class="qol-sub">بر اساس ابزارهای استاندارد SF-20، AIMS-2SF و SCBS</p>';
        html += '<a class="qol-source" href="https://sjimu.medilam.ac.ir/article-1-425-fa.html" target="_blank" rel="noopener">📄 منبع: مقاله بررسی ارتباط بین کیفیت زندگی، وضعیت سلامت و رفتارهای خودمراقبتی</a>';
        html += '</div>';

        // Progress
        html += '<div class="qol-progress">';
        var stepNames = ['اطلاعات شخصی', 'کیفیت زندگی', 'وضعیت سلامت', 'خودمراقبتی'];
        for (var i = 0; i < totalSteps; i++) {
            var cls = i < currentStep ? 'done' : (i === currentStep ? 'active' : '');
            html += '<div class="qol-prog-step ' + cls + '">';
            html += '<div class="qol-prog-dot">' + (i + 1) + '</div>';
            html += '<div class="qol-prog-label">' + stepNames[i] + '</div>';
            html += '</div>';
            if (i < totalSteps - 1) html += '<div class="qol-prog-line"></div>';
        }
        html += '</div>';

        // Step content
        html += '<div class="qol-step-content">';
        if (currentStep === 0) html += renderDemographics();
        else if (currentStep === 1) html += renderScaleSection('sf20', 'کیفیت زندگی (SF-20)', 'نمره کمتر = وضعیت بهتر');
        else if (currentStep === 2) html += renderScaleSection('aims', 'وضعیت سلامت (AIMS-2SF)', 'نمره کمتر = وضعیت بهتر');
        else if (currentStep === 3) html += renderScaleSection('scbs', 'رفتارهای خودمراقبتی (SCBS)', 'نمره بالاتر = وضعیت بهتر');
        else html += renderResults();
        html += '</div>';

        // Navigation
        if (currentStep <= totalSteps) {
            html += '<div class="qol-nav">';
            html += '<button class="qol-btn qol-btn-secondary" onclick="QualityOfLife.prev()" ' + (currentStep === 0 ? 'disabled' : '') + '>→ قبلی</button>';
            if (currentStep < totalSteps) {
                html += '<button class="qol-btn qol-btn-primary" onclick="QualityOfLife.next()">بعدی ←</button>';
            } else {
                html += '<button class="qol-btn qol-btn-primary" onclick="QualityOfLife.submit()">✨ مشاهده نتایج</button>';
            }
            html += '</div>';
        }

        html += '</div>';
        el.innerHTML = html;
    }

    function renderDemographics() {
        var html = '<h3 class="qol-section-title">👤 اطلاعات دموگرافیک</h3>';
        html += '<p class="qol-section-desc">این اطلاعات برای تحلیل دقیق‌تر استفاده می‌شود.</p>';
        html += '<div class="qol-form">';
        QUESTIONS.demographics.forEach(function (q) {
            html += '<div class="qol-field">';
            html += '<label>' + q.label + '</label>';
            if (q.type === 'select') {
                html += '<select id="qol_' + q.id + '" class="qol-input">';
                q.options.forEach(function (opt) {
                    var sel = answers[q.id] === opt ? ' selected' : '';
                    html += '<option value="' + opt + '"' + sel + '>' + opt + '</option>';
                });
                html += '</select>';
            } else {
                html += '<input type="number" id="qol_' + q.id + '" class="qol-input" placeholder="' + (q.placeholder || '') + '" value="' + (answers[q.id] || '') + '">';
            }
            html += '</div>';
        });
        html += '</div>';
        return html;
    }

    function renderScaleSection(key, title, subtitle) {
        var questions = QUESTIONS[key];
        var html = '<h3 class="qol-section-title">' + title + '</h3>';
        html += '<p class="qol-section-desc">' + subtitle + '</p>';
        html += '<div class="qol-scale-list">';
        questions.forEach(function (q, idx) {
            html += '<div class="qol-scale-q">';
            html += '<div class="qol-q-num">' + (idx + 1) + '</div>';
            html += '<div class="qol-q-content">';
            html += '<div class="qol-q-label">' + q.label + '</div>';
            html += '<div class="qol-q-options">';
            q.options.forEach(function (opt) {
                var sel = answers[q.id] === opt.value ? ' selected' : '';
                html += '<button class="qol-opt' + sel + '" data-q="' + q.id + '" data-val="' + opt.value + '" onclick="QualityOfLife.selectOption(this)">';
                html += '<span class="qol-opt-val">' + opt.value + '</span>';
                html += '<span class="qol-opt-text">' + opt.text + '</span>';
                html += '</button>';
            });
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        return html;
    }

    function renderResults() {
        var scores = calcScores();
        var level = getLevel(scores.total);

        var html = '<h3 class="qol-section-title">📊 گزارش تحلیلی شما</h3>';

        // Overall level
        html += '<div class="qol-result-level" style="background:' + level.bg + ';border-color:' + level.color + '">';
        html += '<div class="qol-level-header">';
        html += '<span class="qol-level-emoji">' + level.emoji + '</span>';
        html += '<span class="qol-level-name" style="color:' + level.color + '">' + level.name + '</span>';
        html += '<span class="qol-level-pct">' + scores.total + '%</span>';
        html += '</div>';
        html += '<p class="qol-level-msg">' + level.message + '</p>';
        html += '</div>';

        // Radar chart
        html += '<div class="qol-radar-wrap">';
        html += '<h4>📈 نمودار عملکرد</h4>';
        html += renderRadarChart(scores);
        html += '</div>';

        // Detailed scores
        html += '<div class="qol-scores-detail">';
        html += renderScoreCard('💙', 'کیفیت زندگی', scores.sf20, 'SF-20', 'نمره کمتر = وضعیت بهتر');
        html += renderScoreCard('💚', 'وضعیت سلامت', scores.aims, 'AIMS-2SF', 'نمره کمتر = وضعیت بهتر');
        html += renderScoreCard('🧡', 'خودمراقبتی', scores.scbs, 'SCBS', 'نمره بالاتر = وضعیت بهتر');
        html += '</div>';

        // Conclusion
        html += '<div class="qol-conclusion">';
        html += '<h4>🧠 نتیجه‌گیری هوشمند</h4>';
        html += '<p>بر اساس مدل تحلیلی مقاله، وضعیت سلامت شما (β=0.844) مستقیم‌ترین عامل تاثیرگذار بر کیفیت زندگی شماست. رفتارهای خودمراقبتی (β=0.558) به شدت بر وضعیت سلامت شما اثر می‌گذارد.';
        if (scores.scbs < 50) {
            html += ' پیشنهاد می‌شود برنامه‌ی خودmanaged care خود را (به ویژه در بخش مصرف دارو و ورزش) به صورت جدی دنبال کنید.';
        }
        if (scores.sf20 < 60) {
            html += ' تمرکز بر بهبود درد و عملکرد نقش می‌تواند تاثیر چشمگیری بر کیفیت زندگی شما داشته باشد.';
        }
        html += '</p>';
        html += '</div>';

        // Demographics summary
        if (answers.age || answers.gender) {
            html += '<div class="qol-demo-summary">';
            html += '<h4>👤 اطلاعات شخصی</h4>';
            html += '<div class="qol-demo-grid">';
            if (answers.age) html += '<div><span>سن:</span> ' + answers.age + ' سال</div>';
            if (answers.gender) html += '<div><span>جنسیت:</span> ' + answers.gender + '</div>';
            if (answers.marital) html += '<div><span>وضعیت تأهل:</span> ' + answers.marital + '</div>';
            if (answers.education) html += '<div><span>تحصیلات:</span> ' + answers.education + '</div>';
            if (answers.income) html += '<div><span>درآمد:</span> ' + answers.income + '</div>';
            if (answers.years_illness) html += '<div><span>سابقه بیماری:</span> ' + answers.years_illness + ' سال</div>';
            html += '</div></div>';
        }

        // Actions
        html += '<div class="qol-actions">';
        html += '<button class="qol-btn qol-btn-secondary" onclick="QualityOfLife.reset()">🔄 شروع مجدد</button>';
        html += '<button class="qol-btn qol-btn-primary" onclick="QualityOfLife.printReport()">🖨️ چاپ گزارش</button>';
        html += '</div>';

        return html;
    }

    function renderScoreCard(emoji, label, pct, source, note) {
        var level = getLevel(pct);
        return '<div class="qol-score-card">' +
            '<div class="qol-sc-header">' +
                '<span class="qol-sc-emoji">' + emoji + '</span>' +
                '<span class="qol-sc-label">' + label + '</span>' +
                '<span class="qol-sc-pct" style="color:' + level.color + '">' + pct + '%</span>' +
            '</div>' +
            '<div class="qol-sc-bar"><div class="qol-sc-fill" style="width:' + pct + '%;background:' + level.color + '"></div></div>' +
            '<div class="qol-sc-meta"><span class="qol-sc-source">' + source + '</span><span class="qol-sc-note">' + note + '</span></div>' +
            '<div class="qol-sc-level" style="color:' + level.color + '">' + level.emoji + ' ' + level.name + '</div>' +
        '</div>';
    }

    function renderRadarChart(scores) {
        var cx = 100, cy = 100, maxR = 70;
        var labels = ['کیفیت زندگی', 'سلامت جسمی', 'خودمراقبتی'];
        var values = [scores.sf20, scores.aims, scores.scbs];
        var colors = ['#74b9ff', '#55efc4', '#fdcb6e'];
        var angles = [-90, 30, 150];

        var svg = '<svg viewBox="0 0 200 200" class="qol-radar-svg">';

        // Grid circles
        [0.25, 0.5, 0.75, 1].forEach(function (f) {
            svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (maxR * f) + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>';
        });

        // Grid lines + labels
        angles.forEach(function (a, i) {
            var rad = a * Math.PI / 180;
            var x2 = cx + maxR * Math.cos(rad);
            var y2 = cy + maxR * Math.sin(rad);
            svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2 + '" y2="' + y2 + '" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>';
            var lx = cx + (maxR + 18) * Math.cos(rad);
            var ly = cy + (maxR + 18) * Math.sin(rad);
            svg += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="middle" fill="#aaa" font-size="9" font-family="Vazirmatn,sans-serif">' + labels[i] + '</text>';
        });

        // Data polygon
        var pts = values.map(function (s, i) {
            var rad = angles[i] * Math.PI / 180;
            var r = maxR * (s / 100);
            return (cx + r * Math.cos(rad)) + ',' + (cy + r * Math.sin(rad));
        }).join(' ');
        svg += '<polygon points="' + pts + '" fill="rgba(162,155,254,0.15)" stroke="#a29bfe" stroke-width="1.5"/>';

        // Data dots
        values.forEach(function (s, i) {
            var rad = angles[i] * Math.PI / 180;
            var r = maxR * (s / 100);
            var dx = cx + r * Math.cos(rad);
            var dy = cy + r * Math.sin(rad);
            svg += '<circle cx="' + dx + '" cy="' + dy + '" r="4" fill="' + colors[i] + '" stroke="white" stroke-width="1"/>';
            svg += '<text x="' + dx + '" y="' + (dy - 8) + '" text-anchor="middle" fill="' + colors[i] + '" font-size="10" font-weight="bold" font-family="Vazirmatn,sans-serif">' + s + '</text>';
        });

        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="rgba(162,155,254,0.5)"/>';
        svg += '</svg>';
        return svg;
    }

    // ─── رویدادها ───
    function selectOption(btn) {
        var qId = btn.dataset.q;
        var val = parseInt(btn.dataset.val);
        answers[qId] = val;
        // Update UI
        btn.closest('.qol-q-options').querySelectorAll('.qol-opt').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        saveAnswers();
    }

    function next() {
        saveAnswers();
        if (currentStep < totalSteps) {
            currentStep++;
            render();
        }
    }

    function prev() {
        saveAnswers();
        if (currentStep > 0) {
            currentStep--;
            render();
        }
    }

    function submit() {
        saveAnswers();
        currentStep = totalSteps + 1; // Show results
        var scores = calcScores();
        saveResults(scores);
        render();
    }

    function reset() {
        currentStep = 0;
        answers = {};
        try { localStorage.removeItem(ANSWERS_KEY); } catch (_) {}
        render();
    }

    function saveAnswers() {
        // Gather current step answers from DOM
        if (currentStep === 0) {
            QUESTIONS.demographics.forEach(function (q) {
                var el = document.getElementById('qol_' + q.id);
                if (el) answers[q.id] = el.value;
            });
        }
        try { localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers)); } catch (_) {}
    }

    function saveResults(scores) {
        try {
            var history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            history.push({
                date: new Date().toISOString(),
                scores: scores,
                answers: answers,
                level: getLevel(scores.total).name
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (_) {}
    }

    function printReport() {
        window.print();
    }

    // ─── راه‌اندازی ───
    function init() {
        if (_inited) { render(); return; }
        _inited = true;
        // Load saved answers
        try {
            var saved = JSON.parse(localStorage.getItem(ANSWERS_KEY));
            if (saved) answers = saved;
        } catch (_) {}
        render();
    }

    return {
        init: init,
        next: next,
        prev: prev,
        submit: submit,
        reset: reset,
        selectOption: selectOption,
        printReport: printReport
    };
})();
