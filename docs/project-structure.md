# 專案架構說明文檔

## 概述

本文檔詳細說明苗栗社福促進協會物資管理平台的專案目錄結構、模塊組織方式及各部分的功能職責。

## 專案目錄結構

```
Miaoli/                                 # 專案根目錄
│
├── 📄 index.html                       # 應用程序主頁面
├── 📄 README.md                        # 專案說明文檔
├── 📄 package.json                     # NPM 配置文件
├── 📄 CLAUDE.md                        # Claude Code 開發指南
├── 📄 .gitignore                       # Git 忽略規則
│
├── 📁 assets/                          # 前端資源目錄
│   │
│   ├── 📁 css/                         # 樣式文件目錄
│   │   ├── 📄 main.css                 # 主樣式文件
│   │   ├── 📁 components/              # 組件專用樣式
│   │   │   ├── 📄 modal.css            # 彈窗組件樣式
│   │   │   └── 📄 cards.css            # 卡片組件樣式
│   │   └── 📁 utils/                   # 工具樣式類
│   │       └── 📄 animations.css       # 動畫效果樣式
│   │
│   ├── 📁 js/                          # JavaScript 模塊目錄
│   │   ├── 📄 main.js                  # 應用程序主入口
│   │   ├── 📄 main.legacy.js           # 重構前版本備份
│   │   │
│   │   ├── 📁 config/                  # 配置文件目錄
│   │   │   ├── 📄 constants.js         # 應用常數定義
│   │   │   └── 📄 tailwind-config.js   # Tailwind CSS 配置
│   │   │
│   │   ├── 📁 utils/                   # 工具函數目錄
│   │   │   ├── 📄 dom.js               # DOM 操作工具
│   │   │   ├── 📄 storage.js           # 本地存儲管理
│   │   │   └── 📄 validators.js        # 表單驗證工具
│   │   │
│   │   ├── 📁 services/                # 業務邏輯服務層
│   │   │   ├── 📄 auth.js              # 權限管理服務
│   │   │   ├── 📄 dataManager.js       # 數據管理服務
│   │   │   ├── 📄 uiRenderer.js        # UI 渲染服務
│   │   │   ├── 📄 eventManager.js      # 事件管理服務
│   │   │   ├── 📄 modalManager.js      # 彈窗管理服務
│   │   │   ├── 📄 inventory.js         # 庫存管理服務
│   │   │   ├── 📄 donations.js         # 捐贈管理服務
│   │   │   ├── 📄 distribution.js      # 發放管理服務
│   │   │   └── 📄 formHandler.js       # 表單處理服務
│   │   │
│   │   └── 📁 components/              # UI 組件目錄 (預留)
│   │
│   ├── 📁 images/                      # 圖片資源目錄 (預留)
│   ├── 📁 fonts/                       # 字體文件目錄 (預留)
│   └── 📁 icons/                       # 圖示文件目錄 (預留)
│
├── 📁 public/                          # 公共靜態文件
│   └── 📄 _headers                     # Netlify 部署配置
│
├── 📁 docs/                           # 文檔目錄
│   └── 📄 project-structure.md        # 本文檔
│
├── 📁 components/                     # 共享組件目錄 (預留)
└── 📁 pages/                          # 其他頁面目錄 (預留)
```
