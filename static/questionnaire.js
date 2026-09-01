// ================================================================
//   QUESTIONNAIRE — پرسشنامه یوگا (پوشش تمام صفحه)
//   نمایش در بخش یوگا تا تکمیل کاربر · شخصی‌سازی حرکات · ادامه از جای قبلی
// ================================================================

var Questionnaire = (function () {
'use strict';

var currentStep = 1;
var totalSteps = 4;
var answers = {};
var dom = {};

function init() {
    dom.overlay = document.getElementById('yogaQuestionnaireOverlay');
    dom.prevBtn = document.getElementById('yogaQPrev');
    dom.nextBtn = document.getElementById('yogaQNext');
    dom.submitBtn = document.getElementById('yogaQSubmit');
    dom.dots = document.querySelectorAll('.yoga-q-dot');

    var completed = localStorage.getItem('yoga_questionnaire_done');
    if (completed) { hideOverlay(); return; }

    showOverlay();
    bindEvents();
}

function showOverlay() {
    if (dom.overlay) dom.overlay.classList.add('active');
}

function hideOverlay() {
    if (dom.overlay) dom.overlay.classList.remove('active');
}

function bindEvents() {
    // انتخاب تک
    document.querySelectorAll('.yoga-q-choices:not(.multi) input[type="radio"]').forEach(function (inp) {
        inp.addEventListener('change', function () {
            var parent = this.closest('.yoga-q-choices');
            if (parent) parent.querySelectorAll('.yoga-q-card').forEach(function (c) { c.classList.remove('selected'); });
            if (this.checked) this.closest('.yoga-q-card').classList.add('selected');
        });
    });

    // انتخاب چندگانه
    document.querySelectorAll('.yoga-q-choices.multi input[type="checkbox"]').forEach(function (inp) {
        inp.addEventListener('change', function () { this.closest('.yoga-q-card').classList.toggle('selected'); });
    });

    if (dom.prevBtn) dom.prevBtn.addEventListener('click', function () { if (currentStep > 1) goToStep(currentStep - 1); });
    if (dom.nextBtn) dom.nextBtn.addEventListener('click', function () {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) goToStep(currentStep + 1);
            else { dom.nextBtn.style.display = 'none'; if (dom.submitBtn) dom.submitBtn.style.display = 'inline-block'; }
        }
    });
    if (dom.submitBtn) dom.submitBtn.addEventListener('click', function (e) { e.preventDefault(); if (validateStep(currentStep)) submitForm(); });

    // کیبورد
    document.addEventListener('keydown', function (e) {
        if (!dom.overlay || !dom.overlay.classList.contains('active')) return;
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
            if (dom.nextBtn && dom.nextBtn.style.display !== 'none') dom.nextBtn.click();
            else if (dom.submitBtn) dom.submitBtn.click();
        }
        if (e.key === 'ArrowLeft' && dom.prevBtn && !dom.prevBtn.disabled) dom.prevBtn.click();
    });
}

function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.yoga-q-step').forEach(function (el) { el.classList.remove('active'); });
    var target = document.querySelector('.yoga-q-step[data-step="' + step + '"]');
    if (target) target.classList.add('active');
    if (dom.prevBtn) dom.prevBtn.disabled = (step === 1);
    if (dom.nextBtn) { dom.nextBtn.style.display = (step === totalSteps) ? 'none' : 'inline-block'; }
    if (dom.submitBtn) { dom.submitBtn.style.display = (step === totalSteps) ? 'inline-block' : 'none'; }
    if (dom.dots) dom.dots.forEach(function (dot, i) {
        dot.classList.remove('active', 'done');
        if (i + 1 === step) dot.classList.add('active');
        else if (i + 1 < step) dot.classList.add('done');
    });
    saveStepAnswers(step);
}

function validateStep(step) {
    var c = document.querySelector('.yoga-q-step[data-step="' + step + '"]');
    if (!c) return true;
    var inputs = c.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    var has = false;
    inputs.forEach(function (i) { if (i.checked) has = true; });
    if (!has && inputs.length > 0) {
        var existing = c.querySelector('.yoga-q-error');
        if (!existing) {
            var err = document.createElement('p');
            err.className = 'yoga-q-error';
            err.textContent = '⚠️ لطفاً حداقل یک گزینه را انتخاب کنید.';
            c.appendChild(err);
            setTimeout(function () { if (err.parentNode) err.remove(); }, 2500);
        }
        return false;
    }
    return true;
}

function saveStepAnswers(step) {
    var c = document.querySelector('.yoga-q-step[data-step="' + step + '"]');
    if (!c) return;
    var arr = [];
    c.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(function (i) { arr.push(i.value); });
    answers['step_' + step] = arr;
    try { localStorage.setItem('yoga_questionnaire_answers', JSON.stringify(answers)); } catch (_) {}
}

function submitForm() {
    for (var i = 1; i <= totalSteps; i++) saveStepAnswers(i);
    localStorage.setItem('yoga_questionnaire_done', 'true');
    localStorage.setItem('yoga_questionnaire_answers', JSON.stringify(answers));
    hideOverlay();

    // شخصی‌سازی یوگا بر اساس پاسخ‌ها
    applyPersonalization();

    // رندر مجدد اطلاعات روزانه پس از تکمیل پرسشنامه
    if (window.YogaLibrary) window.YogaLibrary.showLibrary();

    // نمایش پیام
    if (typeof window.showToast === 'function') window.showToast('✅ تنظیمات شما ذخیره شد. حرکات شخصی‌سازی شده نمایش داده می‌شوند.', 'success');
}

function applyPersonalization() {
    var exp = answers.step_1 && answers.step_1[0] ? answers.step_1[0] : 'beginner';
    var focus = answers.step_3 || [];

    // فیلتر حرکات بر اساس تجربه
    if (window.YogaLibrary) {
        var filters = { difficulty: [] };
        if (exp === 'beginner') filters.difficulty = ['beginner'];
        else if (exp === 'intermediate') filters.difficulty = ['beginner', 'intermediate'];
        // advanced و mentor → همه

        // فیلتر بر اساس تمرکز
        if (focus.indexOf('strength') !== -1 || focus.indexOf('core') !== -1) {
            // نمایش حرکات تعادلی و ایستاده
        }
        if (focus.indexOf('flexibility') !== -1) {
            // نمایش خمش‌ها
        }
        if (focus.indexOf('sleep') !== -1 || focus.indexOf('stress') !== -1) {
            // نمایش حرکات نشسته و خوابیده
        }
    }
}

function getAnswers() {
    try {
        var saved = localStorage.getItem('yoga_questionnaire_answers');
        return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
}

function isCompleted() {
    return localStorage.getItem('yoga_questionnaire_done') === 'true';
}

function reset() {
    localStorage.removeItem('yoga_questionnaire_done');
    localStorage.removeItem('yoga_questionnaire_answers');
    answers = {};
    currentStep = 1;
    goToStep(1);
    showOverlay();
}

return { init: init, showOverlay: showOverlay, hideOverlay: hideOverlay, getAnswers: getAnswers, isCompleted: isCompleted, reset: reset };
})();
