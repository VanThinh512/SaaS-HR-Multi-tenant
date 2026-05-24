import os
import re
import socket
import sys

def parse_env_file(filepath):
    """Manually parse .env file without external dependencies like python-dotenv."""
    env_vars = {}
    if not os.path.exists(filepath):
        return env_vars
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                key = key.strip()
                val = val.strip()
                # Strip quotes if present
                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                env_vars[key] = val
    return env_vars

def parse_mysql_url(url):
    """Parse mysql+pymysql://user:pass@host:port/dbname."""
    pattern = r"mysql\+pymysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)"
    match = re.match(pattern, url)
    if not match:
        return None
    user, password, host, port, dbname = match.groups()
    return {
        "user": user,
        "password": password,
        "host": host,
        "port": int(port),
        "database": dbname
    }

def check_port(host, port):
    """Check if the TCP port is open."""
    try:
        with socket.create_connection((host, port), timeout=3):
            return True
    except Exception:
        return False

def test_connections():
    print("=" * 60)
    print(" SaaS HR Multi-Tenant: Database Connection Diagnostics")
    print("=" * 60)
    
    env_path = ".env"
    if not os.path.exists(env_path):
        print(f"[-] ERROR: .env file not found at {os.path.abspath(env_path)}")
        print("    Please copy .env_example to .env and configure it.")
        sys.exit(1)
        
    env_vars = parse_env_file(env_path)
    
    # Check MySQL settings
    mysql_host = env_vars.get("MYSQL_HOST", "localhost")
    mysql_port_str = env_vars.get("MYSQL_PORT", "3307")
    try:
        mysql_port = int(mysql_port_str)
    except ValueError:
        mysql_port = 3307
        
    print(f"[*] Testing basic TCP connectivity to MySQL at {mysql_host}:{mysql_port}...")
    if not check_port(mysql_host, mysql_port):
        print(f"[-] CONNECTION FAILED: Port {mysql_port} on {mysql_host} is closed.")
        print("    Please ensure Docker containers are running (docker-compose up -d) ")
        print("    or your local MySQL server is started.")
        sys.exit(1)
    print("[+] TCP connectivity OK!")
    print("-" * 60)

    # Database URLs to verify
    db_urls = {
        "Tenant DB": "DATABASE_TENANT_URL",
        "Auth DB": "DATABASE_AUTH_URL",
        "HR DB": "DATABASE_HR_URL"
    }
    
    # Try importing PyMySQL to run authentication queries
    has_pymysql = False
    try:
        import pymysql
        has_pymysql = True
    except ImportError:
        print("[!] Warning: 'pymysql' package is not installed in your current host python env.")
        print("    Skipping deep credentials/schema checks. Install it with: pip install pymysql")
        print("    (If running inside Docker, this check runs automatically on startup).")
        
    success = True
    for db_name, var_name in db_urls.items():
        url = env_vars.get(var_name)
        if not url:
            print(f"[-] {db_name}: Environment variable {var_name} is missing in .env")
            success = False
            continue
            
        params = parse_mysql_url(url)
        if not params:
            print(f"[-] {db_name}: Invalid format for {var_name}: {url}")
            success = False
            continue
            
        print(f"[*] Testing connection for {db_name} (Database: {params['database']})...")
        
        if has_pymysql:
            try:
                conn = pymysql.connect(
                    host=params["host"],
                    port=params["port"],
                    user=params["user"],
                    password=params["password"],
                    database=params["database"],
                    connect_timeout=3
                )
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                conn.close()
                print(f"[+] {db_name}: SUCCESS (Connected and queried SELECT 1)")
            except pymysql.err.OperationalError as e:
                # Common errors: 1049 (Unknown DB), 1045 (Access denied)
                err_code = e.args[0]
                if err_code == 1049:
                    print(f"[-] {db_name}: FAILED - Database '{params['database']}' does not exist.")
                elif err_code == 1045:
                    print(f"[-] {db_name}: FAILED - Access denied (Wrong username/password).")
                else:
                    print(f"[-] {db_name}: FAILED - {str(e)}")
                success = False
            except Exception as e:
                print(f"[-] {db_name}: FAILED - {str(e)}")
                success = False
        else:
            # Basic fallback port check
            if check_port(params["host"], params["port"]):
                print(f"[+] {db_name}: Port OK (Credentials not checked without pymysql)")
            else:
                print(f"[-] {db_name}: Port closed at {params['host']}:{params['port']}")
                success = False
                
    print("=" * 60)
    if success:
        print("[+] SUCCESS: All database connection diagnostics passed!")
        sys.exit(0)
    else:
        print("[-] FAILURE: Some database connection checks failed. See details above.")
        sys.exit(1)

if __name__ == "__main__":
    test_connections()
