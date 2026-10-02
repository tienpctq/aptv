# Tích hợp giới hạn tốc độ HERE

Frontend GitHub Pages không nên chứa HERE API key. Repo này có sẵn một Vercel Function tại `api/speed-limit.js`.

## Triển khai

1. Tạo tài khoản HERE Platform và tạo API key.
2. Vào Vercel, chọn **Add New Project** và import repo `tienpctq/aptv`.
3. Trong **Project Settings -> Environment Variables**, thêm:
   - Name: `HERE_API_KEY`
   - Value: API key HERE của bạn.
4. Deploy project.
5. Sau khi Vercel cấp domain, lấy endpoint:
   `https://TEN-DU-AN.vercel.app/api/speed-limit`
6. Mở `config.js` trong repo và điền endpoint đó vào `speedLimitApiUrl`.

Frontend sẽ gửi hai điểm GPS gần nhất đến proxy. Proxy gọi HERE Route Matching với lớp `APPLICABLE_SPEED_LIMIT`, trả về giới hạn tốc độ (km/h), và giao diện APTV dùng giá trị đó để cảnh báo vượt tốc.

## Lưu ý

Dữ liệu bản đồ có thể thiếu hoặc chậm cập nhật. Biển báo thực tế và quy định giao thông tại chỗ vẫn là nguồn ưu tiên.
