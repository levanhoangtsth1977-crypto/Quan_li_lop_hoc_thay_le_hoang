# QUẢN LÝ LỚP HỌC – THẦY LÊ HOÀNG

## 1. Trạng thái bàn giao
- Nhánh chính: `master`
- Lớp hiện tại: **5A3**
- Năm học: **2026–2027**
- Giáo viên: **Lê Hoàng**
- Trường: **Trường Tiểu học Nghĩa Hành**
- Netlify production: `quan-li-lop-hoc-thay-le-hoang.netlify.app`

## 2. Các module chính
- `index.html`: giao diện ứng dụng.
- `style.css`: giao diện/kiểu dáng.
- `script.js`: logic ứng dụng chính.
- `data.js`: dữ liệu và cấu trúc dữ liệu.
- `menu-runtime-fix.js`: runtime loader một lần cho các module bổ trợ.
- `site-link-integrity.js`: kiểm tra và chuẩn hóa menu/liên kết nội bộ.
- `behavior-quick-options.js`: danh mục chọn nhanh Vi phạm/Khen thưởng.
- `learning-smas-import.js`: nhập dữ liệu học tập từ SMAS.
- `google-apps-script/Code.gs`: Google Apps Script kết nối Google Sheets.
- `google-api-bridge.js`, `google-sheets-menu-bridge.js`, `google-sheets-records-bridge.js`: cầu nối Google/Sheets.
- `game/`: module trò chơi học tập.
- `netlify.toml`: cấu hình Netlify.

## 3. Logic thống kê đã chốt
### Điểm danh
Một học sinh chỉ xuất hiện một dòng trong bảng tổng hợp. Có các cột:
- Tổng vắng
- Có phép
- Không phép
- Ngày vắng

Dữ liệu điểm danh gốc không bị xóa hoặc gộp.

### Vi phạm
Một học sinh = một dòng trong bảng tổng hợp, kèm số lượt vi phạm. Các bản ghi gốc vẫn giữ riêng để có thể xóa từng lượt.

### Khen thưởng
Một học sinh = một dòng trong bảng tổng hợp, kèm số lượt khen thưởng. Các bản ghi gốc vẫn giữ riêng.

## 4. Nguyên tắc vận hành hiện tại
- Canonical class: **5A3**; không sử dụng lớp 5C.
- Không dùng file Excel/JSON mẫu làm dữ liệu thật của lớp.
- SMAS là nguồn dữ liệu học tập chính.
- Không tự động ghép học sinh chỉ vì tên gần giống.
- Không đổi ID học sinh.
- Không xóa dữ liệu gốc để xử lý thống kê.
- Link học sinh là link chung của website, không phải danh sách link riêng từng học sinh.
- Khi sửa giao diện, phải bảo vệ cả desktop và mobile.
- Không để workflow tự động sửa `index.html` gây trùng menu/module.
- Mỗi module bổ trợ phải có một loader canonical; runtime dùng cơ chế `loadOnce`.
- Không tự ý xóa chức năng đang dùng nếu chưa xác định chắc chắn.

## 5. Cách triển khai
Repository được triển khai production trên Netlify. `netlify.toml` đặt chính sách revalidate cho HTML/JS/CSS để hạn chế trình duyệt giữ phiên bản cũ. Nếu thay đổi `Code.gs`, phải kiểm tra riêng Web App deployment và quyền truy cập Google Apps Script.

## 6. Kiểm tra sau thay đổi
1. Kiểm tra Trang chủ.
2. Kiểm tra toàn bộ menu chính và từng section tương ứng.
3. Kiểm tra các `data-page-link` nội bộ.
4. Kiểm tra nút thao tác nhanh và modal/form.
5. Kiểm tra danh sách học sinh và dữ liệu SMAS.
6. Kiểm tra điểm danh.
7. Kiểm tra Vi phạm/Khen thưởng và danh mục chọn nhanh.
8. Kiểm tra Học tập, Thống kê, Link học sinh, AI giáo viên, Vòng quay may mắn, Tiện ích, Cài đặt.
9. Kiểm tra không có script/CSS/module bị nạp trùng.
10. Kiểm tra desktop và mobile.
11. Kiểm tra GitHub Actions và Netlify deployment sau mỗi thay đổi.
12. Không đánh dấu hoàn tất kiểm tra thực tế nếu chưa mở website bằng trình duyệt.
