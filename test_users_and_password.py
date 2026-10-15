"""
Test suite kiem thu xac thuc User Database, Password Hashing SHA-256 + Salt,
Doi mat khau (Change Password) va Quan ly tai khoan (User CRUD).
"""

import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:8080"

def request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode("utf-8")
            return res.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed

def run_tests():
    print("=" * 66)
    print("🔐 KIỂM THỬ USER DATABASE, SHA-256 + SALT & ĐỔI MẬT KHẨU")
    print("=" * 66)

    # 1. Đăng nhập tài khoản admin với mật khẩu băm
    status, res = request("/api/admin/login", "POST", {
        "username": "admin",
        "password": "ltvstudio_secret_admin_2026"
    })
    assert status == 200, f"Đăng nhập admin thất bại: {res}"
    admin_token = res["token"]
    assert res["user"]["role"] == "SuperAdmin"
    print("✓ [TEST 1] Đăng nhập tài khoản 'admin' xác thực từ User DB thành công!")

    # 2. Đăng nhập tài khoản support với mật khẩu băm
    status, res = request("/api/admin/login", "POST", {
        "username": "support",
        "password": "support_secret_2026"
    })
    assert status == 200, f"Đăng nhập support thất bại: {res}"
    support_token = res["token"]
    assert res["user"]["role"] == "Support"
    print("✓ [TEST 2] Đăng nhập tài khoản 'support' xác thực từ User DB thành công!")

    # 3. Đăng nhập sai mật khẩu bị từ chối
    status, res = request("/api/admin/login", "POST", {
        "username": "admin",
        "password": "wrong_password_123"
    })
    assert status == 401, f"Mong đợi 401 Unauthorized, nhận {status}"
    print("✓ [TEST 3] Đăng nhập sai mật khẩu bị từ chối 401 Unauthorized chính xác!")

    # 4. SuperAdmin lấy danh sách người dùng
    status, res = request("/api/admin/users", "GET", token=admin_token)
    assert status == 200, f"Lấy danh sách user thất bại: {res}"
    users = res.get("users", [])
    assert len(users) >= 3, f"Số lượng user ít hơn 3: {len(users)}"
    print(f"✓ [TEST 4] Lấy danh sách người dùng thành công (Hiện có {len(users)} tài khoản)!")

    # 5. Support cố lấy danh sách user -> Bị chặn 403 Forbidden
    status, res = request("/api/admin/users", "GET", token=support_token)
    assert status == 403, f"Mong đợi Support bị chặn 403, nhận {status}"
    print("✓ [TEST 5] Tài khoản Support bị chặn xem danh sách user (403 Forbidden) chuẩn RBAC!")

    # 6. SuperAdmin tạo tài khoản mới 'tester2026'
    new_user_data = {
        "username": "tester2026",
        "password": "test_password_2026",
        "fullName": "Kiểm Thử Viên 2026",
        "email": "tester@ltvstudio.vn",
        "role": "Support"
    }
    status, res = request("/api/admin/users", "POST", new_user_data, token=admin_token)
    assert status == 201, f"Tạo user thất bại: {res}"
    print("✓ [TEST 6] SuperAdmin tạo tài khoản mới 'tester2026' thành công!")

    # 7. Đăng nhập bằng tài khoản mới vừa tạo
    status, res = request("/api/admin/login", "POST", {
        "username": "tester2026",
        "password": "test_password_2026"
    })
    assert status == 200, f"Đăng nhập user mới thất bại: {res}"
    tester_token = res["token"]
    assert res["user"]["role"] == "Support"
    print("✓ [TEST 7] Tài khoản mới 'tester2026' đăng nhập thành công với mật khẩu băm!")

    # 8. User tự đổi mật khẩu (tester2026 tự đổi mật khẩu)
    status, res = request("/api/admin/change-password", "POST", {
        "currentPassword": "test_password_2026",
        "newPassword": "new_tester_pass_9999"
    }, token=tester_token)
    assert status == 200, f"Đổi mật khẩu thất bại: {res}"
    print("✓ [TEST 8] Tài khoản tự đổi mật khẩu với xác thực mật khẩu cũ thành công!")

    # 9. Mật khẩu cũ không còn tác dụng
    status, res = request("/api/admin/login", "POST", {
        "username": "tester2026",
        "password": "test_password_2026"
    })
    assert status == 401, f"Mật khẩu cũ vẫn đăng nhập được! {status}"
    print("✓ [TEST 9] Mật khẩu cũ bị vô hiệu hóa 100% sau khi đổi!")

    # 10. Đăng nhập bằng mật khẩu mới
    status, res = request("/api/admin/login", "POST", {
        "username": "tester2026",
        "password": "new_tester_pass_9999"
    })
    assert status == 200, f"Đăng nhập mật khẩu mới thất bại: {res}"
    print("✓ [TEST 10] Đăng nhập bằng mật khẩu mới thành công!")

    # 11. Khóa tài khoản tester2026 (Toggle status sang SUSPENDED)
    status, res = request("/api/admin/users/toggle-status", "POST", {
        "username": "tester2026"
    }, token=admin_token)
    assert status == 200, f"Khóa tài khoản thất bại: {res}"
    print("✓ [TEST 11] Khóa tạm thời tài khoản 'tester2026' thành công!")

    # 12. Tài khoản bị khóa đăng nhập sẽ bị chặn 403 AccountLocked
    status, res = request("/api/admin/login", "POST", {
        "username": "tester2026",
        "password": "new_tester_pass_9999"
    })
    assert status == 403, f"Mong đợi 403 AccountLocked, nhận {status}"
    print("✓ [TEST 12] Tài khoản bị khóa cố đăng nhập bị chặn 403 (AccountLocked) chính xác!")

    # 13. Xóa tài khoản test 'tester2026' để dọn dẹp hệ thống
    status, res = request("/api/admin/users/delete", "POST", {
        "username": "tester2026"
    }, token=admin_token)
    assert status == 200, f"Xóa tài khoản thất bại: {res}"
    print("✓ [TEST 13] Xóa tài khoản thử nghiệm thành công!")

    print("=" * 66)
    print("🎉 TOÀN BỘ 13/13 HẠNG MỤC USER DATABASE & ĐỔI MẬT KHẨU ĐẠT CHUẨN XUẤT SẮC 100%!")
    print("=" * 66)

if __name__ == "__main__":
    run_tests()
