# Build the new script.js
lines = []
def w(s=""): lines.append(s)

# === TAB SWITCHING ===
w('// ================================================================')
w('//   TAB SWITCHING & FORM BUILDERS')
w('// ================================================================')
w("let currentTab = 'birth';")
w("const formContainer = document.getElementById('formContainer');")
w("const calcBtn = document.getElementById('calcBtn');")
w("const formTitle = document.getElementById('formTitle');")
w()
print("Step 1 done")
