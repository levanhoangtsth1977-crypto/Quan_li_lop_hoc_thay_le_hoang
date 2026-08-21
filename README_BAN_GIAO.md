# QUẢN LÝ LỚP HỌC – THẦY LÊ HOÀNG

## 1. Trạng thái bàn giao
- Nhánh chính: `master`
- Bản chốt hiện tại: `9fa675a50043e8b056616004be99395a38816fc6`
- Lớp mặc định: 5C
- Năm học mặc định: 2026–2027

## 2. Các module chính
- `index.html`: giao diện ứng dụng.
- `style.css`: giao diện/kiểu dáng.
- `script.js`: logic ứng dụng chính.
- `data.js`: dữ liệu và cấu trúc dữ liệu.
- `google-apps-script/Code.gs`: Google Apps Script kết nối Google Sheets.
- `google-api-bridge.js`, `google-sheets-menu-bridge.js`, `google-sheets-records-bridge.js`: cầu nối Google/Sheets.
- `event-summary-by-student-fix.js`: tổng hợp vắng/vi phạm/khen thưởng theo học sinh.
- `DANH_SACH_HOC_SINH_5C_2026_2027.json`: dữ liệu danh sách lớp mẫu.
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

## 4. Nguyên tắc bàn giao
- Không tự ý thay đổi cấu trúc dữ liệu Google Sheets đã chốt.
- Không đổi ID học sinh.
- Không xóa dữ liệu gốc để xử lý thống kê.
- Khi sửa giao diện, chỉ sửa đúng module cần thiết và giữ nguyên menu/chức năng đang hoạt động.
- Sau mỗi thay đổi phải kiểm tra trên điện thoại vì ứng dụng được sử dụng trên Android.

## 5. Cách triển khai
Có thể triển khai từ repository này bằng GitHub Pages hoặc Netlify tùy cấu hình hiện tại. Nếu dùng Google Apps Script, kiểm tra Web App deployment và quyền truy cập sau khi thay đổi `Code.gs`.

## 6. Kiểm tra sau bàn giao
1. Mở Trang chủ.
2. Kiểm tra danh sách học sinh.
3. Điểm danh một học sinh vắng nhiều ngày và kiểm tra tổng hợp.
4. Tạo 2–3 lượt vi phạm cho cùng một học sinh: phải hiện 1 dòng, số lần tương ứng.
5. Tạo 2–3 lượt khen thưởng cho cùng một học sinh: phải hiện 1 dòng, số lần tương ứng.
6. Kiểm tra dữ liệu Google Sheets không bị mất.
7. Kiểm tra trên điện thoại: nhập, lưu và tải lại trang.
