## python scripts/repair_mojibake.py "data/raw/myfriends/ES/spa/firststeps/next.html"


from pathlib import Path
import shutil
import sys
import re

# Common mojibake sequences resulting from UTF-8
# being incorrectly interpreted as Windows-1252.
MOJIBAKE_PATTERN = re.compile(r"(?:Ã.|Â.|Ø.|Ù.)+")


def repair_mojibake(text):
    def repair_match(match):
        corrupted = match.group(0)

        try:
            return corrupted.encode("cp1252").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            try:
                return corrupted.encode("latin-1").decode("utf-8")
            except (UnicodeEncodeError, UnicodeDecodeError):
                return corrupted

    return MOJIBAKE_PATTERN.sub(repair_match, text)


for filename in sys.argv[1:]:
    path = Path(filename)

    original = path.read_text(encoding="utf-8")

    corrected = repair_mojibake(original)

    if corrected == original:
        print(f"Skipped (no repairable mojibake found): {path}")
        continue

    # Back up the original file.
    backup = path.with_name(path.name + ".bak")
    shutil.copy2(path, backup)

    # Save corrected HTML as UTF-8.
    path.write_text(corrected, encoding="utf-8")

    print(f"Repaired: {path}")
    print(f"Backup:   {backup}")