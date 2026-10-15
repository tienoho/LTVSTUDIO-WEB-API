# LTVStudio Web API & License Management Server

Hệ thống Web API & Quản trị Bản quyền (License Keys) và Cập nhật Phiên bản (OTA Updates) cho ứng dụng **LTVStudio**.

---

## 🚀 Tính Năng Chính
1. **Kiểm tra Cập nhật Phiên bản (Version Checking):**
   - Cung cấp endpoint cho ứng dụng LTVStudio tự động kiểm tra phiên bản mới, đọc ghi chú cập nhật (changelog), và tải file cài đặt mới nhất.
   - Hỗ trợ cờ ép buộc cập nhật (`force_update`).
2. **Xác thực Bản quyền (License Validation & HWID Lock):**
   - Xác thực mã kích hoạt (License Key) và tự động khóa theo phần cứng thiết bị (Machine GUID / HWID).
   - Ngăn chặn chia sẻ key trái phép sang máy khác.
   - Kiểm tra hạn dùng: Dùng thử (Trial), 1 Tháng, 1 Năm, Vĩnh viễn (Lifetime).
3. **Giao diện Quản trị Web Trực Quan (Web Admin Dashboard):**
   - Thống kê tổng quan số lượng key, số máy đang hoạt động, doanh số bản quyền.
   - **Tạo Key mới / Tạo hàng loạt (Bulk Key Generator)**.
   - **Mở khóa máy (Reset HWID)**: Hỗ trợ khách hàng đổi máy tính mới chỉ với 1 click.
   - **Gia hạn bản quyền** (+30 ngày, +1 năm, Lifetime).
   - **Khóa / Vô hiệu hóa (Revoke)** key vi phạm.
   - Quản lý phiên bản và xuất bản cập nhật tức thì.

---

## 🛠️ Hướng Dẫn Khởi Chạy Nhanh (Local)

### Cách 1: Chạy bằng file Batch (Windows)
Click đúp vào file:
```
start_server.bat
```
Server sẽ khởi động tại `http://localhost:8080` và tự động mở trình duyệt.

### Cách 2: Chạy bằng dòng lệnh
Yêu cầu đã cài đặt **Node.js** (Không cần cài thêm thư viện npm vì server được viết thuần Node.js 100% không phụ thuộc):
```bash
cd web_api
node server.js
```

---

## 🌐 Danh Sách API Endpoints

### 1. Dành cho Ứng dụng Desktop LTVStudio (Client API)
- **Kiểm tra phiên bản mới:**
  ```http
  GET /api/transform/version
  GET /api/version
  ```
  *Response:*
  ```json
  {
    "version": "1.0.0",
    "changelog": "• Tính năng mới...",
    "download_url": "https://domain.com/LTVStudio-Windows-Setup.exe",
    "force_update": false
  }
  ```

- **Xác thực bản quyền:**
  ```http
  POST /api/auth/verify
  Content-Type: application/json

  {
    "licenseKey": "LTV-LIFE-XXXX-XXXX-XXXX",
    "machineId": "WIN-12345678"
  }
  ```
  *Response:*
  ```json
  {
    "isValid": true,
    "licenseType": "LTVStudio Pro Lifetime",
    "expiresAt": "Không giới hạn (Lifetime)",
    "machineId": "WIN-12345678",
    "message": "✓ Bản quyền hợp lệ và đã kích hoạt thành công!"
  }
  ```

---

## 🔒 Quản Trị Viên (Admin Dashboard)
- Mở trình duyệt truy cập: `http://localhost:8080`
- **Mã Secret Key mặc định:** `ltvstudio_secret_admin_2026`
- Bạn có thể đổi mã này qua biến môi trường `ADMIN_SECRET` hoặc sửa trong `server.js`.
# LTVSTUDIO-WEB-API
