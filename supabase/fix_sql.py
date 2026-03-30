import os

file_path = "recreate_database.sql"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

sec7_index = content.find("-- 7. RLS POLICIES")
sec8_index = content.find("-- 8. DATABASE FUNCTIONS")
sec9_index = content.find("-- 9. TRIGGERS")

if sec7_index != -1 and sec8_index != -1 and sec9_index != -1:
    pre = content[:sec7_index]
    part7 = content[sec7_index:sec8_index]
    part8 = content[sec8_index:sec9_index]
    post = content[sec9_index:]
    
    part7 = part7.replace("-- 7. RLS POLICIES", "-- 8. RLS POLICIES")
    part8 = part8.replace("-- 8. DATABASE FUNCTIONS", "-- 7. DATABASE FUNCTIONS")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(pre + part8 + part7 + post)
    print("Done")
else:
    print("Failed to find sections")
