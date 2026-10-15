# 🛡️ LTVStudio Cloud - Web API & License Server (TypeScript)

Hệ thống **Web API, Máy chủ Quản trị Bản quyền (License Keys & HWID Lock)** và **Cập nhật Phiên bản (OTA Updates)** cho phần mềm máy tính **LTVStudio**.

Dự án được xây dựng hoàn toàn bằng **TypeScript (Strict Mode)**, hỗ trợ kiến trúc kép: **Vercel Serverless Functions + React 19 SPA (Vite)** và cơ sở dữ liệu **Neon Serverless Postgres Cloud**.

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

- **💎 100% TypeScript Type-Safe:** Toàn bộ hệ sinh thái (`api/`, `src/`, `types/`, `server.ts`) được định kiểu chặt chẽ, loại bỏ hoàn toàn nguy cơ lỗi runtime.
- **⚛️ Giao diện React 19 Hiện Đại (Vite SPA):**
  - Giao diện người dùng Cyberpunk Glassmorphism đẳng cấp với Tailwind CSS v4 & Lucide Icons.
  - Phân tách trang hoàn chỉnh với React Router: Trang chủ (`/`), Tra cứu (`/lookup`), Quản trị (`/admin`), Tài liệu API (`/docs`).
  - Hỗ trợ Dark Mode / Light Mode, Responsive mượt mà trên Mobile & Desktop.
- **🛡️ Phân Quyền Quản Trị Đa Người Dùng (Multi-User RBAC):**
  - Hỗ trợ 3 vai trò độc lập: **SuperAdmin** (Toàn quyền), **Support** (Hỗ trợ khách & Reset HWID), **Auditor** (Kiểm toán chỉ xem).
  - Mật khẩu băm an toàn chuẩn công nghiệp: **SHA-256 + 16-byte Cryptographic Salt**.
  - Tính năng tự đổi mật khẩu và quản lý danh sách thành viên trực tiếp trên giao diện Admin.
- **🛡️ Chuẩn Bảo Mật OWASP Top 10:**
  - **Chống Timing-Attack (CWE-208):** So sánh mã Admin Secret bằng `crypto.timingSafeEqual` qua bộ đệm Buffer cùng kích thước.
  - **Chống DoS / Brute-force (CWE-307 / CWE-799):** Sliding-Window Rate Limiter giới hạn 180 reqs/phút/IP. Tự động khóa IP 15 phút nếu thử sai mật khẩu hoặc mã key quá 5 lần.
  - **Chống Tràn RAM DoS (CWE-400):** Giới hạn dung lượng Payload theo từng endpoint, xả cạn stream an toàn và trả mã `413 Payload Too Large`.
  - **Chống Rò Rỉ Mật Khẩu (CWE-598):** Chặn hoàn toàn việc truyền mật khẩu quản trị qua URL Query String.
  - **Chống Path Traversal (CWE-22):** Ngăn chặn duyệt thư mục `..` với mã `403 Forbidden`.
  - **Defensive Headers:** Cung cấp đầy đủ `nosniff`, `SAMEORIGIN`, `x-xss-protection`, `referrer-policy`.
- **🐘 Neon Postgres Cloud + Dual-Sync Fallback:** Kết nối trực tiếp cơ sở dữ liệu Serverless Postgres trên Neon; tự động kích hoạt cơ chế Local Fallback nếu không có kết nối đám mây.
- **💼 Bộ Công Cụ Bán Hàng 1-Click:**
  - **Bàn giao khách hàng:** Tạo tin nhắn mẫu chuyên nghiệp chỉ trong 1 click để gửi qua Zalo/Telegram.
  - **Xuất Excel CSV chuẩn UTF-8 BOM:** Xuất danh sách bản quyền ra bảng tính Excel hiển thị tiếng Việt có dấu chuẩn 100%.
  - **Xử lý hàng loạt (Bulk Actions):** Chọn nhiều key cùng lúc để Reset HWID, Khóa/Mở khóa hoặc Xóa vĩnh viễn.
- **📜 Nhật Ký Kích Hoạt & Chống Gian Lận (`activation_logs`):** Ghi nhận chi tiết từng lần gọi API xác thực (IP, Thiết bị HWID, User-Agent, Thời gian, Trạng thái thành công hay vi phạm).
- **🏥 Uptime & Health Check (`GET /api/health`):** Sẵn sàng để tích hợp vào UptimeRobot, BetterStack giám sát 24/7.

---

## 📂 CẤU TRÚC THƯ MỤC

```text
web_api/
├── 📁 src/                      # Giao diện Frontend React 19 + TypeScript + Tailwind
│   ├── App.tsx                  # Root Application & React Router configuration
│   ├── main.tsx                 # React DOM mount & Context Providers wrapper
│   ├── index.css                # Design tokens, cyber glow & glassmorphism theme
│   ├── 📁 pages/                # HomePage, LookupPage, AdminPage, DocsPage, NotFound
│   ├── 📁 components/           # Navbar, Footer, MobileDrawer, LicenseTable, Modals
│   ├── 📁 contexts/             # AuthContext, ThemeContext, ToastContext
│   └── 📁 services/             # API client, AuthService, LicenseService, UserService
├── 📁 dist/                     # Bundle xuất xưởng của React SPA sau khi Vite build
├── 📁 api/                      # Backend REST API Serverless & Controllers (TypeScript)
│   ├── index.ts                 # Main Serverless Entrypoint cho /api & Security Middleware
│   ├── [...slug].ts             # Vercel Catch-All Serverless Route cho /api/*
│   ├── 📁 config/               # Constants, Default Seed Data, Roles & Permissions
│   ├── 📁 controllers/          # Auth, License, User, Version, Health Controllers
│   ├── 📁 db/                   # Neon Postgres Facade, Connection, Schema, SQL Mappers
│   ├── 📁 http/                 # HttpContext, Router Dispatcher
│   ├── 📁 repositories/         # License, User, Version, Log Data Repositories
│   └── 📁 security/             # Crypto, HMAC Signatures, Safe Compare, Rate Limiter
├── 📁 types/                    # Shared Type definitions & Interfaces toàn diện
├── 📁 public/                   # Thư mục tĩnh dự phòng tương thích ngược
├── 📁 data/                     # CSDL JSON dự phòng (licenses, logs, version, users)
├── 📄 server.ts                 # Máy chủ HTTP phục vụ API & React SPA fallback trên máy Local/VPS
├── 📄 vite.config.mts           # Cấu hình Vite 8, React plugin, Tailwind & API proxy
├── 📄 start_server.bat          # File click đúp tự động build & khởi chạy server
├── 📄 tsconfig.json             # Cấu hình TypeScript Strict Mode (ES2022 / NodeNext)
├── 📄 vercel.json               # Cấu hình định tuyến SPA & Security Headers trên Vercel
├── 📄 package.json              # Quản lý scripts (dev, dev:ui, build:ui, build, start)
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
*Hệ thống sẽ tự động kiểm tra `node_modules/`, kiểm tra bundle React trong `dist/` (tự động build nếu chưa có), kích hoạt `tsx` chạy thẳng máy chủ TypeScript tại `http://localhost:8080` và tự động mở trình duyệt.*

### Cách 2: Chạy bằng dòng lệnh (CLI)
Yêu cầu đã cài đặt **Node.js** (khuyên dùng Node 18+ hoặc Node 20+):

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Phát triển giao diện React với Vite Hot-Reload (Dev UI):**
   ```bash
   npm run dev:ui
   ```
   *Vite sẽ chạy tại `http://localhost:5173` với proxy tự động chuyển tiếp `/api` sang backend `8080`.*

3. **Khởi chạy máy chủ Backend Web API (Tự reload khi sửa code):**
   ```bash
   npm run dev
   ```

4. **Biên dịch giao diện React sang `dist/`:**
   ```bash
   npm run build:ui
   ```

5. **Khởi chạy máy chủ Production (phục vụ cả API và React SPA trên cổng 8080):**
   ```bash
   npm start
   ```

6. **Kiểm tra lỗi kiểu dữ liệu toàn diện (Typecheck):**
   ```bash
   npm run typecheck
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
  "service": "LTVStudio Web API",
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
*Yêu cầu header xác thực bảo mật: `Authorization: Bearer <TOKEN>` hoặc `x-admin-key: <ADMIN_SECRET>` (Không chấp nhận tham số query URL để phòng chống CWE-598).*

| Phương thức | Đường dẫn API | Vai trò yêu cầu | Chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Public | Đăng nhập tài khoản Admin, cấp Bearer Token có thời hạn 24h |
| `GET` | `/api/admin/verify-session` | Authenticated | Kiểm tra tính hợp lệ của token phiên đăng nhập |
| `POST` | `/api/admin/logout` | Authenticated | Đăng xuất tài khoản quản trị |
| `POST` | `/api/admin/change-password` | Authenticated | Tự đổi mật khẩu tài khoản hiện tại |
| `GET` | `/api/admin/stats` | Mọi vai trò | Thống kê số lượng key, số máy kích hoạt, phiên bản app |
| `GET` | `/api/admin/licenses` | Mọi vai trò | Lấy danh sách key (Hỗ trợ query: `search`, `status`, `plan`) |
| `POST` | `/api/admin/licenses/create` | SuperAdmin, Support | Tạo mới 1 key hoặc sinh key hàng loạt (Tối đa 100 key/lần) |
| `POST` | `/api/admin/licenses/reset-hwid` | SuperAdmin, Support | Mở khóa thiết bị (cho phép khách đổi sang máy tính khác) |
| `POST` | `/api/admin/licenses/toggle-status` | SuperAdmin, Support | Khóa (Revoke) hoặc mở khóa mã bản quyền |
| `POST` | `/api/admin/licenses/extend` | SuperAdmin, Support | Gia hạn thời hạn bản quyền (+30 ngày, +1 năm, Lifetime) |
| `POST / DELETE` | `/api/admin/licenses/delete` | SuperAdmin | Xóa vĩnh viễn mã bản quyền khỏi CSDL |
| `GET` | `/api/admin/licenses/logs` | Mọi vai trò | Xem nhật ký kích hoạt (`?key=...&limit=50`) |
| `GET / POST` | `/api/admin/version` | GET: Mọi vai trò / POST: SuperAdmin | Xem hoặc cập nhật thông tin phiên bản phần mềm phát hành OTA |
| `GET` | `/api/admin/backup` | SuperAdmin | Sao lưu toàn bộ CSDL ra JSON |
| `POST` | `/api/admin/restore` | SuperAdmin | Khôi phục toàn bộ CSDL từ file JSON sao lưu |
| `GET` | `/api/admin/users` | SuperAdmin | Lấy danh sách toàn bộ tài khoản quản trị |
| `POST` | `/api/admin/users` | SuperAdmin | Thêm tài khoản quản trị mới |
| `POST / PUT` | `/api/admin/users/update` | SuperAdmin | Cập nhật thông tin / đặt lại mật khẩu thành viên |
| `POST` | `/api/admin/users/toggle-status` | SuperAdmin | Khóa / mở khóa tài khoản thành viên |
| `POST / DELETE` | `/api/admin/users/delete` | SuperAdmin | Xóa tài khoản thành viên (Bảo vệ tài khoản gốc) |
| `POST` | `/api/admin/security/reset-lockout` | SuperAdmin | Mở khóa cưỡng bức toàn bộ IP bị chặn Brute-force |

---

## 🔒 CẤU HÌNH BIẾN MÔI TRƯỜNG (`.env`)

Sao chép file `.env.example` thành `.env` để cấu hình:

```env
# 1. Mã bí mật dành cho Quản trị viên (SuperAdmin)
ADMIN_SECRET=ltvstudio_secret_admin_2026

# 2. Khóa bảo mật ký Session Token & Chữ ký số HMAC
AUTH_TOKEN_SECRET=ltvstudio_secret_admin_2026_ltv_signature_secret_2026
AUTH_TOKEN_TTL_SECONDS=86400

# 3. Chuỗi kết nối Neon Serverless Postgres Cloud
DATABASE_URL=postgresql://neondb_owner:npg_xxxx@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# 4. Cổng khởi chạy máy chủ cục bộ (Mặc định: 8080)
PORT=8080
```

---

## ☁️ TRIỂN KHAI LÊN VERCEL (1-CLICK DEPLOY)

Dự án đã được cấu hình tệp [vercel.json](file:///D:/Project/LTVSTUDIO_WEB_API/web_api/vercel.json) với `outputDirectory: "dist"` và hệ thống Serverless Catch-All Route tại `api/index.ts` và `api/[...slug].ts`.

Xem hướng dẫn từng bước chi tiết tại: 📖 **[DEPLOY_VERCEL.md](file:///D:/Project/LTVSTUDIO_WEB_API/web_api/DEPLOY_VERCEL.md)**.

1. Đẩy mã nguồn lên GitHub:
   ```bash
   git add .
   git commit -m "feat: complete web API & React SPA"
   git push origin main
   ```
2. Kết nối với tài khoản [Vercel](https://vercel.com/new) và bấm **Import**.
3. Thêm biến môi trường:
   - `DATABASE_URL`: Connection string từ dự án Neon Postgres của bạn.
   - `ADMIN_SECRET`: Đặt mật khẩu quản trị bí mật của bạn.
4. Bấm **Deploy**. Vercel sẽ tự động build frontend React và cấp phát domain HTTPS miễn phí.

---

## 🧪 BỘ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Dự án đi kèm bộ test case tự động toàn diện kiểm tra trên máy chủ TypeScript:

```bash
# 1. Rà soát chuyên sâu 18 hạng mục hệ thống (OTA, HWID, RESTful, Backup, Logs)
python test_full_system_deep_review.py

# 2. Kiểm thử quy trình Đăng nhập, Phiên làm việc & Đăng xuất Admin
python test_admin_login_logout.py

# 3. Kiểm thử phân quyền 3 vai trò (SuperAdmin, Support, Auditor) & chống giả mạo token
python test_rbac_permissions.py

# 4. Kiểm thử CSDL User, Password Hashing SHA-256 + Salt & Đổi mật khẩu
python test_users_and_password.py

# 5. Kiểm thử các trường hợp biên và bảo mật an toàn CWE
python test_security_edge_cases.py

# 6. Kiểm thử định tuyến React Router SPA (/ , /lookup , /admin , /docs)
python test_spa_routes.py

# 7. Rà soát cấu trúc UI/UX DOM, theme tokens và Drawer Mobile
python verify_ui_ux_integrity.py
```
*Tất cả 100% test cases đều đạt chuẩn PASS.*

---

## 📄 BẢN QUYỀN
Phát triển bởi đội ngũ **LTVStudio Team**. Phát hành theo giấy phép **MIT License**.