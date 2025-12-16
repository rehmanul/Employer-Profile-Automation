import json

# Load the blueprint
with open('Employer Profile Automation.blueprint.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def extract_modules(flow, depth=0):
    """Recursively extract all modules from blueprint"""
    modules = []
    for module in flow:
        if 'id' in module:
            modules.append({
                'id': module['id'],
                'type': module.get('module', 'router'),
                'depth': depth
            })
        # Check for router routes
        if 'routes' in module:
            for route in module.get('routes', []):
                if 'flow' in route:
                    modules.extend(extract_modules(route['flow'], depth + 1))
    return modules

# Extract all modules
all_modules = extract_modules(data.get('flow', []))

# Print summary
print("=" * 60)
print("BLUEPRINT MODULE ANALYSIS")
print("=" * 60)
print(f"\nTotal modules found: {len(all_modules)}\n")

# Group by type
apify_modules = [m for m in all_modules if 'apify' in m['type'].lower()]
gemini_modules = [m for m in all_modules if 'gemini' in m['type'].lower()]
google_modules = [m for m in all_modules if 'google' in m['type'].lower()]
http_modules = [m for m in all_modules if 'http' in m['type'].lower()]
util_modules = [m for m in all_modules if 'util' in m['type'].lower()]
router_modules = [m for m in all_modules if 'router' in m['type'].lower()]
other_modules = [m for m in all_modules if not any(x in m['type'].lower() for x in ['apify','gemini','google','http','util','router'])]

print("APIFY MODULES (to be removed):")
for m in apify_modules:
    print(f"  ID {m['id']:3d} | {m['type']}")

print("\nGEMINI AI MODULES:")
for m in gemini_modules:
    print(f"  ID {m['id']:3d} | {m['type']}")

print("\nGOOGLE MODULES (Drive/Docs):")
for m in google_modules:
    print(f"  ID {m['id']:3d} | {m['type']}")

print("\nHTTP MODULES (Brandfetch):")
for m in http_modules:
    print(f"  ID {m['id']:3d} | {m['type']}")

print("\nUTILITY MODULES (Variables):")
for m in util_modules:
    print(f"  ID {m['id']:3d} | {m['type']}")

print("\nROUTERS:")
for m in router_modules:
    print(f"  ID {m['id']:3d} | {m['type']}")

print("\nOTHER MODULES:")
for m in other_modules:
    print(f"  ID {m['id']:3d} | {m['type']}")

print("\n" + "=" * 60)
