import subprocess
import time
import urllib.request
import urllib.error
import json
import os
import hmac
import hashlib

PROJ = r"D:\Project\LTVSTUDIO_WEB_API\web_api"
TSX_CLI = os.path.join(PROJ, "node_modules", "tsx", "dist", "cli.mjs")
ADMIN_SECRET = "ltvstudio_secret_admin_2026"
AUTH_TOKEN_SECRET = ADMIN_SECRET + "_ltv_signature_secret_2026"

def run_hardened_auth_test():
    print("==================================================================")
    print("🔒 LTVSTUDIO WEB API - HARDENED AUTHENTICATION & DEFENSE TEST SUITE")
    print("==================================================================")

    proc = subprocess.Popen(["node", TSX_CLI, "local-server.ts"], cwd=PROJ, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2)

    try:
        # TEST 1: Tamper-Proof Cryptographic Signature & Anti-Replay
        print("\n--- [AUTH TEST 1] Tamper-Proof HMAC-SHA256 Token & Nonce ---")
        req_create = urllib.request.Request(
            "http://localhost:8080/api/admin/licenses/create",
            data=json.dumps({"plan": "PRO", "count": 1, "customer": "Hardened Auth Test"}).encode('utf-8'),
            headers={"Content-Type": "application/json", "x-admin-key": ADMIN_SECRET}
        )
        res_create = json.loads(urllib.request.urlopen(req_create).read().decode('utf-8'))
        test_key = res_create['keys'][0]['key']
        test_hwid = "HWID-AUTH-TEST-MACHINE-001"

        verify_body = json.dumps({
            "licenseKey": test_key,
            "machineId": test_hwid
        }).encode('utf-8')
        req1 = urllib.request.Request(
            "http://localhost:8080/api/auth/verify",
            data=verify_body,
            headers={"Content-Type": "application/json"}
        )
        res1 = urllib.request.urlopen(req1)
        data1 = json.loads(res1.read().decode('utf-8'))

        assert data1['isValid'] is True, f"Valid license must return isValid: true, got {data1}"
        assert 'token' in data1 and data1['token'], "Missing cryptographic token"
        assert 'timestamp' in data1 and data1['timestamp'] > 0, "Missing timestamp"
        assert 'nonce' in data1 and len(data1['nonce']) >= 16, "Missing cryptographic nonce"

        # Verify HMAC-SHA256 server signature
        payload_expected = f"{test_key}:{test_hwid}:LIFETIME:{data1['timestamp']}:{data1['nonce']}"
        expected_sig = hmac.new(AUTH_TOKEN_SECRET.encode('utf-8'), payload_expected.encode('utf-8'), hashlib.sha256).hexdigest()
        assert data1['token'] == expected_sig, f"Signature mismatch: {data1['token']} != {expected_sig}"
        print(f"✓ PASS: Server đã ký số phản hồi xác thực bản quyền với HMAC-SHA256 chuẩn xác!")
        print(f"   • Nonce: {data1['nonce']}")
        print(f"   • Timestamp: {data1['timestamp']}")
        print(f"   • Signature Token: {data1['token']}")

        # TEST 2: Strict HWID Format Validation (Anti-Dummy / Anti-Spoof)
        print("\n--- [AUTH TEST 2] Strict HWID Sanitization & Validation ---")
        # 2.1: HWID quá ngắn
        short_hwid_req = urllib.request.Request(
            "http://localhost:8080/api/auth/verify",
            data=json.dumps({"licenseKey": test_key, "machineId": "123"}).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        res_short = json.loads(urllib.request.urlopen(short_hwid_req).read().decode('utf-8'))
        assert res_short['isValid'] is False, "Short HWID must be rejected"
        assert "quá ngắn" in res_short['message'], "Error message should mention short HWID"
        print(f"✓ PASS: HWID quá ngắn ('123') bị từ chối chính xác: {res_short['message']}")

        # 2.2: HWID giá trị mẫu / dummy
        dummy_hwid_req = urllib.request.Request(
            "http://localhost:8080/api/auth/verify",
            data=json.dumps({"licenseKey": test_key, "machineId": "12345678"}).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        res_dummy = json.loads(urllib.request.urlopen(dummy_hwid_req).read().decode('utf-8'))
        assert res_dummy['isValid'] is False, "Dummy HWID must be rejected"
        print(f"✓ PASS: HWID giá trị mẫu ('12345678') bị từ chối chính xác: {res_dummy['message']}")

        # TEST 3: Admin Query Parameter Deprecation & Header Enforcement (CWE-598)
        print("\n--- [AUTH TEST 3] CWE-598 Admin Credential URL Exposure Defense ---")
        # 3.1: Gửi adminKey qua query string không có header -> Phải bị từ chối 401
        try:
            req_query = urllib.request.Request(f"http://localhost:8080/api/admin/stats?adminKey={ADMIN_SECRET}")
            urllib.request.urlopen(req_query)
            assert False, "Passing adminKey in query string must NOT grant admin access!"
        except urllib.error.HTTPError as e:
            assert e.code in [400, 401, 403], f"Expected 401 or 403, got {e.code}"
            print("✓ PASS: Chặn triệt để query parameter ?adminKey= (CWE-598 Mitigation) - Bắt buộc dùng Header!")

        # 3.2: Gửi qua header x-admin-key -> Hợp lệ 200 OK
        req_header = urllib.request.Request("http://localhost:8080/api/admin/stats", headers={"x-admin-key": ADMIN_SECRET})
        res_header = urllib.request.urlopen(req_header)
        assert res_header.status == 200
        print("✓ PASS: Truy cập Admin với header x-admin-key thành công (200 OK)")

        # TEST 4: Admin Login Endpoint & Signed Session Token (JWT-like)
        print("\n--- [AUTH TEST 4] POST /api/admin/login & Signed Session Token ---")
        # 4.1: Đăng nhập sai
        try:
            req_bad_login = urllib.request.Request(
                "http://localhost:8080/api/admin/login",
                data=json.dumps({"secret": "wrong_password"}).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            urllib.request.urlopen(req_bad_login)
            assert False, "Bad login must return 401"
        except urllib.error.HTTPError as e:
            assert e.code == 401
            print("✓ PASS: Đăng nhập sai secret bị từ chối chính xác (401 Unauthorized)")

        # 4.2: Đăng nhập đúng -> Cấp session token
        req_good_login = urllib.request.Request(
            "http://localhost:8080/api/admin/login",
            data=json.dumps({"secret": ADMIN_SECRET}).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        res_good_login = urllib.request.urlopen(req_good_login)
        login_data = json.loads(res_good_login.read().decode('utf-8'))
        assert login_data['success'] is True
        assert 'token' in login_data and '.' in login_data['token'], "Session token must be base64url.signature"
        session_token = login_data['token']
        print(f"✓ PASS: Đăng nhập Admin thành công, đã cấp Session Token: {session_token[:25]}... (TTL: {login_data['expiresIn']}s)")

        # 4.3: Dùng Session Token trong Authorization: Bearer
        req_bearer = urllib.request.Request("http://localhost:8080/api/admin/stats", headers={"Authorization": f"Bearer {session_token}"})
        res_bearer = urllib.request.urlopen(req_bearer)
        assert res_bearer.status == 200
        print("✓ PASS: Sử dụng Session Token với Authorization: Bearer <token> thành công (200 OK)")

        # 4.4: Kiểm tra verify session
        req_verify_sess = urllib.request.Request("http://localhost:8080/api/admin/verify-session", headers={"Authorization": f"Bearer {session_token}"})
        res_verify_sess = json.loads(urllib.request.urlopen(req_verify_sess).read().decode('utf-8'))
        assert res_verify_sess['authenticated'] is True
        print("✓ PASS: Kiểm tra phiên làm việc /api/admin/verify-session thành công")

        # TEST 5: Anti-Brute-Force License Verification Lockout
        print("\n--- [AUTH TEST 5] Anti-Brute-Force License Verification Lockout ---")
        # Reset counter trước bằng 1 lần verify thành công
        reset_req = urllib.request.Request(
            "http://localhost:8080/api/auth/verify",
            data=json.dumps({"licenseKey": test_key, "machineId": test_hwid}).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        res_reset = json.loads(urllib.request.urlopen(reset_req).read().decode('utf-8'))
        assert res_reset['isValid'] is True, "Resetting failed attempts counter with valid key"

        # Gửi liên tiếp 5 lần sai mã key
        for i in range(1, 6):
            bad_req = urllib.request.Request(
                "http://localhost:8080/api/auth/verify",
                data=json.dumps({"licenseKey": f"LTV-FAKE-BRUTE-FORCE-{i}", "machineId": "HWID-VALID-123456"}).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            r = json.loads(urllib.request.urlopen(bad_req).read().decode('utf-8'))
            assert r['isValid'] is False

        print("✓ Đã gửi 5 lần thử sai mã key liên tiếp sau khi reset...")
        # Lần thứ 6: Server phải khóa và trả về HTTP 429
        try:
            req_blocked = urllib.request.Request(
                "http://localhost:8080/api/auth/verify",
                data=json.dumps({"licenseKey": "LTV-FAKE-BRUTE-FORCE-6", "machineId": "HWID-VALID-123456"}).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            urllib.request.urlopen(req_blocked)
            assert False, "IP must be locked after 5 failed attempts!"
        except urllib.error.HTTPError as e:
            assert e.code == 429, f"Expected 429 Too Many Requests, got {e.code}"
            err_data = json.loads(e.read().decode('utf-8'))
            assert "khóa" in err_data['message']
            print(f"✓ PASS: Hệ thống đã phát hiện tấn công dò mã và khóa tạm thời IP (HTTP 429):")
            print(f"   • Phản hồi: {err_data['message']}")
            print(f"   • Retry After: {err_data.get('retryAfter')}s")

        print("\n" + "="*66)
        print("🎉 TẤT CẢ 5 HẠNG MỤC THẮT CHẶT BẢO MẬT AUTH ĐỀU VƯỢT QUA 100%!")
        print("==================================================================")

    finally:
        if proc:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        print("Đã dừng server test an toàn.")

if __name__ == '__main__':
    run_hardened_auth_test()
