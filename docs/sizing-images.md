# Đánh giá ảnh hướng dẫn ni do cửa hàng cung cấp

Đã xem trực tiếp cả 7 ảnh trong thư mục `Đo ni`. Không tạo ảnh mới, không xóa dấu nguồn, không suy ra số đo mới bằng AI. Sáu ảnh được đưa vào đúng mục hướng dẫn ni hiện có; nội dung đo vòng/nhẫn theo mm trước đó vẫn giữ nguyên.

| Ảnh nguồn | Kích thước | Nội dung | Quyết định |
|---|---|---|---|
| a548bc06fb337b6d22222.jpg | 1080 × 1920 | Hình đo tay và bảng tham khảo | Dùng; ghi rõ bảng chỉ để ước lượng và trao đổi với cửa hàng, không tự chốt ni từ chu vi cổ tay |
| 09b042f805cd8593dcdc7.jpg | 1440 × 1920 | Vòng bản đũa; lòng trong, thân vòng | Dùng để phân biệt vị trí đo; các khoảng kích thước trong ảnh không được nâng thành quy chuẩn chung |
| cb50eb18ac2d2c73753c6.jpg | 1440 × 1920 | Vòng bản hẹ; lòng trong và độ dày | Dùng theo cùng nguyên tắc tham khảo |
| de9441dd06e886b6dff94.jpg | 1440 × 1920 | Vòng đinh đang | Dùng để nhận biết dáng mảnh và vị trí đo |
| e03c05724247c2199b565.jpg | 1440 × 1920 | Vòng quý phi/oval | Dùng; nhấn mạnh cần cả trục dài và trục ngắn của lòng vòng |
| c7695c201b159b4bc2043.jpg | 1440 × 1920 | Ví dụ đổi ni giữa các dáng vòng | Dùng trong mục mở rộng riêng, kèm lưu ý 1–2 ni là gợi ý của nguồn, không phải công thức cố định |
| d1e538ab7f9effc0a68f1.jpg | 600 × 600 | Bảng Size/Ni nhẫn, hình đo nhỏ | Không đưa vào bảng tra của website: chữ/hình nhỏ và mềm, thang Size/Ni 4–11 khác quy ước đường kính trong mm của catalogue; không xác thực được cách quy đổi từ ảnh |

## Cách trình bày

- Ba mục mở rộng: đo tay/bảng tham khảo; phân biệt dáng vòng; tham khảo khi đổi dáng. Không ép khách cuộn qua sáu ảnh khi chỉ cần đọc cách đo ngắn.
- Ảnh hiển thị đúng tỷ lệ, có alt text, chú thích ngoài ảnh và liên kết xem bản đầy đủ. Mobile dùng một cột; ảnh nguồn lớn có thể mở riêng để đọc rõ.
- Ảnh lazy-load. Bản WebP lossless giữ nguyên kích thước và nội dung; ảnh JPEG nguồn được giữ tại `design/sizing/`, dấu nguồn @vongveojadea vẫn có trên các ảnh tương ứng.
- Không chuyển bảng tham khảo thành bộ tính ni, không trộn ni nhẫn với ni vòng, không sửa ni hoặc thông số sản phẩm trong Supabase.
- Phần nhẫn tiếp tục hướng dẫn đo lòng chiếc nhẫn đang đeo vừa bằng mm, đúng hợp đồng dữ liệu hiện tại.

## Kết quả kiểm tra

- Đối chiếu dữ liệu pixel sau giải mã của cả 6 JPEG nguồn và WebP đầu ra: giống hệt, không cắt hoặc đổi chữ/nguồn ảnh.
- Browser mobile: 3 mục mở rộng, 6 ảnh; nội dung nhẫn ban đầu vẫn có. Chiều rộng nội dung dialog bằng khung, không tràn ngang.
- Browser desktop: 4 ảnh dáng vòng tải đúng kích thước 1440 × 1920, lưới hai cột; phần oval giữ hướng dẫn cả hai trục.
- Toàn bộ ảnh có liên kết mở bản đầy đủ ở tab riêng, không ép đọc bảng số qua thumbnail.
- 11/11 nhóm test hồi quy qua; cú pháp và tham chiếu tài nguyên được kiểm tra.
