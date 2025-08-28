# 苗栗社福促進協會物資管理平台

## 專案簡介

這是一個為苗栗社福促進協會開發的物資管理平台，用於管理慈善物資的捐贈、庫存和發放。該平台由 T-Cross 與苗栗物資共享站合作開發。

## 功能特色

- **物資庫存管理**: 新增、編輯、刪除物資項目
- **捐贈記錄管理**: 記錄捐贈者資訊和捐贈明細
- **發放記錄管理**: 單項和批量物資發放
- **收據生成**: 自動產生捐贈收據並支援列印
- **庫存警告**: 自動監控庫存不足和過期提醒
- **權限管理**: 多層級用戶權限控制
- **響應式設計**: 支援桌面和行動裝置

## 技術架構

### 前端技術
- **HTML5** - 語意化標記
- **Tailwind CSS** - 實用程式優先的CSS框架
- **Vanilla JavaScript** - ES6+模組化程式設計
- **Web Components** - 組件化架構

### 架構模式
- **模組化架構** - 按功能分離的模組系統
- **服務層模式** - 業務邏輯與UI分離
- **事件驅動** - 統一的事件管理系統
- **單頁應用** - SPA架構提供流暢體驗

## 專案結構

\`\`\`
project-root/
├── index.html                 # 主頁面
├── assets/                    # 資源文件
│   ├── css/                  # 樣式文件
│   │   ├── main.css         # 主樣式文件
│   │   ├── components/      # 組件樣式
│   │   └── utils/          # 工具樣式
│   ├── js/                  # JavaScript文件
│   │   ├── main.js         # 應用程序主入口
│   │   ├── components/     # UI組件
│   │   ├── services/       # 業務邏輯服務
│   │   │   ├── auth.js            # 權限管理
│   │   │   ├── dataManager.js     # 資料管理
│   │   │   ├── uiRenderer.js      # UI渲染
│   │   │   ├── eventManager.js    # 事件管理
│   │   │   ├── modalManager.js    # 彈窗管理
│   │   │   ├── inventory.js       # 庫存管理
│   │   │   ├── donations.js       # 捐贈管理
│   │   │   ├── distribution.js    # 發放管理
│   │   │   └── formHandler.js     # 表單處理
│   │   ├── utils/          # 工具函數
│   │   │   ├── dom.js             # DOM操作工具
│   │   │   ├── storage.js         # 存儲管理
│   │   │   └── validators.js      # 表單驗證
│   │   └── config/         # 配置文件
│   │       ├── constants.js       # 常數定義
│   │       └── tailwind-config.js # Tailwind配置
│   ├── images/             # 圖片資源
│   ├── fonts/              # 字體文件
│   └── icons/              # 圖示文件
├── pages/                  # 其他頁面
├── components/             # 共用組件
├── public/                 # 公共文件
└── docs/                  # 文檔
\`\`\`

## 快速開始

### 環境要求
- 現代瀏覽器 (支援ES6+)
- 靜態文件伺服器 (開發用)

### 安裝步驟

1. 複製專案
\`\`\`bash
git clone [repository-url]
cd Miaoli
\`\`\`

2. 啟動開發伺服器
\`\`\`bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx http-server

# 或使用Live Server (VS Code擴充)
\`\`\`

3. 開啟瀏覽器訪問
\`\`\`
http://localhost:8000
\`\`\`

## 使用說明

### 基本操作
1. **新增物資**: 點擊「新增物資」按鈕，填寫捐贈者資訊和物資清單
2. **物資領取**: 在庫存列表中點擊領取按鈕，填寫領取資訊
3. **批量領取**: 使用「批量物資領取」功能一次處理多項物資
4. **查看記錄**: 切換到「捐贈記錄」或「發放記錄」標籤頁查看歷史

### 權限說明
- **志工 (Volunteer)**: 僅能查看物資庫存
- **工作人員 (Staff)**: 可進行物資管理、捐贈和發放操作
- **管理員 (Admin)**: 擁有所有權限，包括庫存調整

## 開發指南

### 代碼規範
- 使用ES6+模組語法
- 遵循單一職責原則
- 採用事件驅動模式
- 優先使用組合而非繼承

### 模組開發
1. **服務模組** (`assets/js/services/`): 業務邏輯實現
2. **工具模組** (`assets/js/utils/`): 通用工具函數
3. **UI組件** (`assets/js/components/`): 可重用的UI元件

### 新功能開發流程
1. 在對應的服務模組中實現業務邏輯
2. 在UI渲染器中新增顯示邏輯
3. 在事件管理器中註冊相關事件
4. 更新配置和常數定義
5. 進行功能測試

## 部署說明

### 靜態部署
專案為純前端應用，可部署到任何靜態主機：
- Netlify
- Vercel
- GitHub Pages
- 任何支援靜態文件的伺服器

### 配置要求
- 支援ES6模組 (需要HTTP/HTTPS協議)
- 正確設定MIME類型
- 確保所有資源路徑可存取

## 貢獻指南

1. Fork 專案
2. 創建功能分支 (\`git checkout -b feature/AmazingFeature\`)
3. 提交更改 (\`git commit -m 'Add some AmazingFeature'\`)
4. 推送到分支 (\`git push origin feature/AmazingFeature\`)
5. 開啟 Pull Request

## 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 聯絡資訊

- **開發團隊**: T-Cross
- **合作夥伴**: 苗栗物資共享站
- **技術支援**: [聯絡方式]

## 更新日誌

### v2.0.0 (重構版)
- ✨ 完整模組化重構
- 🏗️ 分層架構設計
- 🎨 優化使用者體驗
- 📱 改善響應式設計
- 🔧 統一事件管理系統
- 📊 增強統計功能

### v1.0.0 (初始版本)
- 🎉 基本物資管理功能
- 📝 捐贈和發放記錄
- 🖨️ 收據列印功能
- 👥 用戶權限管理