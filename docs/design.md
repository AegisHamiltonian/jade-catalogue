# Hướng giao diện Ngọc Nhà Lyn

## Chủ đích

Thanh nhã, đơn giản, dễ ngắm và có độ tin cậy của một cửa hàng tư vấn trực tiếp. Dùng khoảng trống, ảnh lớn và thông số rõ; không dùng gradient rực, carousel tự chạy, hiệu ứng parallax hoặc nhãn khuyến mãi giả.

| Vai trò | Giá trị | Cách dùng |
|---|---|---|
| Nền ngà | `#fcfbf8` | Nền chính, trung tính khi xem ngọc |
| Xanh ngọc trầm | `#254e43` | Nút chính, điều hướng, vùng liên hệ và focus |
| Chữ xanh đen | `#263d35` | Nội dung chính |
| Chữ phụ | `#69726b` | Thông số và nhãn |
| Xanh sương | `#eaf0e9` | Nền phản hồi nhỏ |
| Đồng trầm | `#a28c60` | Nét trang trí tiết chế |
| Viền | `#e4e6dd` | Phân vùng nhẹ |

Logo Lyn từ ảnh do chủ cửa hàng cung cấp được giữ nguyên nội dung, chuyển định dạng WebP để dùng ở header/footer/trang quản trị; favicon PNG lấy từ cùng ảnh. Nguồn gốc tại `design/brand/lyn-logo-original.png`. Không sinh hoặc vẽ lại logo. Xanh lam trong ảnh QR là giao diện Zalo, không dùng làm màu nhận diện website. Màu ảnh ngọc được giữ tự nhiên; logo Lyn hồng nhỏ được giữ đúng bản gốc.

Lora cho tiêu đề và chữ nghiêng, Be Vietnam Pro cho tiếng Việt trong điều hướng, bộ lọc, thông số. Font phục vụ tại chỗ, có OFL trong assets; không phụ thuộc tải Google Fonts khi mở trang.

### Cỡ chữ và nhịp đọc

Cập nhật theo phản hồi khách: chữ nền 16 px trên desktop, 15 px trên điện thoại; mô tả đầu trang, chi tiết sản phẩm và hướng dẫn 16 px. Nhãn/thông số phụ dùng 12–15 px tùy vị trí, thay các cỡ 8–12 px cũ. Trường nhập quản trị và bộ lọc trên điện thoại dùng 16 px. Chữ nhận diện và dòng trang trí có cấp độ riêng, không dùng làm thông tin chọn hàng.

Khối đầu trang dùng hai cột có khoảng cách rõ, cùng trục căn cho nhãn, tiêu đề, mô tả và nút. Đoạn mô tả tự ngắt dòng theo chiều rộng; chú thích không bị đẩy xa xuống đáy. Ở màn hình nhỏ, khối này căn giữa. Giá và nút chi tiết được xuống dòng khi cần; giữ đủ tìm kiếm/lưu món/menu ở chiều rộng 320 px. Dialog hướng dẫn được nới phần đọc, giữ đầy đủ bảng và hình.

Đã clone repo [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), tham chiếu commit `d14efff8ed1faa4187f004f79926f428c8074ec7`. Truy vấn typography trả về Luxury Serif (Cormorant/Montserrat) và Luxury Minimalist (Bodoni/Jost). Chọn nguyên tắc serif + sans nhưng điều chỉnh thành Lora/Be Vietnam Pro để phục vụ nội dung Việt. Gợi ý glassmorphism từ bộ dữ liệu không được chọn vì không phù hợp yêu cầu của cửa hàng. Không cài tự động toàn bộ repo như một plugin.

## Bố cục và tương tác

- Desktop: hero chia hai cột, ảnh tĩnh, catalogue bốn cột, nhóm hướng dẫn ba cột.
- Tablet: catalogue hai cột; điều hướng rút gọn khi cần.
- Mobile: hero một cột, catalogue hai cột; bộ lọc xuống hai cột để giữ chữ dễ đọc. Ảnh và nút mở chi tiết có tên truy cập; trạng thái dùng chữ kèm dấu màu.
- Dialog dùng phần tử HTML dialog, hỗ trợ Escape, đóng và điều hướng bàn phím; video có controls, không autoplay.
- Focus hiển thị rõ; có skip link; tôn trọng reduced motion. Đối chiếu nguyên tắc tương phản, focus, nhãn và target trong [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Đây chưa phải tuyên bố đã audit đầy đủ WCAG AA.
- Nội dung không bịa đánh giá, số khách, giấy kiểm định, xuất xứ hay cam kết giao hàng.

## Ảnh thật và nguồn gốc

Ảnh do cửa hàng cung cấp trong thư mục Ảnh làm nền, chọn vòng trơn cho đầu trang và vòng hạt xanh nhạt cho câu chuyện. Không sinh ảnh, không đổi màu hoặc sửa bề mặt ngọc. Chuyển JPEG sang WebP/PNG và giảm kích thước bằng sharp. Không còn nhãn ảnh minh họa trên giao diện.

Danh mục nguồn và ánh xạ tài nguyên tại [real-photos.md](real-photos.md), bản gốc tại `design/real-photos/manifest.json`. Giữ nguyên tất cả URL WebP/PNG cũ, thay nội dung bằng ảnh thật để mọi nơi đang dùng đều được cập nhật. Dữ liệu thử về giá/thông số vẫn được ghi rõ trong chế độ preview; không ghi chúng vào Supabase.
