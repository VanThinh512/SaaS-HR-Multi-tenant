-- ============================================================================
-- SaaS HR Multi-Tenant Database Initialization Script
-- Creates 3 distinct logical schemas: tenant_db, auth_db, and hr_db
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DATABASE: tenant_db (Tenant & Subscription Provisioning)
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS tenant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tenant_db;

CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('active', 'suspended', 'trial_expired') DEFAULT 'active',
    plan_tier ENUM('basic', 'pro', 'enterprise') DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed default tenant data
INSERT INTO tenants (id, name, subdomain, status, plan_tier) VALUES
('tenant_44f12d8a-9a2c-47ea-bd3e-90ee9c5123d4', 'Acme Corporation', 'acme', 'active', 'pro'),
('tenant_77b31c9d-8f2b-41da-ad8b-302fe12c55a2', 'Global Tech Inc', 'globaltech', 'active', 'basic');

-- ----------------------------------------------------------------------------
-- 2. DATABASE: auth_db (Authentication Credentials & Roles Map)
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auth_db;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Hashed using bcrypt or argon2
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_tenants (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL, -- Logical foreign key pointing to tenant_db.tenants(id)
    role ENUM('owner', 'admin', 'employee') DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_tenant (user_id, tenant_id)
) ENGINE=InnoDB;

-- Seed default users (Default password_hash represents: 'securepassword123' hashed using bcrypt)
INSERT INTO users (id, email, password_hash, status) VALUES
('usr_90a781b2-2e55-46cb-8d19-4824e8a1d744', 'admin@acme-corp.saashr.com', '$2b$12$50Fn5.7W7QGZbkg8B3/FSOPg1lBjI9bhdZu5tqa0cXwe7y0mFV1cS', 'active'),
('usr_11a881b2-2e55-46cb-8d19-4824e8a1d111', 'jane@acme-corp.saashr.com', '$2b$12$50Fn5.7W7QGZbkg8B3/FSOPg1lBjI9bhdZu5tqa0cXwe7y0mFV1cS', 'active'),
('usr_22b992c3-3f66-57dc-9e20-5935f9b2e222', 'staff@globaltech.com', '$2b$12$50Fn5.7W7QGZbkg8B3/FSOPg1lBjI9bhdZu5tqa0cXwe7y0mFV1cS', 'active');

INSERT INTO user_tenants (id, user_id, tenant_id, role, is_active) VALUES
('ut_1', 'usr_90a781b2-2e55-46cb-8d19-4824e8a1d744', 'tenant_44f12d8a-9a2c-47ea-bd3e-90ee9c5123d4', 'owner', 1),
('ut_2', 'usr_11a881b2-2e55-46cb-8d19-4824e8a1d111', 'tenant_44f12d8a-9a2c-47ea-bd3e-90ee9c5123d4', 'employee', 1),
('ut_3', 'usr_22b992c3-3f66-57dc-9e20-5935f9b2e222', 'tenant_77b31c9d-8f2b-41da-ad8b-302fe12c55a2', 'admin', 1);

-- ----------------------------------------------------------------------------
-- 3. DATABASE: hr_db (Core HR Domain Data - Multi-Tenant Pool Model)
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS hr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_db;

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL, -- Row partitioning key for multi-tenancy
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tenant_dept (tenant_id, name),
    INDEX idx_tenant_dept (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL, -- Row partitioning key for multi-tenancy
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department_id VARCHAR(50),
    position VARCHAR(100) NOT NULL,
    status ENUM('active', 'on_leave', 'terminated') DEFAULT 'active',
    joined_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    UNIQUE KEY uq_tenant_email (tenant_id, email),
    INDEX idx_tenant_employee (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL, -- Partition key for Multi-Tenancy Pool
    employee_id VARCHAR(50) NOT NULL,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_tenant_attendance (tenant_id, employee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL, -- Partition key for Multi-Tenancy Pool
    employee_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type ENUM('sick', 'vacation', 'unpaid') NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_tenant_leave (tenant_id, employee_id)
) ENGINE=InnoDB;

-- Seed default departments (Acme Corp and Global Tech records live in same tables separated by tenant_id)
INSERT INTO departments (id, tenant_id, name, description) VALUES
('dept_acme_eng', 'tenant_44f12d8a-9a2c-47ea-bd3e-90ee9c5123d4', 'Engineering', 'Software Development and IT Operations'),
('dept_acme_hr', 'tenant_44f12d8a-9a2c-47ea-bd3e-90ee9c5123d4', 'Human Resources', 'Talent Acquisition and Operations'),
('dept_gt_eng', 'tenant_77b31c9d-8f2b-41da-ad8b-302fe12c55a2', 'Engineering', 'R&D Department for Global Tech');

-- Seed default employees
INSERT INTO employees (id, tenant_id, first_name, last_name, email, department_id, position, status, joined_date) VALUES
('emp_acme_1', 'tenant_44f12d8a-9a2c-47ea-bd3e-90ee9c5123d4', 'John', 'Smith', 'john.smith@acme-corp.com', 'dept_acme_eng', 'Senior Engineer', 'active', '2024-01-10'),
('emp_acme_2', 'tenant_44f12d8a-9a2c-47ea-bd3e-90ee9c5123d4', 'Jane', 'Doe', 'jane.doe@acme-corp.com', 'dept_acme_hr', 'HR Manager', 'active', '2023-06-15'),
('emp_gt_1', 'tenant_77b31c9d-8f2b-41da-ad8b-302fe12c55a2', 'Bob', 'Johnson', 'bob.johnson@globaltech.com', 'dept_gt_eng', 'Tech Lead', 'active', '2022-09-01');
