import sqlite3

DB_NAME= "item.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS items (
            item_name TEXT PRIMARY KEY,
            item_price REAL,
            reason TEXT
            )
    """)
    conn.commit()
    conn.close()

def add_item(item_name, item_price, reason):
    conn = sqlite3.connect(DB_NAME)
    c= conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO items VALUES (?,?,?)",
        (item_name, item_price, reason)
    )
    conn.commit()
    conn.close()
    return f"ADDED {item_name}"


def delete_item(item_name, item_price, reason):
    conn = sqlite3.connect(DB_NAME)
    c= conn.cursor()
    c.execute(
        "DELETE FROM items WHERE item_name =?",
        (item_name,)
    )
    conn.commit()
    conn.close()
    return f"DELETED{item_name}"


def list_items():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT * FROM items")
    rows = c.fetchall()
    conn.close()
    return rows if rows else "No items found"

init_db()
        