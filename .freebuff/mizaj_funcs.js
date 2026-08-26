// ================================================================
//   MIZAJ SECTION - MMQ (10Q) & SMQ (20Q)
// ================================================================

function getMizajForm() {
    return '<div class="mizaj-container" style="max-width:800px;margin:0 auto;">' +
        '<h3 style="color:#a29bfe;text-align:center;">\U0001f9ec \u062a\u0639\u06cc\u06cc\u0646 \u0645\u0632\u0627\u062c \u0628\u0627 \u067e\u0631\u0633\u0634\u0646\u0627\u0645\u0647\u200c\u0647\u0627\u06cc \u0645\u0639\u062a\u0628\u0631</h3>' +
        '<div style="display:flex;justify-content:center;gap:20px;margin:20px 0;background:rgba(255,255,255,0.03);padding:15px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">' +
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 16px;border-radius:30px;background:rgba(108,92,231,0.2);border:1px solid #6c5ce7;" id="lbl_mmq">' +
        '<input type="radio" name="mizaj_type" value="mmq" checked onchange="toggleMizajForms()"> \u06f1\u06f0 \u0633\u0648\u0627\u0644\u06cc (\u0645\u062c\u0627\u0647\u062f)</label>' +
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 16px;border-radius:30px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);" id="lbl_smq">' +
        '<input type="radio" name="mizaj_type" value="smq" onchange="toggleMizajForms()"> \u06f2\u06f0 \u0633\u0648\u0627\u0644\u06cc (\u0633\u0644\u0645\u0627\u0646\u200c\u0646\u0698\u0627\u062f)</label>' +
        '</div>' +
        '<div id="mmq-questions">' + getMmqQuestions() + '</div>' +
        '<div id="smq-questions" style="display:none;">' + getSmqQuestions() + '</div>' +
        '<div id="mizaj-result" style="margin-top:25px;"></div>' +
        '</div>';
}
