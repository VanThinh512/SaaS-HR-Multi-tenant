from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# Department Schemas
class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentOut(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    department_id: Optional[str] = None
    position: str
    joined_date: date

class EmployeeOut(BaseModel):
    id: str
    tenant_id: str
    first_name: str
    last_name: str
    email: EmailStr
    department_id: Optional[str]
    position: str
    status: str
    joined_date: date
    created_at: datetime

    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceOut(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    check_in: datetime
    check_out: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# Leave Schemas
class LeaveRequestCreate(BaseModel):
    employee_id: str
    start_date: date
    end_date: date
    leave_type: str
    reason: Optional[str] = None

class LeaveRequestResolve(BaseModel):
    status: str # 'approved' or 'rejected'

class LeaveRequestOut(BaseModel):
    id: str
    tenant_id: str
    employee_id: str
    start_date: date
    end_date: date
    leave_type: str
    reason: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
