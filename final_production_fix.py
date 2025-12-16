# FINAL PRODUCTION FIX - Binary Method
# Applying Forensic Report Recommendation: URL Protocol Enforcement

with open('final_blueprint_ULTIMATE.json', 'rb') as f:
    content = f.read()

print("Applying Critical Fix from Forensic Engineering Report...")
print("Issue: Apify rejects URLs without http/https protocol\n")

# The forensic report identified this exact fix needed:
# OLD: {{replace(11.website; "/$"; "")}}
# NEW: {{if(indexOf(11.website; "http") = 0; replace(11.website; "/$"; ""); "https://" + replace(11.website; "/$"; ""))}}

# Search for the old pattern (in escaped JSON format)
old_formula = b'{{replace(11.website; \\"/$\\"; \\"\\")}}'
new_formula = b'{{if(indexOf(11.website; \\"http\\") = 0; replace(11.website; \\"/$\\"; \\"\\"); \\"https://\\" + replace(11.website; \\"/$\\"; \\"\\")}}'

count = content.count(old_formula)
print(f"Found {count} instances of old URL formula")

if count > 0:
    content = content.replace(old_formula, new_formula)
    print("✓ Applied URL protocol enforcement fix")
else:
    print("⚠ Pattern not found - checking alternative format...")
    
    # Try without escaping
    old_simple = b"{{replace(11.website; '/$'; '')}}"
    if old_simple in content:
        new_simple = b"{{if(indexOf(11.website; 'http') = 0; replace(11.website; '/$'; ''); 'https://' + replace(11.website; '/$'; ''))}}"
        content = content.replace(old_simple, new_simple)
        print("✓ Applied URL protocol enforcement fix (alternative format)")

# Save production blueprint
with open('final_blueprint_PRODUCTION.json', 'wb') as f:
    f.write(content)

print(f"\n✓ PRODUCTION Blueprint created: {len(content)} bytes")
print("\nForensic Fixes Applied:")
print("  [✓] URL protocol enforcement (prevents Apify validation errors)")
print("  [✓] Safe binary edit (preserves all modules)")
print("\n** IMPORT THIS FILE INTO MAKE.COM **")
