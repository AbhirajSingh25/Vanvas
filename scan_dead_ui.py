import os
import re

scan_dirs = ['app', 'components', 'context', 'lib', 'types']
total_files = 0
alerts = 0
href_hashes = 0
todos = 0
console_logs = 0

for sdir in scan_dirs:
    target = os.path.join('frontend', sdir)
    for root, dirs, files in os.walk(target):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                total_files += 1
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    alerts += len(re.findall(r'\balert\(', content))
                    href_hashes += len(re.findall(r'href=[\"\']#[\"\']', content))
                    todos += len(re.findall(r'\b(TODO|FIXME)\b', content))
                    console_logs += len(re.findall(r'console\.log\(', content))

print(f"Total frontend source files: {total_files}")
print(f"alert() calls: {alerts}")
print(f"href='#' links: {href_hashes}")
print(f"TODO/FIXME: {todos}")
print(f"console.log(): {console_logs}")
