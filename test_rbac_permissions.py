import subprocess
import time
import urllib.request
import urllib.error
import json
import os

PROJ = r"D:\Project\LTVSTUDIO_WEB_API\web_api"
TSX_CLI = os.path.join(PROJ, "node_modules", "tsx", "dist", "cli.mjs")

ADMIN_SECRET = "ltvstudio_secret_admin_2026"
SUPPORT_SECRET = "ltv_support_secret_2026"
AUDITOR_SECRET = "ltv_auditor_secret_2026"

def run_rbac_test_suite():
    print("==================================================================")
    print("🛡️  KIỂM THỬ HỆ THỐNG PHÂN QUYỀN QUẢN TRỊ 3 VAI TRÒ (RBAC TEST)")
    print("==================================================================")

    proc = subprocess.Popen(["node", TSX_CLI, "server.ts"], cwd=PROJ, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2)

    try:
        # -------------------------------------------------------------
        # 1. SUPERADMIN ROLE TESTS
        # -------------------------------------------------------------
        print("\n--- [ROLE 1: SuperAdmin] Full Access & Management ---")
        login_super = json.dumps({"username": "admin", "password": ADMIN_SECRET}).encode('utf-8')
        req_super_login = urllib.request.Request("http://localhost:8080/api/admin/login", data=login_super, headers={"Content-Type": "application/json"})
        res_super_login = json.loads(urllib.request.urlopen(req_super_login).read().decode('utf-8'))
        
        assert res_super_login['success'] is True
        assert res_super_login['user']['role'] == 'SuperAdmin'
        super_token = res_super_login['token']
        print(f"✓ SuperAdmin đăng nhập thành công: User {res_super_login['user']['username']} (Role: {res_super_login['user']['role']})")

        # SuperAdmin creates a key
        create_payload = json.dumps({"plan": "PRO", "count": 1, "customer": "RBAC SuperAdmin Test"}).encode('utf-8')
        req_super_create = urllib.request.Request(
            "http://localhost:8080/api/admin/licenses/create",
            data=create_payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {super_token}"}
        )
        res_super_create = json.loads(urllib.request.urlopen(req_super_create).read().decode('utf-8'))
        assert res_super_create['success'] is True
        test_key = res_super_create['keys'][0]['key']
        print(f"✓ SuperAdmin tạo key thành công: {test_key}")

        # SuperAdmin updates OTA Version
        ver_payload = json.dumps({"version": "1.0.1", "downloadUrl": "https://example.com/dl", "changelog": "RBAC test update"}).encode('utf-8')
        req_super_ver = urllib.request.Request(
            "http://localhost:8080/api/admin/version",
            data=ver_payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {super_token}"}
        )
        res_super_ver = json.loads(urllib.request.urlopen(req_super_ver).read().decode('utf-8'))
        assert res_super_ver['success'] is True
        print("✓ SuperAdmin cấu hình phiên bản OTA thành công (200 OK)")

        # SuperAdmin downloads backup
        req_super_backup = urllib.request.Request(
            "http://localhost:8080/api/admin/backup",
            headers={"Authorization": f"Bearer {super_token}"}
        )
        res_super_backup = json.loads(urllib.request.urlopen(req_super_backup).read().decode('utf-8'))
        assert 'licenses' in res_super_backup
        print("✓ SuperAdmin tải bản sao lưu CSDL Backup JSON thành công (200 OK)")

        # -------------------------------------------------------------
        # 2. SUPPORT ROLE TESTS (Cấp phép & Hỗ trợ, Chặn Xóa & Chặn OTA)
        # -------------------------------------------------------------
        print("\n--- [ROLE 2: Support] Customer Service & Restricted Operations ---")
        login_support = json.dumps({"username": "support", "password": SUPPORT_SECRET, "role": "Support"}).encode('utf-8')
        req_support_login = urllib.request.Request("http://localhost:8080/api/admin/login", data=login_support, headers={"Content-Type": "application/json"})
        res_support_login = json.loads(urllib.request.urlopen(req_support_login).read().decode('utf-8'))

        assert res_support_login['success'] is True
        assert res_support_login['user']['role'] == 'Support'
        support_token = res_support_login['token']
        print(f"✓ Support đăng nhập thành công: User {res_support_login['user']['username']} (Role: {res_support_login['user']['role']})")

        # Support can create key
        create_supp_payload = json.dumps({"plan": "PRO", "count": 1, "customer": "Support Customer"}).encode('utf-8')
        req_supp_create = urllib.request.Request(
            "http://localhost:8080/api/admin/licenses/create",
            data=create_supp_payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {support_token}"}
        )
        res_supp_create = json.loads(urllib.request.urlopen(req_supp_create).read().decode('utf-8'))
        assert res_supp_create['success'] is True
        supp_key = res_supp_create['keys'][0]['key']
        print(f"✓ Support được phép tạo mã key mới: {supp_key}")

        # Support can reset HWID
        reset_payload = json.dumps({"key": supp_key}).encode('utf-8')
        req_supp_reset = urllib.request.Request(
            "http://localhost:8080/api/admin/licenses/reset-hwid",
            data=reset_payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {support_token}"}
        )
        res_supp_reset = json.loads(urllib.request.urlopen(req_supp_reset).read().decode('utf-8'))
        assert res_supp_reset['success'] is True
        print(f"✓ Support được phép Reset HWID khi khách đổi máy tính (200 OK)")

        # Support can extend key
        ext_payload = json.dumps({"key": supp_key, "days": 30}).encode('utf-8')
        req_supp_ext = urllib.request.Request(
            "http://localhost:8080/api/admin/licenses/extend",
            data=ext_payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {support_token}"}
        )
        res_supp_ext = json.loads(urllib.request.urlopen(req_supp_ext).read().decode('utf-8'))
        assert res_supp_ext['success'] is True
        print(f"✓ Support được phép gia hạn thời gian bản quyền (200 OK)")

        # Support CANNOT delete key -> MUST return 403 Forbidden
        try:
            req_supp_del = urllib.request.Request(
                f"http://localhost:8080/api/admin/licenses/{supp_key}",
                headers={"Authorization": f"Bearer {support_token}"},
                method="DELETE"
            )
            urllib.request.urlopen(req_supp_del)
            assert False, "Support MUST NOT be allowed to delete licenses!"
        except urllib.error.HTTPError as e:
            assert e.code == 403, f"Expected 403 Forbidden, got {e.code}"
            err_data = json.loads(e.read().decode('utf-8'))
            print(f"✓ PASS: Support bị chặn xóa vĩnh viễn key (403 Forbidden): {err_data.get('message')}")

        # Support CANNOT update OTA version -> MUST return 403 Forbidden
        try:
            req_supp_ota = urllib.request.Request(
                "http://localhost:8080/api/admin/version",
                data=json.dumps({"version": "9.9.9"}).encode('utf-8'),
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {support_token}"}
            )
            urllib.request.urlopen(req_supp_ota)
            assert False, "Support MUST NOT be allowed to publish OTA updates!"
        except urllib.error.HTTPError as e:
            assert e.code == 403
            err_data = json.loads(e.read().decode('utf-8'))
            print(f"✓ PASS: Support bị chặn cấu hình phát hành OTA (403 Forbidden): {err_data.get('message')}")

        # -------------------------------------------------------------
        # 3. AUDITOR ROLE TESTS (Quyền chỉ đọc, Chặn tất cả sửa đổi)
        # -------------------------------------------------------------
        print("\n--- [ROLE 3: Auditor] Read-Only Inspection & Strict Mutation Block ---")
        login_auditor = json.dumps({"username": "auditor", "password": AUDITOR_SECRET, "role": "Auditor"}).encode('utf-8')
        req_auditor_login = urllib.request.Request("http://localhost:8080/api/admin/login", data=login_auditor, headers={"Content-Type": "application/json"})
        res_auditor_login = json.loads(urllib.request.urlopen(req_auditor_login).read().decode('utf-8'))

        assert res_auditor_login['success'] is True
        assert res_auditor_login['user']['role'] == 'Auditor'
        auditor_token = res_auditor_login['token']
        print(f"✓ Auditor đăng nhập thành công: User {res_auditor_login['user']['username']} (Role: {res_auditor_login['user']['role']})")

        # Auditor CAN view stats
        req_aud_stats = urllib.request.Request("http://localhost:8080/api/admin/stats", headers={"Authorization": f"Bearer {auditor_token}"})
        res_aud_stats = json.loads(urllib.request.urlopen(req_aud_stats).read().decode('utf-8'))
        assert 'total' in res_aud_stats
        print(f"✓ Auditor được phép xem Dashboard KPIs & thống kê (Tổng key: {res_aud_stats['total']})")

        # Auditor CAN view licenses list
        req_aud_lics = urllib.request.Request("http://localhost:8080/api/admin/licenses", headers={"Authorization": f"Bearer {auditor_token}"})
        res_aud_lics = json.loads(urllib.request.urlopen(req_aud_lics).read().decode('utf-8'))
        assert 'licenses' in res_aud_lics
        print(f"✓ Auditor được phép xem danh sách bản quyền để kiểm toán/kế toán (200 OK)")

        # Auditor CAN view audit logs
        req_aud_logs = urllib.request.Request("http://localhost:8080/api/admin/logs", headers={"Authorization": f"Bearer {auditor_token}"})
        res_aud_logs = json.loads(urllib.request.urlopen(req_aud_logs).read().decode('utf-8'))
        assert 'logs' in res_aud_logs
        print(f"✓ Auditor được phép tra cứu nhật ký Audit Logs (200 OK)")

        # Auditor CANNOT create key -> 403 Forbidden
        try:
            req_aud_create = urllib.request.Request(
                "http://localhost:8080/api/admin/licenses/create",
                data=json.dumps({"plan": "PRO", "count": 1}).encode('utf-8'),
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {auditor_token}"}
            )
            urllib.request.urlopen(req_aud_create)
            assert False, "Auditor MUST NOT be allowed to create keys!"
        except urllib.error.HTTPError as e:
            assert e.code == 403
            print(f"✓ PASS: Auditor bị chặn tạo key mới (403 Forbidden)")

        # Auditor CANNOT reset HWID -> 403 Forbidden
        try:
            req_aud_reset = urllib.request.Request(
                "http://localhost:8080/api/admin/licenses/reset-hwid",
                data=json.dumps({"key": supp_key}).encode('utf-8'),
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {auditor_token}"}
            )
            urllib.request.urlopen(req_aud_reset)
            assert False, "Auditor MUST NOT be allowed to reset HWID!"
        except urllib.error.HTTPError as e:
            assert e.code == 403
            print(f"✓ PASS: Auditor bị chặn Reset HWID (403 Forbidden)")

        # Auditor CANNOT delete key -> 403 Forbidden
        try:
            req_aud_del = urllib.request.Request(
                f"http://localhost:8080/api/admin/licenses/{supp_key}",
                headers={"Authorization": f"Bearer {auditor_token}"},
                method="DELETE"
            )
            urllib.request.urlopen(req_aud_del)
            assert False, "Auditor MUST NOT be allowed to delete keys!"
        except urllib.error.HTTPError as e:
            assert e.code == 403
            print(f"✓ PASS: Auditor bị chặn xóa key (403 Forbidden)")

        # -------------------------------------------------------------
        # 4. TOKEN TAMPERING DEFENSE
        # -------------------------------------------------------------
        print("\n--- [SECURITY] Token Anti-Tampering & Privilege Escalation Defense ---")
        # Try to modify Auditor token payload to SuperAdmin
        parts = auditor_token.split('.')
        tampered_token = parts[0] + "tampered." + parts[1]
        try:
            req_tampered = urllib.request.Request(
                "http://localhost:8080/api/admin/stats",
                headers={"Authorization": f"Bearer {tampered_token}"}
            )
            urllib.request.urlopen(req_tampered)
            assert False, "Tampered token must be rejected!"
        except urllib.error.HTTPError as e:
            assert e.code in [401, 403]
            print("✓ PASS: Token bị can thiệp sửa đổi bị từ chối xác thực ngay lập tức (Chống giả mạo vai trò)")

        # Cleanup: SuperAdmin deletes the test keys
        del_req1 = urllib.request.Request(f"http://localhost:8080/api/admin/licenses/{test_key}", headers={"Authorization": f"Bearer {super_token}"}, method="DELETE")
        urllib.request.urlopen(del_req1)
        del_req2 = urllib.request.Request(f"http://localhost:8080/api/admin/licenses/{supp_key}", headers={"Authorization": f"Bearer {super_token}"}, method="DELETE")
        urllib.request.urlopen(del_req2)
        print("\n✓ Đã dọn dẹp các mã bản quyền thử nghiệm an toàn.")

        print("\n" + "="*66)
        print("🎉 TẤT CẢ CÁC KỊCH BẢN KIỂM THỬ PHÂN QUYỀN RBAC ĐỀU ĐẠT CHUẨN XUẤT SẮC 100%!")
        print("==================================================================")

    finally:
        if proc:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        print("Đã dừng server test an toàn.")

if __name__ == '__main__':
    run_rbac_test_suite()
