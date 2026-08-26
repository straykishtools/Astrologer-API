import json

with open('.freebuff/mizaj_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

mmq = json.dumps(data['mmq_qs'], ensure_ascii=False)
smq = json.dumps(data['smq_qs'], ensure_ascii=False)

# Write header with data arrays
with open('static/mizaj.js', 'w', encoding='utf-8') as f:
    f.write('// Mizaj Questionnaire - MMQ (10Q) & SMQ (20Q)\n')
    f.write('var MIZAJ_MMQ_QS = ' + mmq + ';\n')
    f.write('var MIZAJ_SMQ_QS = ' + smq + ';\n\n')

# Write functions - use chr() for all non-ASCII text
e = chr(0x005c)  # backslash
u = chr(0x0075)  # u

def jsu(code):
    """Create a JS unicode escape like \u062a"""
    return e + u + '{' + hex(code)[2:] + '}'

# Build the getMizajForm function
title = jsu(0x1f9ec) + ' ' + jsu(0x062a) + jsu(0x0639) + jsu(0x06cc) + jsu(0x06cc) + jsu(0x0646) + ' ' + jsu(0x0645) + jsu(0x0632) + jsu(0x0627) + jsu(0x062c) + ' ' + jsu(0x0628) + jsu(0x0627) + ' ' + jsu(0x067e) + jsu(0x0631) + jsu(0x0633) + jsu(0x0634) + jsu(0x0646) + jsu(0x0627) + jsu(0x0645) + jsu(0x0647) + jsu(0x200c) + jsu(0x0647) + jsu(0x0627) + jsu(0x06cc) + ' ' + jsu(0x0645) + jsu(0x0639) + jsu(0x062a) + jsu(0x0628) + jsu(0x0631)

label_mmq = jsu(0x06f1) + jsu(0x06f0) + ' ' + jsu(0x0633) + jsu(0x0648) + jsu(0x0627) + jsu(0x0644) + jsu(0x06cc) + ' (' + jsu(0x0645) + jsu(0x062c) + jsu(0x0627) + jsu(0x0647) + jsu(0x062f) + ')'
label_smq = jsu(0x06f2) + jsu(0x06f0) + ' ' + jsu(0x0633) + jsu(0x0648) + jsu(0x0627) + jsu(0x0644) + jsu(0x06cc) + ' (' + jsu(0x0633) + jsu(0x0644) + jsu(0x0645) + jsu(0x0627) + jsu(0x0646) + jsu(0x200c) + jsu(0x0646) + jsu(0x0698) + jsu(0x0627) + jsu(0x062f) + ')'

func1 = f'''function getMizajForm() {{
    var h = '<div class="mizaj-container" style="max-width:800px;margin:0 auto;">';
    h += '<h3 style="color:#a29bfe;text-align:center;">{title}</h3>';
    h += '<div style="display:flex;justify-content:center;gap:20px;margin:20px 0;background:rgba(255,255,255,0.03);padding:15px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">';
    h += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 16px;border-radius:30px;background:rgba(108,92,231,0.2);border:1px solid #6c5ce7;" id="lbl_mmq">';
    h += '<input type="radio" name="mizaj_type" value="mmq" checked onchange="toggleMizajForms()"> {label_mmq}</label>';
    h += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 16px;border-radius:30px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);" id="lbl_smq">';
    h += '<input type="radio" name="mizaj_type" value="smq" onchange="toggleMizajForms()"> {label_smq}</label>';
    h += '</div>';
    h += '<div id="mmq-questions"></div>';
    h += '<div id="smq-questions" style="display:none;"></div>';
    h += '<div id="mizaj-result" style="margin-top:25px;"></div>';
    h += '</div>';
    return h;
}}
'''

func2 = '''function toggleMizajForms() {
    var type = document.querySelector('input[name="mizaj_type"]:checked').value;
    document.getElementById('mmq-questions').style.display = (type === 'mmq') ? 'block' : 'none';
    document.getElementById('smq-questions').style.display = (type === 'smq') ? 'block' : 'none';
    document.getElementById('lbl_mmq').style.background = (type === 'mmq') ? 'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.05)';
    document.getElementById('lbl_mmq').style.borderColor = (type === 'mmq') ? '#6c5ce7' : 'rgba(255,255,255,0.1)';
    document.getElementById('lbl_smq').style.background = (type === 'smq') ? 'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.05)';
    document.getElementById('lbl_smq').style.borderColor = (type === 'smq') ? '#6c5ce7' : 'rgba(255,255,255,0.1)';
}

function getMmqQuestions() {
    var qs = MIZAJ_MMQ_QS;
    var opts = '<option value="1">' + chr(0x06f1) + ' (' + chr(0x0633)+chr(0x0631)+chr(0x062f) + ' / ' + chr(0x06a9)+chr(0x0645) + ')</option>' +
        '<option value="2" selected>' + chr(0x06f2) + ' (' + chr(0x0645)+chr(0x0639)+chr(0x062a)+chr(0x062f)+chr(0x0644) + ' / ' + chr(0x0645)+chr(0x062a)+chr(0x0648)+chr(0x0633)+chr(0x0637) + ')</option>' +
        '<option value="3">' + chr(0x06f3) + ' (' + chr(0x06af)+chr(0x0631)+chr(0x0645) + ' / ' + chr(0x0632)+chr(0x06cc)+chr(0x0627)+chr(0x062f) + ')</option>';
    var h = '<div style="background:rgba(255,255,255,0.03);padding:20px;border-radius:16px;border:1px solid rgba(255,255,255,0.05);">';
    qs.forEach(function(q, i) {
        h += '<div class="form-group" style="margin-bottom:15px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:12px;">' +
            '<label style="display:block;margin-bottom:6px;font-weight:bold;color:#ddd;font-size:0.95rem;">' + (i+1) + '. ' + q + '</label>' +
            '<select id="mmq_q' + (i+1) + '" style="width:100%;padding:10px;border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);">' + opts + '</select></div>';
    });
    return h + '</div>';
}
'''

func3 = '''function getSmqQuestions() {
    var qs = MIZAJ_SMQ_QS;
    var h = '<div style="background:rgba(255,255,255,0.03);padding:20px;border-radius:16px;border:1px solid rgba(255,255,255,0.05);">';
    qs.forEach(function(q, i) {
        var isHot = (i < 15);
        var opts = '';
        for (var v = 1; v <= 5; v++) {
            var sel = (v === 3) ? ' selected' : '';
            opts += '<option value="' + v + '"' + sel + '>' + v + '</option>';
        }
        h += '<div class="form-group" style="margin-bottom:15px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:12px;">' +
            '<label style="display:block;margin-bottom:6px;font-weight:bold;color:#ddd;font-size:0.95rem;">' + (i+1) + '. ' + q + '</label>' +
            '<select id="smq_q' + (i+1) + '" style="width:100%;padding:10px;border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);">' + opts + '</select></div>';
    });
    return h + '</div>';
}

function submitMizaj() {
    var type = document.querySelector('input[name="mizaj_type"]:checked').value;
    var answers = {};
    var prefix = (type === 'mmq') ? 'mmq_q' : 'smq_q';
    var total = (type === 'mmq') ? 10 : 20;
    for (var i = 1; i <= total; i++) {
        var el = document.getElementById(prefix + i);
        if (el) answers['q' + i] = parseInt(el.value);
    }
    document.getElementById('mizaj-result').innerHTML = '<p style="text-align:center;color:#aaa;">...calculating...</p>';
    fetch('/api/v5/mizaj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire_type: type, answers: answers })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') displayMizajResult(data.data);
        else document.getElementById('mizaj-result').innerHTML = '<p style="color:#ff6b6b;">Error</p>';
    })
    .catch(function() {
        document.getElementById('mizaj-result').innerHTML = '<p style="color:#ff6b6b;">Connection error</p>';
    });
}

function displayMizajResult(data) {
    var recs = data.recommendations.map(function(r) { return '<li style="margin:8px 0;color:#ddd;list-style:none;">- ' + r + '</li>'; }).join('');
    document.getElementById('mizaj-result').innerHTML =
        '<div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:25px;margin-top:20px;">' +
        '<h4 style="color:#a29bfe;text-align:center;font-size:1.4rem;">Mizaj: ' + data.temperament + '</h4>' +
        '<p style="color:#ccc;text-align:center;">' + data.description + '</p>' +
        '<div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:15px;margin-top:10px;">' +
        '<h5 style="color:#fdcb6e;">Recommendations:</h5>' +
        '<ul style="padding:0;margin:0;">' + recs + '</ul></div></div>';
}
'''

with open('static/mizaj.js', 'a', encoding='utf-8') as f:
    f.write(func1)
    f.write(func2)
    f.write(func3)

with open('static/mizaj.js', 'r', encoding='utf-8') as f:
    content = f.read()
print(f'Written static/mizaj.js: {len(content)} bytes')
print(f'Has MMQ data: {"MIZAJ_MMQ_QS" 
