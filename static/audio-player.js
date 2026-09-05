// ================================================================
//  AUDIO PLAYER HOOKS — اتصال افکت‌های صوتی به رابط کاربری
//  کلیک دکمه‌ها · جابه‌جایی تب/صفحه · موفقیت/خطا (از طریق showToast)
//  موتور صدا: AudioManager (سنتز WebAudio — بدون فایل خارجی)
// ================================================================
(function () {
    'use strict';

    function sfx(name) {
        try { if (window.AudioManager && AudioManager.sfx) AudioManager.sfx(name); } catch (e) {}
    }

    // ─── کلیک عمومی روی دکمه‌ها (به‌جز تایپ) ───
    var CLICK_SELECTOR = '.tab-btn, .nav-item, .btn-action, .admin-icon-btn, .admin-btn, .btn-primary, .btn-landing, .yoga-panel-tab, .admin-tab';
    document.addEventListener('click', function (e) {
        var btn = e.target.closest(CLICK_SELECTOR);
        if (btn) sfx('click');
    }, true);

    // ─── صدای جابه‌جایی تب‌ها و صفحات ───
    var _switchTab = window.switchTab;
    if (typeof _switchTab === 'function') {
        window.switchTab = function (tab) {
            if (tab !== (window.__currentTab || null)) sfx('tab-switch');
            return _switchTab.apply(this, arguments);
        };
    }
    document.addEventListener('click', function (e) {
        var nav = e.target.closest('[data-nav]');
        if (nav) sfx('tab-switch');
    }, true);

    // ─── موفقیت / خطا: از طریق showToast مرکزی ───
    function wrapToast() {
        var orig = window.showToast;
        if (typeof orig !== 'function' || orig.__sfxWrapped) {
            if (!orig) setTimeout(wrapToast, 800);
            return;
        }
        var wrapped = function (message, type) {
            var r = orig.apply(this, arguments);
            if (type === 'success') sfx('success');
            else if (type === 'error') sfx('error');
            return r;
        };
        wrapped.__sfxWrapped = true;
        window.showToast = wrapped;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wrapToast);
    } else {
        wrapToast();
    }

    // ─── نمایش نتیجه چارت = آکورد موفقیت ───
    var _resultEl = document.getElementById('result');
    if (_resultEl) {
        var _observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                if (mutations[i].addedNodes.length) { sfx('success'); break; }
            }
        });
        _observer.observe(_resultEl, { childList: true });
    }
})();
