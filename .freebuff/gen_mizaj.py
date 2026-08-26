#!/usr/bin/env python3
import json

with open('.freebuff/mizaj_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

mmq = json.dumps(data['mmq_qs'], ensure_ascii=False)
smq = json.dumps(data['smq_qs'], ensure_ascii=False)

# Build the complete JS file
js = '// Mizaj Questionnaire
'
js += 'var MIZAJ_MMQ_QS = ' + mmq + ';
'
js += 'var MIZAJ_SMQ_QS = ' + smq + ';

'

# Functions using JS unicode escapes for Persian text
js += """
function getMizajForm() {
    var h = '<div class="mizaj-container" style="max-width:800px;margin:0 auto;">';
    h += '<h3 style="color:#a29bfe;text-align:center;">\u{1f9ec} \u062a\u0639\u06cc\u06cc\u0646 \u0645\u0632\u0627\u062c \u0628\u0627 \u067e\u0631\u0633\u0634\u0646\u0627\u0645\u0647\u200c\u0647\u0627\u06cc \u0645\u0639\u062a\u0628\u0631</h3>';
    h += '<div style="display:flex;justify-content:center;gap:20px;margin:20px 0;background:rgba(255,255,255,0.03);padding:15px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">';
    h += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 16px;border-radius:30px;background:rgba(108,92,231,0.2);border:1px solid #6c5ce7;" id="lbl_mmq">';
    h += '<input type="radio" name="mizaj_type" value="mmq" checked onchange="toggleMizajForms()"> \u06f1\u06f0 \u0633\u0648\u0627\u0644\u06cc (\u0645\u062c\u0627\u0647\u062f)</label>';
    h += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 16px;border-radius:30px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);" id="lbl_smq">';
    h += '<input type="radio" name="mizaj_type" value="smq" onchange="toggleMizajForms()"> \u06f2\u06f0 \u0633\u0648\u0627\u0644\u06cc (\u0633\u0644\u0645\u0627\u0646\u200c\u0646\u0698\u0627\u062f)</label>';
    h += '</div>';
    h += '<div id="mmq-questions"></div>';
    h += '<div id="smq-questions" style="display:none;"></div>';
    h += '<div id="mizaj-result" style="margin-top:25px;"></div>';
    h += '</div>';
    return h;
}

function toggleMizajForms() {
    var type = document.querySelector('input[name="mizaj_type"]:checked').value;
    document.getElementById('mmq-questions').style.display = (type === 'mmq') ? 'block' : 'none';
    document.getElementById('smq-questions').style.display = (type === 'smq') ? 'block' : 'none';
    document.getElementById('lbl_mmq').style.background = (type === 'mmq') ? 'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.05)';
    document.getElementById('lbl_mmq').style.borderColor = (type === 'mmq') ? '#6c5ce7' : 'rgba(255,255,255,0.1)';
    document.getElementById('lbl_smq').style.background = (type === 'smq') ? 'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.05)';
    document.getElementById('lbl_smq').style.borderColor = (type === 'smq') ? '#6c5ce7' : 'rgba(255,255,255,0.1)';
}
"""

with open('static/mizaj.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Written mizaj.js')
