"""
Bộ kiểm thử chuyên sâu các trường hợp biên (Edge Cases & Security Hardening Test)
cho Bảng users, Password Hashing SHA-256 + Salt, Đổi mật khẩu và RBAC User Management.
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

def run_edge_cases():
    print("=" * 72)
    print("🛡️  RÀ SOÁT KỸ LƯỠNG & KIỂM THỬ TRƯỜNG HỢP BIÊN (SECURITY EDGE CASES)")
    print("=" * 72)

    # 1. Đăng nhập 3 tài khoản chuẩn
    s_admin, res_admin = request("/api/admin/login", "POST", {"username": "admin", "password": "ltvstudio_secret_admin_2026"})
    assert s_admin == 200, "Đăng nhập admin thất bại"
    admin_token = res_admin["token"]

    s_supp, res_supp = request("/api/admin/login", "POST", {"username": "support", "password": "support_secret_2026"})
    assert s_supp == 200, "Đăng nhập support thất bại"
    support_token = res_supp["token"]

    s_audit, res_audit = request("/api/admin/login", "POST", {"username": "auditor", "password": "auditor_secret_2026"})
    assert s_audit == 200, "Đăng nhập auditor thất bại"
    auditor_token = res_audit["token"]

    print("✓ [TEST 1] Đăng nhập 3 vai trò SuperAdmin, Support, Auditor thành công!")

    # 2. Edge Case Đổi Mật Khẩu: Tự đổi nhưng nhập sai mật khẩu hiện tại
    s, res = request("/api/admin/change-password", "POST", {
        "currentPassword": "sai_mat_khau_cu_123",
        "newPassword": "new_password_safe_2026"
    }, token=admin_token)
    assert s == 400 and res.get("error") == "InvalidCurrentPassword", f"Mong đợi 400 InvalidCurrentPassword, nhận {s}: {res}"
    print("✓ [TEST 2] Nhập sai mật khẩu hiện tại bị chặn chính xác (400 InvalidCurrentPassword)!")

    # 3. Edge Case Đổi Mật Khẩu: Mật khẩu mới quá ngắn (< 6 ký tự)
    s, res = request("/api/admin/change-password", "POST", {
        "currentPassword": "ltvstudio_secret_admin_2026",
        "newPassword": "123"
    }, token=admin_token)
    assert s == 400 and res.get("error") == "BadRequest", f"Mong đợi 400 BadRequest, nhận {s}: {res}"
    print("✓ [TEST 3] Mật khẩu mới quá ngắn (< 6 ký tự) bị từ chối chính xác (400 BadRequest)!")

    # 4. Edge Case Phân quyền: Support cố đổi mật khẩu tài khoản khác -> Bị chặn 403 Forbidden
    s, res = request("/api/admin/change-password", "POST", {
        "targetUsername": "auditor",
        "newPassword": "new_hacked_pass_2026"
    }, token=support_token)
    assert s == 403 and res.get("error") == "Forbidden", f"Mong đợi Support bị chặn 403, nhận {s}: {res}"
    print("✓ [TEST 4] Support cố đổi mật khẩu user khác bị chặn chính xác (403 Forbidden)!")

    # 5. Edge Case Phân quyền: Auditor cố đổi mật khẩu tài khoản khác -> Bị chặn 403 Forbidden
    s, res = request("/api/admin/change-password", "POST", {
        "targetUsername": "support",
        "newPassword": "new_hacked_pass_2026"
    }, token=auditor_token)
    assert s == 403 and res.get("error") == "Forbidden", f"Mong đợi Auditor bị chặn 403, nhận {s}: {res}"
    print("✓ [TEST 5] Auditor cố đổi mật khẩu user khác bị chặn chính xác (403 Forbidden)!")

    # 6. Edge Case Đổi Mật Khẩu: SuperAdmin đổi mật khẩu user không tồn tại -> 404 NotFound
    s, res = request("/api/admin/change-password", "POST", {
        "targetUsername": "non_existing_user_9999",
        "newPassword": "some_valid_new_password_2026"
    }, token=admin_token)
    assert s == 404 and res.get("error") == "NotFound", f"Mong đợi 404 NotFound, nhận {s}: {res}"
    print("✓ [TEST 6] Đổi mật khẩu tài khoản không tồn tại trả về 404 NotFound chuẩn xác!")

    # 7. Edge Case Quản Lý User: Auditor và Support cố tạo user -> Bị chặn 403
    s, res = request("/api/admin/users", "POST", {
        "username": "illegal_user",
        "password": "valid_pass_123456",
        "role": "Support"
    }, token=support_token)
    assert s == 403, f"Mong đợi Support bị chặn 403, nhận {s}"
    s2, res2 = request("/api/admin/users", "POST", {
        "username": "illegal_user",
        "password": "valid_pass_123456",
        "role": "Support"
    }, token=auditor_token)
    assert s2 == 403, f"Mong đợi Auditor bị chặn 403, nhận {s2}"
    print("✓ [TEST 7] Cả Support & Auditor bị chặn triệt để khi cố tạo tài khoản mới (403 Forbidden)!")

    # 8. Edge Case Tạo User: Trùng username -> 409 Conflict
    s, res = request("/api/admin/users", "POST", {
        "username": "admin",
        "password": "password123456",
        "role": "Support"
    }, token=admin_token)
    assert s == 409 and res.get("error") == "Conflict", f"Mong đợi 409 Conflict khi trùng user, nhận {s}: {res}"
    print("✓ [TEST 8] Tạo user trùng tên đăng nhập bị từ chối chính xác (409 Conflict)!")

    # 9. Edge Case Tạo User: Tên đăng nhập chứa ký tự cấm (Space, Slash, etc.)
    s, res = request("/api/admin/users", "POST", {
        "username": "user with spaces!",
        "password": "password123456",
        "role": "Support"
    }, token=admin_token)
    assert s == 400 and res.get("error") == "BadRequest", f"Mong đợi 400 BadRequest khi username không hợp lệ, nhận {s}: {res}"
    print("✓ [TEST 9] Tên đăng nhập chứa ký tự cấm bị từ chối chính xác (400 BadRequest)!")

    # 10. Edge Case Bảo Vệ Tài Khoản Gốc: Cố tự khóa tài khoản của chính mình -> Bị chặn 400
    s, res = request("/api/admin/users/toggle-status", "POST", {
        "username": "admin"
    }, token=admin_token)
    assert s == 400, f"Mong đợi chặn không cho tự khóa admin gốc, nhận {s}: {res}"
    print("✓ [TEST 10] Ngăn chặn tự khóa tài khoản của chính mình hoặc admin gốc (400 BadRequest)!")

    # 11. Edge Case Bảo Vệ Tài Khoản Gốc: Cố xóa tài khoản admin gốc -> Bị chặn 400
    s, res = request("/api/admin/users/delete", "POST", {
        "username": "admin"
    }, token=admin_token)
    assert s == 400, f"Mong đợi chặn không cho xóa tài khoản admin gốc, nhận {s}: {res}"
    print("✓ [TEST 11] Ngăn chặn xóa tài khoản admin gốc (400 BadRequest)!")

    # 12. Edge Case Bảo Vệ Tài Khoản Gốc: Cố hạ vai trò (Role Demotion) của admin gốc -> Bị chặn 400
    s, res = request("/api/admin/users/update", "POST", {
        "username": "admin",
        "role": "Support"
    }, token=admin_token)
    assert s == 400, f"Mong đợi chặn không cho hạ quyền admin gốc, nhận {s}: {res}"
    print("✓ [TEST 12] Ngăn chặn hạ vai trò (Demotion) tài khoản admin gốc (400 BadRequest)!")

    # 13. Edge Case DTO: Kiểm tra GET /api/admin/users tuyệt đối không lộ hash mật khẩu
    s, res = request("/api/admin/users", "GET", token=admin_token)
    assert s == 200
    for u in res.get("users", []):
        assert "passwordHash" not in u, f"CẢNH BÁO: Lộ passwordHash trong user DTO: {u}"
        assert "password_hash" not in u, f"CẢNH BÁO: Lộ password_hash trong user DTO: {u}"
    print("✓ [TEST 13] Danh sách người dùng DTO hoàn toàn sạch sẽ, KHÔNG rò rỉ hash mật khẩu!")

    print("=" * 72)
    print("🎉 TOÀN BỘ 13/13 HẠNG MỤC RÀ SOÁT BẢO MẬT & TRƯỜNG HỢP BIÊN ĐẠT 100% XUẤT SẮC!")
    print("=" * 72)

if __name__ == "__main__":
    run_edge_cases()
