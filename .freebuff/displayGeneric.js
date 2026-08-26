function displayGenericChart(data, title) {
    var chart = data.chart_data || data;
    var subject = chart.subject || {};
    var html = '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u{1f30d}</span> '+title+'</div><div class="grid-masonry">';
    if (subject.first_subject || subject.inner_subject) {
        var s1 = subject.first_subject || subject.inner_subject;
        var s2 = subject.second_subject || subject.outer_subject;
        html += '<div class="person-label">\u{1f464} \u0634\u062e\u0635 \u0627\u0648\u0644</div>' + renderPlanetGrid(s1);
        html += '<div class="person-label">\u{1f464} \u0634\u062e\u0635 \u062f\u0648\u0645</div>' + renderPlanetGrid(s2);
    } else {
        html += renderPlanetGrid(subject);
    }
    html += '</div></div>';
    if (chart.aspects && chart.aspects.length > 0) {
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u26a1</span> \u062c\u0646\u0628\u0647\u200c\u0647\u0627 <span class="badge-count">'+chart.aspects.length+'</span></div><div class="grid-flex">';
        chart.aspects.forEach(function(a) {
            html += '<span class="aspect-item visible">'+translate(a.p1_name||'')+' '+translate(a.aspect||'')+' '+translate(a.p2_name||'')+' ('+(a.orbit?a.orbit.toFixed(1):'?')+'\u00b0)</span>';
        });
        html += '</div></div>';
    }
    if (chart.relationship_score) {
        var rs = chart.relationship_score;
        html += '<div class="section-card visible"><div class="section-title"><span class="emoji-big">\u{1f495}</span> \u0627\u0645\u062a\u06cc\u0627\u0632</div><div class="analysis-box"><h2>\u{1f3c6} \u0627\u0645\u062a\u06cc\u0627\u0632: '+(rs.score_value||rs.score||'?')+' / 100</h2><p>'+(rs.score_description||'')+'</p></div></div>';
    }
    return html;
}

