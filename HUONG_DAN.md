# Hướng dẫn Shelby Quickstart - Từ đầu đến cuối

## ✅ Đã hoàn thành (tự động)

1. **Cài đặt Node.js** – v22.20.0 ✓
2. **Cài đặt dependencies** – `npm install` ✓
3. **Build project** – `npm run build` ✓
4. **Cài đặt Shelby CLI** – v0.0.26 ✓
5. **Khởi tạo Shelby** – `shelby init --setup-default` ✓
6. **Tạo file .env** – Đã tạo từ config Shelby ✓
7. **Sửa hỗ trợ Windows** – `env-check.ts` dùng `where` thay `which` ✓

## ⏳ Bạn cần làm: Nạp tiền (Fund)

Trước khi upload blob, cần nạp **ShelbyUSD** và **APT** vào tài khoản:

**Địa chỉ của bạn:** `0xfd578a72c5d264bf65e0aa94b95983b52dc20649bd3bc07bc883261a5f3b4a27`

1. **ShelbyUSD** (để upload):  
   👉 [Faucet Shelby](https://docs.shelby.xyz/apis/faucet/shelbyusd?address=0xfd578a72c5d264bf65e0aa94b95983b52dc20649bd3bc07bc883261a5f3b4a27)

2. **APT** (phí gas):  
   👉 [Faucet Aptos](https://docs.shelby.xyz/apis/faucet/aptos?address=0xfd578a72c5d264bf65e0aa94b95983b52dc20649bd3bc07bc883261a5f3b4a27)

Hoặc chạy: `shelby faucet` để mở trang faucet.

---

## 📋 Các lệnh bạn có thể dùng

| Lệnh | Mô tả |
|------|--------|
| `npm run list` | Xem danh sách blob (đã test ✓) |
| `npm run upload` | Upload file lên Shelby (cần nạp tiền trước) |
| `npm run download` | Tải blob về máy |
| `npm run config` | Tạo lại .env (interactive) |
| `npm start` | Chạy demo upload→list→download whitepaper.pdf |
| `npm run dev` | Build tự động khi sửa code |

---

## 📁 Cấu trúc file

```
assets/           → File mẫu (whitepaper.pdf, datacenter.jpg, hacker.jpg)
src/
  index.ts        → Demo round-trip whitepaper
  guide/
    config.ts     → npm run config
    upload.ts     → npm run upload
    download.ts   → npm run download
    list.ts       → npm run list
.env              → Cấu hình (đã tạo)
```

---

## ⚠️ Lưu ý

- **Aptos CLI:** Chưa cài được (lỗi PowerShell). Không bắt buộc — bạn có thể nạp tiền qua web faucet.
- **API key mặc định:** Có giới hạn rate. Lấy API key riêng tại: https://docs.shelby.xyz/sdks/typescript/acquire-api-keys
- **Private key:** Chỉ dùng cho dev. Không dùng ví chính với tiền thật.
