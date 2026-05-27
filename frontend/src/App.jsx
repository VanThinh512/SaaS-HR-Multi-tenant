import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    appName: 'SaaS HR',
    appVersion: 'Multi-Tenant Architecture v1.0',
    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to your workspace',
    labelEmail: 'Email address',
    labelPassword: 'Password',
    labelSubdomain: 'Workspace subdomain',
    placeholderEmail: 'admin@company.com',
    placeholderSubdomain: 'your-company',
    btnLogin: 'Sign In',
    btnLoggingIn: 'Signing in…',
    loginError: 'Invalid credentials or workspace not found.',
    loginFooter: 'SaaS HR · Multi-Tenant Platform',
    menuDashboard: '📊 System Dashboard',
    menuEmployees: '👥 Employees',
    menuAttendance: '⏱️ Attendance',
    menuLeaves: '📋 Leave Requests',
    menuDepartments: '🏢 Departments',
    btnLogout: 'Log out',
    headerTitle: 'HR Microservice Portal',
    headerSubtitle: 'Enforcing tenant row-level partitioning across isolated MySQL tables.',
    traceLabel: 'Trace-ID:',
    dashTitle: 'Microservice Orchestration Details',
    dashDesc: 'All services are isolated within a private Docker subnet. The Nginx API Gateway is the sole access point, generating a Correlation ID per request. Credentials are authenticated by the auth-service which returns an RS256-signed JWT. Downstream microservices statelessly decode the payload via RSA public keys to enforce tenant isolation.',
    svcDesc: {
      gateway: 'Handles request routing & correlation tracking',
      auth: 'Issues RS256 tokens and validates accounts',
      tenant: 'Manages subscription and workspace contexts',
      hr: 'Pool-model employee data repository',
    },
    statusLabel: 'Status:',
    empTitle: 'HR Pool Model — Employee Roster',
    empSubtitle: 'Data retrieved from your active tenant workspace context.',
    thName: 'Name', thPosition: 'Position', thEmail: 'Email Address',
    thTenantId: 'Tenant Isolation ID', thStatus: 'Status',
    statusActive: 'Active',
    attTitle: 'Attendance & Timekeeping',
    attSubtitle: 'Clock in, clock out, and view your attendance history.',
    leavesTitle: 'Leave Management', leavesSubtitle: 'Submit, track and approve leave requests for your workspace.',
    leaveNewBtn: 'New Request', leavePeriod: 'Period', filterAll: 'All',
    btnClockIn: 'Clock In', btnLeaveReq: 'Request Leave',
    pendingTitle: 'Pending Leave Approvals',
    emptyLeaves: 'No pending leave requests for this workspace.',
    attSubTabAtt: 'Attendance', attSubTabLeave: 'Leave Requests',
    btnClockOut: 'Clock Out',
    attCheckedIn: 'Clocked in since', attNotClockedIn: 'Not clocked in today.',
    attMyLogs: 'My Attendance Logs', attAllLogs: 'All Attendance Logs', attNoLogs: 'No attendance records yet.',
    attLoading: 'Loading…', attNoProfile: 'No employee profile linked to your account. Contact your administrator.',
    attClockInSuccess: 'Clocked in successfully!', attClockOutSuccess: 'Clocked out successfully!',
    thCheckIn: 'Clock In', thCheckOut: 'Clock Out', thDuration: 'Duration',
    leaveFormTitle: 'Submit Leave Request',
    labelStartDate: 'Start Date', labelEndDate: 'End Date', labelLeaveType: 'Leave Type', labelReason: 'Reason (optional)',
    leaveTypeAnnual: 'Annual Leave', leaveTypeSick: 'Sick Leave', leaveTypePersonal: 'Personal', leaveTypeEmergency: 'Emergency', leaveTypeOther: 'Other',
    leaveStatusPending: 'Pending', leaveStatusApproved: 'Approved', leaveStatusRejected: 'Rejected',
    myLeavesTitle: 'My Leave Requests', pendingLeavesTitle: 'Pending Approvals',
    noLeaves: 'No leave requests found.', noPendingLeaves: 'No pending leave requests.',
    leaveSubmitSuccess: 'Leave request submitted.', leaveApprovedSuccess: 'Leave approved.', leaveRejectedSuccess: 'Leave rejected.',
    btnApprove: 'Approve', btnReject: 'Reject',
    roleOwner: 'Owner', roleAdmin: 'Admin', roleEmployee: 'Employee',
    empAdd: 'Add Employee', empEdit: 'Edit Employee', empDelete: 'Delete',
    empConfirmDelete: 'Confirm Delete',
    empConfirmDeleteMsg: 'Are you sure you want to delete',
    empCancel: 'Cancel', empSave: 'Save',
    empLoading: 'Loading employees…', empEmpty: 'No employees found for this workspace.',
    empAddSuccess: 'Employee added successfully.', empEditSuccess: 'Employee updated successfully.', empDeleteSuccess: 'Employee deleted successfully.',
    thDepartment: 'Department', thJoinDate: 'Join Date', thActions: 'Actions',
    labelFirstName: 'First Name', labelLastName: 'Last Name', labelPosition: 'Position',
    labelDepartment: 'Department', labelJoinDate: 'Join Date', labelStatus: 'Status',
    statusOnLeave: 'On Leave', statusTerminated: 'Terminated',
    noDepartment: 'No Department', btnEdit: 'Edit',
    errFetch: 'Failed to load data.', errConn: 'Connection error.', errSave: 'Failed to save.', errDelete: 'Failed to delete.',
    deptTitle: 'Department Management', deptSubtitle: 'Organize your workforce into departments for efficient HR management.',
    deptAdd: 'Add Department', deptEdit: 'Edit Department', deptDelete: 'Delete',
    deptConfirmDelete: 'Confirm Delete', deptConfirmDeleteMsg: 'Are you sure you want to delete department',
    deptLoading: 'Loading departments…', deptEmpty: 'No departments yet. Create your first department.',
    deptAddSuccess: 'Department added successfully.', deptEditSuccess: 'Department updated successfully.', deptDeleteSuccess: 'Department deleted successfully.',
    labelDeptName: 'Department Name', labelDeptDesc: 'Description (optional)',
    thEmpCount: 'employees',
    menuProfile: '👤 My Profile',
    profileTitle: 'My Profile', profileSubtitle: 'Your account information and security settings.',
    profileEmail: 'Email Address', profileRole: 'Role', profileStatus: 'Account Status', profileTenant: 'Workspace ID',
    profileStatusActive: 'Active', profileStatusInactive: 'Inactive',
    changePwdTitle: 'Change Password', changePwdSubtitle: 'Update your password to keep your account secure.',
    labelCurrentPwd: 'Current Password', labelNewPwd: 'New Password', labelConfirmPwd: 'Confirm New Password',
    pwdMin8: 'Password must be at least 8 characters.', pwdMismatch: 'Passwords do not match.',
    changePwdSuccess: 'Password changed successfully.', btnChangePwd: 'Update Password',
    menuMembers: '💼 Workspace Members',
    membersTitle: 'Workspace Members', membersSubtitle: 'Manage who has access to your workspace.',
    memberInvite: 'Invite Member', memberInviteTitle: 'Invite to Workspace',
    memberRemove: 'Remove', memberYou: '(you)',
    memberInviteSuccess: 'Member invited successfully.', memberRemoveSuccess: 'Member removed from workspace.', memberRoleUpdated: 'Role updated.',
    memberConfirmRemove: 'Remove this member from the workspace?',
    noMembers: 'No members found.',
  },
  vi: {
    appName: 'SaaS HR',
    appVersion: 'Kiến trúc Multi-Tenant v1.0',
    loginTitle: 'Chào mừng trở lại',
    loginSubtitle: 'Đăng nhập vào không gian làm việc của bạn',
    labelEmail: 'Địa chỉ Email',
    labelPassword: 'Mật khẩu',
    labelSubdomain: 'Subdomain workspace',
    placeholderEmail: 'admin@congty.com',
    placeholderSubdomain: 'ten-cong-ty',
    btnLogin: 'Đăng nhập',
    btnLoggingIn: 'Đang đăng nhập…',
    loginError: 'Thông tin đăng nhập không đúng hoặc workspace không tồn tại.',
    loginFooter: 'SaaS HR · Nền tảng Multi-Tenant',
    menuDashboard: '📊 Bảng điều khiển',
    menuEmployees: '👥 Nhân viên',
    menuAttendance: '⏱️ Chấm công',
    menuLeaves: '📋 Nghỉ phép',
    menuDepartments: '🏢 Phòng ban',
    btnLogout: 'Đăng xuất',
    headerTitle: 'Cổng quản lý Nhân sự',
    headerSubtitle: 'Phân vùng dữ liệu theo tenant ở cấp hàng trên MySQL.',
    traceLabel: 'Trace-ID:',
    dashTitle: 'Chi tiết điều phối Microservice',
    dashDesc: 'Tất cả service được cách ly trong mạng Docker riêng tư. Nginx API Gateway là điểm truy cập duy nhất, tạo Correlation ID cho mỗi request. Xác thực được xử lý bởi auth-service trả về JWT ký bằng RS256. Các microservice giải mã JWT bằng RSA public key để đảm bảo cách ly dữ liệu theo tenant.',
    svcDesc: {
      gateway: 'Định tuyến request & theo dõi correlation',
      auth: 'Phát hành token RS256 và xác thực tài khoản',
      tenant: 'Quản lý đăng ký và ngữ cảnh workspace',
      hr: 'Kho dữ liệu nhân viên theo mô hình Pool',
    },
    statusLabel: 'Trạng thái:',
    empTitle: 'Danh sách nhân viên — Pool Model',
    empSubtitle: 'Dữ liệu được lấy từ ngữ cảnh tenant đang hoạt động của bạn.',
    thName: 'Họ tên', thPosition: 'Chức vụ', thEmail: 'Địa chỉ Email',
    thTenantId: 'Mã định danh Tenant', thStatus: 'Trạng thái',
    statusActive: 'Đang làm việc',
    attTitle: 'Chấm công & Giờ làm',
    attSubtitle: 'Chấm công vào/ra và xem lịch sử giờ làm việc.',
    leavesTitle: 'Quản lý Nghỉ phép', leavesSubtitle: 'Gửi, theo dõi và duyệt đơn nghỉ phép trong workspace.',
    leaveNewBtn: 'Tạo đơn mới', leavePeriod: 'Thời gian', filterAll: 'Tất cả',
    btnClockIn: 'Chấm công vào', btnLeaveReq: 'Xin nghỉ phép',
    pendingTitle: 'Đơn nghỉ chờ duyệt',
    emptyLeaves: 'Không có đơn nghỉ phép nào đang chờ duyệt.',
    attSubTabAtt: 'Chấm công', attSubTabLeave: 'Đơn nghỉ phép',
    btnClockOut: 'Chấm công ra',
    attCheckedIn: 'Đã chấm công vào lúc', attNotClockedIn: 'Chưa chấm công hôm nay.',
    attMyLogs: 'Lịch sử chấm công của tôi', attAllLogs: 'Toàn bộ nhật ký chấm công', attNoLogs: 'Chưa có bản ghi chấm công nào.',
    attLoading: 'Đang tải…', attNoProfile: 'Tài khoản chưa được liên kết với hồ sơ nhân viên. Vui lòng liên hệ quản trị viên.',
    attClockInSuccess: 'Đã chấm công vào thành công!', attClockOutSuccess: 'Đã chấm công ra thành công!',
    thCheckIn: 'Giờ vào', thCheckOut: 'Giờ ra', thDuration: 'Thời lượng',
    leaveFormTitle: 'Gửii đơn nghỉ phép',
    labelStartDate: 'Ngày bắt đầu', labelEndDate: 'Ngày kết thúc', labelLeaveType: 'Loại nghỉ phép', labelReason: 'Lý do (tùy chọn)',
    leaveTypeAnnual: 'Nghỉ phép năm', leaveTypeSick: 'Nghỉ ốm', leaveTypePersonal: 'Việc cá nhân', leaveTypeEmergency: 'Khẩn cấp', leaveTypeOther: 'Khác',
    leaveStatusPending: 'Chờ duyệt', leaveStatusApproved: 'Đã duyệt', leaveStatusRejected: 'Từ chối',
    myLeavesTitle: 'Đơn nghỉ phép của tôi', pendingLeavesTitle: 'Đơn chờ duyệt',
    noLeaves: 'Chưa có đơn nghỉ phép nào.', noPendingLeaves: 'Không có đơn chờ duyệt.',
    leaveSubmitSuccess: 'Đã gửi đơn nghỉ phép.', leaveApprovedSuccess: 'Đã duyệt đơn.', leaveRejectedSuccess: 'Đã từ chối đơn.',
    btnApprove: 'Duyệt', btnReject: 'Từ chối',
    roleOwner: 'Chủ sở hữu', roleAdmin: 'Quản trị viên', roleEmployee: 'Nhân viên',
    empAdd: 'Thêm nhân viên', empEdit: 'Chỉnh sửa nhân viên', empDelete: 'Xóa',
    empConfirmDelete: 'Xác nhận xóa',
    empConfirmDeleteMsg: 'Bạn có chắc chắn muốn xóa',
    empCancel: 'Hủy', empSave: 'Lưu',
    empLoading: 'Đang tải danh sách nhân viên…', empEmpty: 'Chưa có nhân viên nào trong workspace này.',
    empAddSuccess: 'Đã thêm nhân viên thành công.', empEditSuccess: 'Đã cập nhật nhân viên thành công.', empDeleteSuccess: 'Đã xóa nhân viên thành công.',
    thDepartment: 'Phòng ban', thJoinDate: 'Ngày vào', thActions: 'Thao tác',
    labelFirstName: 'Tên', labelLastName: 'Họ', labelPosition: 'Chức vụ',
    labelDepartment: 'Phòng ban', labelJoinDate: 'Ngày vào làm', labelStatus: 'Trạng thái',
    statusOnLeave: 'Đang nghỉ', statusTerminated: 'Đã nghỉ việc',
    noDepartment: 'Chưa phân phòng', btnEdit: 'Sửa',
    errFetch: 'Không thể tải dữ liệu.', errConn: 'Lỗi kết nối.', errSave: 'Lưu không thành công.', errDelete: 'Xóa không thành công.',
    deptTitle: 'Quản lý Phòng ban', deptSubtitle: 'Sắp xếp nhân lực theo phòng ban để quản lý nhân sự hiệu quả.',
    deptAdd: 'Thêm phòng ban', deptEdit: 'Chỉnh sửa phòng ban', deptDelete: 'Xóa',
    deptConfirmDelete: 'Xác nhận xóa', deptConfirmDeleteMsg: 'Bạn có chắc chắn muốn xóa phòng ban',
    deptLoading: 'Đang tải danh sách phòng ban…', deptEmpty: 'Chưa có phòng ban nào. Hãy tạo phòng ban đầu tiên.',
    deptAddSuccess: 'Đã thêm phòng ban thành công.', deptEditSuccess: 'Đã cập nhật phòng ban thành công.', deptDeleteSuccess: 'Đã xóa phòng ban thành công.',
    labelDeptName: 'Tên phòng ban', labelDeptDesc: 'Mô tả (tùy chọn)',
    thEmpCount: 'nhân viên',
    menuProfile: '👤 Hồ sơ của tôi',
    profileTitle: 'Hồ sơ của tôi', profileSubtitle: 'Thông tin tài khoản và cài đặt bảo mật của bạn.',
    profileEmail: 'Địa chỉ Email', profileRole: 'Vai trò', profileStatus: 'Trạng thái tài khoản', profileTenant: 'ID Workspace',
    profileStatusActive: 'Đang hoạt động', profileStatusInactive: 'Không hoạt động',
    changePwdTitle: 'Đổi mật khẩu', changePwdSubtitle: 'Cập nhật mật khẩu để bảo vệ tài khoản của bạn.',
    labelCurrentPwd: 'Mật khẩu hiện tại', labelNewPwd: 'Mật khẩu mới', labelConfirmPwd: 'Xác nhận mật khẩu mới',
    pwdMin8: 'Mật khẩu phải có ít nhất 8 ký tự.', pwdMismatch: 'Mật khẩu xác nhận không khớp.',
    changePwdSuccess: 'Đổi mật khẩu thành công.', btnChangePwd: 'Cập nhật mật khẩu',
    menuMembers: '💼 Thành viên',
    membersTitle: 'Thành viên Workspace', membersSubtitle: 'Quản lý quyền truy cập workspace của bạn.',
    memberInvite: 'Mời thành viên', memberInviteTitle: 'Mời vào Workspace',
    memberRemove: 'Xóa', memberYou: '(bạn)',
    memberInviteSuccess: 'Đã mời thành viên thành công.', memberRemoveSuccess: 'Đã xóa thành viên.', memberRoleUpdated: 'Đã cập nhật vai trò.',
    memberConfirmRemove: 'Xóa thành viên này khỏi workspace?',
    noMembers: 'Chưa có thành viên nào.',
  },
};

// ─── JWT Auth Fetch ──────────────────────────────────────────────────────────
// Wraps fetch() to automatically attach Bearer token.
// On 401: silently attempts /refresh. If refresh succeeds, retries the original
// request with the new token. If refresh fails, calls onExpire() (logout).
function useAuthedFetch(token, onTokenUpdate, onExpire) {
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  return useCallback(async (url, options = {}) => {
    const buildHeaders = (t) => ({
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${t}`,
    });

    let res = await fetch(url, { ...options, headers: buildHeaders(tokenRef.current) });

    if (res.status === 401) {
      try {
        const refreshRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenRef.current}`, 'Content-Type': 'application/json' },
        });
        if (refreshRes.ok) {
          const { access_token } = await refreshRes.json();
          tokenRef.current = access_token;
          onTokenUpdate(access_token);
          // Retry original request with fresh token
          res = await fetch(url, { ...options, headers: buildHeaders(access_token) });
        } else {
          onExpire();
        }
      } catch {
        onExpire();
      }
    }

    return res;
  }, [onTokenUpdate, onExpire]);
}

// ─── Language Toggle ──────────────────────────────────────────────────────────
function LangToggle({ lang, setLang, style = {} }) {
  const base = { border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
  const active = { ...base, backgroundColor: '#38bdf8', color: '#0f172a' };
  const inactive = { ...base, backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155' };
  return (
    <div style={{ display: 'flex', gap: '6px', ...style }}>
      <button style={lang === 'vi' ? active : inactive} onClick={() => setLang('vi')}>🇻🇳 VI</button>
      <button style={lang === 'en' ? active : inactive} onClick={() => setLang('en')}>🇬🇧 EN</button>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin, lang, setLang }) {
  const t = T[lang];
  const [form, setForm] = useState({ email: '', password: '', subdomain: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.detail || t.loginError); return; }
      onLogin(data.access_token, { email: data.email, role: data.role, tenant_id: data.active_tenant_id });
    } catch {
      setError(t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={ls.bg}>
      <LangToggle lang={lang} setLang={setLang} style={{ position: 'absolute', top: '24px', right: '24px' }} />
      <div style={ls.card}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#38bdf8' }}>{t.appName}</h1>
        </div>
        <h2 style={ls.title}>{t.loginTitle}</h2>
        <p style={ls.subtitle}>{t.loginSubtitle}</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={ls.label}>{t.labelEmail}</label>
            <input type="email" required autoComplete="email" style={ls.input}
              placeholder={t.placeholderEmail} value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label style={ls.label}>{t.labelPassword}</label>
            <input type="password" required autoComplete="current-password" style={ls.input}
              placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label style={ls.label}>{t.labelSubdomain}</label>
            <input type="text" required style={ls.input}
              placeholder={t.placeholderSubdomain} value={form.subdomain}
              onChange={e => setForm(f => ({ ...f, subdomain: e.target.value }))} />
          </div>
          {error && <div style={ls.errorBox}>{error}</div>}
          <button type="submit" disabled={loading} style={loading ? ls.btnDisabled : ls.btnSubmit}>
            {loading ? t.btnLoggingIn : t.btnLogin}
          </button>
        </form>
        <p style={ls.footer}>{t.loginFooter}</p>
      </div>
    </div>
  );
}

const ls = {
  bg: { minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  card: { backgroundColor: '#1e293b', borderRadius: '20px', padding: '48px 44px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' },
  title: { margin: '0 0 6px 0', fontSize: '22px', fontWeight: '700', color: '#f1f5f9', textAlign: 'center' },
  subtitle: { margin: '0 0 28px 0', color: '#94a3b8', textAlign: 'center', fontSize: '14px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#cbd5e1' },
  input: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f1f5f9', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  errorBox: { backgroundColor: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' },
  btnSubmit: { backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '13px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' },
  btnDisabled: { backgroundColor: '#334155', color: '#64748b', border: 'none', padding: '13px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'not-allowed', marginTop: '4px' },
  footer: { textAlign: 'center', color: '#475569', fontSize: '12px', marginTop: '32px', marginBottom: 0 },
};
// ─── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab({ apiFetch, user, lang }) {
  const t = T[lang];
  const isAdminOrOwner = user.role === 'admin' || user.role === 'owner';

  const [myEmployee, setMyEmployee] = useState(null);
  const [empLoading, setEmpLoading] = useState(true);
  const [attLogs, setAttLogs] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState('');
  const [attSuccess, setAttSuccess] = useState('');
  const [clockLoading, setClockLoading] = useState(false);

  const fetchMyEmployee = async () => {
    setEmpLoading(true);
    try {
      const res = await apiFetch('/api/v1/hr/employees');
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) setMyEmployee(data.find(e => e.email === user.email) || null);
    } catch {}
    finally { setEmpLoading(false); }
  };

  const fetchAttLogs = async () => {
    setAttLoading(true);
    try {
      const url = isAdminOrOwner ? '/api/v1/hr/attendance/all-logs' : '/api/v1/hr/attendance/my-logs';
      const res = await apiFetch(url);
      const data = await res.json().catch(() => []);
      if (res.ok) setAttLogs(Array.isArray(data) ? data : []);
      else setAttError(data.detail || t.errFetch);
    } catch { setAttError(t.errConn); }
    finally { setAttLoading(false); }
  };

  useEffect(() => { fetchMyEmployee(); fetchAttLogs(); }, []);

  const isClockedIn = attLogs.length > 0 && !attLogs[0].check_out;

  const handleClock = async (action) => {
    setClockLoading(true); setAttError(''); setAttSuccess('');
    try {
      const res = await apiFetch(`/api/v1/hr/attendance/${action}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const msg = action === 'check-in' ? t.attClockInSuccess : t.attClockOutSuccess;
        setAttSuccess(msg); setTimeout(() => setAttSuccess(''), 3000);
        fetchAttLogs();
      } else { setAttError(data.detail || t.errSave); }
    } catch { setAttError(t.errConn); }
    finally { setClockLoading(false); }
  };

  const fmtDt = (s) => s ? new Date(s).toLocaleString() : '—';
  const fmtDur = (i, o) => {
    if (!o) return '—';
    const mins = Math.round((new Date(o) - new Date(i)) / 60000);
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const Alert = ({ msg, color }) => msg ? <div style={{ backgroundColor: color === 'green' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${color === 'green' ? '#86efac' : '#fca5a5'}`, color: color === 'green' ? '#166534' : '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{msg}</div> : null;

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: 0, color: '#0f172a' }}>{t.attTitle}</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{t.attSubtitle}</p>
      </div>

      {!empLoading && !myEmployee && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>⚠️ {t.attNoProfile}</div>
      )}
      <Alert msg={attSuccess} color="green" />
      <Alert msg={attError} color="red" />

      {/* Clock in/out card */}
      <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {isClockedIn ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                <span style={{ color: '#15803d', fontWeight: '600', fontSize: '15px' }}>{t.attCheckedIn}</span>
              </div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{fmtDt(attLogs[0].check_in)}</div>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '14px' }}>⏰ {t.attNotClockedIn}</div>
          )}
        </div>
        {myEmployee && (
          isClockedIn
            ? <button disabled={clockLoading} onClick={() => handleClock('check-out')} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: '700', cursor: clockLoading ? 'not-allowed' : 'pointer', fontSize: '15px' }}>{clockLoading ? '…' : t.btnClockOut}</button>
            : <button disabled={clockLoading} onClick={() => handleClock('check-in')} style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: '700', cursor: clockLoading ? 'not-allowed' : 'pointer', fontSize: '15px' }}>{clockLoading ? '…' : t.btnClockIn}</button>
        )}
      </div>

      {/* Logs table */}
      <h4 style={{ color: '#334155', margin: '0 0 12px 0' }}>{isAdminOrOwner ? t.attAllLogs : t.attMyLogs}</h4>
      {attLoading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>{t.attLoading}</div>
      ) : attLogs.length === 0 ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>{t.attNoLogs}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {[...(isAdminOrOwner ? [t.thName] : []), t.thCheckIn, t.thCheckOut, t.thDuration].map(h => (
                  <th key={h} style={{ padding: '10px 14px', color: '#475569', fontWeight: '600', fontSize: '13px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attLogs.slice(0, 50).map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {isAdminOrOwner && <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>{log.employee_id.slice(0, 8)}…</td>}
                  <td style={{ padding: '12px 14px', color: '#334155', fontSize: '13px' }}>{fmtDt(log.check_in)}</td>
                  <td style={{ padding: '12px 14px', color: '#334155', fontSize: '13px' }}>
                    {log.check_out ? fmtDt(log.check_out) : <span style={{ color: '#22c55e', fontWeight: '600' }}>● Active</span>}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{fmtDur(log.check_in, log.check_out)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Leaves Tab ──────────────────────────────────────────────────────────────
function LeavesTab({ apiFetch, user, lang }) {
  const t = T[lang];
  const isAdminOrOwner = user.role === 'admin' || user.role === 'owner';

  const [myEmployee, setMyEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const emptyForm = { start_date: '', end_date: '', leave_type: 'annual', reason: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, myRes] = await Promise.all([
        apiFetch('/api/v1/hr/employees'),
        apiFetch('/api/v1/hr/leaves/my-leaves'),
      ]);
      const empData = await empRes.json().catch(() => []);
      const myData = await myRes.json().catch(() => []);
      if (empRes.ok && Array.isArray(empData)) {
        setEmployees(empData);
        setMyEmployee(empData.find(e => e.email === user.email) || null);
      }
      if (myRes.ok) setMyLeaves(Array.isArray(myData) ? myData : []);
      if (isAdminOrOwner) {
        const pRes = await apiFetch('/api/v1/hr/leaves/pending');
        const pData = await pRes.json().catch(() => []);
        if (pRes.ok) setPendingLeaves(Array.isArray(pData) ? pData : []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!myEmployee) { setFormError(t.attNoProfile); return; }
    setSaving(true); setFormError('');
    try {
      const body = { ...form, employee_id: myEmployee.id, reason: form.reason || null };
      const res = await apiFetch('/api/v1/hr/leaves', { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data.detail || t.errSave); return; }
      setShowForm(false); setForm(emptyForm);
      setSuccess(t.leaveSubmitSuccess); setTimeout(() => setSuccess(''), 3500);
      fetchAll();
    } catch { setFormError(t.errConn); }
    finally { setSaving(false); }
  };

  const handleResolve = async (id, status) => {
    try {
      const res = await apiFetch(`/api/v1/hr/leaves/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      if (res.ok) {
        const msg = status === 'approved' ? t.leaveApprovedSuccess : t.leaveRejectedSuccess;
        setSuccess(msg); setTimeout(() => setSuccess(''), 3500);
        fetchAll();
      }
    } catch {}
  };

  const leaveTypeLbl = (type) => ({ annual: t.leaveTypeAnnual, sick: t.leaveTypeSick, personal: t.leaveTypePersonal, emergency: t.leaveTypeEmergency, other: t.leaveTypeOther }[type] || type);

  const statusBadge = (s) => {
    const c = { pending: ['#fef3c7','#b45309'], approved: ['#dcfce7','#15803d'], rejected: ['#fee2e2','#dc2626'] }[s] || ['#f1f5f9','#64748b'];
    const lbs = { pending: t.leaveStatusPending, approved: t.leaveStatusApproved, rejected: t.leaveStatusRejected };
    return <span style={{ backgroundColor: c[0], color: c[1], padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{lbs[s] || s}</span>;
  };

  const empName = (id) => {
    const e = employees.find(emp => emp.id === id);
    return e ? `${e.first_name} ${e.last_name}` : id.slice(0, 8) + '…';
  };

  const filteredLeaves = filter === 'all' ? myLeaves : myLeaves.filter(l => l.status === filter);

  const statsData = [
    { label: t.filterAll, value: myLeaves.length, color: '#2563eb', bg: '#eff6ff' },
    { label: t.leaveStatusPending, value: myLeaves.filter(l => l.status === 'pending').length, color: '#b45309', bg: '#fef3c7' },
    { label: t.leaveStatusApproved, value: myLeaves.filter(l => l.status === 'approved').length, color: '#15803d', bg: '#dcfce7' },
    { label: t.leaveStatusRejected, value: myLeaves.filter(l => l.status === 'rejected').length, color: '#dc2626', bg: '#fee2e2' },
  ];

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' };
  const th = { padding: '11px 16px', color: '#475569', fontWeight: '600', fontSize: '13px' };
  const td = (extra = {}) => ({ padding: '13px 16px', color: '#334155', fontSize: '14px', ...extra });

  const filterPill = (f) => ({
    padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
    backgroundColor: filter === f ? '#2563eb' : '#f1f5f9',
    color: filter === f ? '#fff' : '#475569',
  });

  if (loading) return (
    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>{t.attLoading}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header card ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>{t.leavesTitle}</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{t.leavesSubtitle}</p>
        </div>
        {myEmployee && (
          <button onClick={() => { setForm(emptyForm); setFormError(''); setShowForm(true); }}
            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>+ {t.leaveNewBtn}</button>
        )}
      </div>

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px 20px', borderRadius: '10px', fontSize: '14px' }}>{success}</div>
      )}

      {!myEmployee && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: '14px 20px', borderRadius: '10px', fontSize: '13px' }}>⚠️ {t.attNoProfile}</div>
      )}

      {/* ── Stats row ── */}
      {myEmployee && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {statsData.map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', textAlign: 'center', border: `1px solid ${s.bg}` }}>
              <div style={{ fontSize: '34px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── My Leaves ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '17px', fontWeight: '700' }}>{t.myLeavesTitle}</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button key={f} style={filterPill(f)} onClick={() => setFilter(f)}>
                {{ all: t.filterAll, pending: t.leaveStatusPending, approved: t.leaveStatusApproved, rejected: t.leaveStatusRejected }[f]}
              </button>
            ))}
          </div>
        </div>
        {filteredLeaves.length === 0 ? (
          <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>{t.noLeaves}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {[t.labelLeaveType, t.leavePeriod, t.labelReason, t.thStatus].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(lv => (
                  <tr key={lv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={td()}>{leaveTypeLbl(lv.leave_type)}</td>
                    <td style={td({ fontSize: '13px', color: '#475569' })}>{lv.start_date} → {lv.end_date}</td>
                    <td style={td({ color: '#64748b', fontSize: '13px' })}>{lv.reason || '—'}</td>
                    <td style={td()}>{statusBadge(lv.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pending Approvals (Admin/Owner) ── */}
      {isAdminOrOwner && (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '17px', fontWeight: '700' }}>{t.pendingLeavesTitle}</h4>
            {pendingLeaves.length > 0 && (
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>{pendingLeaves.length}</span>
            )}
          </div>
          {pendingLeaves.length === 0 ? (
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>{t.noPendingLeaves}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    {[t.thName, t.labelLeaveType, t.leavePeriod, t.labelReason, t.thActions].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.map(lv => (
                    <tr key={lv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td({ fontWeight: '500' })}>{empName(lv.employee_id)}</td>
                      <td style={td()}>{leaveTypeLbl(lv.leave_type)}</td>
                      <td style={td({ fontSize: '13px', color: '#475569' })}>{lv.start_date} → {lv.end_date}</td>
                      <td style={td({ color: '#64748b', fontSize: '13px' })}>{lv.reason || '—'}</td>
                      <td style={td()}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleResolve(lv.id, 'approved')}
                            style={{ backgroundColor: '#dcfce7', color: '#15803d', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{t.btnApprove}</button>
                          <button onClick={() => handleResolve(lv.id, 'rejected')}
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{t.btnReject}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Leave form modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#0f172a' }}>{t.leaveFormTitle}</h3>
            {formError && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={lbl}>{t.labelLeaveType} *</label>
                <select required value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))} style={{ ...inp, backgroundColor: '#fff' }}>
                  <option value="annual">{t.leaveTypeAnnual}</option>
                  <option value="sick">{t.leaveTypeSick}</option>
                  <option value="personal">{t.leaveTypePersonal}</option>
                  <option value="emergency">{t.leaveTypeEmergency}</option>
                  <option value="other">{t.leaveTypeOther}</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={lbl}>{t.labelStartDate} *</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>{t.labelEndDate} *</label>
                  <input type="date" required value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>{t.labelReason}</label>
                <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                  style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{t.empCancel}</button>
                <button type="submit" disabled={saving}
                  style={{ backgroundColor: saving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px' }}>{saving ? '…' : t.empSave}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Departments Tab ─────────────────────────────────────────────────────────
function DepartmentsTab({ apiFetch, user, lang }) {
  const t = T[lang];
  const isAdminOrOwner = user.role === 'admin' || user.role === 'owner';

  const [departments, setDepartments] = useState([]);
  const [empCounts, setEmpCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const emptyForm = { name: '', description: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiFetch('/api/v1/hr/departments');
      const data = await res.json().catch(() => []);
      if (res.ok) setDepartments(Array.isArray(data) ? data : []);
      else setError(data.detail || t.errFetch);
    } catch { setError(t.errConn); }
    finally { setLoading(false); }
  };

  const fetchEmpCounts = async () => {
    try {
      const res = await apiFetch('/api/v1/hr/employees');
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) {
        const counts = {};
        data.forEach(e => { if (e.department_id) counts[e.department_id] = (counts[e.department_id] || 0) + 1; });
        setEmpCounts(counts);
      }
    } catch {}
  };

  useEffect(() => { fetchDepartments(); fetchEmpCounts(); }, []);

  const openAdd = () => { setEditDept(null); setForm(emptyForm); setFormError(''); setShowForm(true); };

  const openEdit = (dept) => {
    setEditDept(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setFormError(''); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      const body = { name: form.name, description: form.description || null };
      const url = editDept ? `/api/v1/hr/departments/${editDept.id}` : '/api/v1/hr/departments';
      const method = editDept ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data.detail || t.errSave); return; }
      setShowForm(false);
      const msg = editDept ? t.deptEditSuccess : t.deptAddSuccess;
      setSuccess(msg); setTimeout(() => setSuccess(''), 3000);
      fetchDepartments();
    } catch { setFormError(t.errConn); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/v1/hr/departments/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setDeleteConfirm(null);
        setSuccess(t.deptDeleteSuccess); setTimeout(() => setSuccess(''), 3000);
        fetchDepartments(); fetchEmpCounts();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || t.errDelete); setDeleteConfirm(null);
      }
    } catch { setError(t.errConn); setDeleteConfirm(null); }
    finally { setDeleting(false); }
  };

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString() : '—';
  const inp = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>{t.deptTitle}</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{t.deptSubtitle}</p>
        </div>
        {isAdminOrOwner && (
          <button onClick={openAdd} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>+ {t.deptAdd}</button>
        )}
      </div>

      {success && <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}
      {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '14px' }}>{t.deptLoading}</div>
      ) : departments.length === 0 ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>{t.deptEmpty}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {departments.map(dept => (
            <div key={dept.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏢</div>
                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '600' }}>{dept.name}</h4>
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 14px 0', minHeight: '20px', lineHeight: '1.5' }}>
                {dept.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#64748b' }}>
                  <span>👤 <strong>{empCounts[dept.id] || 0}</strong> {t.thEmpCount}</span>
                  <span>📅 {fmtDate(dept.created_at)}</span>
                </div>
                {isAdminOrOwner && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(dept)} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>{t.btnEdit}</button>
                    <button onClick={() => setDeleteConfirm(dept)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>{t.deptDelete}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#0f172a' }}>{editDept ? t.deptEdit : t.deptAdd}</h3>
            {formError && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{formError}</div>}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={lbl}>{t.labelDeptName} *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>{t.labelDeptDesc}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{t.empCancel}</button>
                <button type="submit" disabled={saving} style={{ backgroundColor: saving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px' }}>{saving ? '…' : t.empSave}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>{t.deptConfirmDelete}</h3>
            <p style={{ color: '#475569', marginBottom: '24px', fontSize: '14px' }}>{t.deptConfirmDeleteMsg} <strong>{deleteConfirm.name}</strong>?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{t.empCancel}</button>
              <button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer' }}>{deleting ? '…' : t.deptDelete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Employees Tab ───────────────────────────────────────────────────────────
function EmployeesTab({ apiFetch, user, lang }) {
  const t = T[lang];
  const isAdminOrOwner = user.role === 'admin' || user.role === 'owner';

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const emptyForm = { first_name: '', last_name: '', email: '', position: '', department_id: '', joined_date: '', status: 'active' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiFetch('/api/v1/hr/employees');
      const data = await res.json().catch(() => []);
      if (res.ok) setEmployees(Array.isArray(data) ? data : []);
      else setError(data.detail || t.errFetch);
    } catch { setError(t.errConn); }
    finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiFetch('/api/v1/hr/departments');
      const data = await res.json().catch(() => []);
      if (res.ok) setDepartments(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => { fetchEmployees(); fetchDepartments(); }, []);

  const openAdd = () => { setEditEmp(null); setForm(emptyForm); setFormError(''); setShowForm(true); };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({ first_name: emp.first_name, last_name: emp.last_name, email: emp.email, position: emp.position, department_id: emp.department_id || '', joined_date: emp.joined_date, status: emp.status });
    setFormError(''); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    try {
      const body = { ...form, department_id: form.department_id || null };
      const url = editEmp ? `/api/v1/hr/employees/${editEmp.id}` : '/api/v1/hr/employees';
      const method = editEmp ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data.detail || t.errSave); return; }
      setShowForm(false);
      const msg = editEmp ? t.empEditSuccess : t.empAddSuccess;
      setSuccess(msg); setTimeout(() => setSuccess(''), 3000);
      fetchEmployees();
    } catch { setFormError(t.errConn); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/v1/hr/employees/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        setSuccess(t.empDeleteSuccess); setTimeout(() => setSuccess(''), 3000);
        fetchEmployees();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || t.errDelete); setDeleteConfirm(null);
      }
    } catch { setError(t.errConn); setDeleteConfirm(null); }
    finally { setDeleting(false); }
  };

  const deptName = (id) => {
    if (!id) return <span style={{ color: '#94a3b8' }}>—</span>;
    const d = departments.find(dep => dep.id === id);
    return d ? d.name : <span style={{ color: '#94a3b8' }}>—</span>;
  };

  const statusBadge = (s) => {
    const colors = { active: { bg: '#dcfce7', fg: '#15803d' }, on_leave: { bg: '#fef3c7', fg: '#b45309' }, terminated: { bg: '#fee2e2', fg: '#dc2626' } };
    const labels = { active: t.statusActive, on_leave: t.statusOnLeave, terminated: t.statusTerminated };
    const c = colors[s] || colors.active;
    return <span style={{ backgroundColor: c.bg, color: c.fg, padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{labels[s] || s}</span>;
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>{t.empTitle}</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{t.empSubtitle}</p>
        </div>
        {isAdminOrOwner && (
          <button onClick={openAdd} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>+ {t.empAdd}</button>
        )}
      </div>

      {success && <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}
      {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', fontSize: '14px' }}>{t.empLoading}</div>
      ) : employees.length === 0 ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>{t.empEmpty}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {[t.thName, t.thEmail, t.labelPosition, t.thDepartment, t.thJoinDate, t.thStatus, ...(isAdminOrOwner ? [t.thActions] : [])].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', fontSize: '13px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', color: '#334155', fontSize: '14px', fontWeight: '500' }}>{emp.first_name} {emp.last_name}</td>
                  <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>{emp.email}</td>
                  <td style={{ padding: '14px 16px', color: '#334155', fontSize: '14px' }}>{emp.position}</td>
                  <td style={{ padding: '14px 16px', color: '#334155', fontSize: '14px' }}>{deptName(emp.department_id)}</td>
                  <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>{emp.joined_date}</td>
                  <td style={{ padding: '14px 16px' }}>{statusBadge(emp.status)}</td>
                  {isAdminOrOwner && (
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEdit(emp)} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>{t.btnEdit}</button>
                        <button onClick={() => setDeleteConfirm(emp)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>{t.empDelete}</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 24px 0', color: '#0f172a' }}>{editEmp ? t.empEdit : t.empAdd}</h3>
            {formError && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{formError}</div>}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={lbl}>{t.labelFirstName} *</label>
                  <input required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>{t.labelLastName} *</label>
                  <input required value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>{t.labelEmail} *</label>
                <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>{t.labelPosition} *</label>
                <input required value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>{t.labelDepartment}</label>
                <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} style={{ ...inp, backgroundColor: '#fff' }}>
                  <option value="">— {t.noDepartment} —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>{t.labelJoinDate} *</label>
                <input type="date" required value={form.joined_date} onChange={e => setForm(f => ({ ...f, joined_date: e.target.value }))} style={inp} />
              </div>
              {editEmp && (
                <div>
                  <label style={lbl}>{t.labelStatus}</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inp, backgroundColor: '#fff' }}>
                    <option value="active">{t.statusActive}</option>
                    <option value="on_leave">{t.statusOnLeave}</option>
                    <option value="terminated">{t.statusTerminated}</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{t.empCancel}</button>
                <button type="submit" disabled={saving} style={{ backgroundColor: saving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px' }}>{saving ? '…' : t.empSave}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>{t.empConfirmDelete}</h3>
            <p style={{ color: '#475569', marginBottom: '24px', fontSize: '14px' }}>{t.empConfirmDeleteMsg} <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{t.empCancel}</button>
              <button onClick={handleDelete} disabled={deleting} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer' }}>{deleting ? '…' : t.empDelete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Workspace Members Tab ────────────────────────────────────────────────────
function MembersTab({ apiFetch, user, lang }) {
  const t = T[lang];

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const emptyInvite = { email: '', role: 'employee' };
  const [inviteForm, setInviteForm] = useState(emptyInvite);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/auth/tenants/users');
      const data = await res.json().catch(() => []);
      if (res.ok) setMembers(Array.isArray(data) ? data : []);
      else setError(data.detail || t.errFetch);
    } catch { setError(t.errConn); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    try {
      const res = await apiFetch(`/api/v1/auth/tenants/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.detail || t.errSave); return; }
      setSuccess(t.memberRoleUpdated); setTimeout(() => setSuccess(''), 3000);
      fetchMembers();
    } catch { setError(t.errConn); }
  };

  const handleRemove = async (userId, email) => {
    if (!window.confirm(`${t.memberConfirmRemove}\n${email}`)) return;
    setError('');
    try {
      const res = await apiFetch(`/api/v1/auth/tenants/users/${userId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.detail || t.errDelete); return; }
      setSuccess(t.memberRemoveSuccess); setTimeout(() => setSuccess(''), 3000);
      fetchMembers();
    } catch { setError(t.errConn); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError(''); setInviteSaving(true);
    try {
      const res = await apiFetch('/api/v1/auth/tenants/users/invite', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setInviteError(data.detail || t.errSave); return; }
      setShowInvite(false); setInviteForm(emptyInvite);
      setSuccess(t.memberInviteSuccess); setTimeout(() => setSuccess(''), 3500);
      fetchMembers();
    } catch { setInviteError(t.errConn); }
    finally { setInviteSaving(false); }
  };

  const roleBadge = (r) => {
    const c = { owner: ['#ede9fe','#7c3aed'], admin: ['#dbeafe','#1d4ed8'], employee: ['#dcfce7','#15803d'] }[r] || ['#f1f5f9','#475569'];
    const lbs = { owner: t.roleOwner, admin: t.roleAdmin, employee: t.roleEmployee };
    return <span style={{ backgroundColor: c[0], color: c[1], padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{lbs[r] || r}</span>;
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' };
  const th = { padding: '11px 16px', color: '#475569', fontWeight: '600', fontSize: '13px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header card ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>{t.membersTitle}</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{t.membersSubtitle}</p>
        </div>
        <button onClick={() => { setInviteForm(emptyInvite); setInviteError(''); setShowInvite(true); }}
          style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>+ {t.memberInvite}</button>
      </div>

      {success && <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px 20px', borderRadius: '10px', fontSize: '14px' }}>{success}</div>}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: '700', fontSize: '16px', lineHeight: 1 }}>&#10005;</button>
        </div>
      )}

      {/* ── Members table ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px 30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>{t.attLoading}</div>
        ) : members.length === 0 ? (
          <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>{t.noMembers}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {[t.profileEmail, t.profileRole, t.profileStatus, t.thActions].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const isSelf = m.user_id === user.user_id;
                  const canEdit = !isSelf;
                  return (
                    <tr key={m.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#4338ca', fontSize: '14px', flexShrink: 0 }}>
                            {m.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: '#0f172a', fontSize: '14px' }}>{m.email}</div>
                            {isSelf && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{t.memberYou}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {canEdit ? (
                          <select value={m.role} onChange={e => handleRoleChange(m.user_id, e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: '#fff', cursor: 'pointer' }}>
                            <option value="employee">{t.roleEmployee}</option>
                            <option value="admin">{t.roleAdmin}</option>
                            {user.role === 'owner' && <option value="owner">{t.roleOwner}</option>}
                          </select>
                        ) : roleBadge(m.role)}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ backgroundColor: m.status === 'active' ? '#dcfce7' : '#f1f5f9', color: m.status === 'active' ? '#15803d' : '#64748b', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                          {m.status === 'active' ? t.profileStatusActive : t.profileStatusInactive}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {canEdit && (
                          <button onClick={() => handleRemove(m.user_id, m.email)}
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{t.memberRemove}</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Invite modal ── */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{t.memberInviteTitle}</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: 0, marginBottom: '24px' }}>{t.membersSubtitle}</p>
            {inviteError && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{inviteError}</div>}
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={lbl}>{t.profileEmail} *</label>
                <input type="email" required value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  style={inp} placeholder="user@company.com" autoFocus />
              </div>
              <div>
                <label style={lbl}>{t.profileRole} *</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} style={{ ...inp, backgroundColor: '#fff' }}>
                  <option value="employee">{t.roleEmployee}</option>
                  <option value="admin">{t.roleAdmin}</option>
                  {user.role === 'owner' && <option value="owner">{t.roleOwner}</option>}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowInvite(false)}
                  style={{ backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{t.empCancel}</button>
                <button type="submit" disabled={inviteSaving}
                  style={{ backgroundColor: inviteSaving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: inviteSaving ? 'not-allowed' : 'pointer', fontSize: '14px' }}>{inviteSaving ? '…' : t.memberInvite}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({ apiFetch, user, lang }) {
  const t = T[lang];

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/v1/auth/me');
        const data = await res.json().catch(() => ({}));
        if (res.ok) setProfile(data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handlePwd = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (pwdForm.new_password.length < 8) { setPwdError(t.pwdMin8); return; }
    if (pwdForm.new_password !== pwdForm.confirm_password) { setPwdError(t.pwdMismatch); return; }
    setPwdSaving(true);
    try {
      const res = await apiFetch('/api/v1/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: pwdForm.current_password, new_password: pwdForm.new_password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setPwdError(data.detail || t.errSave); return; }
      setPwdSuccess(t.changePwdSuccess);
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwdSuccess(''), 3500);
    } catch { setPwdError(t.errConn); }
    finally { setPwdSaving(false); }
  };

  const roleBadge = (r) => {
    const c = { owner: ['#ede9fe','#7c3aed'], admin: ['#dbeafe','#1d4ed8'], employee: ['#dcfce7','#15803d'] }[r] || ['#f1f5f9','#475569'];
    const lbs = { owner: t.roleOwner, admin: t.roleAdmin, employee: t.roleEmployee };
    return <span style={{ backgroundColor: c[0], color: c[1], padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}>{lbs[r] || r}</span>;
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' };
  const infoField = (label, content) => (
    <div>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      <div>{content}</div>
    </div>
  );

  const p = profile || user;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Profile card ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>{t.profileTitle}</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: '28px' }}>{t.profileSubtitle}</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', flexWrap: 'wrap' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            <span style={{ color: '#fff', fontSize: '32px', fontWeight: '700' }}>{(p?.email || 'U')[0].toUpperCase()}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', flex: 1 }}>
            {infoField(t.profileEmail, <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500' }}>{p?.email || '—'}</span>)}
            {infoField(t.profileRole, roleBadge(p?.role))}
            {infoField(t.profileStatus,
              <span style={{ backgroundColor: p?.status === 'active' ? '#dcfce7' : '#f1f5f9', color: p?.status === 'active' ? '#15803d' : '#64748b', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600' }}>
                {p?.status === 'active' ? t.profileStatusActive : (p?.status || t.profileStatusInactive)}
              </span>
            )}
            {infoField(t.profileTenant,
              <span style={{ fontSize: '13px', color: '#475569', fontFamily: 'monospace', backgroundColor: '#f8fafc', padding: '5px 10px', borderRadius: '6px', display: 'inline-block', border: '1px solid #e2e8f0' }}>
                {p?.active_tenant_id || p?.tenant_id || '—'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Change Password card ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>{t.changePwdTitle}</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: '24px' }}>{t.changePwdSubtitle}</p>

        {pwdSuccess && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{pwdSuccess}</div>
        )}
        {pwdError && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>{pwdError}</div>
        )}

        <form onSubmit={handlePwd} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '460px' }}>
          <div>
            <label style={lbl}>{t.labelCurrentPwd} *</label>
            <input type="password" required value={pwdForm.current_password}
              onChange={e => setPwdForm(f => ({ ...f, current_password: e.target.value }))} style={inp} autoComplete="current-password" />
          </div>
          <div>
            <label style={lbl}>{t.labelNewPwd} *</label>
            <input type="password" required value={pwdForm.new_password}
              onChange={e => setPwdForm(f => ({ ...f, new_password: e.target.value }))} style={inp} autoComplete="new-password" />
          </div>
          <div>
            <label style={lbl}>{t.labelConfirmPwd} *</label>
            <input type="password" required value={pwdForm.confirm_password}
              onChange={e => setPwdForm(f => ({ ...f, confirm_password: e.target.value }))} style={inp} autoComplete="new-password" />
          </div>
          <div>
            <button type="submit" disabled={pwdSaving}
              style={{ backgroundColor: pwdSaving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', padding: '11px 28px', borderRadius: '8px', fontWeight: '600', cursor: pwdSaving ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
              {pwdSaving ? '…' : t.btnChangePwd}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('saashr_lang') || 'vi');
  const [token, setToken] = useState(() => localStorage.getItem('saashr_token') || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saashr_user') || 'null'); }
    catch { return null; }
  });

  const [services, setServices] = useState([
    { name: 'API Gateway (Nginx)', url: '/',                        key: 'gateway', status: 'checking' },
    { name: 'Auth Service',        url: '/api/v1/auth/health',      key: 'auth',    status: 'checking' },
    { name: 'Tenant Service',      url: '/api/v1/tenants/health',   key: 'tenant',  status: 'checking' },
    { name: 'HR Service',          url: '/api/v1/hr/health',        key: 'hr',      status: 'checking' },
  ]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [correlationId, setCorrelationId] = useState('—');

  const t = T[lang];

  useEffect(() => { localStorage.setItem('saashr_lang', lang); }, [lang]);

  useEffect(() => {
    // Check services health statelessly
    const checkHealth = async () => {
      const updated = await Promise.all(
        services.map(async (service) => {
          try {
            const res = await fetch(service.url, { method: 'GET' });
            // Extract Correlation ID from headers if present
            const cid = res.headers.get('X-Correlation-ID');
            if (cid) setCorrelationId(cid);
            
            if (res.status === 200 || res.status === 404) { // 404 is acceptable since routes are empty
              return { ...service, status: 'healthy' };
            }
            return { ...service, status: 'unhealthy' };
          } catch (e) {
            return { ...service, status: 'offline' };
          }
        })
      );
      setServices(updated);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (accessToken, userData) => {
    localStorage.setItem('saashr_token', accessToken);
    localStorage.setItem('saashr_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('saashr_token');
    localStorage.removeItem('saashr_user');
    setToken(null);
    setUser(null);
  }, []);

  const handleTokenUpdate = useCallback((newToken) => {
    localStorage.setItem('saashr_token', newToken);
    setToken(newToken);
  }, []);

  const apiFetch = useAuthedFetch(token, handleTokenUpdate, handleLogout);

  const roleLabel = (role) =>
    ({ owner: t.roleOwner, admin: t.roleAdmin, employee: t.roleEmployee }[role] || role);

  const statusColor = (s) =>
    s === 'healthy' ? '#22c55e' : s === 'checking' ? '#eab308' : '#ef4444';
  const statusTextColor = (s) =>
    s === 'healthy' ? '#16a34a' : s === 'checking' ? '#ca8a04' : '#dc2626';

  if (!token || !user) {
    return <LoginPage onLogin={handleLogin} lang={lang} setLang={setLang} />;
  }

  return (
    <div style={styles.container}>
      {/* ── Sidebar ── */}
      <div style={styles.sidebar}>
        <div style={styles.logoArea}>
          <span style={styles.logoIcon}>⚡</span>
          <h2 style={styles.logoText}>{t.appName}</h2>
        </div>
        <div style={styles.menu}>
          <button
            style={activeTab === 'dashboard' ? styles.menuItemActive : styles.menuItem}
            onClick={() => setActiveTab('dashboard')}
          >{t.menuDashboard}</button>
          <button
            style={activeTab === 'employees' ? styles.menuItemActive : styles.menuItem}
            onClick={() => setActiveTab('employees')}
          >{t.menuEmployees}</button>
          <button
            style={activeTab === 'departments' ? styles.menuItemActive : styles.menuItem}
            onClick={() => setActiveTab('departments')}
          >{t.menuDepartments}</button>
          <button
            style={activeTab === 'attendance' ? styles.menuItemActive : styles.menuItem}
            onClick={() => setActiveTab('attendance')}
          >{t.menuAttendance}</button>
          <button
            style={activeTab === 'leaves' ? styles.menuItemActive : styles.menuItem}
            onClick={() => setActiveTab('leaves')}
          >{t.menuLeaves}</button>
          {(user.role === 'admin' || user.role === 'owner') && (
            <button
              style={activeTab === 'members' ? styles.menuItemActive : styles.menuItem}
              onClick={() => setActiveTab('members')}
            >{t.menuMembers}</button>
          )}
          <button
            style={activeTab === 'profile' ? styles.menuItemActive : styles.menuItem}
            onClick={() => setActiveTab('profile')}
          >{t.menuProfile}</button>
        </div>

        {/* User info + logout */}
        <div style={styles.userBox}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user.email[0].toUpperCase()}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={styles.userEmail} title={user.email}>{user.email}</div>
              <div style={styles.userRole}>{roleLabel(user.role)}</div>
            </div>
          </div>
          <button style={styles.btnLogout} onClick={handleLogout}>{t.btnLogout}</button>
        </div>

        <div style={styles.sidebarFooter}>
          <LangToggle lang={lang} setLang={setLang} />
          <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
            {t.appVersion}
          </p>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div style={styles.mainContent}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
              {t.headerTitle}
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              {t.headerSubtitle}
            </p>
          </div>
          <div style={styles.traceBadge}>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{t.traceLabel}</span>
            <code style={styles.traceCode}>{correlationId}</code>
          </div>
        </header>

        {/* ── Dashboard Tab ── */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={styles.grid}>
              {services.map((service, idx) => (
                <div key={idx} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>{service.name}</span>
                    <span style={{ ...styles.statusDot, backgroundColor: statusColor(service.status) }} />
                  </div>
                  <p style={styles.cardDesc}>{t.svcDesc[service.key]}</p>
                  <div style={styles.cardFooter}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: statusTextColor(service.status) }}>
                      {t.statusLabel} {service.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.detailsCard}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>{t.dashTitle}</h3>
              <p style={{ color: '#475569', lineHeight: '1.6', margin: 0 }}>{t.dashDesc}</p>
            </div>
          </div>
        )}

        {/* ── Employees Tab ── */}
        {activeTab === 'employees' && (
          <EmployeesTab apiFetch={apiFetch} user={user} lang={lang} />
        )}

        {/* ── Departments Tab ── */}
        {activeTab === 'departments' && (
          <DepartmentsTab apiFetch={apiFetch} user={user} lang={lang} />
        )}

        {/* ── Attendance Tab ── */}
        {activeTab === 'attendance' && (
          <AttendanceTab apiFetch={apiFetch} user={user} lang={lang} />
        )}

        {/* ── Leaves Tab ── */}
        {activeTab === 'leaves' && (
          <LeavesTab apiFetch={apiFetch} user={user} lang={lang} />
        )}

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <ProfileTab apiFetch={apiFetch} user={user} lang={lang} />
        )}

        {/* ── Members Tab ── */}
        {activeTab === 'members' && (
          <MembersTab apiFetch={apiFetch} user={user} lang={lang} />
        )}
      </div>
    </div>
  );
}

// Styling Object
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
  },
  sidebar: {
    width: '260px',
    minWidth: '260px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  logoIcon: {
    fontSize: '24px',
    color: '#38bdf8',
  },
  logoText: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    color: '#38bdf8',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
  },
  menuItem: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  menuItemActive: {
    background: '#1e293b',
    border: 'none',
    color: '#38bdf8',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  userBox: {
    borderTop: '1px solid #1e293b',
    paddingTop: '16px',
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    minWidth: '32px',
    borderRadius: '50%',
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
  },
  userEmail: {
    fontSize: '12px',
    color: '#e2e8f0',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '160px',
  },
  userRole: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  btnLogout: {
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '7px 12px',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'center',
  },
  sidebarFooter: {
    borderTop: '1px solid #1e293b',
    paddingTop: '16px',
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  mainContent: {
    flexGrow: 1,
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '20px',
  },
  traceBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    padding: '8px 16px',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    flexShrink: 0,
  },
  traceCode: {
    fontFamily: 'monospace',
    color: '#2563eb',
    fontSize: '12px',
    backgroundColor: '#eff6ff',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '140px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#334155',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  cardDesc: {
    margin: '10px 0',
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  cardFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '8px',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '2px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    color: '#475569',
    fontWeight: '600',
    fontSize: '13px',
  },
  tdRow: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '16px',
    color: '#334155',
    fontSize: '14px',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #d2d6dc',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyLogs: {
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  }
};

export default App;
