/**
 * Clerk 身份驗證配置
 * 請在 Clerk Dashboard 中獲取您的 Publishable Key
 */

import envLoader from '../utils/env-loader.js';

export const CLERK_CONFIG = {
    // 從 .env 檔案讀取 Publishable Key
    get PUBLISHABLE_KEY() {
        const envKey = envLoader.get('VITE_CLERK_PUBLISHABLE_KEY');
        if (!envKey || envKey === 'pk_test_your-key-here') {
            console.error('❌ 未設置 Clerk Publishable Key');
            console.log('請在 .env 檔案中設置 VITE_CLERK_PUBLISHABLE_KEY');
            console.log('取得 Key: https://dashboard.clerk.com/last-active?path=api-keys');
            return null;
        }
        return envKey;
    },
    
    // Clerk 載入選項
    LOAD_OPTIONS: {
        // 本地化設定 - 使用繁體中文
        localization: window.ClerkLocalizations?.zhTW || 'zh-TW',
        
        // 外觀配置
        appearance: {
            baseTheme: 'light',
            variables: {
                // 配合現有 Tailwind 色彩主題
                colorPrimary: '#16a34a', // green-600
                colorBackground: '#ffffff',
                colorText: '#374151', // gray-700
                borderRadius: '0.5rem' // rounded-lg
            },
            elements: {
                card: 'shadow-lg border border-gray-200 rounded-lg',
                formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200',
                formFieldInput: 'border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500',
                headerTitle: 'text-xl font-bold text-gray-800',
                headerSubtitle: 'text-gray-600'
            }
        }
    },
    
    // 角色配置對應
    ROLE_MAPPING: {
        // Clerk metadata key 用於存儲角色
        ROLE_KEY: 'miaoli_role',
        
        // 預設角色
        DEFAULT_ROLE: 'volunteer',
        
        // 角色標籤 (用於 UI 顯示)
        ROLE_LABELS: {
            volunteer: '志工',
            staff: '工作人員', 
            admin: '管理員'
        }
    },
    
    // 重定向路徑
    REDIRECT_PATHS: {
        SIGN_IN: '/sign-in',
        SIGN_UP: '/sign-up', 
        AFTER_SIGN_IN: '/',
        AFTER_SIGN_UP: '/'
    }
};

// 開發環境檢查
export const isDevelopment = () => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.port === '8000';
};

// 取得 Clerk Publishable Key
export const getClerkPublishableKey = async () => {
    // 確保環境變數已載入
    if (!envLoader.isEnvLoaded()) {
        await envLoader.loadEnv();
    }
    
    const key = CLERK_CONFIG.PUBLISHABLE_KEY;
    
    // 驗證 key 的有效性
    if (!key || key === 'pk_test_your-key-here' || key === 'undefined') {
        const errorMsg = '❌ Clerk Publishable Key 未設置或無效';
        console.error(errorMsg);
        console.error('請按照以下步驟設置：');
        console.error('1. 前往 https://dashboard.clerk.com/last-active?path=api-keys');
        console.error('2. 複製您的 Publishable Key');
        console.error('3. 在 .env 檔案中設置 VITE_CLERK_PUBLISHABLE_KEY');
        console.error('4. 執行 npm run setup');
        throw new Error(errorMsg);
    }
    
    // 驗證 key 格式
    if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) {
        const errorMsg = '❌ Clerk Publishable Key 格式不正確';
        console.error(errorMsg);
        console.error('正確格式應該以 pk_test_ 或 pk_live_ 開頭');
        throw new Error(errorMsg);
    }
    
    if (isDevelopment()) {
        console.log('🔧 開發模式: 使用 Clerk Publishable Key:', key.substring(0, 20) + '...');
    }
    
    return key;
};

// 取得完整的 Clerk 配置
export const getClerkConfig = async () => {
    try {
        const publishableKey = await getClerkPublishableKey();
        
        // 嘗試取得 zh-TW 語系包
        let localization = 'zh-TW';
        if (window.ClerkLocalizations && window.ClerkLocalizations.zhTW) {
            localization = window.ClerkLocalizations.zhTW;
            console.log('✅ 繁體中文語系載入成功');
        } else {
            console.warn('⚠️ 語系包未載入，使用預設語系標識');
        }
        
        return {
            publishableKey,
            ...CLERK_CONFIG.LOAD_OPTIONS,
            localization
        };
    } catch (error) {
        console.error('❌ 無法取得 Clerk 配置:', error.message);
        throw error;
    }
};