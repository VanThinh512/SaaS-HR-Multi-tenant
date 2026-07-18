#!/usr/bin/env python3
"""
SaaS HR - Seed Script
Chạy bên trong auth-service container (ECS Exec) hoặc từ bastion với tunnel tới RDS.
Yêu cầu: pip install pymysql "passlib[bcrypt]"
"""
import uuid
import os
from passlib.context import CryptContext
import pymysql

# ─── CONFIG ────────────────────────────────────────────────────────────────────
# Lấy từ biến môi trường của container, hoặc điền trực tiếp khi chạy từ bastion
import re

def parse_db_url(url):
    """mysql+pymysql://user:pass@host:port/db → (host, user, pass, db)"""
    m = re.match(r"mysql\+pymysql://([^:]+):([^@]+)@([^:/]+)(?::\d+)?/(\w+)", url)
    return m.group(3), m.group(1), m.group(2), m.group(4)

AUTH_URL   = os.getenv("AUTH_DB_URL",   "mysql+pymysql://root:strongpassword123@localhost:3306/auth_db")
TENANT_URL = os.getenv("TENANT_DB_URL", "mysql+pymysql://root:strongpassword123@localhost:3306/tenant_db")
HR_URL     = os.getenv("HR_DB_URL",     "mysql+pymysql://root:strongpassword123@localhost:3306/hr_db")

DEFAULT_PASSWORD = "Demo@2026!"

# ─── HELPERS ───────────────────────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
def h(p): return pwd_ctx.hash(p)
def uid(): return str(uuid.uuid4())

def connect(url):
    host, user, pw, db = parse_db_url(url)
    return pymysql.connect(host=host, user=user, password=pw, database=db,
                           charset="utf8mb4", autocommit=False)

auth_db   = connect(AUTH_URL)
tenant_db = connect(TENANT_URL)
hr_db     = connect(HR_URL)
ac = auth_db.cursor()
tc = tenant_db.cursor()
hc = hr_db.cursor()

# ─── ĐỌC TENANT IDs HIỆN CÓ ────────────────────────────────────────────────────
tc.execute("SELECT id, subdomain FROM tenants")
existing = {row[1]: row[0] for row in tc.fetchall()}
print("Existing tenants:", existing)

ACME_ID = existing.get("acme-corp")
GT_ID   = existing.get("globaltech")
if not ACME_ID or not GT_ID:
    raise RuntimeError("Không tìm thấy tenant 'acme-corp' hoặc 'globaltech'. Kiểm tra subdomain.")

# ─── TENANT 3: VINATECH ─────────────────────────────────────────────────────────
VINA_ID = uid()
tc.execute("""
    INSERT IGNORE INTO tenants (id, name, subdomain, status, plan_tier)
    VALUES (%s,'VinaTech Solutions','vinatech','active','pro')
""", (VINA_ID,))
tenant_db.commit()
print(f"VinaTech tenant: {VINA_ID}")

# ─── HELPER: tạo user + link tenant ─────────────────────────────────────────────
def create_user(email, tenant_id, role):
    ac.execute("SELECT id FROM users WHERE email=%s", (email,))
    row = ac.fetchone()
    if row:
        user_id = row[0]
        print(f"  [skip] {email} đã tồn tại, chỉ link tenant")
    else:
        user_id = uid()
        ac.execute("""
            INSERT INTO users (id, email, password_hash, status)
            VALUES (%s,%s,%s,'active')
        """, (user_id, email, h(DEFAULT_PASSWORD)))

    link_id = uid()
    ac.execute("""
        INSERT IGNORE INTO user_tenants (id, user_id, tenant_id, role, is_active)
        VALUES (%s,%s,%s,%s,1)
    """, (link_id, user_id, tenant_id, role))
    print(f"  ✓ {email} [{role}]")
    return user_id

# ─── ACME CORP ──────────────────────────────────────────────────────────────────
print("\n=== ACME CORP ===")
create_user("hr@acme-corp.saashr.com",      ACME_ID, "admin")
create_user("manager@acme-corp.saashr.com", ACME_ID, "admin")
acme_employees = [
    "an.nguyen@acme-corp.saashr.com", "bich.tran@acme-corp.saashr.com",
    "cuong.le@acme-corp.saashr.com",  "dung.pham@acme-corp.saashr.com",
    "em.hoang@acme-corp.saashr.com",  "phuong.nv@acme-corp.saashr.com",
    "giang.vu@acme-corp.saashr.com",  "hoa.do@acme-corp.saashr.com",
    "kien.bui@acme-corp.saashr.com",  "lan.ly@acme-corp.saashr.com",
]
for e in acme_employees:
    create_user(e, ACME_ID, "employee")
auth_db.commit()

# ─── GLOBAL TECH ────────────────────────────────────────────────────────────────
print("\n=== GLOBAL TECH ===")
# Đổi staff@globaltech.com thành owner
ac.execute("UPDATE user_tenants SET role='owner' WHERE tenant_id=%s", (GT_ID,))
print("  ✓ staff@globaltech.com → owner")
create_user("admin@globaltech.com",   GT_ID, "admin")
create_user("manager@globaltech.com", GT_ID, "admin")
gt_employees = [
    "minh.pham@globaltech.com",  "ngoc.tran@globaltech.com",
    "oanh.le@globaltech.com",    "phuong.ng@globaltech.com",
    "quang.vo@globaltech.com",   "rosie.dang@globaltech.com",
    "son.duong@globaltech.com",  "thu.ngo@globaltech.com",
    "uyen.ha@globaltech.com",    "viet.chu@globaltech.com",
]
for e in gt_employees:
    create_user(e, GT_ID, "employee")
auth_db.commit()

# ─── VINATECH ───────────────────────────────────────────────────────────────────
print("\n=== VINATECH ===")
create_user("owner@vinatech.com",   VINA_ID, "owner")
create_user("admin@vinatech.com",   VINA_ID, "admin")
create_user("hr@vinatech.com",      VINA_ID, "admin")
create_user("manager@vinatech.com", VINA_ID, "admin")
vt_employees = [
    "a.nguyen@vinatech.com", "b.tran@vinatech.com",
    "c.le@vinatech.com",     "d.pham@vinatech.com",
    "e.hoang@vinatech.com",  "f.vu@vinatech.com",
    "g.do@vinatech.com",     "h.bui@vinatech.com",
    "i.ly@vinatech.com",     "j.ngo@vinatech.com",
]
for e in vt_employees:
    create_user(e, VINA_ID, "employee")
auth_db.commit()

# ─── HR DB: DEPARTMENTS + EMPLOYEES ─────────────────────────────────────────────
def mk_dept(tenant_id, name, desc=""):
    dept_id = f"dept_{uuid.uuid4()}"
    hc.execute("INSERT IGNORE INTO departments (id,tenant_id,name,description) VALUES(%s,%s,%s,%s)",
               (dept_id, tenant_id, name, desc))
    return dept_id

def mk_emp(tenant_id, first, last, email, position, dept_id, joined="2024-03-01"):
    emp_id = f"emp_{uuid.uuid4()}"
    hc.execute("""
        INSERT IGNORE INTO employees
          (id,tenant_id,first_name,last_name,email,department_id,position,status,joined_date)
        VALUES (%s,%s,%s,%s,%s,%s,%s,'active',%s)
    """, (emp_id, tenant_id, first, last, email, dept_id, position, joined))
    return emp_id

print("\n=== HR DB ===")

# ACME CORP HR data
a_hr  = mk_dept(ACME_ID, "Human Resources", "HR và hành chính")
a_eng = mk_dept(ACME_ID, "Engineering",     "Phòng kỹ thuật")
a_mkt = mk_dept(ACME_ID, "Marketing",       "Phòng marketing")
hc.execute("UPDATE employees SET department_id=%s WHERE tenant_id=%s AND email='jane@acme-corp.saashr.com'", (a_hr, ACME_ID))
hc.execute("UPDATE employees SET department_id=%s WHERE tenant_id=%s AND email='john.smith@acme-corp.com'", (a_eng, ACME_ID))

acme_emp_hr = [
    ("Nguyen","Van An",      "an.nguyen@acme-corp.saashr.com",   "Software Engineer",  a_eng),
    ("Tran",  "Thi Bich",   "bich.tran@acme-corp.saashr.com",   "QA Engineer",        a_eng),
    ("Le",    "Van Cuong",  "cuong.le@acme-corp.saashr.com",    "Backend Developer",  a_eng),
    ("Pham",  "Thi Dung",   "dung.pham@acme-corp.saashr.com",   "Marketing Spec",     a_mkt),
    ("Hoang", "Van Em",     "em.hoang@acme-corp.saashr.com",    "Marketing Lead",     a_mkt),
    ("Nguyen","Thi Phuong", "phuong.nv@acme-corp.saashr.com",   "HR Specialist",      a_hr),
    ("Vu",    "Van Giang",  "giang.vu@acme-corp.saashr.com",    "Accountant",         a_hr),
    ("Do",    "Thi Hoa",    "hoa.do@acme-corp.saashr.com",      "Frontend Developer", a_eng),
    ("Bui",   "Van Kien",   "kien.bui@acme-corp.saashr.com",    "DevOps Engineer",    a_eng),
    ("Ly",    "Thi Lan",    "lan.ly@acme-corp.saashr.com",      "Product Manager",    a_mkt),
]
for f,l,e,pos,dept in acme_emp_hr:
    mk_emp(ACME_ID, f, l, e, pos, dept)

# GLOBAL TECH HR data
g_eng  = mk_dept(GT_ID, "Engineering", "R&D Department for Global Tech")
g_sale = mk_dept(GT_ID, "Sales",       "Sales and Business Development")
g_ops  = mk_dept(GT_ID, "Operations",  "Operations and Support")
hc.execute("UPDATE employees SET department_id=%s WHERE tenant_id=%s AND email='bob.johnson@globaltech.com'", (g_eng, GT_ID))

gt_emp_hr = [
    ("Pham", "Van Minh",  "minh.pham@globaltech.com",  "Software Engineer", g_eng),
    ("Tran", "Thi Ngoc",  "ngoc.tran@globaltech.com",  "QA Engineer",       g_eng),
    ("Le",   "Van Oanh",  "oanh.le@globaltech.com",    "Sales Executive",   g_sale),
    ("Ng",   "Thi Phuong","phuong.ng@globaltech.com",  "Sales Manager",     g_sale),
    ("Vo",   "Van Quang", "quang.vo@globaltech.com",   "Operations Lead",   g_ops),
    ("Dang", "Thi Rosie", "rosie.dang@globaltech.com", "Support Engineer",  g_ops),
    ("Duong","Van Son",   "son.duong@globaltech.com",  "Backend Developer", g_eng),
    ("Ngo",  "Thi Thu",   "thu.ngo@globaltech.com",    "Frontend Developer",g_eng),
    ("Ha",   "Van Uyen",  "uyen.ha@globaltech.com",    "Business Analyst",  g_sale),
    ("Chu",  "Thi Viet",  "viet.chu@globaltech.com",   "DevOps Engineer",   g_ops),
]
for f,l,e,pos,dept in gt_emp_hr:
    mk_emp(GT_ID, f, l, e, pos, dept)

# VINATECH HR data
v_eng = mk_dept(VINA_ID, "Software Engineering","Phòng phát triển phần mềm")
v_hr  = mk_dept(VINA_ID, "Human Resources",     "Phòng nhân sự")
v_pm  = mk_dept(VINA_ID, "Project Management",  "Quản lý dự án")

vt_emp_hr = [
    ("Nguyen","Thanh A", "a.nguyen@vinatech.com", "Senior Developer",  v_eng),
    ("Tran",  "Minh B",  "b.tran@vinatech.com",   "Junior Developer",  v_eng),
    ("Le",    "Van C",   "c.le@vinatech.com",     "QA Tester",         v_eng),
    ("Pham",  "Thi D",   "d.pham@vinatech.com",   "HR Specialist",     v_hr),
    ("Hoang", "Van E",   "e.hoang@vinatech.com",  "Recruiter",         v_hr),
    ("Vu",    "Thi F",   "f.vu@vinatech.com",     "Project Manager",   v_pm),
    ("Do",    "Van G",   "g.do@vinatech.com",     "Scrum Master",      v_pm),
    ("Bui",   "Thi H",   "h.bui@vinatech.com",    "Business Analyst",  v_pm),
    ("Ly",    "Van I",   "i.ly@vinatech.com",     "DevOps Engineer",   v_eng),
    ("Ngo",   "Thi J",   "j.ngo@vinatech.com",    "Frontend Developer",v_eng),
]
for f,l,e,pos,dept in vt_emp_hr:
    mk_emp(VINA_ID, f, l, e, pos, dept)

hr_db.commit()
auth_db.close(); tenant_db.close(); hr_db.close()

print("\n✅ SEED HOÀN THÀNH!")
print(f"Password tất cả tài khoản mới: {DEFAULT_PASSWORD}")
print("""
TỔNG KẾT TÀI KHOẢN
────────────────────────────────────────────────────────
Acme Corp  (subdomain: acme-corp)
  owner   : admin@acme-corp.saashr.com   (có sẵn)
  admin   : hr@acme-corp.saashr.com, manager@acme-corp.saashr.com
  employee: jane@acme-corp.saashr.com (có sẵn) + 10 mới

Global Tech (subdomain: globaltech)
  owner   : staff@globaltech.com         (đổi từ admin → owner)
  admin   : admin@globaltech.com, manager@globaltech.com
  employee: bob.johnson@globaltech.com (có sẵn) + 10 mới

VinaTech   (subdomain: vinatech)
  owner   : owner@vinatech.com
  admin   : admin@vinatech.com, hr@vinatech.com, manager@vinatech.com
  employee: a.nguyen@vinatech.com ... j.ngo@vinatech.com
""")
