# QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG — BASELINE 2026-08-26

## Mục đích
Đây là mốc nền để các lần nâng cấp sau này tiếp tục trên đúng trạng thái đã ổn định, tránh vá chồng hoặc làm mất chức năng đang hoạt động.

## Phiên bản nền
- Branch: `master`
- Mốc nền: commit chứa tài liệu này sau khi hoàn tất các sửa đổi ngày 26/08/2026.
- Năm học: 2026–2027
- Lớp: 5C
- Danh sách lớp hiện hành: 42 học sinh

## Các nhóm chức năng đã có
1. Trang chủ / Dashboard
2. Học sinh
3. Hồ sơ học sinh
4. Điểm danh
5. Vi phạm
6. Khen thưởng
7. Học tập
8. Nhận xét được tổ chức trong khu vực Học tập
9. Thống kê
10. Link học sinh
11. AI giáo viên
12. Tiện ích
13. Triệu Phú Học Đường
14. Nhập dữ liệu SMAS GHK1 / CHK1 / GHK2 / CHK2
15. Xét học sinh xuất sắc theo dữ liệu cả năm

## Quy tắc dữ liệu
- Google Sheets là nguồn dữ liệu đồng bộ chính cho dữ liệu lớp hiện hành.
- Không tự tạo học sinh mẫu.
- Không xóa dữ liệu Google Sheets khi chỉnh giao diện.
- Không ghi ID giao diện tạm ngược vào Google Sheets.
- Vi phạm và Khen thưởng phải đồng bộ lại sau thao tác xóa/sửa.
- Trang chủ và AI phải lấy cùng nguồn dữ liệu hiện hành với các menu nghiệp vụ.

## Học tập / SMAS
- Dữ liệu SMAS được lưu riêng theo 4 kỳ: `GHK1`, `CHK1`, `GHK2`, `CHK2`.
- Tự nhận diện kỳ từ tên file; không xác định được kỳ thì phải cảnh báo.
- Dữ liệu SMAS là nguồn bằng chứng cho xét học sinh xuất sắc.
- Không ghi đè dữ liệu lớp gốc.

## Xét học sinh xuất sắc
Mô hình đã chốt:
- Học tập: 60 điểm
- Thành tích: 15 điểm
- Chuyên cần: 10 điểm
- Tiến bộ: 5 điểm
- Hoạt động: 10 điểm
- Vi phạm: điểm trừ

Khi chọn N học sinh, hệ thống phải hiển thị:
- Bảng xếp hạng theo Hạng / HS / Học tập / Thành tích / Chuyên cần / Tiến bộ / Hoạt động / Vi phạm / Tổng.
- Minh chứng chi tiết từng học sinh để giáo viên kiểm tra trước khi quyết định.

## Quy tắc nâng cấp
- Ưu tiên module độc lập thay vì sửa chồng `script.js` nếu không bắt buộc.
- Không thay đổi `data.js`, `index.html`, `style.css` nếu nhiệm vụ không yêu cầu.
- Trước khi sửa một file, phải đọc đúng phiên bản hiện tại và dùng SHA hiện tại.
- Sau mỗi sửa đổi phải kiểm tra luồng nạp script và cache-busting.
- Không tuyên bố đã sửa live nếu chưa xác minh commit/file thực tế.
- Khi nâng cấp lớn, tạo commit mốc trước rồi mới triển khai thay đổi.

## Các module bổ sung quan trọng hiện tại
- `learning-smas-import.js`
- `excellent-student-engine.js`
- `learning-student-picker-fix.js`
- `student-profile-repair.js`
- `reward-delete-fix.js`
- `menu-badge-sync-fix.js`
- `home-data-sync-fix.js`
- `home-ai-live-sync.js`
- `menu-runtime-fix.js`

## Cách tiếp tục phát triển
Mọi yêu cầu nâng cấp sau này phải bắt đầu bằng:
1. Đọc `BASELINE_UPGRADE_2026-08-26.md`.
2. Xác định module/file liên quan.
3. Kiểm tra SHA hiện tại của file trước khi ghi.
4. Chỉ sửa phần cần thiết.
5. Ghi commit mô tả rõ chức năng.
6. Kiểm tra không làm thay đổi các module đang hoạt động.
