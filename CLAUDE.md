# CLAUDE.md

## Đầu mỗi phiên làm việc

- Đọc `common_errors.md` (nếu có) để tránh lặp lại các lỗi đã gặp.

## Quy trình phát triển: Waterfall

Dự án thực hiện theo mô hình waterfall, lần lượt qua các stage sau.

### Stage 1 — Requirements (đã xong)

- Yêu cầu được mô tả trong `PRD.md`.

### Stage 2 — Thiết kế luồng nghiệp vụ

- Thiết kế luồng nghiệp vụ cho từng chức năng bằng flow chart, dùng cú pháp Mermaid.
- Mỗi chức năng là một file riêng, lưu trong thư mục `design/flows/`.

### Stage 3 — Cài đặt

- Trước khi bắt đầu stage 3: cài đặt các tools và thư viện cần thiết cho dự án.
- Cài đặt lần lượt từng chức năng:
  1. Viết code cho chức năng.
  2. Viết unit test, chạy và đảm bảo tất cả tests đều pass.
  3. Người dùng chạy thử trên trình duyệt; khi người dùng xác nhận thành công mới chuyển sang chức năng tiếp theo.

## Xử lý lỗi

- Mỗi khi gặp lỗi, sau khi giải quyết xong, nhắc người dùng chạy lệnh `/learn-by-mistake` để lưu lỗi vào `common_errors.md`.
