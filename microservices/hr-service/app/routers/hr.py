# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.security import get_current_tenant_user
from app.schemas import (
    DepartmentCreate, DepartmentOut,
    EmployeeCreate, EmployeeUpdate, EmployeeOut,
    AttendanceOut,
    LeaveRequestCreate, LeaveRequestOut, LeaveRequestResolve
)
from app.crud import (
    get_departments, create_department,
    get_employees, get_employee_by_id, create_employee,
    update_employee, delete_employee,
    clock_in_employee, clock_out_employee, get_attendance_logs,
    create_leave_request, get_pending_leave_requests, update_leave_status
)

router = APIRouter(prefix="/api/v1/hr", tags=["HR Domain"])

# --- Departments ---
@router.get("/departments", response_model=List[DepartmentOut])
def list_departments(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    return get_departments(db, tenant_id=current_user["tenant_id"], skip=skip, limit=limit)

@router.post("/departments", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def add_department(
    payload: DepartmentCreate, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    # Only Admin/Owner role can manage departments
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    return create_department(db, tenant_id=current_user["tenant_id"], payload=payload)

# --- Employees ---
@router.get("/employees", response_model=List[EmployeeOut])
def list_employees(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    return get_employees(db, tenant_id=current_user["tenant_id"], skip=skip, limit=limit)

@router.get("/employees/{id}", response_model=EmployeeOut)
def get_employee(
    id: str, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    employee = get_employee_by_id(db, tenant_id=current_user["tenant_id"], employee_id=id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found in your tenant workspace.")
    return employee

@router.post("/employees", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def add_employee(
    payload: EmployeeCreate, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    return create_employee(db, tenant_id=current_user["tenant_id"], payload=payload)

@router.put("/employees/{id}", response_model=EmployeeOut)
def edit_employee(
    id: str,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Cập nhật hồ sơ/chức vụ nhân viên. Chỉ admin/owner mới có quyền."""
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    updated = update_employee(db, tenant_id=current_user["tenant_id"], employee_id=id, payload=payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found in your tenant workspace.")
    return updated

@router.delete("/employees/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_employee(
    id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_tenant_user)
):
    """Xóa nhân viên khỏi hệ thống của tenant. Chỉ admin/owner mới có quyền."""
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    success = delete_employee(db, tenant_id=current_user["tenant_id"], employee_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found in your tenant workspace.")
    # HTTP 204 No Content — không trả về body

# --- Attendance ---
@router.post("/attendance/check-in", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def check_in(
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    # Using sub (user_id) as the link to employee_id in a real system (we assume it exists or use active context)
    # For demo simplicity, we assume employee_id is passed or mapped logically.
    # In a full stack user matches employee. We will use the user_id as employee_id or look up employee by user email.
    # Let's map employee_id: find employee record matching current_user['email']
    employees = get_employees(db, tenant_id=current_user["tenant_id"])
    matched_emp = next((e for e in employees if e.email == current_user["email"]), None)
    if not matched_emp:
        raise HTTPException(status_code=404, detail="Employee profile not found for the authenticated user.")
    
    return clock_in_employee(db, tenant_id=current_user["tenant_id"], employee_id=matched_emp.id)

@router.post("/attendance/check-out", response_model=AttendanceOut)
def check_out(
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    employees = get_employees(db, tenant_id=current_user["tenant_id"])
    matched_emp = next((e for e in employees if e.email == current_user["email"]), None)
    if not matched_emp:
        raise HTTPException(status_code=404, detail="Employee profile not found for the authenticated user.")
        
    record = clock_out_employee(db, tenant_id=current_user["tenant_id"], employee_id=matched_emp.id)
    if not record:
        raise HTTPException(status_code=400, detail="No active clock-in session found to check out.")
    return record

@router.get("/attendance/my-logs", response_model=List[AttendanceOut])
def my_logs(
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    employees = get_employees(db, tenant_id=current_user["tenant_id"])
    matched_emp = next((e for e in employees if e.email == current_user["email"]), None)
    if not matched_emp:
        raise HTTPException(status_code=404, detail="Employee profile not found for the authenticated user.")
        
    return get_attendance_logs(db, tenant_id=current_user["tenant_id"], employee_id=matched_emp.id)

# --- Leaves ---
@router.post("/leaves", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
def submit_leave(
    payload: LeaveRequestCreate, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    # Enforce that employees can only request leaves for themselves unless admin
    if current_user["role"] not in ["admin", "owner"]:
        employees = get_employees(db, tenant_id=current_user["tenant_id"])
        matched_emp = next((e for e in employees if e.email == current_user["email"]), None)
        if not matched_emp or matched_emp.id != payload.employee_id:
            raise HTTPException(status_code=403, detail="Cannot request leaves for other employees.")
            
    return create_leave_request(db, tenant_id=current_user["tenant_id"], payload=payload)

@router.get("/leaves/pending", response_model=List[LeaveRequestOut])
def list_pending_leaves(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
    return get_pending_leave_requests(db, tenant_id=current_user["tenant_id"], skip=skip, limit=limit)

@router.put("/leaves/{id}", response_model=LeaveRequestOut)
def resolve_leave(
    id: str, 
    payload: LeaveRequestResolve, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_tenant_user)
):
    if current_user["role"] not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied. Admin role required.")
        
    record = update_leave_status(db, tenant_id=current_user["tenant_id"], leave_id=id, status=payload.status)
    if not record:
        raise HTTPException(status_code=404, detail="Leave request not found.")
    return record
