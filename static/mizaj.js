// ============================================
// MIZAJ (مزاج‌شناسی) TAB
// پرسشنامه‌های مزاج‌شناسی با دسته‌بندی و اطلاعات کامل
// ============================================

function _mizajEsc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; }

// ── Test definitions ──
var MIZAJ_TESTS = [
    {
        id: 'mmq',
        name: 'پرسشنامه مزاج مجاهد',
        shortName: 'مجاهد',
        category: 'traditional',
        categoryName: 'سنتی',
        categoryEmoji: '📜',
        questionCount: 10,
        duration: '۳ دقیقه',
        difficulty: 'آسان',
        description: 'پرسشنامه ۱۰ سوالی مبتنی بر معیارهای طب سنتی ایرانی. هر سوال با سه گزینه پاسخ داده می‌شود (سرد/معتدل/گرم) و بر اساس آن مزاج شما تعیین می‌شود.',
        whatMeasures: 'گرمی/سردی، تَری/خشکی، وضعیت اخلاط چهارگانه',
        accuracy: 'متوسط',
        bestFor: 'آشنایی اولیه با مزاج و شروع سریع',
        questions: [
            "وقتی اطرافیان دست شما را لمس می‌کنند، در مورد گرمی و سردی آن چه می‌گویند؟",
            "اندازه کف دست شما در چه حد می‌باشد؟",
            "سرعت تأثیرپذیری شما از سرما و گرما چگونه است؟",
            "هنگام صحبت کردن چند جمله متوالی را چگونه ادا می‌کنید؟",
            "سرعت خشم و عصبانیت شما چگونه است؟",
            "سرعت تأثیرپذیری شما از غذاهای با طبع گرم یا سرد چگونه است؟",
            "قوت صدای شما نسبت به اطرافیان چگونه است؟",
            "سرعت حرکات جسمی شما نسبت به اطرافیان چگونه است؟",
            "وضعیت چاقی و لاغری شما نسبت به سایرین چگونه است؟",
            "وضعیت نرمی و خشکی پوست شما چگونه است؟"
        ],
        options: function() {
            return [
                '<option value="1">۱ (سرد / کم)</option>',
                '<option value="2" selected>۲ (معتدل / متوسط)</option>',
                '<option value="3">۳ (گرم / زیاد)</option>'
            ].join('');
        }
    },
    {
        id: 'smq',
        name: 'پرسشنامه مزاج سلمان‌نژاد',
        shortName: 'سلمان‌نژاد',
        category: 'traditional',
        categoryName: 'سنتی',
        categoryEmoji: '📜',
        questionCount: 20,
        duration: '۵ دقیقه',
        difficulty: 'متوسط',
        description: 'پرسشنامه ۲۰ سوالی جامع‌تر بر اساس معیارهای طب سنتی. پاسخ‌ها در مقیاس ۱ تا ۵ ثبت می‌شوند و دقت بالاتری نسبت به پرسشنامه ۱۰ سوالی دارد.',
        whatMeasures: 'مزاج دقیق‌تر با در نظر گرفتن ۲۰ معیار جسمی و رفتاری',
        accuracy: 'خوب',
        bestFor: 'تحلیل دقیق‌تر مزاج برای افرادی که تجربه بیشتری دارند',
        questions: [
            "راه رفتن شما چگونه است؟",
            "میزان نشاط خود را چگونه می‌دانید؟",
            "وقتی اطرافیان دست شما را لمس می‌کنند در مورد گرمی و سردی آن چه می‌گویند؟",
            "در مجموع روابط اجتماعی خود را سرد می‌دانید یا گرم؟",
            "در جمع دوستان و آشنایان، پرحرفید یا کم‌حرف؟",
            "بلندی صدای شما چگونه است؟",
            "در انجام کارهای روزمره دیر تصمیم می‌گیرید یا زود؟",
            "انرژی شما در انجام کارهای روزمره چگونه است؟",
            "سرما را بهتر تحمل می‌کنید یا گرما را؟",
            "هنگام صحبت کردن، جملات متوالی را چگونه بیان می‌کنید؟",
            "چه غذاهایی معمولاً شما را اذیت می‌کند؟",
            "اندازه‌ی قفسه‌ی سینه‌ی شما نسبت به دیگران چگونه است؟",
            "بین اطرافیان، به‌عنوان فردی ترسو معروفید یا نترس؟",
            "سرعت عمل شما در انجام کارهای روزمره چگونه است؟",
            "پهنای کف دست شما چگونه است؟",
            "معمولاً پرخواب هستید یا کم‌خواب؟",
            "خود را از نظر چاقی و لاغری چگونه می‌دانید؟",
            "رنگ پوست شما در محدوده‌ی کدام‌یک از گزینه‌هاست؟",
            "استعداد چاقی شما چگونه است؟",
            "موی سر شما از نظر کم‌پشتی و پرپشتی چگونه است؟"
        ],
        options: function() {
            var html = '';
            for (var v = 1; v <= 5; v++) {
                html += '<option value="' + v + '"' + (v === 3 ? ' selected' : '') + '>' + v + '</option>';
            }
            return html;
        }
    },
    {
        id: 'quick',
        name: 'آزمون سریع مزاج',
        shortName: 'سریع',
        category: 'quick',
        categoryName: 'سریع',
        categoryEmoji: '⚡',
        questionCount: 5,
        duration: '۱ دقیقه',
        difficulty: 'خیلی آسان',
        description: 'آزمون ۵ سوالی سریع برای تعیین اولیه مزاج. مناسب برای کسانی که می‌خواهند سریعاً نتیجه بگیرند.',
        whatMeasures: ' تعیین اولیه مزاج اصلی (گرم/سرد)',
        accuracy: 'پایه',
        bestFor: 'آشنایی سریع و بدون تعهد زمانی',
        questions: [
            "دست شما هنگام لمس گرم است یا سرد؟",
            "معمولاً عرق می‌کنید یا پوستتان خشک است؟",
            " سریع عصبانی می‌شوید یا آرام؟",
            "خواب شما سنگین است یا سبک؟",
            "انرژی شما در طول روز زیاد است یا کم؟"
        ],
        options: function() {
            return [
                '<option value="1">گزینه ۱</option>',
                '<option value="2" selected>گزینه ۲</option>',
                '<option value="3">گزینه ۳</option>'
            ].join('');
        }
    },
    {
        id: 'dosha',
        name: 'آزمون دوشای آیورودا',
        shortName: 'دوشا',
        category: 'ayurveda',
        categoryName: 'آیورودا',
        categoryEmoji: '🌿',
        questionCount: 15,
        duration: '۴ دقیقه',
        difficulty: 'متوسط',
        description: 'پرسشنامه ۱۵ سوالی بر اساس سیستم آیورودای هندی. سه دوشای واتا، پیتا و کاپا را تعیین می‌کند.',
        whatMeasures: 'تعادل سه دوشای واتا (باد)، پیتا (صفرا)، کاپا (بلغم)',
        accuracy: 'خوب',
        bestFor: 'مقایسه مزاج ایرانی با سیستم آیورودا',
        questions: [
            "体型 شما چگونه است؟ (لاغر/متوسط/درشت)",
            "پوست شما خشک است یا چرب؟",
            "خواب شما سبک است یا سنگین؟",
            "در استرس، مضطرب می‌شوید یا عصبانی؟",
            "غذای مورد علاقه شما شیرین است یا تند؟",
            "آب و هوای مورد علاقه شما سرد است یا گرم؟",
            "حرکات شما سریع است یا آرام؟",
            "صبر شما زیاد است یا کم؟",
            "خلاقیت شما زیاد است یا عملی‌گرا هستید؟",
            "در تصمیم‌گیری سریع عمل می‌کنید یا با تأمل؟",
            "بدن شما انعطاف‌پذیر است یا سفت؟",
            "هضم شما سریع است یا کند؟",
            "شب‌ها راحت می‌خوابید یا بدخواب هستید؟",
            "در جمع اجتماعی هستید یا تنهایی را ترجیح می‌دهید؟",
            "وزن شما به راحتی کم می‌شود یا سخت؟"
        ],
        options: function() {
            return [
                '<option value="1">گزینه ۱</option>',
                '<option value="2" selected>گزینه ۲</option>',
                '<option value="3">گزینه ۳</option>'
            ].join('');
        }
    }
];

// ── Category definitions ──
var MIZAJ_CATEGORIES = [
    { id: 'all', name: 'همه', emoji: '📋' },
    { id: 'traditional', name: 'سنتی ایرانی', emoji: '📜' },
    { id: 'quick', name: 'سریع', emoji: '⚡' },
    { id: 'ayurveda', name: 'آیورودا', emoji: '🌿' }
];

// ── Current state ──
var mizajState = {
    selectedCategory: 'all',
    activeTest: null,
    inProgress: false
};

function getMizajForm() {
    return '<div class="mizaj-container">' +
        '<div class="mizaj-header">' +
            '<h3 class="mizaj-title">🧬 مزاج‌شناسی — طبع خود را بشناس</h3>' +
            '<p class="mizaj-subtitle">بر اساس طب سنتی ایرانی: چهار مزاج اصلی از ترکیبِ دو محورِ گرمی/سردی و تَری/خشکی</p>' +
        '</div>' +
        // ─── شفاف‌سازی سیستم ───
        '<div style="background:rgba(162,155,254,0.06);border:1px solid rgba(162,155,254,0.25);border-radius:16px;padding:16px 18px;margin-bottom:20px;">' +
            '<h4 style="color:#a29bfe;margin:0 0 10px;font-size:0.95rem;">🌟 مزاج‌شناسی چیست؟</h4>' +
            '<p style="color:#ccc;font-size:0.85rem;line-height:2;margin:0 0 8px;">در طب سنتی ایرانی، هر انسان ترکیبی از <b style="color:#fdcb6e;">دو محور</b> است: <b>گرمی/سردی</b> و <b>تَری/خشکی</b>. ترکیب این دو، مزاجِ شما را می‌سازد — یکی از این چهار تیپِ اصلی:</p>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:10px 0;">' +
                '<div style="background:rgba(231,76,60,0.08);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:1.4rem;">🩸</div><b style="color:#e17055;font-size:0.8rem;">دموی</b><div style="font-size:0.68rem;color:#aaa;">گرم و تَر · عنصرِ هوا · بهار</div></div>' +
                '<div style="background:rgba(243,156,18,0.08);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:1.4rem;">🔥</div><b style="color:#f39c12;font-size:0.8rem;">صفراوی</b><div style="font-size:0.68rem;color:#aaa;">گرم و خشک · آتش · تابستان</div></div>' +
                '<div style="background:rgba(116,185,255,0.08);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:1.4rem;">💧</div><b style="color:#74b9ff;font-size:0.8rem;">بلغمی</b><div style="font-size:0.68rem;color:#aaa;">سرد و تَر · آب · زمستان</div></div>' +
                '<div style="background:rgba(155,89,182,0.08);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:1.4rem;">🌑</div><b style="color:#a29bfe;font-size:0.8rem;">سوداوی</b><div style="font-size:0.68rem;color:#aaa;">سرد و خشک · خاک · پاییز</div></div>' +
            '</div>' +
            '<p style="color:#8fb4ff;font-size:0.78rem;line-height:1.9;margin:0;">💡 مزاجِ شما مثلِ اثرِ انگشت است: فیزیکِ بدن، خلق‌وخو، خواب و گوارش‌تان را شکل می‌دهد. شناختنش یعنی دانستنِ اینکه چه غذایی، چه خوابی و چه سبکِ زندگی‌ای با شما سازگار است. این آزمون‌ها <b>تشخیصِ پزشکی نیستند</b> — ابزارِ خودشناسیِ سنتی‌اند.</p>' +
        '</div>' +
        '<div id="mizaj-test-list">' + renderMizajTestList() + '</div>' +
        '<div id="mizaj-questions-area" style="display:none;"></div>' +
        '<div id="mizaj-result" class="mizaj-result-slot"></div>' +
    '</div>';
}

function renderMizajTestList() {
    var html = '';
    // Category filter
    html += '<div class="mizaj-categories">';
    MIZAJ_CATEGORIES.forEach(function(cat) {
        var activeClass = mizajState.selectedCategory === cat.id ? ' active' : '';
        html += '<button class="mizaj-cat-btn' + activeClass + '" onclick="filterMizajCategory(\'' + cat.id + '\')">';
        html += '<span class="mizaj-cat-emoji">' + cat.emoji + '</span>';
        html += '<span class="mizaj-cat-name">' + cat.name + '</span>';
        html += '</button>';
    });
    html += '</div>';

    // Test cards
    html += '<div class="mizaj-tests-grid">';
    MIZAJ_TESTS.forEach(function(test) {
        if (mizajState.selectedCategory !== 'all' && test.category !== mizajState.selectedCategory) return;
        html += renderMizajTestCard(test);
    });
    html += '</div>';

    return html;
}

function renderMizajTestCard(test) {
    return '<div class="mizaj-test-card" id="mizaj-card-' + test.id + '">' +
        '<div class="mizaj-test-card-head">' +
            '<span class="mizaj-test-emoji">' + test.categoryEmoji + '</span>' +
            '<span class="mizaj-test-cat-tag">' + test.categoryName + '</span>' +
        '</div>' +
        '<h4 class="mizaj-test-name">' + test.name + '</h4>' +
        '<div class="mizaj-test-meta">' +
            '<span class="mizaj-test-meta-item">📝 ' + test.questionCount + ' سوال</span>' +
            '<span class="mizaj-test-meta-item">⏱ ' + test.duration + '</span>' +
            '<span class="mizaj-test-meta-item">📊 ' + test.accuracy + '</span>' +
        '</div>' +
        '<p class="mizaj-test-desc">' + test.description + '</p>' +
        '<div class="mizaj-test-info">' +
            '<div class="mizaj-test-info-row"><span class="mizaj-test-info-label">🎯 اندازه‌گیری:</span> <span>' + test.whatMeasures + '</span></div>' +
            '<div class="mizaj-test-info-row"><span class="mizaj-test-info-label">👤 مناسب برای:</span> <span>' + test.bestFor + '</span></div>' +
            '<div class="mizaj-test-info-row"><span class="mizaj-test-info-label">📈 سطح دقت:</span> <span>' + test.accuracy + '</span></div>' +
        '</div>' +
        '<button class="btn-primary mizaj-start-btn" onclick="startMizajTest(\'' + test.id + '\')">🚀 شروع آزمون</button>' +
    '</div>';
}

function filterMizajCategory(catId) {
    mizajState.selectedCategory = catId;
    var listEl = document.getElementById('mizaj-test-list');
    if (listEl) listEl.innerHTML = renderMizajTestList();
}

function startMizajTest(testId) {
    var test = MIZAJ_TESTS.find(function(t) { return t.id === testId; });
    if (!test) return;

    mizajState.activeTest = test;
    mizajState.inProgress = true;

    // Hide test list, show questions
    var listEl = document.getElementById('mizaj-test-list');
    var qArea = document.getElementById('mizaj-questions-area');
    if (listEl) listEl.style.display = 'none';
    if (qArea) {
        qArea.style.display = 'block';
        qArea.innerHTML = renderMizajQuestions(test);
    }
}

function renderMizajQuestions(test) {
    var html = '<div class="mizaj-q-header">';
    html += '<button class="mizaj-back-btn" onclick="backToMizajTests()">→ بازگشت به لیست</button>';
    html += '<h4 class="mizaj-q-title">' + test.categoryEmoji + ' ' + test.name + '</h4>';
    html += '<span class="mizaj-q-count">' + test.questionCount + ' سوال · ' + test.duration + '</span>';
    html += '</div>';

    // نوار پیشرفت
    html += '<div style="background:rgba(255,255,255,0.05);border-radius:8px;height:6px;overflow:hidden;margin:10px 0 16px;">' +
        '<div id="mizajProgressBar" style="height:100%;width:0%;background:linear-gradient(90deg,#a29bfe,#fdcb6e);transition:width .3s;"></div></div>';

    html += '<div class="mizaj-q-block">';
    test.questions.forEach(function(q, i) {
        html += '<div class="mizaj-q-card" id="mizaj-qcard-' + (i + 1) + '" style="background:rgba(0,0,0,0.2);border-radius:12px;padding:14px 16px;margin:10px 0;border:1px solid rgba(255,255,255,0.04);">';
        html += '<div style="color:#fdcb6e;font-size:0.85rem;font-weight:700;margin-bottom:10px;">' + (i + 1) + '. ' + q + '</div>';
        html += '<div class="mizaj-q-options" data-q="' + (i + 1) + '" style="display:flex;flex-wrap:wrap;gap:8px;">';
        // گزینه‌های دکمه‌ای بر اساس نوع آزمون
        var opts = test.id === 'smq' ? ['بسیار کم', 'کم', 'متوسط', 'زیاد', 'بسیار زیاد'] : null;
        if (test.id === 'mmq') opts = ['کم/سرد', 'متوسط', 'زیاد/گرم'];
        else if (test.id === 'quick') opts = ['گزینه ۱', 'گزینه ۲', 'گزینه ۳'];
        else if (test.id === 'dosha') opts = ['گزینه ۱', 'گزینه ۲', 'گزینه ۳'];
        (opts || ['۱','۲','۳','۴','۵']).forEach(function(label, oi) {
            var val = oi + 1;
            var sel = (test.id === 'smq' && val === 3) || (test.id !== 'smq' && val === 2);
            html += '<button type="button" class="mizaj-opt' + (sel ? ' mizaj-opt-sel' : '') + '" data-q="' + (i + 1) + '" data-val="' + val + '"' +
                ' onclick="mizajPickOpt(this)"' +
                ' style="flex:1;min-width:72px;padding:9px 6px;border-radius:10px;border:1px solid rgba(162,155,254,0.25);background:' + (sel ? 'rgba(253,203,110,0.15)' : 'rgba(255,255,255,0.03)') + ';color:' + (sel ? '#fdcb6e' : '#bbb') + ';font-size:0.78rem;cursor:pointer;transition:all .15s;font-family:inherit;">' + label + '</button>';
        });
        html += '</div></div>';
    });
    html += '</div>';

    // مقدارهای مخفی برای submit
    test.questions.forEach(function(q, i) {
        var defaultVal = test.id === 'smq' ? 3 : 2;
        html += '<input type="hidden" id="' + test.id + '_q' + (i + 1) + '" value="' + defaultVal + '">';
    });

    html += '<button class="btn-primary" onclick="submitMizaj()" style="margin-top:16px;">🧬 محاسبه مزاج</button>';
    return html;
}

// انتخاب گزینه‌ی دکمه‌ای
function mizajPickOpt(btn) {
    var q = btn.getAttribute('data-q');
    var val = btn.getAttribute('data-val');
    var test = mizajState.activeTest;
    if (!test) return;
    // مقدار مخفی
    var hidden = document.getElementById(test.id + '_q' + q);
    if (hidden) hidden.value = val;
    // ظاهرِ دکمه‌ها
    document.querySelectorAll('.mizaj-q-options[data-q="' + q + '"] .mizaj-opt').forEach(function (b) {
        var sel = b === btn;
        b.classList.toggle('mizaj-opt-sel', sel);
        b.style.background = sel ? 'rgba(253,203,110,0.15)' : 'rgba(255,255,255,0.03)';
        b.style.color = sel ? '#fdcb6e' : '#bbb';
        b.style.borderColor = sel ? '#fdcb6e' : 'rgba(162,155,254,0.25)';
    });
    // نوار پیشرفت (بر اساس تعدادِ تغییر یافته از پیش‌فرض)
    var answered = 0;
    for (var i = 1; i <= test.questionCount; i++) {
        var h = document.getElementById(test.id + '_q' + i);
        var def = test.id === 'smq' ? 3 : 2;
        if (h && parseInt(h.value, 10) !== def) answered++;
    }
    var bar = document.getElementById('mizajProgressBar');
    if (bar) bar.style.width = Math.round((answered / test.questionCount) * 100) + '%';
}
window.mizajPickOpt = mizajPickOpt;

function backToMizajTests() {
    mizajState.activeTest = null;
    mizajState.inProgress = false;

    var listEl = document.getElementById('mizaj-test-list');
    var qArea = document.getElementById('mizaj-questions-area');
    if (listEl) {
        listEl.style.display = 'block';
        listEl.innerHTML = renderMizajTestList();
    }
    if (qArea) qArea.style.display = 'none';
}

function submitMizaj() {
    var test = mizajState.activeTest;
    if (!test) return;

    var answers = {};
    for (var i = 1; i <= test.questionCount; i++) {
        var el = document.getElementById(test.id + '_q' + i);
        if (el) answers['q' + i] = parseInt(el.value, 10);
    }

    var resultBox = document.getElementById('mizaj-result');
    if (!resultBox) return;

    // Hide questions, show result
    var qArea = document.getElementById('mizaj-questions-area');
    if (qArea) qArea.style.display = 'none';
    resultBox.innerHTML = '<p style="text-align:center;color:#aaa;">⏳ در حال محاسبه...</p>';

    fetch('/api/v5/mizaj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire_type: test.id, answers: answers })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') {
            displayMizajResult(data.data);
        } else {
            resultBox.innerHTML = '<p style="color:#ff6b6b;">❌ خطا: ' + _mizajEsc(data.detail || 'سرور') + '</p>' +
                '<button class="btn-primary" onclick="backToMizajTests()" style="margin-top:12px;">← بازگشت</button>';
        }
    })
    .catch(function() {
        resultBox.innerHTML = '<p style="color:#ff6b6b;">❌ خطا در ارتباط با سرور</p>' +
            '<button class="btn-primary" onclick="backToMizajTests()" style="margin-top:12px;">← بازگشت</button>';
    });
}

// ---------- Gauge helpers ----------
function mizajAxesFromTemperament(name) {
    var n = (name || '').trim();
    var hotWords = ['دموی', 'صفراوی', 'گرم'];
    var coldWords = ['بلغمی', 'سوداوی', 'سرد'];
    var wetWords = ['دموی', 'بلغمی', 'تر'];
    var dryWords = ['صفراوی', 'سوداوی', 'خشک'];

    var isHot = hotWords.some(function(w) { return n.includes(w); });
    var isCold = coldWords.some(function(w) { return n.includes(w); });
    var isWet = wetWords.some(function(w) { return n.includes(w); });
    var isDry = dryWords.some(function(w) { return n.includes(w); });

    var hot = isHot && !isCold ? 75 : (!isHot && isCold ? 25 : 50);
    var wet = isWet && !isDry ? 75 : (!isWet && isDry ? 25 : 50);
    return { hot: hot, cold: 100 - hot, wet: wet, dry: 100 - wet };
}

function renderMizajGauge(id, percent, colorFrom, colorTo, label, valueText) {
    var r = 42, c = 2 * Math.PI * r;
    return '<div class="mizaj-gauge-wrap">' +
        '<div class="mizaj-gauge">' +
            '<svg viewBox="0 0 100 100" width="100" height="100">' +
                '<circle class="mizaj-gauge-track" cx="50" cy="50" r="' + r + '"></circle>' +
                '<circle class="mizaj-gauge-value" cx="50" cy="50" r="' + r + '"' +
                    ' style="stroke:' + colorTo + ';stroke-dasharray:' + c + ';stroke-dashoffset:' + c + ';"' +
                    ' data-target-offset="' + (c - (percent / 100) * c) + '"' +
                    ' data-gradient-from="' + colorFrom + '"></circle>' +
            '</svg>' +
            '<div class="mizaj-gauge-center">' + valueText + '</div>' +
        '</div>' +
        '<div class="mizaj-gauge-label">' + label + '</div>' +
    '</div>';
}

function displayMizajResult(data) {
    var profile = data.profile || {};
    var advice = data.advice || {};
    var scores = data.scores || {};

    var test = mizajState.activeTest;
    var testInfo = test ? '<span class="mizaj-result-test-info">' + _mizajEsc(test.categoryEmoji + ' ' + test.name) + ' (' + test.questionCount + ' سوال)</span>' : '';

    // محورها از scores دقیق (نه حدسِ اسم)
    var hotPct = scores.hot_percent != null ? scores.hot_percent : mizajAxesFromTemperament(data.temperament).hot;
    var coldPct = 100 - hotPct;
    var wetPct, dryPct;
    if (data.humidity_status === 'تر') { wetPct = 75; dryPct = 25; }
    else if (data.humidity_status === 'خشک') { wetPct = 25; dryPct = 75; }
    else { wetPct = 50; dryPct = 50; }

    function adviceBox(icon, title, items, color) {
        if (!items || !items.length) return '';
        return '<div style="margin-top:10px;padding:12px 14px;background:rgba(255,255,255,0.03);border-radius:10px;border-right:3px solid ' + color + ';">' +
            '<b style="color:' + color + ';font-size:0.85rem;">' + icon + ' ' + title + '</b>' +
            '<ul style="margin:6px 0 0;padding-right:18px;color:#ccc;font-size:0.82rem;line-height:2;">' +
            items.map(function (i) { return '<li>' + _mizajEsc(i) + '</li>'; }).join('') + '</ul></div>';
    }

    var html =
        '<div class="mizaj-result-card">' +
            '<div class="mizaj-result-head">' +
                '<button class="mizaj-back-btn" onclick="backToMizajTests()">→ آزمون‌های دیگر</button>' +
                '<h4 class="mizaj-result-title">' + (profile.name || ('مزاج: ' + _mizajEsc(data.temperament))) + '</h4>' +
                testInfo +
                '<span class="mizaj-questionnaire-tag">' + _mizajEsc(data.questionnaire) + '</span>' +
            '</div>' +

            // شناسنامه مزاج
            (profile.element ?
                '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin:14px 0;">' +
                    '<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:0.68rem;color:#888;">عنصر</div><b style="color:#fdcb6e;font-size:0.85rem;">' + _mizajEsc(profile.element) + '</b></div>' +
                    '<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:0.68rem;color:#888;">فصل</div><b style="color:#fdcb6e;font-size:0.85rem;">' + _mizajEsc(profile.season) + '</b></div>' +
                    '<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:0.68rem;color:#888;">اخلاط</div><b style="color:#fdcb6e;font-size:0.85rem;">' + _mizajEsc(profile.humor) + '</b></div>' +
                    '<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:0.68rem;color:#888;">مزاج سنتی</div><b style="color:#fdcb6e;font-size:0.85rem;">' + _mizajEsc(data.temperament) + '</b></div>' +
                '</div>' : '') +

            // گیج‌ها
            '<div class="mizaj-gauges">' +
                renderMizajGauge('hot', hotPct, '#ffcf5c', '#ff6b4a', 'گرمی', hotPct + '٪') +
                renderMizajGauge('cold', coldPct, '#5cc9ff', '#3fa7ff', 'سردی', coldPct + '٪') +
                renderMizajGauge('wet', wetPct, '#00d2a0', '#3fa7ff', 'تَری', wetPct + '٪') +
                renderMizajGauge('dry', dryPct, '#ffb454', '#ff5f6d', 'خشکی', dryPct + '٪') +
            '</div>' +

            // شخصیت
            (profile.personality ?
                '<div style="margin-top:14px;padding:14px 16px;background:rgba(253,203,110,0.05);border-right:3px solid rgba(253,203,110,0.45);border-radius:10px;line-height:2;color:#ddd;font-size:0.88rem;">' +
                '<b style="color:#fdcb6e;">🌟 خلق‌وخو:</b> ' + _mizajEsc(profile.personality) + '</div>' : '') +

            // بدن
            (profile.body ?
                '<div style="margin-top:10px;padding:12px 16px;background:rgba(255,255,255,0.03);border-right:3px solid rgba(116,185,255,0.4);border-radius:10px;line-height:2;color:#ccc;font-size:0.85rem;">' +
                '<b style="color:#74b9ff;">🫀 ویژگی‌های جسمی:</b> ' + _mizajEsc(profile.body) + '</div>' : '') +

            // ریسک‌ها
            (profile.risks ?
                '<div style="margin-top:10px;padding:12px 16px;background:rgba(231,76,60,0.05);border-right:3px solid rgba(231,76,60,0.4);border-radius:10px;line-height:2;color:#ccc;font-size:0.85rem;">' +
                '<b style="color:#e17055;">⚠️ آمادگی‌های مزاجی (نه تشخیص پزشکی):</b> ' + _mizajEsc(profile.risks) + '</div>' : '') +

            '<p class="mizaj-desc" style="margin-top:12px;">' + _mizajEsc(data.description) + '</p>' +

            // توصیه‌ها با تفکیک
            '<div class="mizaj-recs-box" style="margin-top:14px;">' +
                '<h5 class="mizaj-recs-title">💡 برنامه‌ی تعادل مزاج شما</h5>' +
                adviceBox('🍽️', 'تغذیه', advice.diet, '#2ecc71') +
                adviceBox('🌅', 'سبک زندگی', advice.lifestyle, '#74b9ff') +
                adviceBox('🧠', 'رفتار و ذهن', advice.behavioral, '#a29bfe') +
                (advice.seasonal ? '<div style="margin-top:10px;padding:12px 14px;background:rgba(243,156,18,0.06);border-right:3px solid rgba(243,156,18,0.4);border-radius:10px;line-height:2;color:#ccc;font-size:0.82rem;"><b style="color:#f39c12;">🍂 نکته‌ی فصلی:</b> ' + _mizajEsc(advice.seasonal) + '</div>' : '') +
                (profile.balance_note ? '<div style="margin-top:10px;padding:12px 14px;background:rgba(46,204,113,0.06);border-right:3px solid rgba(46,204,113,0.4);border-radius:10px;line-height:2;color:#ccc;font-size:0.85rem;"><b style="color:#2ecc71;">⚖️ کلیدِ تعادل شما:</b> ' + _mizajEsc(profile.balance_note) + '</div>' : '') +
            '</div>' +
        '</div>';

    document.getElementById('mizaj-result').innerHTML = html;

    // انیمیشن پر شدن گیج‌ها
    requestAnimationFrame(function() {
        document.querySelectorAll('.mizaj-gauge-value').forEach(function(circle) {
            var offset = circle.getAttribute('data-target-offset');
            requestAnimationFrame(function() { circle.style.strokeDashoffset = offset; });
        });
    });
}
