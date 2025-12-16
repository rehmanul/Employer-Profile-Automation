import re

with open('final_blueprint_v5_v2.json', 'rb') as f:
    content = f.read()

# 1. Replace includeUrlGlobs content
# We look for the start, and the closing bracket
# The content is inside a JSON string, so it's escaped
start_marker = b'\\"includeUrlGlobs\\": ['
end_marker = b'],\\r\\n\\r\\n  \\"crawlerType'

new_globs = b'\\"{{13.norm_url}}\\",\\r\\n    \\"{{13.norm_url}}/*\\",\\r\\n    \\"*/uber-uns*\\",\\r\\n    \\"*/ueber-uns*\\",\\r\\n    \\"*/about*\\",\\r\\n    \\"*/unternehmen*\\",\\r\\n    \\"*/karriere*\\",\\r\\n    \\"*/jobs*\\",\\r\\n    \\"*/benefits*\\",\\r\\n    \\"*/team*\\",\\r\\n    \\"*/was-uns-ausmacht*\\",\\r\\n    \\"*/wie-wir-arbeiten*\\",\\r\\n    \\"*/wir*\\",\\r\\n    \\"*/company*\\",\\r\\n    \\"*/arbeiten-bei*\\",\\r\\n    \\"*/stellenangebote*\\",\\r\\n    \\"*/vorteile*\\",\\r\\n    \\"*/mitarbeiter*\\"'

# Find start
start_idx = content.find(start_marker)
if start_idx == -1:
    print("Could not find includeUrlGlobs start")
    exit(1)

# Find end (search from start)
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("Could not find includeUrlGlobs end")
    exit(1)

print(f"Replacing content from {start_idx} to {end_idx}")

# Construct new content part 1
# We keep the start_marker, add new globs, close with \r\n  
prefix = content[:start_idx + len(start_marker)]
middle = b'\r\n    ' + new_globs + b'\r\n  '
suffix = content[end_idx:]

new_content = prefix + middle + suffix

# 2. Replace maxCrawlPages
# "maxCrawlPages": 10,
pages_marker = b'\\"maxCrawlPages\\": 10,'
pages_new = b'\\"maxCrawlPages\\": 15,'

if pages_marker in new_content:
    print("Replacing maxCrawlPages")
    new_content = new_content.replace(pages_marker, pages_new)
else:
    print("Could not find maxCrawlPages marker")

with open('final_blueprint_FIXED_SAFE.json', 'wb') as f:
    f.write(new_content)

print(f"Done. Original size: {len(content)}, New size: {len(new_content)}")
