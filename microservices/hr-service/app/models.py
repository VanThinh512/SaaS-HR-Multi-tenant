from sqlalchemy import Column, String, TEXT, Enum, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(36), nullable=False, index=True) # Row partition key
    name = Column(String(100), nullable=False)
    description = Column(TEXT)
    created_at = Column(DateTime, server_default=func.now())

    employees = relationship("Employee", back_populates="department")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(36), nullable=False, index=True) # Row partition key
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"))
    position = Column(String(100), nullable=False)
    status = Column(Enum("active", "on_leave", "terminated"), default="active")
    joined_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    department = relationship("Department", back_populates="employees")
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(36), nullable=False, index=True) # Row partition key
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    check_in = Column(DateTime, nullable=False)
    check_out = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    employee = relationship("Employee", back_populates="attendance_records")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(36), nullable=False, index=True) # Row partition key
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    leave_type = Column(Enum("sick", "vacation", "unpaid"), nullable=False)
    reason = Column(TEXT)
    status = Column(Enum("pending", "approved", "rejected"), default="pending")
    created_at = Column(DateTime, server_default=func.now())

    employee = relationship("Employee", back_populates="leave_requests")
