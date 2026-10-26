> Cập nhật 26/10/2026: khách chọn trở lại bảng màu xanh ngọc trầm trên nền ngà. Thương hiệu Ngọc Nhà Lyn, logo, nhóm Zalo và hotline giữ nguyên. Quy chuẩn hiện hành tại design.md; ảnh thật tại real-photos.md. Phần dưới ghi lại yêu cầu nhận diện trước đó.

# Yêu cầu nhận diện Ngọc Nhà Lyn

## Yêu cầu và cách xử lý

| Yêu cầu | Triển khai |
|---|---|
| Tên web là Ngọc Nhà Lyn | Đổi title, metadata, menu, header, footer, trang quản trị, trạng thái trống/lỗi, hướng dẫn, nội dung hỏi món và thông báo quyền |
| Kem hồng, đơn giản và sang trọng | Dùng kem làm nền chính, hồng phấn ở mảng phụ, hồng đất đậm cho hành động; giữ khoảng trống và hệ chữ Lora/Be Vietnam Pro |
| Theo nhận diện ảnh khách gửi | Dùng nguyên logo Lyn, không tạo ảnh mới hoặc vẽ lại logo; không lấy xanh lam của khung Zalo làm màu thương hiệu |
| Zalo chuyển sang nhóm | Mọi CTA Zalo tĩnh và động dùng `https://zalo.me/g/bafpcs297`, nhãn ghi rõ nhóm |
| Giữ liên hệ trực tiếp bằng hotline | Giữ `tel:+84979628889` tại footer, vùng liên hệ, chi tiết và hướng dẫn; không dùng đường dẫn chat Zalo cá nhân |

## Vì sao không phủ hồng toàn trang

Ảnh logo có nền hồng phấn và nét hồng mềm. Dùng đúng màu nét logo cho toàn bộ chữ/nút sẽ giảm độ rõ của chữ nhỏ. Vì vậy màu gốc dùng trong logo và các nền phụ; màu hành động được làm đậm hơn trong cùng họ màu. Nền kem ấm giúp trang bớt lạnh, đồng thời ít cạnh tranh với ảnh sản phẩm.

Không thêm hiệu ứng lấp lánh, bướm chuyển động hoặc chữ viết tay vào toàn bộ nội dung. Nét chữ viết tay chỉ nằm trong logo; tên thương hiệu và thông số vẫn dùng font dễ đọc. Bảng màu hiện tại được ghi trong `design.md`.

Các tỷ lệ tương phản tính từ màu CSS: chữ chính trên kem 10,73:1; chữ phụ trên kem 5,41:1; chữ trắng trên nút hồng đất 6,94:1; chữ nhấn trên kem 5,41:1; chữ phụ trên hồng phấn 4,71:1. Đây là kiểm tra các cặp màu chính, không phải chứng nhận toàn bộ WCAG.

## Bảo toàn chức năng và dữ liệu

Không đổi schema, UUID, quyền admin, kết nối Supabase, dữ liệu sản phẩm, bộ lọc, trạng thái cung ứng, thư viện ảnh/video hay cơ chế chống ghi đè. Giữ nguyên khóa lưu món trong trình duyệt để khách không mất danh sách đã lưu; khóa nội bộ không được hiển thị như tên cửa hàng.

Không xóa tệp hoặc chức năng cũ trong lần cập nhật này. Mọi vị trí hiển thị logo đã chuyển sang tài nguyên Lyn; đây là thay nhận diện, không bỏ chức năng nhận diện/trang chủ/favicon. Các ảnh preview cũ trong docs là bằng chứng lịch sử; không phải ảnh giao diện hiện tại.

## Hành vi liên hệ

Website chỉ mở nhóm hoặc ứng dụng gọi điện. Nhóm Zalo không tự nhận nội dung tiền điền, vì vậy giữ chức năng sao chép mã/tên/giá/ni/URL rồi người dùng tự dán. Có hotline để trao đổi trực tiếp. Không tự gửi tin nhắn, không tự tham gia nhóm, không đưa thông tin khách lên nhóm.

## Kiểm tra đi kèm

Đã kiểm tra menu mobile, hướng dẫn, popup sản phẩm mẫu, nội dung hỏi món, lưu món sau tải lại, trang quản trị và bố cục desktop/mobile. Sửa thêm lỗi chiều cao ảnh popup bị cố định bởi thuộc tính HTML; ảnh nay co theo khung, không bỏ nội dung. 11 nhóm test hồi quy hiện có và kiểm tra tài nguyên đều qua. Bằng chứng chi tiết ở `verification.md`.
