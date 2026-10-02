# APTV TV Launcher

Bộ này gồm 2 phần:

1. `index.html` + `styles.css` + `app.js` + `channels.json`
   - Trang web giao diện riêng cho TV / remote.
   - Mở bằng trình duyệt trong APTV hoặc trình duyệt tương thích WebKit.
   - Để dùng thật, upload toàn bộ thư mục lên hosting HTTPS.

2. `aptv.m3u`
   - File playlist dùng trực tiếp trong mục Cấu hình/Configuration của APTV.
   - APTV cần link trực tiếp đến file `.m3u` hoặc `.txt`, không phải link trang HTML.

## Cách sửa kênh

Mở `channels.json` và thay `url` bằng các luồng HLS `.m3u8` mà bạn có quyền sử dụng.

Ví dụ:

{
  "id": "vtv1",
  "name": "VTV1",
  "short": "VTV1",
  "group": "Truyền hình",
  "favorite": true,
  "url": "https://example.com/live/vtv1.m3u8"
}

Đồng thời cập nhật `aptv.m3u` nếu muốn APTV đọc trực tiếp playlist.

## Cách tạo link

Sau khi upload, bạn sẽ có hai URL dạng:

- Web launcher:
  https://TEN-MIEN-CUA-BAN/index.html

- Playlist APTV:
  https://TEN-MIEN-CUA-BAN/aptv.m3u

Nếu dùng GitHub Pages, ví dụ:
- https://USERNAME.github.io/aptv-home/
- https://USERNAME.github.io/aptv-home/aptv.m3u

## Lưu ý

- Các URL trong bản mẫu là luồng test công khai để kiểm thử kỹ thuật.
- Hãy thay bằng nguồn mà bạn có quyền sử dụng.
- Một số luồng chặn CORS hoặc yêu cầu header/cookie/token có thể không chạy trong trình duyệt dù vẫn chạy trong player native.
