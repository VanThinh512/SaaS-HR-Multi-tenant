# SaaS HR Multi-Tenant Microservices Project

A production-grade, multi-tenant (SaaS) Human Resources system built using a microservices architecture. It features strict logical data separation (Pool Model) for tenants, asymmetric token authorization via Nginx API Gateway, and a responsive frontend portal.

---

## 1. Architectural Components

*   **Frontend**: ReactJS (Vite) - Single Page Application serving Tenant Login, Dashboards, Employee Directory, Leave Requests, and Attendance tracking.
*   **API Gateway**: Nginx - Handles request routing, CORS configuration, SSL termination, and injects global Request Transaction Tracing (`X-Correlation-ID`).
*   **Backend Microservices** (Python FastAPI):
    *   `auth-service`: Handles registration, authentication, security credentials, and issues RS256 JWT tokens containing tenant claims.
    *   `tenant-service`: Manages corporate tenant accounts, subscription statuses, and subdomains.
    *   `hr-service`: Core domain microservice managing departments, employees, clock-in logs, and leave requests. Enforces tenant logical separation (Pool Model).
*   **Databases**: 3 dedicated MySQL databases (`tenant_db`, `auth_db`, `hr_db`) supporting service autonomy.

---

## 2. Directory Structure

```text
SaaS-HR-Multi-tenant/
├── .env                          # Shared environment variables
├── PLAN.md                       # High-level coding plan
├── ARCH_DETAIL.md                # ER database details and API Specs
├── MICROSERVICE_PROPOSALS.md     # Traceability, gRPC & broker guidelines
├── README.md                     # This documentation file
├── docker-compose.yml            # Docker orchestration configuration
│
├── api-gateway/
│   ├── nginx.conf                # Nginx proxy mapping settings
│   └── Dockerfile                # Nginx container wrapper
│
├── database/
│   └── init.sql                  # MySQL database initialization script
│
├── frontend/                     # React Vite app
│   ├── src/                      # UI modules and pages
│   ├── package.json              # Frontend npm dependencies
│   ├── vite.config.js            # Build and server settings
│   └── Dockerfile                # Multi-stage container file
│
└── microservices/                # Backend API microservices
    ├── auth-service/             # FastAPI credentials app
    ├── tenant-service/           # FastAPI subscription app
    └── hr-service/               # FastAPI core HR app (Pool model)
```

---

## 3. Prerequisites & Software Installation

To compile and launch the full multi-container stack, download and install the following software:

1.  **Docker Desktop** (Highly Recommended)
    *   Download: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
    *   *Purpose*: Orchestrates all backend services, Nginx routing, and MySQL databases under a single network namespace without manual service-by-service installations.
2.  **Node.js (v18.0.0 or higher) & npm (v9.0.0 or higher)**
    *   Download: [Node.js](https://nodejs.org/)
    *   *Purpose*: Necessary to run, build, and debug the frontend ReactJS application locally.
3.  **Python (v3.10 or higher) & pip**
    *   Download: [Python](https://www.python.org/downloads/)
    *   *Purpose*: Required to run the FastAPI microservices locally and run script migrations.
4.  **MySQL Database Client** (Optional but recommended for auditing)
    *   Tools like [DBeaver Community](https://dbeaver.io/) or [TablePlus](https://tableplus.com/) to connect and inspect the tables.

---

## 4. Package Dependencies

### 4.1. Backend Python Dependencies (`requirements.txt`)
Each microservice installs specific versions of required libraries. Important packages include:

*   `fastapi` & `uvicorn[standard]`: Core web framework and high-performance server.
*   `sqlalchemy` & `pymysql`: ORM tools and database driver connectivity.
*   `cryptography`: **Required** for MySQL 8 default `caching_sha2_password` password authentication.
*   `python-jose[cryptography]`: Handles RS256 JWT key signing and verification.
*   `passlib[bcrypt]`: Hashing password algorithms for authentication.
*   `pydantic` & `email-validator`: Pydantic object validation, including `EmailStr` formatting.
*   `redis`: Client connector to process Redis Pub/Sub events.
*   `httpx`: Used for synchronous and asynchronous HTTP communication between services.

### 4.2. Frontend Node.js Dependencies (`package.json`)
Located inside the `frontend/` directory:

*   `react` & `react-dom`: Client-side core framework.
*   `react-router-dom`: Handles client-side view routing.
*   `axios`: HTTP client to call backend API gateway.
*   `vite` & `@vitejs/plugin-react`: Hot-reloading compiler and bundler.

---

## 5. Configuration Setup

Create a file named `.env` in the **root directory** (`SaaS-HR-Multi-tenant/.env`) with the following variables. 

> [!IMPORTANT]
> Since Windows machines often run local SQL Server or MySQL servers binding port 3306, we map the Docker container database host port to **3307** to avoid port conflicts. Inside the Docker network, the containers still interact on port 3306.

```env
# Database Settings
MYSQL_ROOT_PASSWORD=strongpassword123
MYSQL_HOST=localhost
MYSQL_PORT=3307

# Service DB Connections (Used when running services locally on Windows host)
DATABASE_TENANT_URL=mysql+pymysql://root:strongpassword123@localhost:3307/tenant_db
DATABASE_AUTH_URL=mysql+pymysql://root:strongpassword123@localhost:3307/auth_db
DATABASE_HR_URL=mysql+pymysql://root:strongpassword123@localhost:3307/hr_db

# Security & JWT Token Keys
# Generate keys with: ssh-keygen -t rsa -b 2048 -m PEM -f jwt_key.pem
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## 6. How to Initialize and Run the Project

### Method A: Automated Run via Docker Compose (Recommended)
This approach configures and seeds the databases and launches the complete client-server stack.

1.  **Start Docker Desktop** on your machine.
2.  Open your terminal inside the project root folder (`SaaS-HR-Multi-tenant/`).
3.  Execute the build and launch command:
    ```bash
    docker-compose up -d --build
    ```
4.  Docker will automatically:
    *   Spin up a MySQL instance on host port **3307** and execute the SQL script `/database/init.sql` to create `auth_db`, `tenant_db`, `hr_db` and seed demo records.
    *   Build and run `auth-service`, `tenant-service`, and `hr-service` containers.
    *   Compile the Vite frontend assets and run Nginx on port `80` to act as both a web server and a proxy.
5.  Access the web portal at: `http://localhost/`

To inspect container logs:
```bash
docker logs -f saashr-auth
docker logs -f saashr-tenant
docker logs -f saashr-hr
```

### 6.2. Verify Database Connection
To quickly check if your database connections are correctly configured in `.env` and accessible, you can run the diagnostic script in the root directory:
```bash
python test_db_connection.py
```
This script does not require any external libraries to check TCP ports, but if you have `pymysql` installed locally, it will also test authentication and table structures for `tenant_db`, `auth_db`, and `hr_db`.


---

### Method B: Manual Local Run (Step-by-Step for Debugging)
If you prefer running backends and frontends natively in terminal tabs for active debugging:

#### Step 1: Run MySQL and Initialize Databases
1.  Ensure you have a local MySQL server running.
2.  Log in as administrator and execute the script inside [database/init.sql](file:///c:/App10/Intern/MicroserviceAWSproj/project/SaaS-HR-Multi-tenant/database/init.sql):
    ```bash
    mysql -u root -p -P 3307 < database/init.sql
    ```

#### Step 2: Spin Up Backend Microservices
Open three separate terminal sessions inside the respective directories:

```bash
# In terminal 1 (auth-service)
cd microservices/auth-service
python -m venv venv
source venv/bin/activate  # (On Windows use: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# In terminal 2 (tenant-service)
cd microservices/tenant-service
python -m venv venv
source venv/bin/activate  # (On Windows use: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# In terminal 3 (hr-service)
cd microservices/hr-service
python -m venv venv
source venv/bin/activate  # (On Windows use: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

#### Step 3: Run the ReactJS Frontend
Open a fourth terminal session:

```bash
cd frontend
npm install
npm run dev
```
*   The terminal will output the local development URL, usually `http://localhost:5173`.

