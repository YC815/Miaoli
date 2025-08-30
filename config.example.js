/**
 * 環境變數配置檔案範例
 * 複製此檔案為 config.js 並填入實際配置
 * 
 * 注意: config.js 檔案會被 .gitignore 忽略，確保敏感資料不會被提交
 */

// 設置環境變數到全域 window 物件
window.ENV_VARS = {
    // Clerk 身份驗證配置
    VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_your-key-here', // 請替換為實際的 key
    
    // 應用環境設定
    NODE_ENV: 'development',
    
    // 應用名稱
    VITE_APP_NAME: '苗栗物資管理平台',
    
    // 功能開關
    VITE_ENABLE_USER_MANAGEMENT: 'true',
    VITE_ENABLE_OFFLINE_MODE: 'true'
};

console.log('📄 環境變數已從 config.js 載入');