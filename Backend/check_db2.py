from Supplier_Portal_Dashboard.database import SupplierPortalDB

conn = SupplierPortalDB.get_connection()
cursor = conn.cursor()

def check_table(table_name):
    try:
        cursor.execute(f"DESCRIBE {table_name}")
        print(f"\n--- {table_name} ---")
        for row in cursor.fetchall():
            print(f"{row[0]}: {row[1]}")
    except Exception as e:
        print(f"Error: {e}")

check_table("supplier_pricing")

cursor.close()
conn.close()
