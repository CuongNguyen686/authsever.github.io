# Cấu hình Firebase đồng bộ Web ↔ Theos

Web và Theos cùng dùng Realtime Database:

`https://sever-key-ngcuong-default-rtdb.asia-southeast1.firebasedatabase.app`

## Luồng dữ liệu

1. Web tạo package → `/packages/{firebaseId}` và sinh `token`; không có trường ID package cũ.
2. Web tạo key → `/keys/{firebaseId}`, tự gắn `packageToken` và `packageName`; trường `package` chỉ giữ token để tương thích dữ liệu cũ.
3. Web sửa/cấm key → Firebase thay đổi ngay.
4. Dashboard đăng ký realtime listener nên bảng tự cập nhật khi dữ liệu đổi.
5. Theos đọc `/keys`, sau đó tìm `/packages` bằng `token`; không query hoặc so sánh ID package cũ.

## Bảo mật

Không nên triển khai Rules `.read: true` và `.write: true` cho production. Đặc biệt không cấp quyền ghi toàn database cho Tweak. Nên giới hạn quyền theo Firebase Auth/custom claims hoặc dùng backend cho các thao tác ghi từ client.
