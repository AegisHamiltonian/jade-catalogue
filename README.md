# Ngọc Nhà Lyn — catalogue ngọc

Website giới thiệu vòng cẩm thạch, phỉ thúy, nhẫn và mặt ngọc. Khách xem catalogue và [nhóm Zalo Ngọc Nhà Lyn](https://zalo.me/g/bafpcs297); liên hệ trực tiếp qua hotline **0979 628 889**. Không có giỏ hàng, thanh toán, tài khoản khách hoặc cơ chế giữ hàng.

Nhận diện hiện tại dùng logo Lyn do chủ cửa hàng cung cấp, nền ngà, xanh ngọc trầm và ảnh thật do cửa hàng cung cấp. Xem [yêu cầu và quyết định thiết kế](docs/rebrand-lyn.md). Kết nối Supabase và quyền quản trị được giữ nguyên.

Đã kết nối dự án Supabase thật, áp dụng schema/Storage/RLS và cấp quyền cho **tài khoản chủ cửa hàng đã chỉ định**. Tại thời điểm bàn giao database có **0 sản phẩm, 1 admin**; không đưa hàng minh họa vào tồn kho thật. Trang `/admin.html` dùng email/mật khẩu của user được cấp quyền trong Supabase Authentication. Không dùng mật khẩu database.

## Deploy Vercel

Import repo GitHub vào Vercel, chọn Root Directory là thư mục gốc repo (`.`). `vercel.json` đã cấu hình Framework **Other**, xuất bản `dist/` và chạy kiểm tra bằng Node trước khi deploy; không cần cài dependency phát triển lên hosting. Không cần biến môi trường chứa mật khẩu hoặc service key. Khách trên bản Vercel không cần tài khoản ChatGPT.

Sau deploy, mở `/admin.html` để đăng nhập và thêm sản phẩm thật. Không chạy lại SQL khởi tạo trên Supabase hiện tại. Chi tiết tại [hướng dẫn cấu hình](docs/setup.md).

## Chạy tại máy

Yêu cầu Node.js phiên bản LTS còn được hỗ trợ và npm.

```powershell
cd C:\Users\LMC\Desktop\Web\ngan-giang
npm.cmd ci
npm.cmd test
npm.cmd run check
npm.cmd run dev
```

Mở `http://127.0.0.1:4173/`. Trang quản trị: `/admin.html`.

Web phục vụ trực tiếp thư mục `dist/`, không cần build và không cần Node trên hosting. Các dependency trong package.json chỉ dùng khi phát triển, kiểm thử hoặc cấu hình database.

## Dữ liệu và quyền truy cập

- [Đề xuất nghiệp vụ và kiến trúc](docs/architecture.md)
- [Hướng dẫn cấu hình và vận hành](docs/setup.md)
- [Quy chuẩn giao diện và nguồn ảnh](docs/design.md)
- [Đánh giá và cách dùng ảnh hướng dẫn ni](docs/sizing-images.md)
- Schema cho dự án mới: `database/schema.sql`, tiếp theo `database/storage.sql`.
- `dist/config.js` chỉ chứa cấu hình công khai và publishable key. Không chứa mật khẩu Postgres, `service_role`, `sb_secret_` hoặc mật khẩu đăng nhập.
- Trong chế độ `preview`, dữ liệu mẫu được ghi rõ trên màn hình. Trong chế độ `supabase`, lỗi mạng hiển thị lỗi; không thay bằng hàng mẫu.
- Không đăng hàng mẫu vào database thật. Chủ cửa hàng tự thêm ảnh và thông số sản phẩm thật qua trang quản trị.

## Chức năng đã có mã triển khai

Catalogue có tìm kiếm tiếng Việt không dấu và mã SKU, lọc loại/ni/màu/chất/giá/trạng thái, gom đợt đăng hàng, sắp xếp, chi tiết ảnh/video/kiểm định, liên kết trực tiếp từng SKU, lưu món trên thiết bị, sao chép nội dung hỏi món, gọi và mở Zalo.

Quản trị dùng Supabase Auth, kiểm tra quyền từ bảng membership riêng; thêm/sửa/ẩn/xóa sản phẩm; tải ảnh/video và chọn ảnh đại diện; cập nhật hàng sẵn/nhận đặt/hết hàng; chống ghi đè khi hai phiên cùng sửa. Các trigger lưu lịch sử và cập nhật thời gian tại database.

Test thực thi PostgreSQL qua PGlite kiểm tra quyền, constraint, trigger và thu hồi admin. Test REST contract dùng phản hồi giả có kiểm soát; không thay cho kiểm tra tải file/đăng nhập trên dự án Supabase thật. Xem kết quả thực tế và giới hạn tại `docs/verification.md`.

## Tài nguyên

Ảnh đầu trang, câu chuyện và ảnh dùng để kiểm tra giao diện lấy từ bộ ảnh thật do cửa hàng cung cấp. Bản JPEG gốc và danh mục nguồn tại `design/real-photos/`; bản WebP/PNG tại `dist/assets/`. Không tự đưa ảnh nền thành hàng có sẵn. Xem [nguồn ảnh và cách chọn](docs/real-photos.md). Các font Lora và Be Vietnam Pro được phục vụ tại chỗ kèm giấy phép OFL.
