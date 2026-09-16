# QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG · V2

V2 được dựng theo mô hình một Router + một Store + một EventBus. Không dùng chuỗi `fix/repair/patch` để bù lỗi giao diện.

- Trường: Trường Tiểu học Nghĩa Hành
- Lớp: 5A3
- Năm học: 2026–2027
- Roster khởi tạo: 42 học sinh theo file SMAS đã cung cấp.

## Học tập / SMAS
UI có GK1, CK1, GK2, CK2 / Cuối năm. Bộ nhập hỗ trợ PDF, XLS/XLSX, CSV phía trình duyệt và có luồng scan -> đối chiếu -> preview -> confirm. Không bắt đổi SMAS sang template riêng. Ưu tiên Student ID nếu file có; PDF mẫu hiện tại không thể hiện cột Student ID trong tiêu đề, nên fallback matching được hiển thị rõ.

## Liên kết học sinh
Mỗi học sinh có một token opaque ổn định và link mở thẳng trang tổng hợp; các module chỉ tham chiếu `studentId`.

## Triệu Phú Học Đường
`millionaire.html` được cô lập khỏi Store/Event của quản lý lớp. Schema question bank 18 cột được ghi ngay trên module.
