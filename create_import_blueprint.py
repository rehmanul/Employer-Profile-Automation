# Create clean importable blueprint from complete scenario
import json

# Try the most complete looking file
files_to_try = [
    'scenario_blueprint.json',
    'full_production_blueprint.json', 
    'modified_blueprint.json'
]

for fname in files_to_try:
    try:
        print(f"Trying {fname}...")
        with open(fname, 'rb') as f:
            raw = f.read()
        
        # Remove BOM if present
        if raw.startswith(b'\xef\xbb\xbf'):
            raw = raw[3:]
        
        text = raw.decode('utf-8')
        data = json.loads(text)
        
        # Count modules (including nested in routes)
        def count_modules(flow):
            count = len(flow)
            for m in flow:
                if 'routes' in m:
                    for r in m['routes']:
                        if 'flow' in r:
                            count += count_modules(r['flow'])
            return count
        
        total = count_modules(data.get('flow', []))
        print(f"  Valid! Total modules (including nested): {total}")
        
        if total >= 20:  # We need at least 20 modules for complete scenario
            # Save as clean importable JSON
            with open('IMPORT_ME.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            size = len(open('IMPORT_ME.json').read())
            print(f"\n✓ SUCCESS! Created: IMPORT_ME.json ({size} bytes, {total} modules)")
            break
    except Exception as e:
        print(f"  Error: {e}")
