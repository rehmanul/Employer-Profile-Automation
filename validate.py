import json

with open('CLEAN_BLUEPRINT.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print('✅ Valid JSON!')
print(f'📦 Modules: {len(d["flow"])}')
print()
for m in d['flow']:
    print(f'  ID {m["id"]:2d}: {m["module"]}')
