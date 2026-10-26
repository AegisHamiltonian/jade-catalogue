# Lỗi thêm sản phẩm trên điện thoại — 26/10/2026

## Đã tái hiện

Trên giao diện trước sửa, bấm Lưu khi thiếu ảnh/mã phiếu, rồi nhập mã `256`: input đã chứa mã nhưng editor-message vẫn giữ lỗi thiếu mã. Chọn hai ảnh với upload giả lập chậm: không có thẻ xem trước, vẫn hiện lỗi cũ và chỉ có dòng “Đang tải ảnh 1/2…”. Đây là lỗi phản hồi giao diện. Đọc FormData hiện tại và kiểm tra/lưu lại sau khi tải xong vẫn nhận mã 256 đúng.

Ảnh khách chụp cho thấy upload chưa hoàn tất; riêng ảnh chụp không xác định được nguyên nhân mạng, định dạng hay Storage. Transport cũ có hạn 20 giây cho cả ảnh/video, không có tiến độ hay dừng/thử lại; dễ gây hiểu lầm trên mạng chậm. Không kết luận khách nhập sai hoặc HEIC/4G là nguyên nhân đã được chứng minh.

## Sửa trên đường hoạt động duy nhất

- PhotoQueue sở hữu toàn bộ thứ tự, bìa và trạng thái ảnh. Ảnh đầu tiên hiện preview và nhãn bìa ngay; pending/error không được chuyển thành URL lưu. Lỗi ảnh đầu không âm thầm đổi bìa sang ảnh thứ hai.
- Từng ảnh có chuẩn bị, chờ, phần trăm tải, hoàn tất, lỗi; có thử lại, dừng và gỡ. File đã chọn giữ trong tab, ảnh đã tải thành công không bị gửi lại khi thử ảnh khác. Kết quả muộn sau reset/remove không được ghép vào món khác. Object URL được giải phóng khi gỡ/reset.
- Ảnh điện thoại lớn được đọc bằng bộ giải mã của trình duyệt, giảm cạnh dài về tối đa 2.000 px khi cần, không phóng to. JPEG xuất JPEG; PNG/WebP giữ alpha qua PNG khi cần xử lý. Giới hạn gốc 40 MB/64 MP, tệp cuối 8 MB. HEIC chưa đọc được có lỗi rõ và yêu cầu JPG/PNG; không giả vờ hỗ trợ mọi trình duyệt.
- Media dùng XMLHttpRequest có tiến độ, signal dừng và hạn ảnh 180 giây/video 300 giây. Gửi đủ byte chỉ báo tối đa 99%; chỉ phản hồi 2xx của Storage mới thành công. Giữ nguyên Bearer token, refresh, UUID object path, x-upsert=false, bucket/MIME/size limits và RLS. Video 40 MB, retry và URL HTTPS vẫn hoạt động.
- Sửa input xóa thông báo kiểm tra cũ. Bấm Lưu luôn đọc và kiểm tra lại form hiện tại; mã phiếu vẫn bắt buộc nếu có kết luận xử lý. Form bị khóa trong lúc ghi để tránh mất thay đổi vừa nhập. Không đổi Auth, schema, dữ liệu thật hoặc quyền.

## Bằng chứng kiểm tra

- 27/27 tests qua: 20 tests trước đó cùng 5 hợp đồng hàng đợi ảnh và 2 kiểm tra transport. Các test giữ cover/order/gallery/max12, retry, cancellation, kết quả muộn, auth headers, 2xx confirmation, timeout/network/403 và giới hạn ảnh/video.
- Browser QA cách ly trên localhost, chỉ thay repository bằng fixture trong bộ nhớ, không ghi Supabase: tái hiện lỗi cũ; form mới nhập 256 xóa lỗi cũ, chọn hai ảnh hiện ngay hai preview và bìa, ảnh 1 được chuẩn bị từ 1920×2560 về 1500×2000, phần trăm tải rõ, Lưu khóa khi chưa xong. Đổi bìa, lưu/mở lại giữ đúng URL bìa và mã 256/kết luận A.
- Giả lập mất mạng: ảnh lỗi vẫn còn, Save khóa; thử lại/dừng/thử lại thành công, không cần chọn lại tệp; hai ảnh đã xong giữ nguyên. Dialog mobile 390 px: clientWidth = scrollWidth = 322 px.
- Chưa kiểm thử trực tiếp trên iPhone/Safari của khách. Fixture upload chứng minh UI và hợp đồng; test transport dùng XHR giả lập, không được gọi là upload thực thành công lên Storage production. Không tạo hàng thử hoặc đổi membership thật.

## Nguồn kỹ thuật

- [MDN: XMLHttpRequest upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload): đăng ký listener trước open để tương thích trình duyệt; tiến độ upload khác phản hồi thành công.
- [WebKit Safari 17](https://webkit.org/blog/14205/news-from-wwdc23-webkit-features-in-safari-17-beta/): hỗ trợ ảnh HEIC của Safari; khả năng giải mã vẫn được kiểm tra trên tệp thực tế.
- [Supabase Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads): hướng dẫn upload và tránh ghi đè object. Ảnh thông thường được giảm dung lượng trước khi gửi; video vẫn giữ giới hạn hiện có, không khẳng định đã có resumable upload.
