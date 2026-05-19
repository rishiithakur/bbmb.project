from django.db import connection
with connection.cursor() as cur:
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_master'")
    cols = [r[0] for r in cur.fetchall()]
    print(f"Columns in user_master: {cols}")
    
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = [r[0] for r in cur.fetchall()]
    print(f"Tables in public: {tables}")
