# 🚀 Hướng Dẫn Triển Khai LTVStudio Web API Lên Vercel

Dự án Web API & License Manager của **LTVStudio** đã được cấu hình chuẩn kiến trúc **Vercel Serverless Functions + Static Hosting**, sẵn sàng deploy 100% chỉ trong 2 phút!

---

## 🌟 2 Cách Triển Khai Lên Vercel

### Cách 1: Triển Khai Qua Giao Diện Vercel.com (Khuyên Dùng)

1. **Đưa mã nguồn lên GitHub:**
   - Tạo một repository trên GitHub (ví dụ: `ltvstudio-cloud`).
   - Push thư mục `web_api` lên repository đó.

2. **Kết nối với Vercel:**
   - Truy cập: [https://vercel.com/new](https://vercel.com/new)
   - Chọn kho lưu trữ GitHub của bạn và bấm **Import**.

3. **Cấu hình Deploy:**
   - **Framework Preset:** Chọn `Other`.
   - **Root Directory:** Chọn `web_api` (nếu repo chứa cả project desktop) hoặc để `./` (nếu repo chỉ chứa thư mục web_api).
   - **Environment Variables (Biến môi trường - Tùy chọn):**
     * `ADMIN_SECRET`: Đặt mật khẩu quản trị của bạn (Mặc định nếu không đặt là: `ltvstudio_secret_admin_2026`).

4. **Bấm Deploy:**
   - Vercel sẽ tự động build và cấp phát cho bạn một domain HTTPS miễn phí dạng:
     `https://ltvstudio-xxxx.vercel.app`

---

### Cách 2: Triển Khai Bằng Vercel CLI (Dòng Lệnh Siêu Tốc)

Yêu cầu đã cài đặt Node.js trên máy tính:

1. **Cài đặt Vercel CLI (nếu chưa có):**
   ```bash
   npm install -g vercel
   ```

2. **Đăng nhập và Deploy:**
   Mở terminal tại thư mục `web_api/`:
   ```bash
   cd web_api
   vercel
   ```
   * Làm theo hướng dẫn trên màn hình (Enter chọn mặc định).

3. **Deploy lên Production:**
   ```bash
   vercel --prod
   ```
   Hệ thống sẽ cung cấp ngay đường link production trực tiếp.

---

## 🐘 Cấu Hình Cơ Sở Dữ Liệu Neon Postgres (Khuyên Dùng Nhất)

Dự án đã được tích hợp sẵn driver **Neon Serverless Driver (`@neondatabase/serverless`)**. Hệ thống sẽ tự động khởi tạo bảng (`licenses` và `version_config`), tự động migrate key mẫu và lưu trữ dữ liệu vĩnh viễn trên đám mây!

### 3 Bước Thiết Lập Neon Postgres Cực Kỳ Đơn Giản:
1. **Tạo Database:**
   - Truy cập: [https://neon.tech](https://neon.tech) và đăng ký tài khoản miễn phí.
   - Bấm **New Project** (Khuyên chọn region `ap-southeast-1 Singapore` để tốc độ truy vấn từ Việt Nam đạt mức mili-giây siêu tốc).
2. **Lấy Connection String:**
   - Trên Dashboard của Neon, sao chép chuỗi kết nối **Connection String** dạng:
     ```
     postgresql://neondb_owner:xxxx@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
3. **Thêm Biến Môi Trường (Environment Variable):**
   - **Trên Vercel:** Vào mục **Settings** -> **Environment Variables** -> Thêm biến:
     * Key: `DATABASE_URL` (hoặc `POSTGRES_URL`)
     * Value: `[Connection String vừa sao chép từ Neon]`
   - **Khi chạy trên máy Local:** Dán vào file `.env` (hoặc sửa trong file `.env.example`).
   - Server sẽ tự động phát hiện `DATABASE_URL`, tự động tạo bảng và gắn huy hiệu **`Database: Neon Postgres (Cloud)`** trực tiếp trên Web Dashboard!

### Tính Năng Sao Lưu & Khôi Phục (Backup & Restore):
- Ngay trên Web Admin Center (`https://your-domain.vercel.app/`):
  * Bấm nút **"Sao Lưu JSON"** để tải file snapshot toàn bộ CSDL Neon về máy tính.
  * Bấm nút **"Khôi Phục JSON"** để nạp lại dữ liệu bất kỳ lúc nào nếu cần chuyển database mới.

---

## 🔗 Các Đường Link Sau Khi Deploy

- **Trang chủ Khách hàng (Landing & Tải App):**  
  `https://your-domain.vercel.app/`
- **Cổng Tra cứu Bản quyền Online:**  
  `https://your-domain.vercel.app/` (chọn tab *Tra Cứu Bản Quyền*) hoặc `GET /api/license/lookup?key=...`
- **Trung tâm Quản trị Admin:**  
  `https://your-domain.vercel.app/` (chọn tab *Quản Trị Hệ Thống*, mã secret mặc định: `ltvstudio_secret_admin_2026`)
- **API Check Version dành cho Ứng dụng Desktop:**  
  `https://your-domain.vercel.app/api/transform/version`
- **API Verify Key & Khóa HWID:**  
  `https://your-domain.vercel.app/api/auth/verify`
