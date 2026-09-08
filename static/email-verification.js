// ================================================================
//  SHARED EMAIL-VERIFICATION LOGIC — Cosmic Oracle
//  Used by both the SPA (spa-router.js) and the standalone account
//  page (account-page.js) so the verify-email flow can't drift apart.
//  Exposes: window.verifyEmailToken(token) -> Promise<data>
//  On success it also syncs the stored user (email_verified=true) and
//  refreshes it from /me when a session token exists.
// ================================================================
(function () {
    'use strict';

    var TOKEN_KEY = 'cosmic_token';
    var USER_KEY = 'cosmic_user';

    function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

    // POST the verification token; on success mark the stored user verified
    // and refresh from /me (best-effort). Returns the API response.
    // Throws Error(message) on failure.
    async function verifyEmailToken(token) {
        var resp = await fetch('/api/v5/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
        });
        var data = {};
        try { data = await resp.json(); } catch (e) { data = {}; }
        if (!resp.ok || !data.email_verified) {
            throw new Error(data.detail || data.message || 'توکن نامعتبر یا منقضی شده');
        }

        // Keep the stored user in sync so the UI reflects the verified state.
        try {
            var u = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
            u.email_verified = true;
            localStorage.setItem(USER_KEY, JSON.stringify(u));
        } catch (e) {}

        // Best-effort fresh copy from /me for signed-in users.
        var tok = getToken();
        if (tok) {
            try {
                var meResp = await fetch('/api/v5/auth/me', { headers: { 'Authorization': 'Bearer ' + tok } });
                if (meResp.ok) {
                    var me = await meResp.json();
                    if (me && me.email) localStorage.setItem(USER_KEY, JSON.stringify(me));
                }
            } catch (e) {}
        }

        // Notify the auth panel so UI driven by the user object (e.g. the
        // unverified-email banner) re-renders immediately.
        if (typeof window.updateVerifyBannerNow === 'function') {
            try { window.updateVerifyBannerNow(); } catch (e) {}
        }
        return data;
    }

    window.verifyEmailToken = verifyEmailToken;
})();