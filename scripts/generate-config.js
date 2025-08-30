#!/usr/bin/env node

/**
 * 自動生成 config.js 檔案的腳本
 * 從 .env 檔案讀取環境變數並生成前端可用的 config.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 讀取 .env 檔案
function loadEnvFile() {
    const envPath = path.join(__dirname, '../.env');
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env 檔案不存在，請先建立 .env 檔案');
        console.log('💡 可以複製 .env.example 為 .env');
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    // 解析 .env 檔案
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=').trim();
                // 移除引號
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                envVars[key.trim()] = value;
            }
        }
    });
    
    return envVars;
}

// 生成 config.js 檔案
function generateConfig() {
    try {
        const envVars = loadEnvFile();
        
        // 檢查必要的環境變數
        if (!envVars.VITE_CLERK_PUBLISHABLE_KEY || 
            envVars.VITE_CLERK_PUBLISHABLE_KEY === 'pk_test_your-key-here' ||
            envVars.VITE_CLERK_PUBLISHABLE_KEY === 'pk_test_your-actual-key-here') {
            console.error('❌ VITE_CLERK_PUBLISHABLE_KEY 未正確設置！');
            console.log('\n📋 請按照以下步驟設置：');
            console.log('1. 前往 https://dashboard.clerk.com/');
            console.log('2. 建立新應用程式或選擇現有的');
            console.log('3. 複製您的 Publishable Key (以 pk_test_ 開頭)');
            console.log('4. 編輯 .env 檔案，取消註解並設置:');
            console.log('   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-actual-key-here');
            console.log('5. 重新執行 npm run setup');
            console.log('\n⚠️  警告: 沒有正確的 Clerk Key，應用程式將無法正常運作！\n');
        } else if (envVars.VITE_CLERK_PUBLISHABLE_KEY) {
            // 驗證 key 格式
            if (!envVars.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_test_') && 
                !envVars.VITE_CLERK_PUBLISHABLE_KEY.startsWith('pk_live_')) {
                console.error('❌ Clerk Publishable Key 格式不正確！');
                console.log('正確格式應該以 pk_test_ 或 pk_live_ 開頭');
                console.log('請檢查您從 Clerk Dashboard 複製的 key 是否正確');
            } else {
                console.log('✅ Clerk Publishable Key 已設置');
            }
        }
        
        // 生成 config.js 內容
        const configContent = `/**
 * 環境變數配置檔案 (自動生成)
 * 此檔案由 scripts/generate-config.js 自動生成
 * 請勿手動編輯，所有更改請在 .env 檔案中進行
 */

// 設置環境變數到全域 window 物件
window.__ENV__ = ${JSON.stringify(envVars, null, 4)};

console.log('📄 環境變數已從 config.js 載入');

// 開發模式下顯示載入的環境變數（隱藏敏感資料）  
if (window.__ENV__.NODE_ENV === 'development') {
    const safeVars = { ...window.__ENV__ };
    if (safeVars.VITE_CLERK_PUBLISHABLE_KEY) {
        safeVars.VITE_CLERK_PUBLISHABLE_KEY = safeVars.VITE_CLERK_PUBLISHABLE_KEY.substring(0, 20) + '...';
    }
    console.log('🔧 載入的環境變數:', safeVars);
}
`;
        
        // 寫入 config.js
        const configPath = path.join(__dirname, '../config.js');
        fs.writeFileSync(configPath, configContent, 'utf8');
        
        console.log('✅ config.js 檔案生成成功');
        console.log('📁 路徑:', configPath);
        
        // 檢查 .gitignore 是否包含 config.js
        const gitignorePath = path.join(__dirname, '../.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            if (!gitignoreContent.includes('config.js')) {
                fs.appendFileSync(gitignorePath, '\n# 自動生成的配置檔案\nconfig.js\n');
                console.log('📝 已將 config.js 添加到 .gitignore');
            }
        }
        
    } catch (error) {
        console.error('❌ 生成 config.js 時發生錯誤:', error.message);
        process.exit(1);
    }
}

// 執行生成
if (import.meta.url === `file://${process.argv[1]}`) {
    generateConfig();
}

export { generateConfig, loadEnvFile };