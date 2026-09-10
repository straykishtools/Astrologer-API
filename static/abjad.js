// ============================================
// ABJAD (ابجد) TAB
// ============================================

function getAbjadForm() {
    var h = '<div style="max-width:900px;margin:0 auto;">';
    h += '<h3 style="color:#a29bfe;text-align:center;">\u{1f522} \u0627\u0628\u062c\u062f - \u0645\u062d\u0627\u0633\u0628\u0647 \u0648 \u062a\u0637\u0628\u06cc\u0642</h3>';

    // --- Single word calculation ---
    h += '<div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:30px;border:1px solid rgba(255,255,255,0.05);">';
    h += '<h4 style="color:#fdcb6e;margin-top:0;">\u{1f4dd} \u0645\u062d\u0627\u0633\u0628\u0647\u0654 \u0627\u0628\u062c\u062f \u06cc\u06a9 \u06a9\u0644\u0645\u0647</h4>';
    h += '<div class="form-group">';
    h += '<label>\u0645\u062a\u0646 (\u06a9\u0644\u0645\u0647 \u06cc\u0627 \u0646\u0627\u0645)</label>';
    h += '<input id="abjadText" placeholder="\u0645\u062b\u0644\u0627\u064b: \u0639\u0644\u06cc" value="\u0639\u0644\u06cc" style="width:100%;padding:10px;border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);">';
    h += '</div>';
    h += '<div class="form-group">';
    h += '<label>\u0646\u0648\u0639 \u0627\u0628\u062c\u062f</label>';
    h += '<select id="abjadMethod" style="width:100%;padding:10px;border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);">';
    h += '<option value="kabir">\u06a9\u0628\u06cc\u0631</option>';
    h += '<option value="saghir">\u0635\u063a\u06cc\u0631</option>';
    h += '</select></div>';
    h += '<button class="btn-primary" onclick="submitAbjadSingle()">\u{1f9ee} \u0645\u062d\u0627\u0633\u0628\u0647</button>';
    h += '<div id="abjadSingleResult" style="margin-top:15px;"></div>';
    h += '</div>';

    // --- Two names comparison ---
    h += '<div style="background:rgba(255,255,255,0.03);border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.05);">';
    h += '<h4 style="color:#fdcb6e;margin-top:0;">\u{1f517} \u062a\u0637\u0628\u06cc\u0642 \u062f\u0648 \u0646\u0627\u0645 (\u0633\u0627\u0632\u06af\u0627\u0631\u06cc)</h4>';
    h += '<div class="form-group">';
    h += '<label>\u0646\u0627\u0645 \u0627\u0648\u0644</label>';
    h += '<input id="abjadName1" placeholder="\u0645\u062b\u0644\u0627\u064b: \u0639\u0644\u06cc" value="\u0639\u0644\u06cc" style="width:100%;padding:10px;border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);">';
    h += '</div>';
    h += '<div class="form-group">';
    h += '<label>\u0646\u0627\u0645 \u062f\u0648\u0645</label>';
    h += '<input id="abjadName2" placeholder="\u0645\u062b\u0644\u0627\u064b: \u0641\u0627\u0637\u0645\u0647" value="\u0641\u0627\u0637\u0645\u0647" style="width:100%;padding:10px;border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);">';
    h += '</div>';
    h += '<div class="form-group">';
    h += '<label>\u0646\u0648\u0639 \u0627\u0628\u062c\u062f</label>';
    h += '<select id="abjadCompareMethod" style="width:100%;padding:10px;border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.1);">';
    h += '<option value="kabir">\u06a9\u0628\u06cc\u0631</option>';
    h += '<option value="saghir">\u0635\u063a\u06cc\u0631</option>';
    h += '</select></div>';
    h += '<button class="btn-secondary" onclick="submitAbjadCompare()" style="width:100%;">\u{1f50d} \u0645\u0642\u0627\u06cc\u0633\u0647</button>';
    h += '<div id="abjadCompareResult" style="margin-top:15px;"></div>';
    h += '</div>';

    h += '</div>';
    return h;
}

// ---------- Single Word API Call ----------

function submitAbjadSingle() {
    var text = document.getElementById('abjadText').value.trim();
    var method = document.getElementById('abjadMethod').value;
    var resultDiv = document.getElementById('abjadSingleResult');

    if (!text) {
        resultDiv.innerHTML = '<p style="color:#ff6b6b;">\u274c \u0644\u0637\u0641\u0627\u064b \u06cc\u06a9 \u06a9\u0644\u0645\u0647 \u06cc\u0627 \u0646\u0627\u0645 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.</p>';
        return;
    }

    resultDiv.innerHTML = '<p style="color:#aaa;">\u23f3 \u062f\u0631 \u062d\u0627\u0644 \u0645\u062d\u0627\u0633\u0628\u0647...</p>';

    fetch('/api/v5/abjad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, method: method })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') displayAbjadResult(data.data, resultDiv);
        else resultDiv.innerHTML = '<p style="color:#ff6b6b;">\u274c \u062e\u0637\u0627: ' + (data.detail || '\u0633\u0631\u0648\u0631') + '</p>';
    })
    .catch(function() {
        resultDiv.innerHTML = '<p style="color:#ff6b6b;">\u274c \u062e\u0637\u0627 \u062f\u0631 \u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u0631</p>';
    });
}

// ---------- Two Names Comparison API Call ----------

function submitAbjadCompare() {
    var name1 = document.getElementById('abjadName1').value.trim();
    var name2 = document.getElementById('abjadName2').value.trim();
    var method = document.getElementById('abjadCompareMethod').value;
    var resultDiv = document.getElementById('abjadCompareResult');

    if (!name1 || !name2) {
        resultDiv.innerHTML = '<p style="color:#ff6b6b;">\u274c \u0644\u0637\u0641\u0627\u064b \u0647\u0631 \u062f\u0648 \u0646\u0627\u0645 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.</p>';
        return;
    }

    resultDiv.innerHTML = '<p style="color:#aaa;">\u23f3 \u062f\u0631 \u062d\u0627\u0644 \u0645\u0642\u0627\u06cc\u0633\u0647...</p>';

    fetch('/api/v5/abjad/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name1: name1, name2: name2, method: method })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') displayAbjadCompareResult(data.data, resultDiv);
        else resultDiv.innerHTML = '<p style="color:#ff6b6b;">\u274c \u062e\u0637\u0627: ' + (data.detail || '\u0633\u0631\u0648\u0631') + '</p>';
    })
    .catch(function() {
        resultDiv.innerHTML = '<p style="color:#ff6b6b;">\u274c \u062e\u0637\u0627 \u062f\u0631 \u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u0631</p>';
    });
}

// ---------- Display Functions ----------

function displayAbjadResult(data, container) {
    var detailsHtml = data.details.map(function(d) {
        return '<span style="display:inline-block;background:rgba(255,255,255,0.05);padding:2px 10px;border-radius:12px;margin:3px;">' + d.char + ' = ' + d.value + '</span>';
    }).join(' ');

    var methodLabel = data.method === 'kabir' ? '\u06a9\u0628\u06cc\u0631' : '\u0635\u063a\u06cc\u0631';
    var interp = data.interp || {};

    var interpHtml = '';
    if (data.method === 'kabir' && interp.element) {
        interpHtml = '<div style="margin-top:14px;padding:14px 16px;background:rgba(253,203,110,0.06);border-right:3px solid rgba(253,203,110,0.45);border-radius:10px;">';
        // \u0639\u0646\u0635\u0631
        interpHtml += '<div style="font-size:1rem;font-weight:800;color:#fdcb6e;">' + interp.element + '</div>';
        interpHtml += '<div style="font-size:0.85rem;color:#ccc;line-height:1.9;margin-top:4px;">' + interp.element_desc + '</div>';
        // \u0645\u0639\u0646\u0627\u06cc \u0645\u0633\u062a\u0642\u06cc\u0645 \u0639\u062f\u062f
        if (interp.direct_meaning) {
            interpHtml += '<div style="margin-top:10px;line-height:2;color:#ddd;font-size:0.9rem;"><b style="color:#a29bfe;">\u{1f52e} \u0645\u0639\u0646\u0627\u06cc \u0639\u062f\u062f ' + data.total + ':</b><br>' + interp.direct_meaning + '</div>';
        } else if (interp.reduced_meaning) {
            interpHtml += '<div style="margin-top:10px;line-height:2;color:#ddd;font-size:0.9rem;"><b style="color:#a29bfe;">\u{1f52e} \u062a\u0641\u0633\u06cc\u0631 (\u0631\u0642\u0645 ' + interp.reduced + '):</b><br>' + interp.reduced_meaning + '</div>';
        }
        interpHtml += '</div>';
    }

    container.innerHTML =
        '<div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:20px;margin-top:10px;">' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;align-items:center;">' +
        '<span style="color:#a29bfe;font-weight:bold;">\u{1f4ca} \u0627\u0628\u062c\u062f ' + methodLabel + '</span>' +
        '<span style="background:#6c5ce7;padding:4px 14px;border-radius:20px;color:#fff;font-size:1.2rem;font-weight:bold;">' + data.total + '</span>' +
        '</div>' +
        '<div style="margin-top:12px;color:#ccc;font-size:0.95rem;">' +
        '<div>\u{1f4dd} \u0645\u062a\u0646: <strong>' + data.text + '</strong></div>' +
        '<div style="margin-top:4px;">\u{1f522} \u062c\u0645\u0639 \u0627\u0631\u0642\u0627\u0645: <strong>' + data.digit_sum + '</strong></div>' +
        '<div style="margin-top:8px;">' + detailsHtml + '</div>' +
        '</div>' +
        interpHtml +
        '</div>';
}

function displayAbjadCompareResult(data, container) {
    var compatColors = {
        '\u0639\u0627\u0644\u06cc': '#00b894',
        '\u062e\u0648\u0628': '#fdcb6e',
        '\u0645\u062a\u0648\u0633\u0637': '#e17055',
        '\u0636\u0639\u06cc\u0641': '#d63031'
    };
    var color = compatColors[data.compatibility] || '#fff';
    var methodLabel = data.method === 'kabir' ? '\u06a9\u0628\u06cc\u0631' : '\u0635\u063a\u06cc\u0631';
    var fa = data.fa || '';

    container.innerHTML =
        '<div style="background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.3);border-radius:16px;padding:20px;margin-top:10px;">' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;align-items:center;">' +
        '<span style="color:#a29bfe;font-weight:bold;">\u{1f517} \u062a\u0637\u0628\u06cc\u0642 (' + methodLabel + ')</span>' +
        '<span style="background:' + color + ';padding:4px 14px;border-radius:20px;color:#000;font-weight:bold;font-size:1.1rem;">' + data.compatibility + '</span>' +
        '</div>' +
        '<div style="margin-top:15px;display:flex;justify-content:space-around;flex-wrap:wrap;text-align:center;">' +
        '<div><strong style="color:#fdcb6e;">' + data.name1 + '</strong><br><span style="font-size:1.3rem;">' + data.value1 + '</span></div>' +
        '<div style="color:#555;font-size:1.5rem;display:flex;align-items:center;">\u2194</div>' +
        '<div><strong style="color:#fdcb6e;">' + data.name2 + '</strong><br><span style="font-size:1.3rem;">' + data.value2 + '</span></div>' +
        '</div>' +
        '<div style="text-align:center;margin-top:12px;color:#ccc;">\u062a\u0641\u0627\u0648\u062a: <strong>' + data.difference + '</strong></div>' +
        (fa ? '<div style="margin-top:14px;padding:12px 16px;background:rgba(253,203,110,0.06);border-right:3px solid rgba(253,203,110,0.45);border-radius:10px;line-height:2;color:#ddd;font-size:0.9rem;"><b style="color:#fdcb6e;">\u{1f52e} \u062a\u0641\u0633\u06cc\u0631 \u067e\u06cc\u0648\u0646\u062f:</b><br>' + fa + '</div>' : '') +
        '</div>';
}