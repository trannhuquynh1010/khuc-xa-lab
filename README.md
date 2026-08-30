# Phòng thí nghiệm Khúc xạ ánh sáng

Ứng dụng một trang cho học sinh nhập lớp, tên nhóm và số liệu thí nghiệm. Hai đồ thị cập nhật ngay trên trình duyệt. Khi gửi, dữ liệu được lưu trong Neon Postgres và hiển thị tại trang `/giao-vien` có mật khẩu.

## Biến môi trường

Sao chép `.env.example` thành `.env.local` và điền:

- `DATABASE_URL`: chuỗi kết nối Neon Postgres.
- `AUTH_SECRET`: chuỗi bí mật dài, ngẫu nhiên để ký phiên đăng nhập.

## Chạy cục bộ

```bash
pnpm install
pnpm dev
```

Các bảng dữ liệu được tạo tự động ở lần lưu/xem đầu tiên.
