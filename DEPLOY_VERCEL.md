# 🚀 Hướng Dẫn Triển Khai LTVStudio Web API Lên Vercel

Dự án Web API & License Manager của **LTVStudio** được xây dựng theo chuẩn kiến trúc **Vercel Serverless Functions + React 19 SPA (Vite)**, sẵn sàng deploy 100% chỉ trong 2 phút!

---

## 🌟 2 Cách Triển Khai Lên Vercel

### Cách 1: Triển Khai Qua Giao Diện Vercel.com (Khuyên Dùng)

1. **Đưa mã nguồn lên GitHub:**
   - Commit toàn bộ thay đổi và push lên repository GitHub của bạn:
     ```bash
     git add .
     git commit -m "feat: complete LTVStudio Web API & React SPA"
     git push origin main
     ```

2. **Kết nối với Vercel:**
   - Truy cập: [https://vercel.com/new](https://vercel.com/new)
   - Chọn kho lưu trữ GitHub của bạn và bấm **Import**.

3. **Cấu hình Deploy trên Vercel:**
   - **Framework Preset:** Chọn `Vite` (hoặc `Other`).
   - **Root Directory:** Để `./` (hoặc `web_api` nếu repository chứa cả project desktop).
   - **Build Command:** `npm run build` (tự động chạy `vite build --outDir dist && tsc`).
   - **Output Directory:** `dist` (đã được cấu hình tự động trong `vercel.json`).
   - **Environment Variables (Biến môi trường - Xem mục bên dưới):**
     * `DATABASE_URL`: Chuỗi kết nối Neon Postgres.
     * `ADMIN_SECRET`: (Tùy chọn) Mật khẩu quản trị SuperAdmin riêng của bạn.
     * `AUTH_TOKEN_SECRET`: (Tùy chọn) Khóa bí mật ký session token JWT/HMAC.

4. **Bấm Deploy:**
   - Vercel sẽ tự động build frontend, liên kết Serverless Function tại `api/` và cấp phát domain HTTPS miễn phí dạng:
     `https://ltv-tools.vercel.app`

---

### Cách 2: Triển Khai Bằng Vercel CLI (Dòng Lệnh Siêu Tốc)

Yêu cầu đã cài đặt Node.js trên máy tính:

1. **Cài đặt Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Đăng nhập và Deploy:**
   Mở terminal tại thư mục `web_api/`:
   ```bash
   cd web_api
   vercel
   ```
   * Làm theo hướng dẫn trên màn hình (Enter để chọn các giá trị mặc định).

3. **Deploy lên Production:**
   ```bash
   vercel --prod
   ```
   Hệ thống sẽ cung cấp ngay đường link production trực tiếp với SSL HTTPS miễn phí.

---

## 🐘 Cấu Hình Cơ Sở Dữ Liệu Neon Postgres (Khuyên Dùng)

Dự án đã tích hợp sẵn driver **Neon Serverless Driver (`@neondatabase/serverless`)**. Hệ thống sẽ tự động khởi tạo 3 bảng dữ liệu khi có request đầu tiên:
1. `licenses`: Lưu trữ toàn bộ mã bản quyền, khách hàng, ngày hết hạn, mã khóa máy (HWID).
2. `version_config`: Cấu hình phiên bản OTA phần mềm, đường dẫn tải về, changelog.
3. `users`: Quản lý danh sách tài khoản quản trị viên phân quyền 3 cấp (SuperAdmin, Support, Auditor) với mật khẩu băm SHA-256 + Salt.

### 3 Bước Thiết Lập Neon Postgres Cực Kỳ Đơn Giản:
1. **Tạo Database:**
   - Truy cập: [https://neon.tech](https://neon.tech) và đăng ký tài khoản miễn phí.
   - Bấm **New Project** (Khuyên chọn vùng `ap-southeast-1 Singapore` để tốc độ truy vấn từ Việt Nam đạt mức mili-giây siêu tốc).
2. **Lấy Connection String:**
   - Trên Dashboard của Neon, sao chép chuỗi kết nối **Connection String** dạng:
     ```text
     postgresql://neondb_owner:npg_xxxx@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
3. **Thêm Biến Môi Trường (Environment Variable):**
   - **Trên Vercel:** Vào mục **Settings** -> **Environment Variables** -> Thêm:
     * Key: `DATABASE_URL` (hoặc `POSTGRES_URL`)
     * Value: `[Connection String vừa sao chép từ Neon]`
   - Server sẽ tự động phát hiện `DATABASE_URL`, tự động khởi tạo schema và gắn huy hiệu **`Database: Neon Postgres (Cloud)`** trực tiếp trên Web Dashboard!

---

## 🔐 Danh Sách Tài Khoản Quản Trị Mặc Định (RBAC)

Hệ thống được khởi tạo sẵn 3 tài khoản mẫu tương ứng 3 vai trò phân quyền:

| Tài khoản (Username) | Mật khẩu mặc định | Vai trò (Role) | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `admin` | `ltvstudio_secret_admin_2026` | **SuperAdmin** | Toàn quyền hệ thống, tạo/xóa key, đổi version OTA, backup/restore, quản lý người dùng |
| `support` | `support_secret_2026` | **Support** | Tạo key, gia hạn, Reset HWID đổi máy cho khách, tra cứu danh sách |
| `auditor` | `auditor_secret_2026` | **Auditor** | Chỉ xem (Read-only) danh sách, thống kê doanh thu và tra cứu nhật ký kích hoạt |

> 💡 **Khuyến nghị**: Ngay sau khi deploy lên Vercel, hãy đăng nhập tài khoản `admin` và truy cập menu **"Đổi Mật Khẩu"** để đổi sang mật khẩu an toàn của riêng bạn!

---

## 🔗 Các Đường Link Sau Khi Deploy

- **Trang chủ Khách hàng (Landing & Tải App):**  
  `https://ltv-tools.vercel.app/`
- **Cổng Tra cứu Bản quyền Online (React SPA):**  
  `https://ltv-tools.vercel.app/lookup`
- **Trung tâm Quản trị Admin (React Dashboard):**  
  `https://ltv-tools.vercel.app/admin`
- **Cổng Tài liệu & API Specs (Swagger-like Docs):**  
  `https://ltv-tools.vercel.app/docs`
- **API Check Version dành cho Ứng dụng Desktop:**  
  `https://ltv-tools.vercel.app/api/transform/version`
- **API Verify Key & Khóa HWID:**  
  `https://ltv-tools.vercel.app/api/auth/verify`
- **API Kiểm tra Sức khỏe Uptime:**  
  `https://ltv-tools.vercel.app/api/health`
