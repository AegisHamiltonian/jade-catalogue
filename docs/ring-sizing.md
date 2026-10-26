# Hướng dẫn ni nhẫn — 26/10/2026

## Phạm vi và số liệu

Theo yêu cầu khách, dựng lại hai hình thao tác trong bảng nhẫn 600 × 600 bằng công cụ **image_gen tích hợp**, tông xanh ngọc/nền ngà. Không sửa ảnh sản phẩm thật. Không thay hoặc lược bỏ sáu ảnh và các hướng dẫn vòng tay đang dùng.

Bảng khách gửi có cột Size/Ni 4–11 không xác định hệ ni và các cặp chu vi–đường kính không khớp hình học. Ví dụ 18 mm được ghép với 59–62 mm, trong khi π × 18 ≈ 56,5 mm. Không công bố lại cột này như bảng quy đổi chính xác.

`dist/ring-sizing.js` là nguồn duy nhất của bảng mới. Đường kính 14–21 mm và ví dụ 18,4 mm dùng đúng hợp đồng ni nhẫn trên catalogue: đường kính trong, không phải cỡ US/JP. Chu vi lòng nhẫn tròn tính bằng π × đường kính, làm tròn 0,1 mm. Đây là phép đối chiếu hình học, không phải lời đảm bảo một số đo giấy sẽ đeo vừa.

| Đường kính trong (mm) | Chu vi lòng trong xấp xỉ (mm) |
|---|---|
| 14,0 | 44,0 |
| 15,0 | 47,1 |
| 16,0 | 50,3 |
| 17,0 | 53,4 |
| 18,0 | 56,5 |
| 18,4 | 57,8 |
| 19,0 | 59,7 |
| 20,0 | 62,8 |
| 21,0 | 66,0 |

Cách đo ngón tay bằng dải giấy và cách đo lòng nhẫn đã đối chiếu [Tiffany & Co. Size Guide](https://www.tiffany.com/size-guide/), truy cập 26/10/2026. Không sao chép cỡ US của Tiffany sang ni web. Các con số chu vi trên là phép tính của dự án, không gán là bảng Tiffany.

## Tài nguyên và cách dùng

- `design/ring-sizing/customer-reference.png`: ảnh khách gửi để lưu dấu yêu cầu; không phục vụ trên catalogue.
- `design/ring-sizing/measure-finger.png`: hình mới, 1774 × 887.
- `design/ring-sizing/measure-ring.png`: hình mới, 1672 × 941.
- `dist/assets/size-ring-finger.webp` và `size-ring-diameter.webp`: bản dùng trên web, không cắt và không đổi nội dung. Tạo lại bằng `node scripts/prepare-ring-sizing.mjs`.
- Chữ, hướng dẫn và bảng số là HTML thật, không nằm trong ảnh AI. Hai hình không chứa chữ/số đo. Mũi tên lòng nhẫn chạm hai mép trong, không đo cả thân nhẫn. Thước trong hình giải thích thao tác, không dùng làm thước đo trên màn hình.
- Mục mở rộng nằm ngay dưới đoạn ni nhẫn hiện có, trong cùng dialog đo ni ở mọi điểm mở hướng dẫn. Hình có liên kết xem bản lớn; bảng có caption và header theo hàng/cột.
- Không có tính ni tự động hoặc ghi dữ liệu từ giấy vào sản phẩm. Người xem gửi số đo cho cửa hàng kiểm tra khớp ngón, bản nhẫn và độ vừa.

## Prompt cuối cùng — công cụ tích hợp

### Đo ngón tay

Use case: scientific-educational. Asset type: crisp instructional illustration for the ring sizing section of a refined Vietnamese jade jewellery website, Ngọc Nhà Lyn. Create one landscape artwork with two distinct sequential vignettes arranged left and right with generous breathing room. Left: a realistic elegantly drawn adult hand, anatomically correct, a slim pale sage paper strip wrapped once snugly around the base of the ring finger (not wrist), ends overlap visibly, a fine dark green pen marks exactly the overlap. Right: the same strip now unwrapped and laid completely straight horizontally, two fine visible green marks indicating its start and overlap point, with a simple straight ruler immediately below and parallel. Ruler has only evenly spaced unlabelled tick marks, absolutely no digits, no fake measurements. The strip and ruler sit flat, not at a skewed perspective. Style: sophisticated editorial educational illustration, precise fine dark jade green outlines #254e43, restrained pale sage #eaf0e9 shading, natural pale warm skin colour, clean ivory #fcfbf8 background, faint natural shadows, high resolution, no decorative foliage, no jewellery ornaments, no gradients. This is a clear diagram of measuring finger circumference, not a product photograph. No text, no letters, no numbers, no headings, no captions, no watermarks, no logos. Keep all objects within frame. Illustration only; exact Vietnamese typography and quantitative table will be placed separately in the website.

### Đo lòng nhẫn

Use case: scientific-educational. Asset type: one crisp ring inner diameter measurement illustration for refined jade jewellery website Ngọc Nhà Lyn. Create a wide landscape diagram, clean precise overhead orthographic view. One plain circular pale celadon jade ring lies FLAT on ivory #fcfbf8 background, no gemstones no metal setting. The complete ring centered in frame, viewed straight down so outer edge and inner opening are exactly circular with visible band thickness. A simple thin straight flat ruler is placed horizontally through the centre of the opening, passing underneath the ring. Ruler only shows neatly evenly spaced unlabelled minor and major tick marks, NO digits, NO letters. A dark forest green fine double-headed arrow spans EXACTLY the inner opening horizontally through its centre, arrow tips touching only the LEFT INNER edge and RIGHT INNER edge, never touching outer edges. Two subtle thin dashed vertical guide lines tangent to the inner circle left/right extend below the ring to clarify the measured endpoints. Use fine dark jade green #254e43 contours and restrained pale sage #eaf0e9 shading. Sophisticated minimal educational editorial illustration matching an ivory/green luxury jade boutique, subtle natural polished jade texture, clearly legible geometry, lots of empty background, no decorations. No text no labels no numbers no headings no watermark no brand. Do not include any measuring value or scale claim: exact measurement example will be typeset separately in HTML. Show inner diameter only, do not measure outside band. Keep whole ring and ruler inside frame.

Hình ngón tay cuối thể hiện ngón muốn đeo nhẫn, không buộc người xem chọn một ngón cụ thể. Hướng dẫn chữ mô tả đo đúng ngón dự định đeo.
