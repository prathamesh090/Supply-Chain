from Supplier_Portal_Dashboard.database import SupplierPortalDB
import json

conn = SupplierPortalDB.get_connection()
cursor = conn.cursor()

def check_table(table_name):
    try:
        cursor.execute(f"DESCRIBE {table_name}")
        print(f"\n--- {table_name} ---")
        for row in cursor.fetchall():
            print(f"{row[0]}: {row[1]}")
    except Exception as e:
        print(f"Error describing {table_name}: {e}")

cursor.execute("SHOW TABLES")
print("=== TABLES ===")
for row in cursor.fetchall():
    print(row[0])

check_table("supplier_profiles")
check_table("supplier_products")
check_table("supplier_documents")

cursor.close()
conn.close()
