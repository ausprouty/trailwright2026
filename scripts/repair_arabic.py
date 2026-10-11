## python scripts/repair_arabic.py "data/raw/myfriends/EG/arb/firststeps/next.html"


from pathlib import Path
import shutil
import sys

# Reverse Windows-1252 decoding, while also handling
# Latin-1 control characters found in the corrupted text.
def repair_mojibake(text):
    result = bytearray()

    for char in text:
        try:
            result.extend(char.encode("latin-1"))
        except UnicodeEncodeError:
            result.extend(char.encode("cp1252"))

    return result.decode("utf-8")


for filename in sys.argv[1:]:
    path = Path(filename)

    original = path.read_text(encoding="utf-8")

    # Only repair files containing the characteristic corruption.
    if "Ø" not in original and "Ù" not in original:
        print(f"Skipped (no Arabic corruption found): {path}")
        continue

    corrected = repair_mojibake(original)

    # Back up before changing anything.
    backup = path.with_name(path.name + ".bak")
    shutil.copy2(path, backup)

    path.write_text(corrected, encoding="utf-8")

    print(f"Repaired: {path}")
    print(f"Backup:   {backup}")