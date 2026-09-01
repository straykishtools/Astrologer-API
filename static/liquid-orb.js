// LIQUID ORB - Animated glass orb icon next to calcBtn
// Two states: idle (calm blue-purple) and thinking (energetic orange-gold)
(function(){
'use strict';
var NL = String.fromCharCode(10);
var st = document.createElement('style');
st.textContent = [
'.orb-wrapper{display:none;align-items:center;justify-content:center;width:100%;gap:10px}',
'.orb-wrapper.visible{display:flex}',
'.orb-icon{width:32px;height:32px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0;pointer-events:none}',
'.orb-css{width:100%;height:100%;border-radius:50%;transition:transform .4s,box-shadow .4s}',
'.orb-css.idle{box-shadow:0 0 12px rgba(108,92,231,0.5),inset 0 0 8px rgba(108,92,231,0.3);background:radial-gradient(circle at 35% 35%,#a29bfe,#6c5ce7 50%,#341f97);animation:oip 3s ease-in-out infinite}',
'.orb-css.thinking{box-shadow:0 0 18px rgba(243,156,18,0.7),0 0 36px rgba(243,156,18,0.3),inset 0 0 10px rgba(243,156,18,0.4);background:radial-gradient(circle at 35% 35%,#f39c12,#e67e22 50%,#d35400);animation:otp .7s ease-in-out infinite}',
'@keyframes oip{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}',
'@keyframes otp{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.12);filter:brightness(1.2)}}'
].join(NL);
document.head.appendChild(st);
var ct = document.createElement('div');
ct.className = 'orb-wrapper';
var oi = document.createElement('div');
oi.className = 'orb-icon';
var cf = document.createElement('div');
cf.className = 'orb-css idle';
oi.appendChild(cf);
ct.appendChild(oi);
var ij = false, cs = 'idle';

function shouldShow() {
    var b = document.getElementById('calcBtn');
    if (!b) return false;
    // calcBtn is visible if its inline style says block OR computed display is not none
    // AND its parent page section is not hidden
    var page = b.closest('.page');
    if (page && page.hidden) return false;
    if (b.style.display === 'none') return false;
    if (b.style.display === 'block') return true;
    // If style is empty (doSwitchTab hasn't run yet), check computed style
    if (b.style.display === '' && window.getComputedStyle(b).display !== 'none') return true;
    return false;
}

function inj() {
    if (ij) return;
    var b = document.getElementById('calcBtn');
    if (!b) return;
    b.parentNode.insertBefore(ct, b);
    ct.appendChild(b);
    ij = true;
    // Auto-show if calcBtn is already in a visible calc tab
    if (shouldShow()) ct.classList.add('visible');
}

function sync() {
    // Called by script.js after doSwitchTab to sync wrapper state
    if (!ij) return;
    if (shouldShow()) ct.classList.add('visible');
    else ct.classList.remove('visible');
}

function show() { inj(); ct.classList.add('visible'); }
function hide() { ct.classList.remove('visible'); }
function thinking() { cs = 'thinking'; cf.className = 'orb-css thinking'; }
function idle() { cs = 'idle'; cf.className = 'orb-css idle'; }

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { inj(); });
} else {
    inj();
}

window.liquidOrb = { show: show, hide: hide, thinking: thinking, idle: idle, sync: sync };
})();
