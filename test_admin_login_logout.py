import subprocess
import time
import urllib.request
import urllib.error
import json
import os

PROJ = r"D:\Project\LTVSTUDIO_WEB_API\web_api"
TSX_CLI = os.path.join(PROJ, "node_modules", "tsx", "dist", "cli.mjs")
ADMIN_SECRET = "ltvstudio_secret_admin_2026"

def test_admin_login_logout_flow():
    print("==================================================================")
    print("🔑 KIỂM THỬ CHUẨN ĐĂNG NHẬP / ĐĂNG XUẤT TÀI KHOẢN ADMIN")
    print("==================================================================")

    proc = subprocess.Popen(["node", TSX_CLI, "server.ts"], cwd=PROJ, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2)

    try:
        # TEST 1: Admin Login with standard username & password
        print("\n--- [TEST 1] POST /api/admin/login (Đăng nhập với Username/Password) ---")
        login_body = json.dumps({
            "username": "admin",
            "password": ADMIN_SECRET
        }).encode('utf-8')
        req1 = urllib.request.Request(
            "http://localhost:8080/api/admin/login",
            data=login_body,
            headers={"Content-Type": "application/json"}
        )
        res1 = urllib.request.urlopen(req1)
        data1 = json.loads(res1.read().decode('utf-8'))

        assert res1.status == 200
        assert data1['success'] is True
        assert 'token' in data1 and len(data1['token']) > 20
        assert data1['user']['username'] == 'admin'
        assert data1['user']['role'] == 'SuperAdmin'
        assert data1['expiresIn'] == 86400
        token = data1['token']
        print(f"✓ PASS: Đăng nhập thành công! Cấp Session Token 24h: {token[:30]}...")
        print(f"   • User: {data1['user']['username']} (Role: {data1['user']['role']})")
        print(f"   • Message: {data1['message']}")

        # TEST 2: Verify Session Endpoint
        print("\n--- [TEST 2] GET /api/admin/verify-session (Kiểm tra phiên làm việc) ---")
        req2 = urllib.request.Request(
            "http://localhost:8080/api/admin/verify-session",
            headers={"Authorization": f"Bearer {token}"}
        )
        res2 = urllib.request.urlopen(req2)
        data2 = json.loads(res2.read().decode('utf-8'))
        assert res2.status == 200
        assert data2['authenticated'] is True
        print(f"✓ PASS: Xác nhận phiên đăng nhập hợp lệ (200 OK) | User: {data2['user']['username']}")

        # TEST 3: Access Protected Admin API using Session Token
        print("\n--- [TEST 3] GET /api/admin/stats (Truy cập API Quản trị với Bearer Token) ---")
        req3 = urllib.request.Request(
            "http://localhost:8080/api/admin/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        res3 = urllib.request.urlopen(req3)
        stats = json.loads(res3.read().decode('utf-8'))
        assert res3.status == 200
        assert 'total' in stats
        print(f"✓ PASS: Tải thống kê Admin thành công với Bearer Token (Tổng key: {stats['total']})")

        # TEST 4: Admin Logout Endpoint
        print("\n--- [TEST 4] POST /api/admin/logout (Đăng xuất tài khoản) ---")
        req4 = urllib.request.Request(
            "http://localhost:8080/api/admin/logout",
            data=b"{}",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
        )
        res4 = urllib.request.urlopen(req4)
        data4 = json.loads(res4.read().decode('utf-8'))
        assert res4.status == 200
        assert data4['success'] is True
        print(f"✓ PASS: Đăng xuất thành công: {data4['message']}")

        # TEST 5: Verify Frontend HTML, CSS & JS Components
        print("\n--- [TEST 5] Kiểm tra giao diện HTML, CSS, JS cho Đăng nhập / Đăng xuất ---")
        with open(os.path.join(PROJ, "public", "index.html"), "r", encoding="utf-8") as f:
            html = f.read()

        assert 'id="navAdminProfilePill"' in html, "Missing navAdminProfilePill"
        assert 'id="btnNavLogout"' in html, "Missing btnNavLogout in navbar"
        assert 'id="btnAdminLogout"' in html, "Missing btnAdminLogout in topbar"
        assert 'id="adminUsernameInput"' in html, "Missing adminUsernameInput"
        assert 'id="adminSecretInput"' in html, "Missing adminSecretInput"
        assert 'id="btnTogglePasswordEye"' in html, "Missing btnTogglePasswordEye"
        assert 'id="checkRememberAdmin"' in html, "Missing checkRememberAdmin"
        assert 'id="adminLoginError"' in html, "Missing adminLoginError banner"
        print("✓ PASS: Tất cả các thành phần UI Đăng nhập / Đăng xuất đều hiện diện trong index.html!")

        with open(os.path.join(PROJ, "public", "app.js"), "r", encoding="utf-8") as f:
            js = f.read()

        assert 'verifyAdminSessionOnLoad' in js, "Missing verifyAdminSessionOnLoad in app.js"
        assert 'performAdminLogout' in js, "Missing performAdminLogout in app.js"
        assert 'btnTogglePasswordEye' in js, "Missing eye toggle in app.js"
        assert 'clearAdminSession' in js, "Missing clearAdminSession in app.js"
        print("✓ PASS: Logic JavaScript điều khiển phiên đăng nhập/đăng xuất đã chuẩn hóa 100%!")

        print("\n" + "="*66)
        print("🎉 TẤT CẢ 5/5 HẠNG MỤC ĐĂNG NHẬP / ĐĂNG XUẤT ĐỀU ĐẠT CHUẨN XUẤT SẮC 100%!")
        print("==================================================================")

    finally:
        if proc:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        print("Đã dừng server test an toàn.")

if __name__ == '__main__':
    test_admin_login_logout_flow()
