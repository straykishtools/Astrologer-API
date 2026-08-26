import base64

# Base64 encoded mizaj JS functions
b64 = open(".freebuff/mizaj_b64.txt").read().strip()
js = base64.b64decode(b64).decode("utf-8")

# Read script.js
with open("static/script.js", "r", encoding="utf-8") as f:
    content = f.read()

# Insert before INIT section
marker = "// ================================================================
//   INIT"
if marker in content:
    content = content.replace(marker, js + "

" + marker)
    with open("static/script.js", "w", encoding="utf-8") as f:
        f.write(content)
    print("Inserted mizaj functions into script.js")
else:
    print("ERROR: INIT marker not found")