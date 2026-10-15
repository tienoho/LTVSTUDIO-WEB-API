import json
import urllib.request
import urllib.parse
import subprocess
import time
import sys
import os

PROJ = r"D:\Project\LTVSTUDIO_WEB_API\web_api"
TSX_CLI = os.path.join(PROJ, "node_modules", "tsx", "dist", "cli.mjs")
BASE_URL = "http://localhost:8080"

def request_json(path, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    url = f"{BASE_URL}{path}"
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body.strip() else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return e.code, json.loads(body) if body.strip() else {}
    except Exception as e:
        return 0, {"error": str(e)}

def run_deep_review():
    print("=" * 70)
    print("🔬 BẮT ĐẦU RÀ SOÁT CHUYÊN SÂU TOÀN DIỆN HỆ THỐNG (DEEP SYSTEM REVIEW)")
    print("=" * 70)

    proc = None
    # Check if server is already running, if not start it
    try:
        urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=1)
    except Exception:
        proc = subprocess.Popen(["node", TSX_CLI, "server.ts"], cwd=PROJ, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(2)
    
    try:
        # 1. Health Check
        status, data = request_json("/api/health")
        assert status == 200, f"Health check failed with {status}"
        assert "status" in data and "database" in data
        print("✓ [CHECK 1] GET /api/health trả về 200 OK, database driver:", data["database"].get("driver"))

        # 2. Version OTA Check (2 URLs: /api/transform/version and /api/version)
        status1, data1 = request_json("/api/transform/version")
        status2, data2 = request_json("/api/version")
        assert status1 == 200 and status2 == 200
        assert data1.get("version") == data2.get("version")
        print(f"✓ [CHECK 2] GET /api/transform/version & /api/version đồng bộ chuẩn xác (v{data1.get('version')})")

        # 3. CWE-598 Defense Check (Query parameters with secrets)
        status, data = request_json("/api/admin/stats?adminKey=secret123")
        assert status == 400 and data.get("error") == "BadRequest"
        print("✓ [CHECK 3] CWE-598: Chặn truyền mật khẩu qua URL (Query string) chính xác (400 BadRequest)")

        # 4. CORS Preflight OPTIONS Check
        req = urllib.request.Request(f"{BASE_URL}/api/auth/verify", method="OPTIONS")
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 204
            assert "Access-Control-Allow-Origin" in resp.headers
            print("✓ [CHECK 4] CORS Preflight OPTIONS xử lý chuẩn xác (204 No Content)")

        # 5. SuperAdmin Login
        status, login_res = request_json("/api/admin/login", method="POST", data={"username": "admin", "password": "ltvstudio_secret_admin_2026"})
        assert status == 200 and "token" in login_res, f"Login failed: {status} {login_res}"
        admin_token = login_res["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("✓ [CHECK 5] Đăng nhập Quản trị viên SuperAdmin thành công, cấp Bearer Token")
        request_json("/api/admin/security/reset-lockout", method="POST", data={}, headers=admin_headers)

        # 6. Create Test License Key
        status, create_res = request_json("/api/admin/licenses/create", method="POST", data={
            "plan": "TRIAL",
            "count": 1,
            "customer": "Test Deep Review",
            "notes": "Automated verification"
        }, headers=admin_headers)
        assert status == 200 and create_res.get("success")
        test_key = create_res["keys"][0]["key"]
        print(f"✓ [CHECK 6] Tạo license kiểm thử thành công: {test_key}")

        # 7. Client HWID Verification - New Activation
        hwid_pc1 = "TEST-HWID-PC1-B892AC771"
        status, v1 = request_json("/api/auth/verify", method="POST", data={
            "licenseKey": test_key,
            "machineId": hwid_pc1
        })
        assert status == 200 and v1.get("isValid") == True
        assert "token" in v1 and "nonce" in v1
        print(f"✓ [CHECK 7] Kích hoạt HWID thiết bị lần đầu thành công (Signed Token, Nonce hợp lệ)")

        # 8. Re-Verify Same Machine
        status, v2 = request_json("/api/auth/verify", method="POST", data={
            "licenseKey": test_key,
            "machineId": hwid_pc1
        })
        assert status == 200 and v2.get("isValid") == True
        print(f"✓ [CHECK 8] Xác thực lại cùng máy tính thành công (200 OK)")

        # 9. Machine ID Mismatch Defense
        hwid_pc2 = "HACKER-DIFFERENT-MACHINE-999"
        status, v_bad = request_json("/api/auth/verify", method="POST", data={
            "licenseKey": test_key,
            "machineId": hwid_pc2
        })
        assert status == 200 and v_bad.get("isValid") == False
        print("✓ [CHECK 9] Chặn kích hoạt trên thiết bị khác thành công (HWID Anti-Sharing)")

        # 10. Public Lookup (Check Masked HWID)
        status, lookup_res = request_json(f"/api/license/lookup?key={test_key}")
        assert status == 200 and lookup_res.get("exists") == True
        assert "****" in lookup_res.get("maskedMachineId", "")
        print(f"✓ [CHECK 10] Tra cứu công khai /api/license/lookup trả về masked HWID bảo mật ({lookup_res['maskedMachineId']})")

        # 11. SuperAdmin HWID Reset
        status, reset_res = request_json("/api/admin/licenses/reset-hwid", method="POST", data={
            "key": test_key
        }, headers=admin_headers)
        assert status == 200 and reset_res.get("success") == True
        print("✓ [CHECK 11] SuperAdmin Reset HWID thành công")

        # 12. Activate on New PC after Reset
        status, v_new_pc = request_json("/api/auth/verify", method="POST", data={
            "licenseKey": test_key,
            "machineId": hwid_pc2
        })
        assert status == 200 and v_new_pc.get("isValid") == True
        print("✓ [CHECK 12] Máy tính mới kích hoạt thành công sau khi Reset HWID")

        # 13. Revoke/Toggle License Status
        status, toggle_res = request_json("/api/admin/licenses/toggle-status", method="POST", data={
            "key": test_key
        }, headers=admin_headers)
        assert status == 200 and toggle_res.get("status") == "REVOKED"
        status, v_revoked = request_json("/api/auth/verify", method="POST", data={
            "licenseKey": test_key,
            "machineId": hwid_pc2
        })
        assert status == 200 and v_revoked.get("isValid") == False
        print("✓ [CHECK 13] Tạm khóa mã bản quyền (REVOKED) -> Client bị chặn xác thực ngay lập tức")

        # 14. RESTful Update (PUT /api/admin/licenses/:key)
        status, put_res = request_json(f"/api/admin/licenses/{test_key}", method="PUT", data={
            "status": "ACTIVE",
            "notes": "Updated by RESTful test"
        }, headers=admin_headers)
        assert status == 200 and put_res.get("success") == True
        print("✓ [CHECK 14] RESTful PUT /api/admin/licenses/:key cập nhật thành công")

        # 15. Audit Logs Check
        status, logs_res = request_json(f"/api/admin/licenses/logs?key={test_key}", headers=admin_headers)
        assert status == 200 and logs_res.get("count", 0) > 0
        print(f"✓ [CHECK 15] Tra cứu Audit Logs ghi nhận đầy đủ {logs_res.get('count')} lần kích hoạt")

        # 16. Database Backup Export
        status, backup_res = request_json("/api/admin/backup", headers=admin_headers)
        assert status == 200 and "licenses" in backup_res and "version" in backup_res
        print(f"✓ [CHECK 16] Sao lưu CSDL /api/admin/backup thành công ({backup_res.get('totalLicenses')} bản quyền)")

        # 17. RESTful Delete (DELETE /api/admin/licenses/:key)
        status, del_res = request_json(f"/api/admin/licenses/{test_key}", method="DELETE", headers=admin_headers)
        assert status == 200 and del_res.get("success") == True
        print("✓ [CHECK 17] RESTful DELETE /api/admin/licenses/:key xóa sạch mã bản quyền thử nghiệm")

        # 18. Verify Deleted Key
        status, lk_after = request_json(f"/api/license/lookup?key={test_key}")
        assert status == 200 and lk_after.get("exists") == False
        print("✓ [CHECK 18] Xác nhận mã thử nghiệm đã được loại bỏ hoàn toàn khỏi hệ thống")

        print("=" * 70)
        print("🎉 TẤT CẢ 18/18 HẠNG MỤC RÀ SOÁT CHUYÊN SÂU ĐỀU ĐẠT CHUẨN XUẤT SẮC 100%!")
        print("=" * 70)
    finally:
        if proc:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)

if __name__ == "__main__":
    run_deep_review()
