# Hướng giao diện Ngân Giang

## Chủ đích

Thanh nhã, đơn giản, dễ ngắm và có độ tin cậy của một cửa hàng tư vấn trực tiếp. Dùng khoảng trống, ảnh lớn và thông số rõ; không dùng gradient rực, carousel tự chạy, hiệu ứng parallax hoặc nhãn khuyến mãi giả.

| Vai trò | Giá trị | Cách dùng |
|---|---|---|
| Nền ngà | `#fcfbf8` | Không gian chính, giúp ảnh đá tự nhiên nổi bật |
| Xanh ngọc trầm | `#254e43` | Nút chính, điều hướng, chữ thương hiệu và vùng liên hệ |
| Chữ chính | `#263d35` | Nội dung cần đọc |
| Chữ phụ | `#69726b` | Thông số, nhãn, chú thích |
| Xanh nhạt | `#eaf0e9` | Nhóm kiến thức, phản hồi nhẹ |
| Vàng đất | `#a28c60` | Chi tiết rất nhỏ, không làm màu chủ đạo |
| Viền | `#e4e6dd` | Chia cấu trúc, giảm nhu cầu box shadow |

Lora cho tiêu đề và chữ nghiêng, Be Vietnam Pro cho tiếng Việt trong điều hướng, bộ lọc, thông số. Font phục vụ tại chỗ, có OFL trong assets; không phụ thuộc tải Google Fonts khi mở trang.

Đã clone repo [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), tham chiếu commit `d14efff8ed1faa4187f004f79926f428c8074ec7`. Truy vấn typography trả về Luxury Serif (Cormorant/Montserrat) và Luxury Minimalist (Bodoni/Jost). Chọn nguyên tắc serif + sans nhưng điều chỉnh thành Lora/Be Vietnam Pro để phục vụ nội dung Việt. Gợi ý glassmorphism từ bộ dữ liệu không được chọn vì không phù hợp yêu cầu của cửa hàng. Không cài tự động toàn bộ repo như một plugin.

## Bố cục và tương tác

- Desktop: hero chia hai cột, ảnh tĩnh, catalogue bốn cột, nhóm hướng dẫn ba cột.
- Tablet: catalogue hai cột; điều hướng rút gọn khi cần.
- Mobile: hero một cột, catalogue hai cột; bộ lọc xuống hai cột để giữ chữ dễ đọc. Ảnh và nút mở chi tiết có tên truy cập; trạng thái dùng chữ kèm dấu màu.
- Dialog dùng phần tử HTML dialog, hỗ trợ Escape, đóng và điều hướng bàn phím; video có controls, không autoplay.
- Focus hiển thị rõ; có skip link; tôn trọng reduced motion. Đối chiếu nguyên tắc tương phản, focus, nhãn và target trong [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Đây chưa phải tuyên bố đã audit đầy đủ WCAG AA.
- Nội dung không bịa đánh giá, số khách, giấy kiểm định, xuất xứ hay cam kết giao hàng.

## Ảnh tạm và nguồn gốc

Người dùng đã yêu cầu không tạo thêm ảnh fake. Bốn ảnh đã tạo trước yêu cầu đó được giữ làm ảnh minh họa tạm và ghi nhãn. Chủ cửa hàng thay ảnh thật qua trang quản trị; không dùng chúng để xác nhận hàng có sẵn.

Phương thức đã dùng: công cụ image_gen tích hợp, không dùng fallback CLI. Ảnh gốc giữ nguyên trong `design/source-images/`; WebP tương ứng dùng trên giao diện:

- `dist/assets/jade-editorial.webp` — hero và vòng minh họa.
- `dist/assets/lavender-bangle.webp` — vòng tím nhạt minh họa.
- `dist/assets/honey-ring.webp` — nhẫn vàng mật minh họa.
- `dist/assets/green-pendant.webp` — mặt ngọc xanh minh họa.

Nén định dạng bằng sharp, không sửa nội dung ảnh. Không tạo ảnh mới trong script chuẩn bị tài nguyên.

### Prompt đã dùng

**Hero**

> Use case: product-mockup. Asset type: wide editorial photograph for an elegant Vietnamese jade jewelry boutique website. Create a photorealistic luxury still life, landscape 3:2 composition: one substantial pale celadon semi translucent jade bangle stands almost upright leaning against a rough pale cream limestone block, with a second slender milky ivory jade bangle lying in front on softly folded ivory raw silk. Close intimate camera, jade occupies center-right and fills most of photo. Subtle green cloud inclusions and realistic translucent polish, no gold or gemstones. Natural window light from upper left, soft botanical shadows, warm off-white plaster background. Calm quiet luxury, restrained and sculptural, artisanal editorial photography, exquisite tactile detail, no excessive saturation, no text, no logos, no watermark, no collage. This is illustrative concept photography, not an image of real shop inventory.

**Vòng tím**

> Use case: product-mockup. Square photorealistic premium product photograph of a single polished round jade bangle in soft very pale lavender with cloudy milky white inclusions. Bangle rests at a shallow angle on a small raw light limestone slab over warm ivory background. Full bangle visible, centered, fills 72% of square. Natural soft daylight, realistic stone semitranslucency, soft gray green shadows. Refined quiet luxury jewelers catalogue. No extra jewelry, no flowers, no props other than limestone, no text, no watermark. Illustrative fictional product for design prototype.

**Nhẫn**

> Use case: product-mockup. Square photorealistic premium macro product photograph of a single solid honey amber yellow jade hololith ring, thick rounded polished band made entirely of jade, no metal setting. The ring leans gently on a small pale cream limestone piece, warm ivory matte studio background. Whole ring visible, centered, fills 65% of square. Soft daylight, translucent natural jade cloudy variations, refined understated luxury editorial catalogue, believable scale and stone texture. No gold metal, no text, no watermark. Illustrative fictional product for design prototype.

**Mặt dây**

> Use case: product-mockup. Square photorealistic premium product photograph of a single rich forest green jade oval cabochon pendant with a discreet tiny warm gold bail, pendant lying on pale warm limestone with thin dark green silk cord gently running toward the upper background edge. Natural stone variation and polished domed green surface, soft window daylight, warm ivory studio background. Whole pendant centered, fills 60% of square, refined understated luxury jewelers catalogue. No additional jewelry, no flowers, no text, no watermark. Illustrative fictional product for design prototype.
