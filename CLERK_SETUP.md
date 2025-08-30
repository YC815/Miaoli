# Clerk 身份驗證設置指南

## 📋 概述

本指南將幫助您為苗栗物資管理平台設置 Clerk 身份驗證系統。

## 🚀 快速開始

### 步驟 1: 建立 Clerk 應用

1. 前往 [Clerk Dashboard](https://dashboard.clerk.com)
2. 註冊或登入您的帳戶
3. 點擊 **"Create application"**
4. 選擇您的應用名稱 (例: "苗栗物資管理平台")
5. 選擇登入選項 (建議: Email + Password)

### 步驟 2: 取得 API Keys

1. 在 Clerk Dashboard 中，前往 **API Keys** 頁面
2. 找到 **Publishable Key**
3. 複製 `pk_test_` 開頭的 key

### 步驟 3: 配置應用

#### 方法 1: 使用 .env 檔案 (推薦)

1. 編輯專案根目錄下的 `.env` 檔案
2. 將您的 Publishable Key 貼到檔案中:

```env
# Clerk Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-actual-key-here
```

#### 方法 2: 直接修改配置檔

編輯 `assets/js/config/clerk-config.js`:

```javascript
export const CLERK_CONFIG = {
    // 將您的 Publishable Key 貼到這裡
    PUBLISHABLE_KEY: 'pk_test_your-actual-key-here', // 替換這裡
    // ... 其他設定保持不變
};
```

**注意**: 使用 .env 檔案更安全，不會意外將 API Key 提交到版本控制系統。

### 步驟 4: 設置用戶角色

#### 在 Clerk Dashboard 中:

1. 前往 **Users** 頁面
2. 選擇要設置角色的用戶
3. 在 **Metadata** 區域點擊 **Edit**
4. 在 **Public metadata** 中添加:

```json
{
  "miaoli_role": "admin"
}
```

#### 可用角色:

- `"volunteer"` - 志工：僅可查看物資庫存
- `"staff"` - 工作人員：可管理物資、捐贈、發放記錄
- `"admin"` - 管理員：完整系統管理權限

### 步驟 5: 測試設置

1. 儲存配置文件後，重新載入網頁
2. 應該看到登入介面而不是直接進入系統
3. 使用您的帳戶登入
4. 檢查右上角是否顯示用戶按鈕
5. 如果是管理員，應該能看到「用戶管理」按鈕

## 🔧 開發模式測試

### 離線測試模式

如果您尚未設置 Clerk，系統會自動進入離線開發模式：

- 控制台會顯示 "🔧 啟動離線開發模式"
- 默認以管理員權限運行
- 適合開發和測試階段使用

### 角色切換測試

管理員可以使用「用戶管理」功能測試不同角色：

1. 以管理員身份登入
2. 點擊「用戶管理」按鈕
3. 使用「測試角色切換」功能
4. 觀察不同角色下的界面變化

## 🎨 自定義外觀

### 修改 Clerk 組件樣式

在 `clerk-config.js` 中，您可以自定義外觀:

```javascript
appearance: {
    baseTheme: 'light',
    variables: {
        colorPrimary: '#16a34a', // 主要色彩 (綠色)
        colorBackground: '#ffffff', // 背景色
        colorText: '#374151', // 文字色
        borderRadius: '0.5rem' // 圓角
    },
    elements: {
        // 自定義特定元素樣式
        card: 'shadow-xl border-0',
        formButtonPrimary: 'bg-green-600 hover:bg-green-700'
    }
}
```

### 本地化設定

支援繁體中文：

```javascript
localization: {
    locale: 'zh-TW'
}
```

## 👥 用戶管理

### 管理員功能

管理員可以：

1. **查看用戶管理界面**
   - 點擊「用戶管理」按鈕
   - 查看角色權限說明
   - 使用測試角色切換

2. **管理用戶角色** (需要後端支持)
   - 目前版本僅支援前端測試
   - 實際部署需要配置 Clerk Backend API

## 🔒 權限控制

### 角色權限對照表

| 功能 | 志工 | 工作人員 | 管理員 |
|------|------|----------|---------|
| 查看物資庫存 | ✅ | ✅ | ✅ |
| 新增物資 | ❌ | ✅ | ✅ |
| 捐贈管理 | ❌ | ✅ | ✅ |
| 發放記錄 | ❌ | ✅ | ✅ |
| 庫存調整 | ❌ | ❌ | ✅ |
| 用戶管理 | ❌ | ❌ | ✅ |

### UI 調整

系統會自動根據用戶角色調整界面：

- **未登入**: 只能查看物資庫存，所有操作按鈕隱藏
- **志工**: 僅顯示庫存標籤頁和搜尋功能
- **工作人員**: 顯示大部分功能，隱藏管理員專用功能
- **管理員**: 顯示所有功能

## 🐛 疑難排解

### 常見問題

**Q: 登入後仍然顯示登入畫面？**

A: 檢查:
1. Publishable Key 是否正確設置
2. 瀏覽器控制台是否有錯誤訊息
3. 網路連線是否正常

**Q: 用戶角色不正確？**

A: 檢查:
1. Clerk Dashboard 中用戶的 public metadata
2. `miaoli_role` 欄位是否正確設置
3. 角色值是否為 `volunteer`, `staff`, 或 `admin`

**Q: 找不到用戶管理按鈕？**

A: 確認:
1. 當前用戶角色是否為 `admin`
2. 是否已成功登入
3. 重新載入頁面試試

### 控制台檢查

開啟瀏覽器開發者工具 (F12)，檢查控制台訊息：

- ✅ `Clerk 身份驗證系統初始化完成` - 表示 Clerk 載入成功
- ✅ `用戶已登入: user@example.com` - 表示登入成功
- ✅ `用戶角色: 管理員` - 表示角色讀取正確

## 📞 技術支援

如遇到問題，請檢查：

1. [Clerk 官方文檔](https://clerk.com/docs)
2. [專案 GitHub Issues](https://github.com/YC815/Miaoli/issues)
3. 瀏覽器控制台錯誤訊息

---

**注意**: 此為前端整合版本，完整的用戶管理功能需要後端 API 支持。當前版本適合快速部署和測試使用。