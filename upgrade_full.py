import re

# Load safe blueprint
with open('final_blueprint_FIXED_SAFE.json', 'rb') as f:
    content = f.read()

# 1. Upgrade Crawler to 30 Pages (Bulletproof scraping)
content = content.replace(b'\\"maxCrawlPages\\": 15,', b'\\"maxCrawlPages\\": 30,')

# 2. Upgrade Description Prompt
# We match the start of the old prompt to replace it safely
old_desc_start = b'Erstelle eine kurze, ansprechende Arbeitgeberbeschreibung'
new_desc = b'Erstelle ein umfassendes, executive-level Arbeitgeberprofil basierend auf: {{50.aggregated_text}}\\r\\n\\r\\nStruktur:\\r\\n1. Executive Summary: Kernkompetenzen & Marktposition\\r\\n2. Unternehmenskultur & Werte (DNA)\\r\\n3. Karriere & Entwicklungschancen\\r\\n4. Key Differentiators (Warum hier arbeiten?)\\r\\n\\r\\nTonality: Professionell, gewinnend, corporate. Keine Markdown-Formatierung, reiner Text mit echten Zeilenumbruechen.'

# Find the full old description string to replace
# It ends with ...\\r\\n\\r\\nDer Text muss lesefertig sein und sich direkt an Bewerber:innen richten.\\r\\n
# We'll use a regex to find the exact span
desc_pattern = re.compile(b'Erstelle eine kurze.*?Bewerber:innen richten\.\\\\r\\\\n', re.DOTALL)
match_desc = desc_pattern.search(content)

if match_desc:
    print("Upgrading Description Prompt to Executive Level...")
    content = content.replace(match_desc.group(0), new_desc)
else:
    print("WARNING: Description prompt NOT found for upgrade.")

# 3. Upgrade Benefits Prompt
# Old starts with: Analysiere den folgenden Website-Text und extrahiere alle Mitarbeiter-Benefits
old_ben_start = b'Analysiere den folgenden Website-Text und extrahiere alle Mitarbeiter-Benefits'
new_ben = b'Fuehre eine Due-Diligence-Analyse der Mitarbeiter-Benefits durch.\\r\\n\\r\\nKategorisiere die Ergebnisse strikt:\\r\\n- Financials (Gehalt, Boni, Aktien)\\r\\n- Work-Life (Home Office, Urlaub, Flexibilitaet)\\r\\n- Health & Well-being (Sport, Gesundheit)\\r\\n- Development (Weiterbildung, Aufstieg)\\r\\n- Office & Perks (Ausstattung, Events)\\r\\n\\r\\nFormatiere ausschliesslich als deutsche Bullet-Point-Liste.\\r\\n\\r\\nWebsite-Inhalt:\\r\\n{{50.aggregated_text}}'

# Old ends with: Website-Inhalt:\\r\\n{{50.aggregated_text}}
ben_pattern = re.compile(b'Analysiere den folgenden Website-Text.*?Website-Inhalt:\\\\r\\\\n\{\{50\.aggregated_text\}\}', re.DOTALL)
match_ben = ben_pattern.search(content)

if match_ben:
    print("Upgrading Benefits Prompt to Due-Diligence Level...")
    content = content.replace(match_ben.group(0), new_ben)
else:
    print("WARNING: Benefits prompt NOT found for upgrade.")


# Save Ultimate Blueprint
with open('final_blueprint_ULTIMATE.json', 'wb') as f:
    f.write(content)

print(f"ULTIMATE Blueprint created. Size: {len(content)}")
