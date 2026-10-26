# Cấu hình và sử dụng cửa hàng

## Trạng thái đã cấu hình cho Ngọc Nhà Lyn

Đã thực hiện các bước khởi tạo bên dưới trên project `rqbyaiqdhbvtssnanoap` ngày 26/10/2026. **Không chạy lại schema.sql hoặc storage.sql trên project này.** Đã tạo bảng, trigger, index, policy, bucket và membership cho tài khoản chủ cửa hàng đã chỉ định. `dist/config.js` đã ở chế độ `supabase`.

Chủ cửa hàng chỉ cần mở `/admin.html`, đăng nhập bằng email đã cấp quyền và mật khẩu đã đặt trong **Supabase Authentication**, rồi đăng ảnh và thông tin hàng thật. Tại thời điểm cấu hình database không có sản phẩm. Mật khẩu Postgres chỉ dùng cho cấu hình qua stdin ẩn, không ghi vào source hoặc cấu hình web.

Kết nối quản trị đã dùng đúng Session pooler `aws-0-ap-northeast-2.pooler.supabase.com:5432`, user `postgres.rqbyaiqdhbvtssnanoap`, xác minh TLS đầy đủ với CA của Supabase. CA công khai được lưu tại `database/certs/supabase-root-2021.crt`, fingerprint SHA-256 `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`. Không thay đổi trust store hệ thống. [Supabase — SSL](https://supabase.com/docs/guides/platform/ssl-enforcement)

Các bước tiếp theo là tài liệu tái lập cho **dự án mới khác**, không phải yêu cầu phải làm lại trên database đang chạy.

## 1. Khởi tạo Supabase

Dùng một dự án mới hoặc đã được kiểm tra không có bảng sản phẩm. Không chạy schema tạo mới trên dự án có dữ liệu cùng tên. Trong SQL Editor, chạy theo thứ tự:

1. `database/schema.sql`
2. `database/storage.sql`

Hai file tạo bảng, enum, index, trigger, audit, RLS và bucket `product-media`. File schema là migration khởi tạo chạy một lần; không phải script reset dữ liệu. Nếu cần sửa hệ thống đang chạy, viết migration ALTER có kiểm tra dữ liệu riêng.

Có công cụ `node scripts/database.mjs inspect|apply|verify|grant-admin|probe` cho cấu hình bằng Postgres. Công cụ chỉ nhận JSON qua stdin ẩn và luôn xác minh TLS; không đưa password vào dòng lệnh hay file. `probe` cần email admin, luôn rollback transaction và kiểm tra không để lại dữ liệu. Direct connection cần IPv6; máy IPv4 dùng đúng **Connect → Session pooler** do dashboard cung cấp. Không tự đoán host pooler theo khu vực.

## 2. Tạo tài khoản chủ cửa hàng

Trong **Authentication → Users → Add user**, tạo tài khoản email/password cho chủ cửa hàng. Chủ cửa hàng tự giữ mật khẩu. Không dùng tài khoản hoặc mật khẩu Postgres để đăng nhập trang web.

Lấy UUID đúng user trong Authentication rồi chạy trong SQL Editor:

```sql
insert into private.shop_admins(user_id)
values ('THAY_BANG_UUID_USER_THAT')
on conflict(user_id) do nothing;
```

Không lấy UUID người dùng do trình duyệt tự khai để cấp quyền. Chỉ người có quyền database được thêm membership. Để thu hồi:

```sql
delete from private.shop_admins
where user_id = 'THAY_BANG_UUID_CAN_THU_HOI';
```

Không có luồng đăng ký khách trên web. Có thể tắt **Allow new users to sign up** trong cấu hình Supabase Auth nếu dự án chỉ phục vụ tài khoản do chủ dự án tạo. Dù signup đang bật, người đăng ký mới không có membership và không có quyền ghi.

## 3. Kết nối web

Sửa `dist/config.js`:

```js
export const config = Object.freeze({
  brand: 'Ngọc Nhà Lyn',
  phone: '0979628889',
  zaloGroupUrl: 'https://zalo.me/g/bafpcs297',
  dataSource: 'supabase',
  supabaseUrl: 'https://PROJECT_REF.supabase.co',
  supabasePublishableKey: 'sb_publishable_...',
  mediaBucket: 'product-media',
});
```

URL và publishable key là cấu hình công khai. Không đặt mật khẩu database, access token của CLI, `service_role` hoặc `sb_secret_` vào `dist/`. Không cần chạy `supabase login` hay link CLI chỉ để website đọc API; chỉ cần các lệnh đó nếu dùng quy trình CLI quản lý migration.

Chạy test, kiểm tra file, rồi tải thư mục `dist/` lên static hosting HTTPS. Đường dẫn quản trị là `/admin.html`. Trang quản trị dùng token theo phiên tab; tải lại trang yêu cầu đăng nhập lại.

## 4. Đăng và quản lý sản phẩm

1. Đăng nhập trang quản trị bằng email/password đã tạo trong Supabase Auth.
2. Bấm **Đăng món mới**, nhập mã SKU, tên, loại, giá nguyên VNĐ, ngày lên hàng và trạng thái.
3. Với nhẫn/vòng, nhập đường kính trong theo **mm**. Với mặt dây/ngọc khác, ni được bỏ trống. Ghi kích thước bản và dáng bầu nếu có trong phần kích thước.
4. Thêm ảnh thật. Chọn ảnh đại diện; có thể gỡ ảnh khỏi sản phẩm hoặc đổi thứ tự bằng nút đặt đại diện. Gỡ ảnh không xóa file nguồn trong kho.
5. Nếu có video, tải MP4/WebM hoặc nhập URL HTTPS trỏ trực tiếp file video. Không dùng link trang YouTube như URL file MP4.
6. Ghi mô tả vân, bề mặt, lưu ý và thông tin kiểm định. Chỉ chọn kết luận xử lý khi có đủ đơn vị, mã phiếu và liên kết ảnh phiếu.
7. Bật **Hiển thị trên catalogue** nếu muốn công bố; tắt để giữ sản phẩm trong trang quản trị.
8. Bấm Lưu. Mở catalogue để kiểm tra ảnh, giá, ni và trạng thái.
9. Sau giao dịch qua Zalo, sửa sang **Đã hết hàng**. Có thể để công bố như một mẫu đã bán hoặc ẩn.

Khi có thông báo “đã thay đổi ở nơi khác”, tải lại danh sách rồi sửa trên bản mới. Không bấm nhiều lần để ghi đè phiên khác.

Mã sản phẩm phân biệt với tên: không dùng lại cùng mã cho món mới khác. Không đưa thông tin khách, địa chỉ giao hàng hay chứng từ cá nhân vào mô tả/ảnh public.

## 5. Kiểm tra trên dự án thật trước khi dùng

- Khách không đăng nhập chỉ đọc được sản phẩm công bố.
- Một user thường không thể POST/PATCH/DELETE sản phẩm và không upload media, kể cả qua API.
- User chủ cửa hàng thêm/sửa/ẩn/đổi trạng thái/tải ảnh được; tải lại trang và đăng nhập lại vẫn thấy dữ liệu.
- Sau thu hồi membership, request tiếp theo không ghi được.
- Các nút Zalo mở đúng nhóm `https://zalo.me/g/bafpcs297`; sao chép mã và URL rồi dán vào nhóm khi người dùng muốn hỏi. Liên hệ trực tiếp dùng hotline `0979628889`. Không gửi tin nhắn tự động.
- Không chuyển dữ liệu minh họa thành hàng đang bán. Nếu database chưa có sản phẩm, catalogue thật phải hiện trạng thái trống rõ ràng.

## 6. Vận hành

Chủ cửa hàng chịu trách nhiệm cập nhật tình trạng sau giao dịch qua Zalo. Lưu bản sao database/media theo nhu cầu của cửa hàng; không coi private.product_audit là bản backup thay thế. Theo dõi quota Supabase, lỗi API và tệp tải lên để xử lý lỗi sớm.

Nếu đã chia sẻ mật khẩu database trong chat hoặc nơi không chủ đích, đổi mật khẩu trong Supabase sau cấu hình và kiểm tra lại kết nối vận hành. Website không phụ thuộc mật khẩu database, nên thay mật khẩu không làm thay đổi publishable key trong web.

## 7. Triển khai trên Vercel từ GitHub

1. Vào Vercel → Add New Project → Import Git Repository, chọn repo `jade-catalogue`.
2. Root Directory: `.` (gốc repo). Giữ cấu hình từ `vercel.json`: Framework Other, build `node scripts/check.mjs`, Output Directory `dist`, bỏ bước install vì frontend không cần dependency khi chạy.
3. Không thêm database password, service key hoặc Supabase CLI access token vào Vercel. Cấu hình công khai đã có trong `dist/config.js`; RLS bảo vệ quyền ghi tại database.
4. Deploy. Mở trang chủ, kiểm tra catalogue đọc được Supabase, nút Zalo vào đúng nhóm và hotline gọi đúng số cửa hàng.
5. Mở `/admin.html`, đăng nhập bằng tài khoản Auth được cấp quyền rồi đăng ảnh và thông tin món đầu tiên.

Bản Vercel dùng HTTPS và Supabase Auth trực tiếp, không dùng cổng đăng nhập ChatGPT của bản xem thử Sites. Metadata `.openai/hosting.json` chỉ ghi nhận bản xem thử riêng tư đã tạo, Vercel không sử dụng file đó. Toàn bộ chức năng chạy từ `dist/` và cùng nguồn dữ liệu Supabase.

Tham khảo cấu hình chính thức: [Vercel — vercel.json](https://vercel.com/docs/project-configuration/vercel-json).
