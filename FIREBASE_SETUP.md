# Cấu hình Firebase đồng bộ Web ↔ Theos

Web và Theos cùng dùng Realtime Database:

`https://sever-key-ngcuong-default-rtdb.asia-southeast1.firebasedatabase.app`

## Luồng dữ liệu

1. Web tạo package → `/packages/{id}` và sinh `token`.
2. Web tạo key → `/keys/{id}`, tự gắn `package`, `packageName`, `packageToken`.
3. Web sửa/cấm key → Firebase thay đổi ngay.
4. Dashboard đăng ký realtime listener nên bảng tự cập nhật khi dữ liệu đổi.
5. Theos đọc `/keys` bằng Firebase REST, kiểm tra key + package + packageToken + status + expiresAt.

## Bảo mật

Không nên triển khai Rules `.read: true` và `.write: true` cho production. Đặc biệt không cấp quyền ghi toàn database cho Tweak. Nên giới hạn quyền theo Firebase Auth/custom claims hoặc dùng backend cho các thao tác ghi từ client.

- `firebase-rules.example.json`: rule mở (chỉ dùng để phát triển/test nhanh), đã bổ sung `.indexOn` cho `keys.key` và `packages.packageId` — hai truy vấn mà `theos/APIClient` dùng (`orderBy="key"`, `orderBy="packageId"`); thiếu index này Firebase vẫn chạy được nhưng sẽ cảnh báo và chậm dần khi dữ liệu lớn.
- `firebase-rules.production.example.json`: rule tham khảo cho production — giữ `.read: true` (Theos cần đọc trực tiếp) nhưng giới hạn `.write` bằng `"auth != null"`. **Lưu ý:** áp dụng rule này đòi hỏi trang quản trị phải đăng nhập Firebase Auth thật (ví dụ email/password hoặc anonymous auth) trước khi ghi — hiện `js/auth.js` chỉ là một lớp "cổng" so khớp chuỗi ở phía client (`ADMIN_GATE_SECRET`), không phải Firebase Auth, nên nếu bật rule này ngay mà chưa thêm đăng nhập Firebase, mọi thao tác ghi (tạo/sửa/xoá key, package, v.v.) trên dashboard sẽ bị Firebase từ chối.
