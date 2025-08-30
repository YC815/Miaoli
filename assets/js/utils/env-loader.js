/**
 * .env 檔案載入工具
 * 前端讀取 .env 檔案並解析環境變數
 */

class EnvLoader {
    constructor() {
        this.env = {};
        this.isLoaded = false;
    }

    /**
     * 載入環境變數
     * @returns {Promise<Object>} 環境變數物件
     */
    async loadEnv() {
        try {
            // 優先從 window.__ENV__ 載入（執行期注入）
            if (typeof window !== 'undefined' && window.__ENV__) {
                console.log('✅ 從 window.__ENV__ 載入環境配置');
                this.env = { ...window.__ENV__ };
                this.isLoaded = true;
                return this.env;
            }

            // 回退：檢查舊格式 window.ENV_VARS（向後兼容）
            if (typeof window !== 'undefined' && window.ENV_VARS) {
                console.log('✅ 從 window.ENV_VARS 載入環境配置');
                this.env = { ...window.ENV_VARS };
                this.isLoaded = true;
                return this.env;
            }

            console.warn('⚠️  環境變數未載入，請確保 config.js 已正確載入');
            return this.loadDefaults();
        } catch (error) {
            console.warn('⚠️  載入環境變數失敗:', error.message);
            return this.loadDefaults();
        }
    }



    /**
     * 載入預設配置
     * @returns {Object} 預設環境變數
     */
    loadDefaults() {
        this.env = {
            NODE_ENV: 'development',
            VITE_APP_NAME: '苗栗物資管理平台',
            VITE_ENABLE_USER_MANAGEMENT: 'true'
        };
        this.isLoaded = true;
        console.warn('⚠️  使用預設配置，Clerk 功能將無法使用');
        return this.env;
    }

    /**
     * 取得環境變數值
     * @param {string} key 環境變數鍵名
     * @param {string} defaultValue 預設值
     * @returns {string} 環境變數值
     */
    get(key, defaultValue = '') {
        return this.env[key] || defaultValue;
    }

    /**
     * 取得布林值環境變數
     * @param {string} key 環境變數鍵名
     * @param {boolean} defaultValue 預設值
     * @returns {boolean} 布林值
     */
    getBoolean(key, defaultValue = false) {
        const value = this.get(key);
        if (!value) return defaultValue;
        return value.toLowerCase() === 'true' || value === '1';
    }

    /**
     * 取得數字值環境變數
     * @param {string} key 環境變數鍵名
     * @param {number} defaultValue 預設值
     * @returns {number} 數字值
     */
    getNumber(key, defaultValue = 0) {
        const value = this.get(key);
        if (!value) return defaultValue;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * 檢查是否已載入
     * @returns {boolean} 是否已載入
     */
    isEnvLoaded() {
        return this.isLoaded;
    }

    /**
     * 取得所有環境變數
     * @returns {Object} 所有環境變數
     */
    getAll() {
        return { ...this.env };
    }
}

// 建立全域實例
const envLoader = new EnvLoader();

// 匯出
export default envLoader;