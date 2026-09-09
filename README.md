# Hệ thống quản lý Key — Firebase + Theos

Dashboard tĩnh chạy trên GitHub Pages và dùng Firebase Realtime Database làm nguồn dữ liệu chung. Theos/Tweak đọc và cập nhật trạng thái license trực tiếp từ cùng database.

## Đồng bộ
- Web tạo/sửa/cấm key → Firebase.
- Web tạo/sửa package và token → Firebase.
- Theos xác thực key theo package, token, trạng thái và thời hạn.
- Theos đăng ký thiết bị theo SHA-256(deviceID), kiểm tra `maxDevices`.
- Thiết bị được lưu tại `/keyDevices/{keyId}/{deviceHash}` và mirror tại `/devices/{deviceHash}`.
- Ban thiết bị trên Web có hiệu lực ở lần xác thực Theos kế tiếp.
- Realtime listener của Web tự tải lại dữ liệu khi Firebase thay đổi.

## Firebase
Database: `https://sever-key-ngcuong-default-rtdb.asia-southeast1.firebasedatabase.app`

`js/config.js` chỉ chứa Firebase client config công khai. Không đặt service-account hoặc Admin SDK vào frontend.

## Bảo mật
Nếu dùng trực tiếp Firebase từ Web/Theos, Rules phải được cấu hình phù hợp. Không nên mở toàn bộ `.read` và `.write` trong môi trường production.
