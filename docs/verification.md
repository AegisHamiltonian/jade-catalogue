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

## Ảnh thật và màu xanh — 26/10/2026

- Đã xem bộ 13 ảnh thật do cửa hàng cung cấp; thay ảnh đầu trang và câu chuyện, đồng thời thay hai ảnh còn lại của chế độ kiểm tra giao diện. Mọi URL PNG/WebP hiện hành giữ nguyên, cùng trỏ tới nội dung ảnh thật. Bản JPEG nguồn giữ nguyên byte so với ảnh khách cung cấp; PNG xuất ra có pixel khớp phép giảm kích thước từ nguồn. Không tạo hoặc đổi màu ảnh.
- Gỡ nhãn ảnh minh họa/ảnh AI khỏi HTML, alt và caption chi tiết. Quét mã HTML/JS/CSS trong dist không còn các cụm đó. Giá/thông số giả lập vẫn được ghi rõ trong chế độ preview riêng, không hiển thị là tồn kho thật.
- Browser ở desktop 1280 px và mobile 390 px: ảnh đầu trang/câu chuyện tải đúng, không tràn ngang. Trang đăng nhập quản trị mobile dùng bảng màu xanh, hiện form Auth thật. Popup sản phẩm trong chế độ kiểm tra dùng ảnh nhẫn thật và ghi chú ánh sáng/màn hình, không còn ghi chú sai về nguồn ảnh.
- Hướng dẫn ni mở được, vẫn đủ 3 mục và 6 ảnh. Nhóm Zalo và hotline giữ đúng liên kết. Không thay cấu hình Supabase, schema, quyền admin hoặc dữ liệu sản phẩm.
- Tương phản trên nền #fcfbf8: chữ chính 11,27:1, xanh chính 9,02:1, chữ phụ 4,81:1, chữ nghiêng 5,47:1. Đây là kiểm tra bảng màu, không phải tuyên bố audit toàn bộ WCAG.
- `npm test`: 11/11 qua; `npm run check`: qua; `git diff --check`: qua. Không thực hiện đăng nhập hay ghi dữ liệu bằng tài khoản chủ cửa hàng cho thay đổi giao diện này.

## Hướng dẫn ni nhẫn được dựng lại — 26/10/2026

- Hai hình thao tác mới bằng image_gen tích hợp: đo lòng nhẫn và quấn giấy đo ngón tay. Giữ tông xanh/ngà, không chứa chữ hoặc số do AI sinh; bảng và hướng dẫn dùng HTML thật. Ảnh nguồn và prompt cuối lưu trong design/ring-sizing và docs/ring-sizing.md.
- Bảng cũ ghép đường kính 18 mm với chu vi 59–62 mm không được coi là phép quy đổi đúng. Bảng mới có 9 dòng theo mm, chu vi được tính từ π × đường kính và làm tròn 0,1 mm; các cặp đã được khóa bằng kiểm thử giá trị cụ thể. Không chuyển cỡ US/JP thành ni web.
- Module mới được gọi ngay trong hướng dẫn size hiện có. Ba mục và sáu ảnh vòng tay vẫn giữ nguyên, không sửa sản phẩm, dữ liệu hay quyền truy cập. Tất cả các điểm mở hướng dẫn tiếp tục dùng cùng một dialog.
- Browser desktop và mobile 390 px: mục nhẫn mở/đóng được, hai ảnh tải đúng kích thước, có liên kết xem lớn; bảng HTML đủ 9 dòng. Mobile đo được dialog clientWidth = scrollWidth = 328 px; không tràn ngang.
- `npm test`: 13/13 qua, gồm 11 kiểm thử hiện có cùng kiểm tra số liệu và đường nối hướng dẫn mới; kiểm tra cú pháp/tham chiếu tài nguyên qua. Không đăng nhập hoặc ghi database cho thay đổi này.

## Tăng cỡ chữ và cân đối đầu trang — 26/10/2026

- Nâng cỡ chữ ở catalogue, bộ lọc, thông số/giá, chi tiết, hướng dẫn ni, chân trang và quản trị. Giữ nội dung, toàn bộ thao tác, thông số, dữ liệu, liên hệ và phân quyền. Chỉ bỏ ngắt dòng cứng giữa câu mô tả đầu trang, thay bằng ngắt dòng tự nhiên trong CSS; nguyên văn câu vẫn giữ đủ.
- Browser desktop 1280 px, laptop 1024 px, tablet 900 px và điện thoại 390/320 px: không tràn ngang. Ở 320 px sau chỉnh header: root scrollWidth = clientWidth = 305 px (phần còn lại là thanh cuộn); tìm kiếm/lưu món/menu đều còn trong khung. Trang quản trị 320 px cũng bằng 305 px, trường nhập 16 px.
- Kiểm tra với host dữ liệu thử riêng: tìm SKU n188 trả 1 món; popup chi tiết mở được, thông số và giá đọc rõ, không tràn ngang. Không thêm dữ liệu thử vào Supabase. Ở mobile: tên thẻ 18 px, thông số phụ 13 px, giá 15 px, bộ lọc 16 px; mô tả chi tiết và hướng dẫn 16 px.
- Hướng dẫn nhẫn vẫn mở được, bảng đủ 9 dòng; dialog 320 px có clientWidth = scrollWidth = 281 px sau khi nới phần đọc. Các ảnh/hướng dẫn vòng tay và liên kết nhóm/hotline giữ nguyên.
- 13/13 kiểm thử hiện có qua; cú pháp và tham chiếu tài nguyên qua. Không thêm test chỉ để khóa các giá trị CSS; kiểm tra bố cục trực tiếp bằng trình duyệt.

## Sửa huy hiệu nhận diện bị tràn chữ — 26/10/2026

- Nguyên nhân: khung tròn cố định 83–99 px cùng text node/br trong flex column không chứa được chữ lớn hơn. Thay trong đúng thành phần bằng dải nhận diện dưới ảnh, tên và dòng phụ có phần tử/cấp chữ riêng. Bốn quy tắc CSS vòng tròn cũ được thay bởi một bố cục chung; nội dung tên/dòng phụ được giữ đủ, không còn caller nào dùng kiểu huy hiệu cũ.
- Browser desktop 1280 px và mobile 320 px: tên và dòng phụ đều nằm trong dải nhận diện. Mobile: root clientWidth = scrollWidth = 305 px, tên 20 px, toàn bộ chữ nằm trong khung cao tự nhiên 84,4 px. Ảnh không còn bị huy hiệu che, phần nội dung và CTA nhóm Zalo giữ nguyên.
- Kiểm tra cú pháp/tham chiếu tài nguyên và git diff --check qua. Không sửa JavaScript, dữ liệu, phân quyền hoặc chức năng quản trị; không thêm test chỉ sao chép quy tắc CSS.

## Sáu danh mục, bốn khoảng giá và form kiểm định — 26/10/2026

- Cùng sáu loại trên catalogue, tìm kiếm, URL danh mục và quản trị: Vòng chuỗi; Vòng bản; Nhẫn; Mặt dây / Hoa tai; Phụ kiện charm ngọc; Ngọc khác. Giữ mã vong/mat_day cho trách nhiệm đã có, thêm vong_chuoi/charm, không thêm alias cũ/mới.
- Giá được kiểm tra tại 499.999 / 500.000 / 999.999 / 1.000.000 / 1.999.999 / 2.000.000 / 2.000.001 VNĐ: không chồng hoặc thiếu mốc. Đúng 2 triệu nằm trong nhóm 1–2 triệu.
- Bỏ hai ô đơn vị và URL phiếu theo vùng khoanh đỏ, giữ mã phiếu. Đường ghi form duy nhất giữ dữ liệu lab/URL đã lưu khi sửa các ô khác. Kết luận xử lý vẫn cần mã phiếu; constraint HTTPS của tài liệu đang lưu không đổi. Không thay Auth/RLS.
- Thêm bead_diameter_mm riêng cho Vòng chuỗi. Chủ dự án xác nhận ba số 5,8 / 6,5 / 10,2 là đường kính hạt lẻ. Script chuyển danh mục/số đo khóa từng dòng, đối chiếu giá trị đã xác nhận, kiểm tra toàn bộ trường còn lại bằng checksum và rollback cả lô nếu một món đã thay đổi. Test chạy từ schema trước cập nhật, chứng minh dữ liệu không đổi khi nâng schema và các trường khác không đổi khi chuyển hạt.
- Migration schema đã chạy trên Supabase qua TLS xác minh, đủ sáu enum, còn nguyên 3 sản phẩm và chính sách quyền. Probe PostgreSQL thật đạt 39 assertions: admin lưu được Vòng chuỗi/hạt và kết luận với mã phiếu; đường kính hạt không bị trộn với ni; khách/user thường không được ghi; thu hồi quyền hoạt động. Mọi sản phẩm/media QA và thay đổi membership trong probe đều rollback.
- Browser QA dùng repository giả lập trên host cục bộ riêng, không sửa repository thật hay gửi dữ liệu thử lên Supabase: form đủ 6 loại, hai ô đã bỏ không còn trong DOM, sửa hạt 5,8→6,5 và lưu kết luận theo mã phiếu thành công. Catalogue lọc chuỗi <500k đúng một món; 1–2 triệu có cả mốc 2 triệu, trên 2 triệu không chứa mốc đó.
- Mobile 320 px: toàn bộ danh mục xuống dòng, các nút nằm trong khung; root scrollWidth = clientWidth = 305 px. Hướng dẫn chuỗi phân biệt đường kính hạt với ni lòng vòng; các hướng dẫn nhẫn/vòng bản giữ đầy đủ.
- 17/17 kiểm thử tự động qua; kiểm tra cú pháp/tài nguyên và diff qua. Không thử tải media mới hoặc đăng nhập bằng mật khẩu thật của chủ cửa hàng cho lần cập nhật này.

## Size chung và gỡ trích dẫn khỏi giao diện — 26/10/2026

- Mọi danh mục có đúng một ô text Size (mm), không còn các ô ni/hạt/dimensions riêng. Thẻ, chi tiết, quản trị, tìm kiếm và nội dung hỏi món dùng cùng size_mm. Khối thông số chi tiết có một dòng Size (mm), không lặp kích thước.
- Các đoạn nguồn trong hướng dẫn đo ni, nhẫn, chất ngọc và chăm sóc được gỡ. Không còn Tham khảo/tham khảo, Mason-Kay, Tiffany hoặc liên kết GIA trong HTML/JS công khai. Giữ 8 hình, 9 dòng bảng nhẫn, hướng dẫn đo và phần lưu ý độ vừa. Không sửa dấu nguồn bên trong ảnh gốc được cửa hàng cung cấp.
- Migration thêm Size và ghép dữ liệu đang có, kiểm tra checksum toàn bộ trường cũ trừ updated_at; không xóa các cột số đo cũ. Dữ liệu thật vẫn đủ 3 món với Size Hạt 5,8 mm / Hạt 6,5 mm / Hạt 10,2 mm. Timestamp và audit ghi nhận thay đổi schema/data theo cơ chế cũ.
- Kiểm thử từ schema trước cập nhật chứng minh dữ liệu cũ giữ nguyên, retry không hồi sinh Size đã xóa. Client/database tạo cùng chỉ số cho 54, 18,4, 18,45 và tiền tố Ni/Hạt; 54 × 12 × 7 không bị đọc nhầm là ni 54. Bộ lọc ni vẫn trả đúng các món xác định ni.
- 20/20 kiểm thử tự động qua. Probe PostgreSQL thật kiểm tra admin lưu được số đo tự do, chỉnh Size rõ ni cập nhật chỉ số, sửa cột số cũ riêng lẻ bị chặn; quyền khách/user thường và rollback/membership được giữ. Kiểm tra cú pháp/tài nguyên và diff qua.
- Browser QA cục bộ dùng repository giả lập, không ghi hàng thử lên Supabase: sửa Size thành 5,8 / 6,5, lưu và mở lại đúng nguyên văn; DOM chỉ có một input size_mm, không còn ba input cũ. Mobile 390 px hiển thị gọn. Hướng dẫn không còn liên kết nguồn ngoài, đủ 8 hình và 9 dòng bảng. Ảnh form QA chỉ là bằng chứng bố cục trên dữ liệu thử, không phải đăng nhập thực bằng tài khoản cửa hàng.

## Upload ảnh mobile và thông báo kiểm định — 26/10/2026

- Tái hiện được giao diện cũ giữ lỗi thiếu mã sau khi input đã có 256; trong lúc upload chưa xong không có thumbnail/bìa xem trước. Đã sửa phản hồi giao diện, giữ nguyên kiểm tra ảnh hoàn tất và mã kiểm định khi lưu. Không suy đoán nguyên nhân mạng/định dạng trên iPhone chỉ từ screenshot.
- Một PhotoQueue thay đường images cũ, được kiểm tra tương đương cover/order/gallery/max12 trước tích hợp; bổ sung preview ngay, tiến độ, dừng/thử lại, giữ lỗi và không đưa kết quả muộn sang món khác. Transport media có auth/progress/abort và timeout riêng; chuẩn bị ảnh điện thoại trước upload. Video và URL HTTPS giữ nguyên trách nhiệm, bổ sung khôi phục lỗi.
- Browser localhost cách ly: input 256 xóa lỗi cũ; hai ảnh hiện ngay, ảnh đầu tự bìa, chờ tải hoàn tất mới mở Lưu. Đổi bìa/lưu/mở lại giữ đúng URL và 256/A. Mất mạng giả lập, thử lại/dừng/thử lại thành công không cần chọn lại ảnh. Dialog 390 px không tràn ngang; console không có error/warn.
- 27/27 kiểm thử qua; kiểm tra cú pháp/tài nguyên qua. Không đổi schema, Auth/RLS, quyền hoặc dữ liệu thật; không đăng nhập bằng mật khẩu chủ cửa hàng. Chưa kiểm tra trực tiếp chiếc iPhone/Safari của khách. Chi tiết phạm vi và nguồn kỹ thuật ở `mobile-upload.md`.
