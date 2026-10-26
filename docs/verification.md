# Bằng chứng kiểm tra

Cập nhật 26/10/2026. Kết quả này phân biệt mã, bản xem thử và dịch vụ thật.

## Mã và database thực thi cục bộ

`npm.cmd test`: **11/11 nhóm test qua**.

- Tìm tiếng Việt không dấu và mã có dấu chấm.
- Giao bộ lọc loại, ni, màu, chất, giá, tình trạng; không trộn ni nhẫn với vòng.
- Không hiển thị hàng bị ẩn; lọc danh sách đã lưu trên thiết bị.
- Gom đợt và thứ tự ổn định; sắp xếp giá toàn bộ kết quả.
- Liên kết chính xác SKU, nội dung hỏi món theo hàng sẵn/nhận đặt/hết.
- Escape dữ liệu sản phẩm; chặn media URL thực thi script hoặc không HTTPS.
- Kiểm tra số nguyên VNĐ, ni theo loại, bằng chứng xử lý.
- Thực thi schema và policy trên PostgreSQL qua PGlite: anon chỉ đọc công bố; user thường không ghi/không tự nâng quyền; admin được CRUD; private audit; ni/giá/media/SKU/kiểm định; timestamp chống ghi đè; thu hồi membership.
- REST contract: phân trang hơn 200; lỗi kết nối thật không trả hàng mẫu.
- Auth thành công nhưng không có membership vẫn bị chặn trang quản trị.
- Write mang access token và `updated_at`, xung đột không ghi đè im lặng.

`npm.cmd run check`: kiểm tra cú pháp toàn bộ JS, đường dẫn tài nguyên HTML/CSS, ngôn ngữ trang và cấu hình khóa công khai. **Qua**.

## Trình duyệt

- HTTP localhost trả 200.
- Thử bộ lọc nhẫn → ni 18,4 mm: đúng một sản phẩm mẫu.
- Mở chi tiết n188 bằng dữ liệu mẫu: đúng giá/ni/mã, nội dung hỏi mang tên Ngọc Nhà Lyn, liên kết nhóm Zalo `https://zalo.me/g/bafpcs297` và gọi `+84979628889`.
- Tìm không có kết quả: trạng thái trống và reset hoạt động.
- Hướng dẫn ni mở/đóng bằng dialog, giải thích đường kính trong.
- Lưu/bỏ lưu và xem danh sách đã lưu hoạt động; đã bỏ lưu dữ liệu test sau kiểm tra.
- 390 px: `clientWidth = scrollWidth = 390`; hàng tab loại không tràn nội dung; bộ lọc hai cột.
- 1440 px: `clientWidth = scrollWidth = 1440`; lưới bốn cột.
- Trang quản trị chưa nối backend hiển thị thông báo thật, không giả đăng nhập hoặc lưu thành công.
- Ảnh kiểm tra: `preview-mobile.png`, `preview-desktop.png`; đây là bản thiết kế dùng hàng minh họa.
- Chưa thử gửi tin nhắn Zalo hoặc gọi điện thật; chỉ kiểm tra liên kết, không gửi tin thay người dùng.

## Supabase của người dùng

- Đã kết nối **Session pooler** do người dùng cung cấp, trên project `rqbyaiqdhbvtssnanoap`. TLS được xác minh (`authorized=true`) với CA Supabase; không tắt kiểm tra chứng chỉ/tên máy chủ.
- Trước khi áp dụng, inspect xác nhận không có bảng trong public/private và có 1 user Auth. Không chạy reset, không xóa dữ liệu hiện có.
- Đã áp dụng `schema.sql`, `storage.sql`, yêu cầu PostgREST nạp lại schema và cấp membership cho đúng user chủ cửa hàng đã chỉ định.
- Kiểm tra metadata cuối: **0 sản phẩm, 1 admin, RLS bật**, policy public chỉ SELECT sản phẩm công bố, policy ghi yêu cầu membership; bucket `product-media` public và giới hạn 40 MiB.
- `node scripts/database.mjs probe` chạy trên **PostgreSQL thật**: **32 assertions PASS**, `rolledBack=true`, `adminMembershipPreserved=true`. Kiểm tra khách/user thường/admin, dữ liệu ẩn, write, quyền Storage, audit riêng, xung đột timestamp và thu hồi admin. Hàng QA/media metadata chỉ tồn tại trong transaction chưa commit và được rollback; không để lại sản phẩm hay file QA. Bảo vệ Supabase không cho DELETE trực tiếp storage table vẫn được giữ nguyên.
- Script probe giữ nguyên microsecond của `updated_at` như PostgREST; không làm tròn timestamp qua JS Date khi kiểm tra ghi đồng thời.
- `node scripts/probe-api.mjs` gọi **API cloud thật**: GET sản phẩm 200; RPC admin với publishable key trả false; POST/PATCH/DELETE của khách đều **401, SQLSTATE 42501**. Kết quả nằm ở `live-api-results.json`.
- Trình duyệt đã đọc catalogue cloud: **0 món**, không báo lỗi, không hiện sản phẩm minh họa; thông báo bộ sưu tập đang cập nhật. Trang quản trị đã chuyển sang form đăng nhập thật.
- Không có mật khẩu mặc định; không lưu mật khẩu database vào source. Chưa đăng nhập thay chủ cửa hàng hoặc thử tải tệp qua phiên Auth của chủ cửa hàng vì không có mật khẩu user đó. User thật tự đăng nhập để thêm hàng; đây là bước kiểm tra thao tác của người dùng còn lại, không phải quyền được giả lập.

Mã catalogue hiện dùng `dataSource: 'supabase'`. Lỗi API thật không trả hàng mẫu. Các screenshot preview-desktop/mobile ghi lại phương án giao diện trước khi chuyển sang database trống thật; không phải bằng chứng tồn kho.

## Cập nhật nhận diện Ngọc Nhà Lyn

- Catalogue và trang quản trị hiển thị tên mới, logo Lyn do khách cung cấp và bảng màu kem/hồng phấn/hồng đất. Không còn tên cửa hàng cũ trong nội dung HTML/JS hiển thị.
- Quét các liên kết tĩnh và kiểm tra DOM: toàn bộ nút Zalo mở nhóm `https://zalo.me/g/bafpcs297`; hotline vẫn là `tel:+84979628889`.
- Popup chi tiết, trạng thái trống và hướng dẫn đều dùng nhóm; các vùng liên hệ trực tiếp giữ hotline. Nội dung sao chép hỏi món bắt đầu bằng “Chào Ngọc Nhà Lyn”.
- Browser QA dùng đúng mã ứng dụng và chế độ preview có sẵn trên host QA riêng; không thêm hàng giả vào Supabase. Bộ lọc nhẫn → ni 18,4 trả đúng một món mẫu. Lưu món, tải lại trang, danh sách vẫn giữ; đã bỏ lưu món thử sau kiểm tra.
- Ảnh popup được sửa `height:auto` để không bị giữ 800 px từ thuộc tính HTML. Trên mobile, khung ảnh đo được khoảng 300 × 261 px; thông số và toàn bộ nội dung vẫn có thể xem. Không tràn ngang trong dialog.
- Kiểm tra ở viewport 390 px và 1440 px: chiều rộng nội dung bằng viewport khả dụng, không tràn ngang. Trang quản trị mobile cũng không tràn và vẫn hiển thị form đăng nhập thật.
- 11/11 nhóm test hiện có qua sau đổi nhận diện; kiểm tra cú pháp và tham chiếu tài nguyên qua. Không sửa schema, dữ liệu sản phẩm hoặc quyền admin.

## Ảnh hướng dẫn ni

- Đọc trực tiếp cả 7 ảnh do khách cung cấp; dùng 6 ảnh rõ, không dùng bảng nhẫn 600 × 600 có thang Size/Ni khác mm. Chi tiết quyết định tại `sizing-images.md`.
- Giữ nguyên hướng dẫn đo ni trước đó và bổ sung ba mục ảnh có thể mở/đóng, thông tin tham khảo được phân biệt với quy tắc dữ liệu sản phẩm.
- 6 ảnh đầu ra WebP lossless có pixel giống hệt ảnh JPEG nguồn sau giải mã; giữ dấu nguồn. Không tạo lại ảnh bằng AI, không nội suy số đo.
- Browser mobile/desktop: mở mục ảnh và lưới dáng vòng, không tràn ngang; ảnh có alt text và liên kết đọc bản đầy đủ; ảnh thực tế đã tải đủ.
- Catalogue thật vẫn dùng Supabase; các thử nghiệm ảnh/guide không tạo hoặc sửa sản phẩm. Các nhóm kiểm tra mã hiện có đều qua.

## Repo triển khai đang dùng

Theo địa chỉ người dùng xác nhận, remote `origin` là `https://github.com/AegisHamiltonian/jade-catalogue.git`. Nhánh main giữ nguyên commit khởi tạo của repo đó, không force-push. Bản nhận diện Ngọc Nhà Lyn đã được xác nhận trên `https://jade-catalogue.vercel.app/`, cùng config nhóm Zalo và trang quản trị mới.
