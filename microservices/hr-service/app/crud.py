# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
from typing import List, Optional
from app.models import Department, Employee, Attendance, LeaveRequest
from app.schemas import EmployeeCreate, EmployeeUpdate, DepartmentCreate, DepartmentUpdate, LeaveRequestCreate

# Department CRUD
def get_departments(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[Department]:
    return db.query(Department).filter(Department.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_department(db: Session, tenant_id: str, payload: DepartmentCreate) -> Department:
    db_dept = Department(
        id=f"dept_{uuid.uuid4()}",
        tenant_id=tenant_id,
        name=payload.name,
        description=payload.description
    )
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

def get_department_by_id(db: Session, tenant_id: str, dept_id: str) -> Optional[Department]:
    return db.query(Department).filter(
        Department.tenant_id == tenant_id,
        Department.id == dept_id
    ).first()

def update_department(db: Session, tenant_id: str, dept_id: str, payload: DepartmentUpdate) -> Optional[Department]:
    db_dept = get_department_by_id(db, tenant_id, dept_id)
    if not db_dept:
        return None
    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(db_dept, field, value)
    db.commit()
    db.refresh(db_dept)
    return db_dept

def delete_department(db: Session, tenant_id: str, dept_id: str) -> bool:
    db_dept = get_department_by_id(db, tenant_id, dept_id)
    if not db_dept:
        return False
    db.delete(db_dept)
    db.commit()
    return True

# Employee CRUD
def get_employees(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[Employee]:
    return db.query(Employee).filter(Employee.tenant_id == tenant_id).offset(skip).limit(limit).all()

def get_employee_by_id(db: Session, tenant_id: str, employee_id: str) -> Optional[Employee]:
    return db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.id == employee_id
    ).first()

def create_employee(db: Session, tenant_id: str, payload: EmployeeCreate) -> Employee:
    db_emp = Employee(
        id=f"emp_{uuid.uuid4()}",
        tenant_id=tenant_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        department_id=payload.department_id,
        position=payload.position,
        joined_date=payload.joined_date,
        status="active"
    )
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

def update_employee(
    db: Session, tenant_id: str, employee_id: str, payload: EmployeeUpdate
) -> Optional[Employee]:
    """Cập nhật thông tin nhân viên theo tenant — chỉ ghi đè các trường được truyền vào."""
    db_emp = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.id == employee_id
    ).first()

    if not db_emp:
        return None

    # Partial update: chỉ cập nhật các trường không phải None
    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(db_emp, field, value)

    db.commit()
    db.refresh(db_emp)
    return db_emp

def delete_employee(db: Session, tenant_id: str, employee_id: str) -> bool:
    """Xóa nhân viên khỏi tenant. Trả về True nếu xóa thành công, False nếu không tìm thấy."""
    db_emp = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.id == employee_id
    ).first()

    if not db_emp:
        return False

    db.delete(db_emp)
    db.commit()
    return True

# Attendance CRUD
def clock_in_employee(db: Session, tenant_id: str, employee_id: str) -> Attendance:
    db_attendance = Attendance(
        id=f"att_{uuid.uuid4()}",
        tenant_id=tenant_id,
        employee_id=employee_id,
        check_in=datetime.now()
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def clock_out_employee(db: Session, tenant_id: str, employee_id: str) -> Optional[Attendance]:
    # Find active clock-in (where check_out is null)
    db_attendance = db.query(Attendance).filter(
        Attendance.tenant_id == tenant_id,
        Attendance.employee_id == employee_id,
        Attendance.check_out.is_(None)
    ).order_by(Attendance.check_in.desc()).first()
    
    if db_attendance:
        db_attendance.check_out = datetime.now()
        db.commit()
        db.refresh(db_attendance)
    return db_attendance

def get_attendance_logs(db: Session, tenant_id: str, employee_id: str) -> List[Attendance]:
    return db.query(Attendance).filter(
        Attendance.tenant_id == tenant_id,
        Attendance.employee_id == employee_id
    ).order_by(Attendance.check_in.desc()).all()

def get_all_attendance_logs(db: Session, tenant_id: str, skip: int = 0, limit: int = 200) -> List[Attendance]:
    """Lấy toàn bộ log chấm công của tenant (dành cho admin/owner)."""
    return db.query(Attendance).filter(
        Attendance.tenant_id == tenant_id
    ).order_by(Attendance.check_in.desc()).offset(skip).limit(limit).all()

# Leave Request CRUD
def create_leave_request(db: Session, tenant_id: str, payload: LeaveRequestCreate) -> LeaveRequest:
    db_leave = LeaveRequest(
        id=f"leave_{uuid.uuid4()}",
        tenant_id=tenant_id,
        employee_id=payload.employee_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        leave_type=payload.leave_type,
        reason=payload.reason,
        status="pending"
    )
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    return db_leave

def get_pending_leave_requests(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[LeaveRequest]:
    return db.query(LeaveRequest).filter(
        LeaveRequest.tenant_id == tenant_id,
        LeaveRequest.status == "pending"
    ).offset(skip).limit(limit).all()

def get_my_leave_requests(db: Session, tenant_id: str, employee_id: str) -> List[LeaveRequest]:
    """Lấy tất cả đơn nghỉ phép của nhân viên (mọi trạng thái)."""
    return db.query(LeaveRequest).filter(
        LeaveRequest.tenant_id == tenant_id,
        LeaveRequest.employee_id == employee_id
    ).order_by(LeaveRequest.start_date.desc()).all()

def update_leave_status(db: Session, tenant_id: str, leave_id: str, status: str) -> Optional[LeaveRequest]:
    db_leave = db.query(LeaveRequest).filter(
        LeaveRequest.tenant_id == tenant_id,
        LeaveRequest.id == leave_id
    ).first()
    
    if db_leave:
        db_leave.status = status
        db.commit()
        db.refresh(db_leave)
    return db_leave
