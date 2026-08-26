import json

with open('.freebuff/mizaj_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

mmq = json.dumps(data['mmq_qs'], ensure_ascii=False)
smq = json.dumps(data['smq_qs'], ensure_ascii=False)

# Build the JS content line by line
lines = []
lines.append('// Mizaj Questionnaire - MMQ (10Q) & SMQ (20Q)')
lines.append('var MIZAJ_MMQ_QS = ' + mmq + ';')
lines.append('var MIZAJ_SMQ_QS = ' + smq + ';')
lines.append('')
lines.append('function getMizajForm() {')
lines.append('    return "<div class=mizaj-container style=max-width:800px;margin:0 auto;>";')
lines.append('}')

with open('static/mizaj.js', 'w', encoding='utf-8') as f:
    f.write(chr(10).join(lines))
print('Written mizaj.js:', len(lines), 'lines')
