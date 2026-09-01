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
            '<h3 class="mizaj-title">🧬 تعیین مزاج</h3>' +
            '<p class="mizaj-subtitle">طبع خود را بشناسید و توصیه‌های اختصاصی دریافت کنید</p>' +
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

    html += '<div class="mizaj-q-block">';
    test.questions.forEach(function(q, i) {
        html += '<div class="form-group mizaj-q">';
        html += '<label>' + (i + 1) + '. ' + q + '</label>';
        html += '<select id="' + test.id + '_q' + (i + 1) + '" class="abjad-input">' + test.options() + '</select>';
        html += '</div>';
    });
    html += '</div>';

    html += '<button class="btn-primary" onclick="submitMizaj()">🧬 محاسبه مزاج</button>';
    return html;
}

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
    var recs = (data.recommendations || [])
        .map(function(r) { return '<li class="mizaj-rec">✅ ' + _mizajEsc(r) + '</li>'; }).join('');

    var axes = mizajAxesFromTemperament(data.temperament);

    var test = mizajState.activeTest;
    var testInfo = test ? '<span class="mizaj-result-test-info">' + _mizajEsc(test.categoryEmoji + ' ' + test.name) + ' (' + test.questionCount + ' سوال)</span>' : '';

    document.getElementById('mizaj-result').innerHTML =
        '<div class="mizaj-result-card">' +
            '<div class="mizaj-result-head">' +
                '<button class="mizaj-back-btn" onclick="backToMizajTests()">→ آزمون‌های دیگر</button>' +
                '<h4 class="mizaj-result-title">🧬 مزاج: ' + _mizajEsc(data.temperament) + '</h4>' +
                testInfo +
                '<span class="mizaj-questionnaire-tag">' + _mizajEsc(data.questionnaire) + '</span>' +
            '</div>' +
            '<div class="mizaj-gauges">' +
                renderMizajGauge('hot', axes.hot, '#ffcf5c', '#ff6b4a', 'گرمی', axes.hot + '٪') +
                renderMizajGauge('cold', axes.cold, '#5cc9ff', '#3fa7ff', 'سردی', axes.cold + '٪') +
                renderMizajGauge('wet', axes.wet, '#00d2a0', '#3fa7ff', 'تَری', axes.wet + '٪') +
                renderMizajGauge('dry', axes.dry, '#ffb454', '#ff5f6d', 'خشکی', axes.dry + '٪') +
            '</div>' +
            '<p class="mizaj-desc">' + _mizajEsc(data.description) + '</p>' +
            '<div class="mizaj-recs-box">' +
                '<h5 class="mizaj-recs-title">💡 توصیه‌ها:</h5>' +
                '<ul class="mizaj-recs-list">' + recs + '</ul>' +
            '</div>' +
        '</div>';

    // انیمیشن پر شدن گیج‌ها
    requestAnimationFrame(function() {
        document.querySelectorAll('.mizaj-gauge-value').forEach(function(circle) {
            var offset = circle.getAttribute('data-target-offset');
            requestAnimationFrame(function() { circle.style.strokeDashoffset = offset; });
        });
    });
}
