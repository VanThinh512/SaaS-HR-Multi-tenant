# Dự án SaaS HR Multi-Tenant Microservices

Hệ thống Quản lý Nhân sự (HR) đa doanh nghiệp (SaaS) quy mô doanh nghiệp, được xây dựng trên kiến trúc microservices. Dự án triển khai mô hình phân tách dữ liệu logic nghiêm ngặt (Pool Model) cho từng tenant, cơ chế xác thực bất đối xứng qua Nginx API Gateway, và bảng điều khiển (dashboard) quản trị trực quan.

---

## 1. Các Thành Phần Kiến Trúc

*   **Frontend**: ReactJS (Vite) - Ứng dụng Single Page hỗ trợ đăng nhập, theo dõi sức khỏe hệ thống, quản lý nhân viên, chấm công và quản lý nghỉ phép.
*   **API Gateway**: Nginx - Đảm nhận định tuyến request, cấu hình CORS, mã hóa SSL và tự động nhúng mã theo vết giao dịch toàn cục (`X-Correlation-ID`).
*   **Backend Microservices** (Python FastAPI):
    *   `auth-service`: Quản lý tài khoản, đăng ký, đăng nhập, bảo mật thông tin và ký mã token JWT (thuật toán bất đối xứng RS256) chứa thông tin phân quyền của tenant.
    *   `tenant-service`: Quản lý các tài khoản doanh nghiệp (tenant), gói dịch vụ đăng ký (subscription) và subdomain riêng biệt.
    *   `hr-service`: Nghiệp vụ nhân sự cốt lõi quản lý phòng ban, nhân viên, lịch sử chấm công và yêu cầu nghỉ phép. Thực thi phân tách dữ liệu tenant logic (Pool Model).
*   **Cơ sở dữ liệu**: 3 cơ sở dữ liệu MySQL độc lập (`tenant_db`, `auth_db`, `hr_db`) để đảm bảo tính tự trị (autonomy) của từng microservice.

---

## 2. Cấu Trúc Thư Mục

```text
SaaS-HR-Multi-tenant/
├── .env                          # Các biến môi trường dùng chung
├── PLAN.md                       # Kế hoạch phát triển dự án
├── ARCH_DETAIL.md                # Đặc tả kiến trúc cơ sở dữ liệu và API
├── README.md                     # Tài liệu hướng dẫn (Tiếng Anh)
├── README_VI.md                  # Tài liệu hướng dẫn này (Tiếng Việt)
├── test_db_connection.py         # Công cụ kiểm tra kết nối cơ sở dữ liệu
├── docker-compose.yml            # Cấu hình điều phối container Docker
│
├── api-gateway/
│   ├── nginx.conf                # Cấu hình định tuyến proxy của Nginx
│   └── Dockerfile                # File đóng gói container Nginx
│
├── database/
│   └── init.sql                  # Script SQL khởi tạo dữ liệu mẫu và 3 database
│
├── frontend/                     # Ứng dụng React Vite
│   ├── src/                      # Mã nguồn UI và các trang chính
│   ├── package.json              # Các thư viện frontend npm
│   ├── vite.config.js            # Cấu hình biên dịch và dev server
│   └── Dockerfile                # Đóng gói container frontend
│
└── microservices/                # Các dịch vụ backend API
    ├── auth-service/             # FastAPI xác thực và phân quyền
    ├── tenant-service/           # FastAPI quản lý tenant/doanh nghiệp
    └── hr-service/               # FastAPI quản lý nhân sự (Pool model)
```

---

## 3. Yêu Cầu Hệ Thống & Cài Đặt Phần Mềm

Tải và cài đặt các phần mềm sau trước khi chạy dự án:

1.  **Docker Desktop** (Khuyên dùng)
    *   Tải về: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
    *   *Mục đích*: Điều phối toàn bộ các dịch vụ backend, Nginx routing, và MySQL DBs trong một môi trường duy nhất mà không cần cài đặt riêng lẻ.
2.  **Node.js (v18.0.0 hoặc cao hơn) & npm (v9.0.0 hoặc cao hơn)**
    *   Tải về: [Node.js](https://nodejs.org/)
    *   *Mục đích*: Cần thiết để biên dịch và chạy debug ứng dụng frontend ReactJS local.
3.  **Python (v3.10 hoặc cao hơn) & pip**
    *   Tải về: [Python](https://www.python.org/downloads/)
    *   *Mục đích*: Yêu cầu để chạy các dịch vụ FastAPI local hoặc chạy script test kết nối.
4.  **MySQL Database Client** (Tùy chọn)
    *   Công cụ như [DBeaver Community](https://dbeaver.io/) hoặc [TablePlus](https://tableplus.com/) để kết nối và kiểm tra dữ liệu trong DB.

---

## 4. Các Thư Viện Phụ Thuộc (Dependencies)

### 4.1. Backend Python (`requirements.txt`)
Mỗi microservice cài đặt phiên bản cụ thể của các thư viện sau:

*   `fastapi` & `uvicorn[standard]`: Khung ứng dụng web và máy chủ hiệu năng cao.
*   `sqlalchemy` & `pymysql`: Bộ công cụ ORM và trình điều khiển kết nối MySQL.
*   `cryptography`: **Bắt buộc** để MySQL 8 chạy xác thực mật khẩu kiểu `caching_sha2_password`.
*   `python-jose[cryptography]`: Xử lý việc ký và xác thực JWT mã hóa bất đối xứng RS256.
*   `passlib[bcrypt]`: Thuật toán mã hóa băm mật khẩu.
*   `pydantic` & `email-validator`: Kiểm tra tính hợp lệ của dữ liệu đầu vào.
*   `redis`: Kết nối với Redis Broker xử lý Pub/Sub.
*   `httpx`: Sử dụng để gửi request đồng bộ/bất đồng bộ giữa các dịch vụ.

### 4.2. Frontend Node.js (`package.json`)
Nằm trong thư mục `frontend/`:

*   `react` & `react-dom`: Thư viện lõi xây dựng giao diện.
*   `react-router-dom`: Quản lý định tuyến trang phía Client.
*   `axios`: Thư viện gửi HTTP Request lên API Gateway.
*   `vite` & `@vitejs/plugin-react`: Bộ biên dịch ứng dụng siêu tốc.

---

## 5. Thiết Lập Biến Môi Trường (.env)

Tạo một tệp tên là `.env` ở **thư mục gốc** (`SaaS-HR-Multi-tenant/.env`) với nội dung dưới đây:

> [!IMPORTANT]
> Vì máy chạy Windows thường chạy dịch vụ MySQL cục bộ chiếm cổng 3306, dự án ánh xạ cổng MySQL của Docker ra ngoài máy thật là **3307** để tránh xung đột cổng. Trong mạng nội bộ Docker, các container vẫn giao tiếp với nhau qua cổng 3306 bình thường.

```env
# Thiết lập MySQL
MYSQL_ROOT_PASSWORD=strongpassword123
MYSQL_HOST=localhost
MYSQL_PORT=3307

# Chuỗi kết nối DB (Sử dụng khi chạy dịch vụ local ngoài máy thật)
DATABASE_TENANT_URL=mysql+pymysql://root:strongpassword123@localhost:3307/tenant_db
DATABASE_AUTH_URL=mysql+pymysql://root:strongpassword123@localhost:3307/auth_db
DATABASE_HR_URL=mysql+pymysql://root:strongpassword123@localhost:3307/hr_db

# Khóa JWT Bảo mật
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAy7CZP+mqLIJjG7p/0+3DhyPRWg8XbHeaKRkVP/+toByIb6SU\ne/IXJmHcSxfofnvzxRqwx9Qb3f2GU9Kel7vOiujRltBIxwo2d4PJwNUt+oL+v5Ya\nq1OYnbf4CYJXwOOj43l/36cr8dDIxz7HdntizyyuCinnZ+STb6yuiLLP1vQFbTIf\naQPyasTEBH6SzhdSdx4CczNmWV8j88yVLJ5kDW8MjLd2useWVFs4RMMEbAxqje7F\n1vL1K7zBLszsZp+rNBnSei25dF9ZazUhPY0HcAhWSVjg8xeCnYk64Qc1n/USka2g\ns5PBIQVAXE2XDAkmm3NiUmeHptr6bIFNPwYCuQIDAQABAoIBABv2rG9dD6cJJnyP\ny81HSszigrMDt+JFADXMswFkg0xkJmn3VQg4GewDytfHWjyFHVgNvD/O052UGO0o\nkOvBVY91+5IiGZ+zu/sH7XqK+cM22SzpuVMUiLL8ZvG9QnlhdyY7T64fd/W8hVfv\nOzh9o3jQSDtuec2mUIRoF1T+gXCftGvZ91Djz9ddDlVFTo8eNS35kWZFMmIpl9O8\n1jDXmyUCtW+69yPPmFvSxwJ4qqOjPIwDkacxFdDnICuDqVcdjawiyxf+Q5px0Iay\nxeNXcxmdY0Zl7nwhx6WQdAbwI59305UEQsU7PtQMyIEW3YiuWzy1wDsjbvBjZXSy\nb4ZEcvUCgYEA5wJZFRbxqXwLPwK2eaZ0mrAFrOp3TcHMQfYNbUJ+OgABzMSDimXV\n6DrbOs0Fe90Vv4FQT/EYDG+zpoC2UU2DKi43FDAQ4d+3Cg3hckqbc9a5lIU0wHkh\nMGXsHdfIc9+ayN7a1BD3b/i14/zEHDgMgPZTi1uhohCyfzVkMCq184UCgYEA4bmo\nuq8x5Zj9vp2CQCqNNLl3UHPlrt0976zDsGnUQG1yL/FHGN/cHWkddi4iWp6LkLdF\nP4JnlMp9zX1jcMmaIXGKBRgWx2KKIuRV6+9ey6vJzj3qKCvShOkzfiZXQqe/0Hp4\nJ1nkHBV+AEf3ofMnQDb9XtLf7eK+k3gL//V6NqUCgYAL2cD8JfsruKNTDi6SOwnM\nTa9c2YJZSNHTqG2z5y9Whl2RRZuB5At/KFXKxG29lu/grR+Tmkijiq9qoTu5HALY\njRpiPL0A+VsIdwHTvSQQYzmN9u9n2E7tjqz4MvOjjhsApv4O1vf6lIWwNm1RDUcG\n7pwGkCLQj464m+KR3f8LiQKBgCXxFzOKD1EQjlZkE2jFvkaGhk+3q3vhJHANEjet\nEkhiHTeBzvmXZ2BqMtGSn6Or0rnYlINAYDjacJsB4J0sxgOpGhIRIoMRRTboOqkV\n61FA5wML1Tg7ZX+B02348+H4YH2imF/E9FrkIfHaJv3J6WcZ1y0BNTK/UllnbFzx\n3kEhAoGBAI3t8yiaDvEbvMWwEeB9OyQeOUGgcxraiA9pDlIUY09d6OrATA1h+DqH\n0Ed6Xc2HNJrrFY/nWDXXMYGSAgpBa+l1gwKSOvDmxvls6S3Y1M7vjpTG6ePMvm92\nWMe/hKjU8CkOsU4MJP4qNpbeQq+VVrylDJy77nKvBfSktTJM5o0n\n-----END RSA PRIVATE KEY-----\n"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy7CZP+mqLIJjG7p/0+3D\nhyPRWg8XbHeaKRkVP/+toByIb6SUe/IXJmHcSxfofnvzxRqwx9Qb3f2GU9Kel7vO\niujRltBIxwo2d4PJwNUt+oL+v5Yaq1OYnbf4CYJXwOOj43l/36cr8dDIxz7Hdnti\nzyyuCinnZ+STb6yuiLLP1vQFbTIfaQPyasTEBH6SzhdSdx4CczNmWV8j88yVLJ5k\nDW8MjLd2useWVFs4RMMEbAxqje7F1vL1K7zBLszsZp+rNBnSei25dF9ZazUhPY0H\ncAhWSVjg8xeCnYk64Qc1n/USka2gs5PBIQVAXE2XDAkmm3NiUmeHptr6bIFNPwYC\nuQIDAQAB\n-----END PUBLIC KEY-----\n"

# Thời gian hết hạn JWT (phút)
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## 6. Hướng Dẫn Khởi Chạy Dự Án

### Cách A: Khởi Chạy Tự Động bằng Docker Compose (Khuyên dùng)
Cách này giúp tự động khởi tạo cơ sở dữ liệu và khởi động toàn bộ hệ thống frontend, backend và database bằng một câu lệnh duy nhất.

1.  **Mở phần mềm Docker Desktop** trên máy của bạn.
2.  Mở terminal ở thư mục gốc của dự án (`SaaS-HR-Multi-tenant/`).
3.  Chạy lệnh để build và khởi tạo sạch (xóa dữ liệu rác cũ nếu có):
    ```bash
    docker-compose down -v
    docker-compose up -d --build
    ```
4.  Docker sẽ tự động:
    *   Tạo container MySQL kết nối qua cổng **3307** của máy thật và chạy file `/database/init.sql` để khởi tạo các bảng và dữ liệu mẫu của 3 database.
    *   Tạo và chạy các container `auth-service`, `tenant-service`, và `hr-service`.
    *   Biên dịch giao diện Vite và khởi chạy Nginx trên cổng **80** để làm Gateway điều phối.
5.  Truy cập hệ thống dashboard qua trình duyệt tại: `http://localhost/`

Để xem nhật ký hoạt động (logs) của các microservice:
```bash
docker logs -f saashr-auth
docker logs -f saashr-tenant
docker logs -f saashr-hr
```

### 6.2. Kiểm Tra Kết Nối Cơ Sở Dữ Liệu
Để kiểm tra nhanh xem cấu hình `.env` trên máy bạn đã kết nối thành công tới database hay chưa, hãy chạy script kiểm thử:
```bash
python test_db_connection.py
```
Script này sẽ kiểm tra xem cổng 3307 có mở không. Nếu máy của bạn đã cài đặt thư viện `pymysql` (`pip install pymysql`), script sẽ tự động kiểm tra sâu hơn về tài khoản đăng nhập và cấu trúc bảng của cả 3 database.

---

### Cách B: Chạy Thủ Công Từng Dịch Vụ (Dành cho Debug)

#### Bước 1: Khởi chạy và khởi tạo dữ liệu MySQL
1.  Đảm bảo bạn có MySQL Server đang hoạt động cục bộ.
2.  Chạy script khởi tạo tại đường dẫn [database/init.sql](file:///c:/App10/Intern/MicroserviceAWSproj/project/SaaS-HR-Multi-tenant/database/init.sql):
    ```bash
    mysql -u root -p -P 3307 < database/init.sql
    ```

#### Bước 2: Khởi chạy các dịch vụ Backend Python
Mở 3 terminal riêng biệt ứng với các thư mục dịch vụ:

```bash
# Terminal 1: auth-service
cd microservices/auth-service
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: tenant-service
cd microservices/tenant-service
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3: hr-service
cd microservices/hr-service
python -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

#### Bước 3: Khởi chạy ReactJS Frontend
Mở terminal thứ 4:
```bash
cd frontend
npm install
npm run dev
```
*   Ứng dụng sẽ chạy tại cổng local dev, thường là `http://localhost:5173`.
