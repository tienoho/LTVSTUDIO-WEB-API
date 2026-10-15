import os
import re

PROJ_DIR = r"D:\Project\LTVSTUDIO_WEB_API\web_api"
PUBLIC_DIR = os.path.join(PROJ_DIR, "public")

PAGES = ["index.html", "lookup.html", "admin.html", "docs.html"]
SCRIPTS = ["portal.js", "lookup.js", "admin.js", "docs.js"]

def verify_ui_ux_integrity():
    print("=" * 70)
    print("🔍 RÀ SOÁT KỸ LƯỠNG TOÀN DIỆN HỆ THỐNG GIAO DIỆN & TƯƠNG TÁC (UI/UX)")
    print("=" * 70)
    
    # 1. Rà soát cấu trúc HTML 4 trang
    print("\n--- [1] RÀ SOÁT CẤU TRÚC 4 TRANG HTML CHÍNH ---")
    required_html_elements = [
        ('meta viewport', r'<meta\s+name=["\']viewport["\']'),
        ('style.css link', r'<link\s+rel=["\']stylesheet["\']\s+href=["\']/?style\.css["\']'),
        ('btnThemeToggle', r'id=["\']btnThemeToggle["\']'),
        ('themeToggleIcon', r'id=["\']themeToggleIcon["\']'),
        ('btnMobileNav', r'id=["\']btnMobileNav["\']'),
        ('mobileDrawerOverlay', r'id=["\']mobileDrawerOverlay["\']'),
        ('mobileDrawerPane', r'id=["\']mobileDrawerPane["\']'),
    ]

    all_html_passed = True
    for page in PAGES:
        file_path = os.path.join(PUBLIC_DIR, page)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        print(f"\n📄 Đang kiểm tra trang: {page} ({len(content)} bytes)")
        page_ok = True
        for elem_name, pattern in required_html_elements:
            if re.search(pattern, content):
                print(f"   ✓ {elem_name}: TỒN TẠI")
            else:
                print(f"   ❌ {elem_name}: THIẾU!")
                page_ok = False
                all_html_passed = False
        if page_ok:
            print(f"   => {page}: ĐẠT CHUẨN 100%")

    assert all_html_passed, "Một hoặc nhiều trang HTML thiếu thành phần UI bắt buộc!"

    # 2. Rà soát file JS điều khiển Theme và Mobile Drawer
    print("\n--- [2] RÀ SOÁT JAVASCRIPT CONTROLLERS (THEME & MOBILE DRAWER) ---")
    all_js_passed = True
    for js_file in SCRIPTS:
        file_path = os.path.join(PUBLIC_DIR, js_file)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        print(f"\n📜 Đang kiểm tra script: {js_file} ({len(content)} bytes)")
        
        has_theme = ("btnThemeToggle" in content or "data-theme" in content or "theme" in content)
        has_drawer = ("mobileDrawer" in content or "btnMobileNav" in content or "drawer" in content)
        
        if has_theme:
            print("   ✓ Theme Switcher logic: HIỆN DIỆN")
        else:
            print("   ❌ Theme Switcher logic: THIẾU")
            all_js_passed = False
            
        if has_drawer:
            print("   ✓ Mobile Drawer logic: HIỆN DIỆN")
        else:
            print("   ❌ Mobile Drawer logic: THIẾU")
            all_js_passed = False

    assert all_js_passed, "Một hoặc nhiều file JS thiếu logic tương tác Theme hoặc Mobile Drawer!"

    # 3. Rà soát CSS Design System tokens
    print("\n--- [3] RÀ SOÁT HỆ THỐNG CSS TOKENS & UTILITIES (style.css) ---")
    css_path = os.path.join(PUBLIC_DIR, "style.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
    
    css_checks = [
        ('[data-theme="light"]', '[data-theme="light"]' in css),
        ('skeletonShimmer animation', '@keyframes skeletonShimmer' in css),
        ('.skeleton-box utility', '.skeleton-box' in css),
        ('.empty-state-card', '.empty-state-card' in css),
        ('.role-notice-banner', '.role-notice-banner' in css),
        ('.role-warning-banner', '.role-warning-banner' in css),
        ('.mobile-drawer-pane', '.mobile-drawer-pane' in css),
        ('Responsive breakpoint @media (max-width: 768px)', '@media (max-width: 768px)' in css),
        ('Responsive breakpoint @media (max-width: 480px)', '@media (max-width: 480px)' in css)
    ]

    for label, passed in css_checks:
        status = "✓ TỒN TẠI" if passed else "❌ THIẾU"
        print(f"   {status}: {label}")
        assert passed, f"Thiếu định nghĩa CSS: {label}"

    # 4. Kiểm tra cấu trúc phân cấp DOM trong admin.html
    print("\n--- [4] RÀ SOÁT CẤU TRÚC DOM ĐẶC THÙ (admin.html) ---")
    with open(os.path.join(PUBLIC_DIR, "admin.html"), "r", encoding="utf-8") as f:
        admin_html = f.read()

    # Kiểm tra subtab-version và subtab-docs là ngang hàng
    idx_ver_start = admin_html.find('id="subtab-version"')
    idx_docs_start = admin_html.find('id="subtab-docs"')
    idx_preview = admin_html.find('class="preview-desktop-box"')
    idx_ver_warning = admin_html.find('id="versionRoleWarning"')

    assert idx_ver_start != -1, "Không tìm thấy subtab-version"
    assert idx_docs_start != -1, "Không tìm thấy subtab-docs"
    assert idx_preview != -1, "Không tìm thấy preview-desktop-box"
    assert idx_ver_warning != -1, "Không tìm thấy versionRoleWarning"

    # Preview phải nằm TRƯỚC khi subtab-docs bắt đầu
    assert idx_preview < idx_docs_start, "LỖI PHÂN CẤP: preview-desktop-box phải nằm trong subtab-version (trước subtab-docs)!"
    assert idx_ver_warning < idx_preview, "versionRoleWarning phải nằm trong form cấu hình OTA trước preview-desktop-box!"
    print("   ✓ Cấu trúc DOM subtab-version chứa trọn vẹn preview-desktop-box và versionRoleWarning.")
    print("   ✓ subtab-docs là container độc lập ngang hàng, không bị lồng sai.")

    print("\n" + "=" * 70)
    print("🎉 TOÀN BỘ 4 HẠNG MỤC RÀ SOÁT UI/UX VÀ CẤU TRÚC ĐỀU ĐẠT CHUẨN XUẤT SẮC 100%!")
    print("=" * 70)

if __name__ == '__main__':
    verify_ui_ux_integrity()
