# Clean blueprint for Make.com import
import json

# Read as binary to preserve all characters
with open('final_blueprint_v5_v2.json', 'rb') as f:
    raw = f.read()

# Remove BOM if present
if raw.startswith(b'\xef\xbb\xbf'):
    raw = raw[3:]
    print('Removed BOM')

# Decode
text = raw.decode('utf-8')

# Validate JSON
print('Validating JSON...')
data = json.loads(text)
print(f'Valid! Keys: {list(data.keys())}')
print(f'Flow modules: {len(data.get("flow", []))}')

# Save as clean JSON with proper formatting
with open('CLEAN_BLUEPRINT.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Saved: CLEAN_BLUEPRINT.json')
print('Size:', len(open('CLEAN_BLUEPRINT.json').read()), 'bytes')
