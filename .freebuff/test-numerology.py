import sys
sys.path.insert(0, '.')
from app.engines.numerology import NumerologyEngine
e = NumerologyEngine()
print('Life path:', e.life_path_number(1990, 5, 15))
print('Personal year:', e.personal_year(1990, 5, 15))
print('Expression:', e.expression_number('\u0639\u0644\u06cc'))
print('Soul urge:', e.soul_urge_number('\u0639\u0644\u06cc'))
print('Compat:', e.compatibility(1, 5))
