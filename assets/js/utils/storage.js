/**
 * LocalStorage 管理模塊
 */
export const StorageManager = {
    // 基本操作
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`讀取 localStorage 失敗: ${key}`, error);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`儲存到 localStorage 失敗: ${key}`, error);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`刪除 localStorage 失敗: ${key}`, error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空 localStorage 失敗', error);
            return false;
        }
    },
    
    // 專用於物資數據的方法
    getItems() {
        return this.get('charityItems', []);
    },
    
    saveItems(items) {
        return this.set('charityItems', items);
    },
    
    // 備份功能
    backup() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        return data;
    },
    
    restore(data) {
        try {
            this.clear();
            Object.entries(data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
            return true;
        } catch (error) {
            console.error('恢復數據失敗', error);
            return false;
        }
    },
    
    // 數據驗證
    validateItems(items) {
        if (!Array.isArray(items)) {
            return false;
        }
        
        return items.every(item => 
            typeof item === 'object' &&
            typeof item.name === 'string' &&
            typeof item.quantity === 'number' &&
            item.quantity >= 0
        );
    }
};