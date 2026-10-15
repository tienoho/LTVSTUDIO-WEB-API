# 🛡️ LTVStudio Cloud - Web API & License Server (TypeScript)

Hệ thống **Web API, Máy chủ Quản trị Bản quyền (License Keys & HWID Lock)** và **Cập nhật Phiên bản (OTA Updates)** cho phần mềm máy tính **LTVStudio**.

Dự án được xây dựng hoàn toàn bằng **TypeScript (Strict Mode)**, hỗ trợ kiến trúc **Vercel Serverless Platform** và cơ sở dữ liệu **Neon Serverless Postgres Cloud**.

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

- **💎 100% TypeScript Type-Safe:** Toàn bộ hệ sinh thái (`api/`, `types/`, `server.ts`) được định kiểu chặt chẽ, loại bỏ hoàn toàn nguy cơ lỗi runtime.
- **⚡ Khởi động tức thì với `tsx`:** Sử dụng engine `tsx` (dựa trên `esbuild`) giúp chạy trực tiếp mã TypeScript mà không cần bước build thủ công phức tạp.
- **🛡️ Chuẩn Bảo Mật OWASP Top 10:**
  - **Chống Timing-Attack (CWE-208):** So sánh mã Admin Secret bằng `crypto.timingSafeEqual` qua bộ đệm Buffer cùng kích thước.
  - **Chống DoS / Brute-force (CWE-307 / CWE-799):** Sliding-Window Rate Limiter giới hạn 150 reqs/phút/IP.
  - **Chống Tràn RAM DoS (CWE-400):** Giới hạn dung lượng Payload theo từng endpoint, xả cạn stream an toàn và trả mã `413 Payload Too Large`.
  - **Chống Stored XSS (CWE-79):** Bộ lọc `escapeHtml()` bảo vệ toàn bộ giao diện quản trị.
  - **Chống Path Traversal (CWE-22):** Ngăn chặn duyệt thư mục `..` với mã `403 Forbidden`.
  - **Defensive Headers:** Cung cấp đầy đủ `nosniff`, `SAMEORIGIN`, `x-xss-protection`, `referrer-policy`.
- **🐘 Neon Postgres Cloud + Auto Fallback:** Kết nối trực tiếp cơ sở dữ liệu Serverless Postgres trên Neon; tự động kích hoạt cơ chế Local Fallback nếu không có kết nối đám mây.
- **💼 Bộ Công Cụ Bán Hàng 1-Click:**
  - **Bàn giao khách hàng:** Tạo tin nhắn mẫu chuyên nghiệp chỉ trong 1 click để gửi qua Zalo/Telegram.
  - **Xuất Excel CSV chuẩn UTF-8 BOM:** Xuất danh sách bản quyền ra bảng tính Excel hiển thị tiếng Việt có dấu chuẩn 100%.
- **📜 Nhật Ký Kích Hoạt & Chống Gian Lận (`activation_logs`):** Ghi nhận chi tiết từng lần gọi API xác thực (IP, Thiết bị HWID, User-Agent, Thời gian, Trạng thái thành công hay vi phạm).
- **🏥 Uptime & Health Check (`GET /api/health`):** Sẵn sàng để tích hợp vào UptimeRobot, BetterStack giám sát 24/7.

---

## 📂 CẤU TRÚC THƯ MỤC

```text
web_api/
├── 📁 api/
│   ├── db.ts                    # Tầng truy vấn CSDL Neon Postgres (TypeScript)
│   └── index.ts                 # Hub Serverless Router & Middleware (TypeScript)
├── 📁 types/
│   └── index.ts                 # Type definitions & Interfaces toàn diện
├── 📁 public/
│   ├── index.html               # Giao diện Portal & Trung tâm Quản trị
│   ├── style.css                # CSS thiết kế Dark Mode & Glassmorphism
│   └── app.js                   # Logic Frontend, Bộ lọc nâng cao & Xuất Excel
├── 📁 data/
│   ├── licenses.json            # CSDL dự phòng bản quyền
│   ├── activation_logs.json     # CSDL dự phòng nhật ký kích hoạt
│   └── version_config.json      # Cấu hình phiên bản cập nhật phần mềm
├── 📄 server.ts                 # Máy chủ HTTP phát triển cục bộ (TypeScript)
├── 📄 start_server.bat          # File click đúp khởi động server 1-Click
├── 📄 tsconfig.json             # Cấu hình TypeScript Strict Mode (ES2022 / NodeNext)
├── 📄 vercel.json               # Cấu hình định tuyến & Security Headers trên Vercel
├── 📄 package.json              # Quản lý scripts và dependencies
├── 📄 .env.example              # Mẫu cấu hình biến môi trường
├── 📄 .gitignore                # Danh sách tệp loại trừ khỏi Git
├── 📄 DEPLOY_VERCEL.md          # Hướng dẫn chi tiết triển khai lên Vercel
└── 📄 README.md                 # Tài liệu hướng dẫn sử dụng & danh mục API
```

---

## 🛠️ HƯỚNG DẪN KHỞI CHẠY (LOCAL)

### Cách 1: Chạy 1-Click bằng Batch File (Windows)
Click đúp vào file:
```cmd
start_server.bat
```
*Hệ thống sẽ tự động kích hoạt `tsx` chạy thẳng máy chủ TypeScript tại `http://localhost:8080` và tự động mở trình duyệt.*

### Cách 2: Chạy bằng dòng lệnh (CLI)
Yêu cầu đã cài đặt **Node.js** (khuyên dùng Node 18+ hoặc Node 20+):

1. **Cài đặt thư viện (lần đầu tiên):**
   ```bash
   npm install
   ```

2. **Khởi chạy máy chủ phát triển (Tự reload khi sửa code):**
   ```bash
   npm run dev
   ```

3. **Khởi chạy máy chủ tiêu chuẩn:**
   ```bash
   npm start
   ```

4. **Kiểm tra lỗi kiểu dữ liệu (Typecheck):**
   ```bash
   npm run typecheck
   ```

5. **Biên dịch mã sang thư mục `dist/` (Tùy chọn):**
   ```bash
   npm run build
   ```

---

## 🌐 DANH SÁCH API ENDPOINTS

### 1. Dành Cho Ứng Dụng Desktop LTVStudio (Client API)

#### • Kiểm tra phiên bản mới & OTA Updates
```http
GET /api/transform/version
GET /api/version
```
*Response mẫu (200 OK):*
```json
{
  "version": "1.0.0",
  "changelog": "• Tích hợp mô hình AI Expressive TTS\n• Tối ưu bóc tách phụ đề",
  "download_url": "https://github.com/ltvstudio/releases/releases/download/v1.0.0/LTVStudio_Setup.exe",
  "force_update": false
}
```

#### • Xác thực mã bản quyền & Khóa theo phần cứng máy (HWID)
```http
POST /api/auth/verify
Content-Type: application/json

{
  "key": "LTV-PRO-XXXXXX-XXXXXX-XXXXXX",
  "machineId": "WIN-GUID-12345678"
}
```
*Response mẫu thành công (200 OK):*
```json
{
  "isValid": true,
  "licenseType": "LTVStudio Pro Lifetime",
  "expiresAt": "Không giới hạn (Lifetime)",
  "machineId": "WIN-GUID-12345678",
  "message": "✓ Bản quyền hợp lệ và đã kích hoạt thành công!",
  "token": "9b0adae8e85f0427aa3f74b6219fdba37537823344c004c6c98eafec0a8c85c3",
  "timestamp": 1792045545124,
  "nonce": "07b483c22617d8d1440a0251b03ff355"
}
```
*Ghi chú bảo mật:*
- `token`: Chữ ký số HMAC-SHA256 chống can thiệp gói tin (Anti-Tamper / Anti-MITM proxy spoofing).
- `timestamp` & `nonce`: Chống tấn công phát lại (Anti-Replay Protection).
- Tự động khóa IP tạm thời 15 phút (HTTP 429) nếu thử sai mã license quá 5 lần liên tiếp (Anti-Brute-Force).

#### • Tra cứu bản quyền công khai (Public Lookup)
```http
GET /api/license/lookup?key=LTV-PRO-XXXXXX-XXXXXX-XXXXXX
```
*Response mẫu (200 OK):*
```json
{
  "exists": true,
  "key": "LTV-PRO-XXXXXX-XXXXXX-XXXXXX",
  "plan": "PRO",
  "type": "LTVStudio Pro Lifetime",
  "status": "ACTIVE",
  "expiresAt": "Vĩnh viễn (Lifetime)",
  "isActivated": true,
  "maskedMachineId": "WIN-G--****--001",
  "createdAt": "2026-10-15T00:00:00.000Z"
}
```

---

### 2. Giám Sát Sức Khỏe Hệ Thống (Monitoring API)

#### • Health Check & Uptime (Public)
```http
GET /api/health
```
*Response mẫu (200 OK):*
```json
{
  "status": "healthy",
  "service": "LTVStudio License & Cloud API",
  "version": "1.0.0",
  "uptimeSeconds": 1420,
  "timestamp": "2026-10-15T05:00:00.000Z",
  "database": {
    "connected": true,
    "driver": "neon_postgres",
    "latencyMs": 15
  },
  "stats": {
    "totalLicenses": 32,
    "activeLicenses": 14
  }
}
```

---

### 3. Dành Cho Quản Trị Viên (Admin API)
*Yêu cầu header xác thực bảo mật: `x-admin-key: <ADMIN_SECRET>` hoặc `Authorization: Bearer <SESSION_TOKEN_HOAC_SECRET>` (Không chấp nhận tham số query URL để phòng chống CWE-598).*
*Tự động khóa IP 15 phút nếu nhập sai mật khẩu Admin quá 5 lần liên tiếp.*

| Phương thức | Đường dẫn API | Chức năng |
| :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Đăng nhập Quản trị viên, cấp signed session token (JWT-like HMAC token) |
| `GET` | `/api/admin/verify-session` | Kiểm tra tính hợp lệ của token phiên quản trị viên |
| `GET` | `/api/admin/stats` | Thống kê số lượng key, số máy hoạt động, phiên bản app |
| `GET` | `/api/admin/licenses` | Lấy danh sách key (Hỗ trợ query: `search`, `status`, `plan`) |
| `POST` | `/api/admin/licenses/create` | Tạo mới hoặc sinh key hàng loạt (Tối đa 100 key/lần) |
| `POST` | `/api/admin/licenses/reset-hwid` | Mở khóa thiết bị (cho phép khách đổi sang máy tính khác) |
| `POST` | `/api/admin/licenses/toggle-status` | Khóa (Revoke) hoặc mở khóa mã bản quyền |
| `POST` | `/api/admin/licenses/extend` | Gia hạn thời hạn bản quyền (+30 ngày, +1 năm, Lifetime) |
| `POST` | `/api/admin/licenses/delete` | Xóa vĩnh viễn mã bản quyền khỏi CSDL |
| `GET` | `/api/admin/licenses/logs` | Xem nhật ký kích hoạt (`?key=...&limit=50`) |
| `GET / POST` | `/api/admin/version` | Xem hoặc cập nhật thông tin phiên bản phần mềm phát hành |
| `GET` | `/api/admin/backup` | Sao lưu toàn bộ CSDL ra JSON |
| `POST` | `/api/admin/restore` | Khôi phục toàn bộ CSDL từ file JSON sao lưu |

---

## 🔒 CẤU HÌNH BIẾN MÔI TRƯỜNG (`.env`)

Sao chép file `.env.example` thành `.env` để cấu hình:

```env
# Mã bí mật bảo vệ Trung tâm Quản trị (Admin)
ADMIN_SECRET=ltvstudio_secret_admin_2026

# Chuỗi kết nối Neon Serverless Postgres Cloud
DATABASE_URL=postgresql://neondb_owner:npg_xxxx@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Cổng khởi chạy máy chủ cục bộ (Mặc định: 8080)
PORT=8080
```

---

## ☁️ TRIỂN KHAI LÊN VERCEL (1-CLICK DEPLOY)

Dự án đã được cấu hình tệp [vercel.json](file:///D:/Project/LTVSTUDIO_WEB_API/web_api/vercel.json) để Vercel tự động nhận diện và biên dịch TypeScript Serverless Function tại `api/index.ts`.

Xem hướng dẫn từng bước chi tiết tại: 📖 **[DEPLOY_VERCEL.md](file:///D:/Project/LTVSTUDIO_WEB_API/web_api/DEPLOY_VERCEL.md)**.

1. Đẩy thư mục `web_api` lên GitHub.
2. Kết nối với tài khoản [Vercel](https://vercel.com/new) và bấm **Import**.
3. Thêm biến môi trường:
   - `ADMIN_SECRET`: Đặt mật khẩu quản trị bí mật của bạn.
   - `DATABASE_URL`: Connection string từ dự án Neon Postgres của bạn.
4. Bấm **Deploy**. Vercel sẽ tự động cấp phát domain HTTPS miễn phí.

---

## 🧪 BỘ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Dự án đi kèm bộ test case tự động toàn diện kiểm tra trên máy chủ TypeScript:

```bash
# 1. Kiểm tra toàn bộ lỗi an ninh OWASP Top 10
python test_security_audit.py

# 2. Kiểm thử 7 tính năng cốt lõi & giao diện
python test_full_suite.py

# 3. Kiểm thử 5 tính năng nâng cấp (Health, Audit Logs, Bộ lọc, Bàn giao, Excel)
python test_upgrades_suite.py

# 4. Kiểm thử bộ tính năng bảo mật Auth thắt chặt (Chữ ký HMAC, Khóa HWID, Chống Brute-force, Session token)
python test_hardened_auth.py

# 5. Kiểm thử chuẩn quy trình Đăng nhập, Xác thực phiên, Đăng xuất tài khoản Admin
python test_admin_login_logout.py
```
*Tất cả 27/27 test cases đều đạt chuẩn 100% PASS.*

---

## 📄 BẢN QUYỀN
Phát triển bởi đội ngũ **LTVStudio Team**. Phát hành theo giấy phép **MIT License**.