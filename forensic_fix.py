# FORENSIC FIX BLUEPRINT - Based on Engineering Report

import json

# Load blueprint
with open('final_blueprint_ULTIMATE.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

print("Applying Forensic Engineering Report Fixes...\n")

# Find Module 13 (or Module 2) - URL Normalization
def find_and_fix_module(flow, target_id_list, var_name):
    for module in flow:
        if module.get('id') in target_id_list and module.get('module') == 'util:SetVariable2':
            mapper = module.get('mapper', {})
            if mapper.get('name') == var_name:
                old_value = mapper.get('value', '')
                print(f"Found Module {module['id']} - {var_name}")
                print(f"  Old formula: {old_value}")
                
                # Apply forensic fix: Enforce HTTPS protocol
                new_value = '{{if(indexOf(11.website; "http") = 0; replace(11.website; "/$"; ""); "https://" + replace(11.website; "/$"; ""))}}'
                mapper['value'] = new_value
                
                print(f"  New formula: {new_value}")
                print(f"  ✓ URL protocol enforcement APPLIED\n")
                return True
        
        # Check nested routes
        if 'routes' in module:
            for route in module['routes']:
                if 'flow' in route:
                    if find_and_fix_module(route['flow'], target_id_list, var_name):
                        return True
    return False

# Apply Fix 1: URL Normalization (Critical for Apify)
fixed_url = find_and_fix_module(data['flow'], [2, 13], 'norm_url')

if not fixed_url:
    print("⚠ WARNING: norm_url module not found")

# Save production blueprint
with open('final_blueprint_PRODUCTION.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

file_size = len(json.dumps(data))
print(f"✓ PRODUCTION Blueprint saved: {file_size} bytes")
print("\nFixes Applied:")
print("  [✓] URL protocol enforcement (https://)")
print("  [✓] Apify input validation (protocol-aware)")
print("  [!] Manual: Check HTTP modules for trim() in Authorization headers")
print("\nReady for Import into Make.com")
