
import json

# Configuration
CREDENTIALS = {
    "brandfetch_token": "Bearer rntRA0ixB5ftNaas08Fig94MEUV9WIYRIerZVmPUy_EExmuHQ6xRELbnS4JFlPpOo9GozQ6crcYYUA5yIif0Jw",
    "apify_conn": 10942194,
    "drive_conn": 7740843,
    "docs_conn": 10941496,
    "gemini_conn": 10945047
}

MODULE_41_JSON = {
    "id": 41,
    "module": "gemini-ai:createACompletionGeminiPro",
    "version": 1,
    "parameters": {
        "__IMTCONN__": CREDENTIALS["gemini_conn"]
    },
    "mapper": {
        "model": "gemini-2.5-pro",
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": "Analysiere den folgenden Website-Text und extrahiere alle Mitarbeiter-Benefits bzw. Arbeitgeberleistungen oder Vorteile für Mitarbeiter.\r\n\r\nFormatiere das Ergebnis **ausschließlich** als Bullet-Point-Liste in deutscher Sprache.\r\n\r\nBeispiele:\r\n- Home-Office\r\n- 30 Urlaubstage\r\n- Betriebliche Altersvorsorge\r\n- Weiterbildungsmöglichkeiten\n- Weihnachtsgeld\n- Urlaubsgeld\n- Vermögenswirksame Leistungen\n\nWenn im Text keine Benefits zu finden sind, gib nur einen Eintrag zurück:\n\r\n- Kein Benefit gefunden auf {{11.website}}\r\n\r\nAntwort: Gib nur die Liste aus, keine zusätzlichen Kommentare, keine Erklärungen.\r\n\r\nWebsite-Inhalt:\r\n{{50.aggregated_text}}",
                        "type": "text"
                    }
                ]
            }
        ],
        "generationConfig": {
            "imageConfig": {},
            "temperature": "0.2",
            "thinkingConfig": {},
            "responseModalities": [
                "text"
            ]
        },
        "system_instruction": {}
    },
    "metadata": {
        "designer": {
            "x": 3900,
            "y": 0
        }
    }
}

def update_blueprint(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        blueprint = json.load(f)

    # Helper function to update credentials recursively
    def recursively_update(items):
        if isinstance(items, list):
            for item in items:
                recursively_update(item)
        elif isinstance(items, dict):
            # Update Credentials based on Module ID or Type
            if "module" in items:
                mod_id = items.get("id")
                mod_type = items.get("module")
                
                # Brandfetch (Module 87)
                if mod_id == 87 and mod_type == "http:MakeRequest":
                    if "mapper" in items and "headers" in items["mapper"]:
                        for header in items["mapper"]["headers"]:
                            if header["name"] == "Authorization":
                                header["value"] = CREDENTIALS["brandfetch_token"]
                                print(f"Updated Brandfetch Token for Module {mod_id}")

                # Apify (Modules 48, 61)
                if mod_id in [48, 61] or (mod_type and "apify" in mod_type):
                    if "parameters" in items and "__IMTCONN__" in items["parameters"]:
                        items["parameters"]["__IMTCONN__"] = CREDENTIALS["apify_conn"]
                        print(f"Updated Apify Connection for Module {mod_id}")

                # Google Drive (Module 25)
                if mod_id == 25 or (mod_type == "google-drive:createAFolder"):
                    if "parameters" in items and "__IMTCONN__" in items["parameters"]:
                        items["parameters"]["__IMTCONN__"] = CREDENTIALS["drive_conn"]
                        print(f"Updated Drive Connection for Module {mod_id}")
                
                # Google Docs (Module 26)
                if mod_id == 26 or (mod_type == "google-docs:createADocument"):
                    if "parameters" in items and "__IMTCONN__" in items["parameters"]:
                        items["parameters"]["__IMTCONN__"] = CREDENTIALS["docs_conn"]
                         # Also update Gemini conn if it was mistakenly set here, but logic says specific ID
                        print(f"Updated Docs Connection for Module {mod_id}")

                # Gemini (Module 7)
                if mod_id == 7 or (mod_type and "gemini" in mod_type):
                    if "parameters" in items and "__IMTCONN__" in items["parameters"]:
                        items["parameters"]["__IMTCONN__"] = CREDENTIALS["gemini_conn"]
                        print(f"Updated Gemini Connection for Module {mod_id}")

                # Router logic to add Module 41
                if mod_id == 67 and mod_type == "builtin:BasicRouter":
                    # Check if Module 41 already exists in routes
                    found_41 = False
                    for route in items.get("routes", []):
                        for mod in route.get("flow", []):
                            if mod.get("id") == 41:
                                found_41 = True
                    
                    if not found_41:
                        print("Adding Module 41 to Module 67 Router")
                        # Add new route
                        new_route = {
                            "flow": [MODULE_41_JSON]
                        }
                        if "routes" not in items:
                            items["routes"] = []
                        items["routes"].append(new_route)

            # Recurse into nested structures (routes, flows)
            for key, value in items.items():
                recursively_update(value)

    recursively_update(blueprint["flow"])

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(blueprint, f, indent=2, ensure_ascii=False)
    print(f"Successfully saved updated blueprint to {output_file}")

if __name__ == "__main__":
    update_blueprint("c:\\Users\\HP\\Desktop\\Automated Employer\\IMPORT_ME.json", "c:\\Users\\HP\\Desktop\\Automated Employer\\FINAL_IMPORT_ME.json")
