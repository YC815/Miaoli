# 🚀 安全設置指南

## ⚡ 快速開始

### 1. 設置環境變數

```bash
# 步驟 1: 編輯 .env 檔案
cp .env.example .env
# 然後編輯 .env，填入您的 Clerk Publishable Key

# 步驟 2: 生成配置檔案
npm run setup

# 步驟 3: 啟動開發環境
npm run dev
```

### 2. 使用 VS Code Live Server 打開

1. 安裝 VS Code Live Server 擴展
2. 右鍵點擊 `index.html`
3. 選擇 "Open with Live Server"

## 🔐 安全原則

### ✅ 正確做法

1. **敏感資料只存在 .env 檔案中**
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```

2. **使用自動化腳本生成配置**
   ```bash
   npm run setup  # 從 .env 生成 config.js
   ```

3. **確保 .gitignore 正確配置**
   - ✅ `.env` 已被忽略
   - ✅ `config.js` 已被忽略

### ❌ 錯誤做法

- ❌ 直接在程式碼中寫入 API Key
- ❌ 將 `.env` 或 `config.js` 提交到版本控制
- ❌ 在生產環境中暴露敏感資訊

## 📂 檔案結構

```
project-root/
├── .env                    # 環境變數（不提交到 git）
├── .env.example           # 環境變數範例
├── config.js              # 自動生成的配置（不提交到 git）
├── config.example.js      # 配置檔案範例
├── scripts/
│   └── generate-config.js # 配置生成腳本
└── assets/js/utils/
    └── env-loader.js      # 環境變數載入器
```

## 🛠️ 可用指令

| 指令 | 說明 |
|------|------|
| `npm run setup` | 從 .env 生成 config.js |
| `npm run dev` | 準備開發環境 |
| `npm run clean` | 清除生成的配置檔案 |
| `npm run reset-env` | 重置 .env 為範例檔案 |

## 🔄 環境變數載入順序

系統會按以下優先順序載入環境變數：

1. **window.ENV_VARS**（如果存在）
2. **config.js** 檔案
3. **localStorage** 中的 DEV_ENV_VARS
4. **預設值**

## 🧪 測試環境變數載入

打開瀏覽器開發者工具，查看控制台：

**成功載入**：
```
📄 環境變數已從 config.js 載入
🔧 載入的環境變數: { VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_ZWxlY3RyaWM...', ... }
```

**載入失敗**：
```
⚠️ config.js 未找到，將嘗試其他方式載入環境變數
⚠️ 無法載入環境變數，使用預設配置
```

## 🚨 故障排除

### Q: npm run setup 執行失敗？

**檢查清單**：
- [ ] Node.js 版本 >= 14
- [ ] .env 檔案存在且格式正確
- [ ] 沒有語法錯誤在 .env 中

### Q: Clerk SDK 載入失敗？

**目前使用的 CDN**：
- `https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js`（支援 CORS）

**如果載入失敗**：
- 檢查網路連線
- 檢查防火牆設置  
- 確認沒有廣告攔截器阻擋 unpkg.com
- 請檢查控制台錯誤訊息並修復 Clerk 配置

### Q: 環境變數沒有載入？

**檢查順序**：
1. 確認 config.js 檔案存在
2. 檢查瀏覽器控制台錯誤
3. 驗證 .env 檔案格式
4. 重新執行 npm run setup

### Q: Clerk 仍然無法初始化？

**除錯步驟**：
1. 檢查 Publishable Key 格式是否正確
2. 確認網路連線
3. 查看 Clerk Dashboard 是否有服務問題
4. 確認 Clerk Publishable Key 完整且有效

## 🔒 生產環境部署

### 部署前檢查

```bash
# 1. 清理開發檔案
npm run clean

# 2. 設置生產環境變數
# 編輯 .env，設置正確的 production keys

# 3. 生成生產配置
npm run build

# 4. 驗證敏感檔案未被包含
git status  # 確保 .env 和 config.js 不在列表中
```

### 服務器配置

1. **靜態檔案服務器**
   - 確保 `.env` 檔案無法被外部訪問
   - 配置適當的 HTTP 頭部

2. **CDN 部署**
   - 只上傳必要的靜態檔案
   - 不要上傳 `.env` 或 `config.js`

## 🔐 安全檢查清單

部署前請確保：

- [ ] `.env` 檔案已在 `.gitignore` 中
- [ ] `config.js` 檔案已在 `.gitignore` 中
- [ ] 沒有硬編碼的 API Key 在程式碼中
- [ ] 生產環境使用正確的 Clerk keys
- [ ] 伺服器正確配置檔案訪問權限
- [ ] 啟用 HTTPS
- [ ] 設置適當的 CSP 頭部

---

**記住**: 永遠不要將包含敏感資訊的檔案提交到版本控制系統！