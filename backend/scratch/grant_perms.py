import psycopg2
from psycopg2 import sql

def grant_permissions():
    try:
        # Try port 5432
        print("Trying port 5432...")
        conn = psycopg2.connect(
            dbname='bbmc_dam_monitoring',
            user='postgres',
            password='181219',
            host='localhost',
            port='5432'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("GRANT ALL PRIVILEGES ON SCHEMA public TO bbmc_user;")
        cur.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bbmc_user;")
        cur.execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bbmc_user;")
        cur.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bbmc_user;")
        cur.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bbmc_user;")
        
        print("Permissions granted successfully to bbmc_user on port 5432.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error on 5432: {e}")

if __name__ == "__main__":
    grant_permissions()
