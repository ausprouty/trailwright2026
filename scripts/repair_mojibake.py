## python scripts/repair_mojibake.py "data/raw/myfriends/ET/gaz/firststeps/next.html"



from pathlib import Path
import shutil
import sys
from ftfy import fix_encoding

for filename in sys.argv[1:]:
    path = Path(filename)

    original = path.read_text(encoding="utf-8")

    corrected = fix_encoding(original)

    if corrected == original:
        print(f"Skipped (no encoding problems found): {path}")
        continue

    backup = path.with_name(path.name + ".bak")
    shutil.copy2(path, backup)

    path.write_text(corrected, encoding="utf-8")

    print(f"Repaired: {path}")