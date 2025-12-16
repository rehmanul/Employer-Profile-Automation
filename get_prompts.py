import re

with open('final_blueprint_FIXED_SAFE.json', 'rb') as f:
    content = f.read()

# Pattern for Module 7 Description
# "text": "Erstelle eine kurze...
pattern_desc = re.compile(b'Erstelle eine kurze.*?ansprechende Arbeitgeberbeschreibung.*?(?=\"\s*})', re.DOTALL)
match_desc = pattern_desc.search(content)

if match_desc:
    print("FOUND DESC PROMPT")
    with open('prompt_desc.bin', 'wb') as f:
        f.write(match_desc.group(0))
else:
    print("DESC PROMPT NOT FOUND")

# Pattern for Module 41 Benefits
# "text": "Analysiere den folgenden Website-Text und extrahiere alle Mitarbeiter-Benefits...
pattern_ben = re.compile(b'Analysiere den folgenden Website-Text.*?extrahiere alle Mitarbeiter-Benefits.*?(?=\"\s*})', re.DOTALL)
match_ben = pattern_ben.search(content)

if match_ben:
    print("FOUND BENEFITS PROMPT")
    with open('prompt_ben.bin', 'wb') as f:
        f.write(match_ben.group(0))
else:
    print("BENEFITS PROMPT NOT FOUND")
