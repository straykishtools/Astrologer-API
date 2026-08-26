import json

with open(".freebuff/mizaj_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

mmq = json.dumps(data["mmq_qs"], ensure_ascii=False)
smq = json.dumps(data["smq_qs"], ensure_ascii=False)

with open("static/mizaj.js", "w", encoding="utf-8") as f:
    f.write("// Mizaj Questionnaire
")
    f.write("var MIZAJ_MMQ_QS = " + mmq + ";
")
    f.write("var MIZAJ_SMQ_QS = " + smq + ";

")
    f.write(open(".freebuff/mizaj_funcs_raw.txt", "r", encoding="utf-8").read())

with open("static/mizaj.js", "r", encoding="utf-8") as f:
    c = f.read()
print(f"Written: {len(c)} bytes")