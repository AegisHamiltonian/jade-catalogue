# Ảnh thật và bảng màu xanh — 26/10/2026

Nguồn: 13 ảnh JPEG do cửa hàng cung cấp trong thư mục **Ảnh làm nền**. Chọn bốn ảnh rõ chi tiết, nền sáng và màu ngọc tự nhiên. Không tạo ảnh, tô màu, chỉnh chất ngọc hoặc tự đăng hàng vào database.

| URL hiện hành (cả WebP và PNG) | JPEG nguồn trong design/real-photos | Vai trò |
|---|---|---|
| jade-editorial | bangle.jpg | Vòng trơn trên khay gỗ, ảnh đầu trang |
| lavender-bangle | beads.jpg | Vòng hạt xanh nhạt, phần câu chuyện |
| honey-ring | ring.jpg | Nhẫn, ảnh cho bộ dữ liệu kiểm tra giao diện |
| green-pendant | cabochons.jpg | Mặt ngọc, ảnh cho bộ dữ liệu kiểm tra giao diện |

Tên URL cũ được giữ để tất cả nơi đang dùng nhận cùng ảnh thật, kể cả các liên kết PNG. Tên file nguồn khách cung cấp được ghi đầy đủ trong manifest.json. `scripts/prepare-assets.mjs` đọc manifest, giữ tỷ lệ, không phóng lớn ảnh và xuất bản WebP/PNG tương ứng; các PNG trong design/source-images cũng cùng nội dung ảnh thật.

Gỡ nhãn ảnh AI/ảnh minh họa sau khi thay ảnh. Giữ hướng dẫn ánh sáng/màn hình ảnh hưởng cảm nhận màu và thông báo giá/tình trạng giả lập trong chế độ kiểm tra giao diện. Catalogue thật tiếp tục đọc Supabase, không tự dùng dữ liệu thử khi lỗi mạng.

Bảng màu: nền ngà #fcfbf8, xanh chính #254e43, chữ #263d35, phụ #69726b. Giữ logo Lyn đúng ảnh gốc và các màu trạng thái có chữ đi kèm. Giữ nguyên catalogue, bộ lọc, lưu món, chi tiết, hướng dẫn ni, liên kết nhóm Zalo, hotline và quản trị có phân quyền.
