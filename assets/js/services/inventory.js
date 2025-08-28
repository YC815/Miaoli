/**
 * 庫存管理模塊
 * 處理物資庫存相關的業務邏輯
 */
import { Validators } from '../utils/validators.js';
import { DEFAULTS, ERROR_MESSAGES, INVENTORY_ITEMS_LIST } from '../config/constants.js';

export class InventoryManager {
    constructor(dataManager, uiRenderer) {
        this.dataManager = dataManager;
        this.uiRenderer = uiRenderer;
    }
    
    // 新增物資
    async addItem(itemData, donorInfo, notes = '', lineNotify = false) {
        try {
            // 驗證物資數據
            const validation = Validators.validateItem(itemData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // 添加到數據管理器
            const success = this.dataManager.addDonation(itemData, donorInfo, notes);
            
            if (success) {
                // 更新UI
                this.uiRenderer.renderItems();
                this.uiRenderer.updateStats();
                
                // Line 通知 (如果啟用)
                if (lineNotify) {
                    this.sendLineNotification(itemData, donorInfo);
                }
                
                return { success: true, message: '物資新增成功' };
            }
            
            return { success: false, message: '物資新增失敗' };
            
        } catch (error) {
            console.error('新增物資失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 批量新增物資
    async addItemsBatch(itemsData, donorInfo, notes = '', lineNotify = false) {
        try {
            // 批量驗證
            const batchValidation = Validators.validateItemsBatch(itemsData);
            if (!batchValidation.isValid) {
                throw new Error(batchValidation.errors.join('\n'));
            }
            
            const results = [];
            
            for (const itemData of itemsData) {
                const result = await this.addItem(itemData, donorInfo, notes, false);
                results.push(result);
            }
            
            // 統一更新UI
            this.uiRenderer.renderItems();
            this.uiRenderer.updateStats();
            
            // 統一Line通知
            if (lineNotify) {
                this.sendBatchLineNotification(itemsData, donorInfo);
            }
            
            const successCount = results.filter(r => r.success).length;
            return { 
                success: successCount === itemsData.length, 
                message: `成功新增 ${successCount}/${itemsData.length} 項物資`,
                results 
            };
            
        } catch (error) {
            console.error('批量新增物資失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 編輯物資
    async editItem(itemIndex, itemData, donorInfo, notes = '', lineNotify = false) {
        try {
            const validation = Validators.validateItem(itemData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            const item = this.dataManager.getItemByIndex(itemIndex);
            if (!item) {
                throw new Error('找不到指定的物資');
            }
            
            // 更新物資資料
            item.name = itemData.name;
            item.quantity = itemData.quantity;
            item.expiryDate = itemData.expiryDate || '';
            item.notes = notes;
            item.lineNotify = lineNotify;
            item.lastUpdated = new Date().toLocaleDateString('zh-TW');
            
            // 添加操作記錄
            this.dataManager.addOperation(itemIndex, {
                type: 'edit',
                quantity: itemData.quantity,
                notes: `編輯 - 捐贈者：${donorInfo}${notes ? ` - ${notes}` : ''}`
            });
            
            // 儲存數據
            this.dataManager.saveItems();
            
            // 更新UI
            this.uiRenderer.renderItems();
            this.uiRenderer.updateStats();
            
            return { success: true, message: '物資編輯成功' };
            
        } catch (error) {
            console.error('編輯物資失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 刪除物資
    async deleteItem(itemIndex) {
        try {
            const item = this.dataManager.getItemByIndex(itemIndex);
            if (!item) {
                throw new Error('找不到指定的物資');
            }
            
            const success = this.dataManager.deleteItem(itemIndex);
            
            if (success) {
                // 更新UI
                this.uiRenderer.renderItems();
                this.uiRenderer.updateStats();
                
                return { success: true, message: '物資刪除成功' };
            }
            
            return { success: false, message: '物資刪除失敗' };
            
        } catch (error) {
            console.error('刪除物資失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 庫存調整
    async adjustStock(itemIndex, adjustment, reason = '') {
        try {
            const item = this.dataManager.getItemByIndex(itemIndex);
            if (!item) {
                throw new Error('找不到指定的物資');
            }
            
            const newQuantity = item.quantity + adjustment;
            
            if (newQuantity < 0) {
                throw new Error('調整後庫存不能為負數');
            }
            
            const success = this.dataManager.adjustStock(itemIndex, newQuantity, reason);
            
            if (success) {
                // 更新UI
                this.uiRenderer.renderItems();
                this.uiRenderer.updateStats();
                
                // 檢查庫存警告
                this.checkStockWarnings(item);
                
                return { success: true, message: '庫存調整成功' };
            }
            
            return { success: false, message: '庫存調整失敗' };
            
        } catch (error) {
            console.error('庫存調整失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 更新安全庫存量
    async updateSafetyStock(itemIndex, newSafetyStock) {
        try {
            if (!Validators.isValidNumber(newSafetyStock, 0)) {
                throw new Error('安全庫存量必須是大於等於0的數字');
            }
            
            const success = this.dataManager.updateSafetyStock(itemIndex, newSafetyStock);
            
            if (success) {
                // 更新UI
                this.uiRenderer.renderItems();
                this.uiRenderer.updateStats();
                
                return { success: true, message: '安全庫存量更新成功' };
            }
            
            return { success: false, message: '安全庫存量更新失敗' };
            
        } catch (error) {
            console.error('更新安全庫存量失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 新增自訂庫存品項
    async addCustomInventoryItem(itemName) {
        try {
            if (Validators.isEmpty(itemName)) {
                throw new Error('品項名稱不能為空');
            }
            
            // 檢查是否已存在
            const existingItem = this.dataManager.findItemByName(itemName);
            if (existingItem) {
                throw new Error('此品項已存在');
            }
            
            // 創建新品項
            const newItem = {
                name: itemName,
                category: '自訂類',
                barcode: '',
                unit: DEFAULTS.ITEM_UNIT,
                quantity: 0,
                safetyStock: DEFAULTS.SAFETY_STOCK,
                notes: '自訂品項',
                expiryDate: '',
                createdDate: new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
                lastUpdated: new Date().toLocaleDateString('zh-TW'),
                image: null,
                lineNotify: false,
                operations: [{
                    type: 'create',
                    quantity: 0,
                    date: new Date().toLocaleDateString('zh-TW'),
                    notes: '建立自訂品項',
                    timestamp: Date.now()
                }]
            };
            
            // 添加到數據管理器
            const items = this.dataManager.getAllItems();
            items.push(newItem);
            this.dataManager.saveItems();
            
            // 更新UI
            this.uiRenderer.renderItems();
            this.uiRenderer.updateStats();
            this.uiRenderer.populateCategoryFilter();
            
            return { success: true, message: '自訂品項新增成功' };
            
        } catch (error) {
            console.error('新增自訂品項失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 搜尋物資
    searchItems(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            this.uiRenderer.filterItems({ search: '' });
            return;
        }
        
        this.uiRenderer.filterItems({ search: searchTerm.trim() });
    }
    
    // 檢查庫存警告
    checkStockWarnings(item = null) {
        const items = item ? [item] : this.dataManager.getAllItems();
        const warnings = [];
        
        items.forEach(item => {
            // 庫存不足警告
            if (item.quantity > 0 && item.quantity <= (item.safetyStock || DEFAULTS.SAFETY_STOCK)) {
                warnings.push({
                    type: 'low_stock',
                    item: item.name,
                    message: `${item.name} 庫存不足，目前數量：${item.quantity}`
                });
            }
            
            // 即將過期警告
            if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry <= DEFAULTS.EXPIRY_WARNING_DAYS && daysUntilExpiry > 0) {
                    warnings.push({
                        type: 'expiry_warning',
                        item: item.name,
                        message: `${item.name} 將在 ${daysUntilExpiry} 天後過期`
                    });
                } else if (daysUntilExpiry <= 0) {
                    warnings.push({
                        type: 'expired',
                        item: item.name,
                        message: `${item.name} 已過期`
                    });
                }
            }
        });
        
        return warnings;
    }
    
    // 獲取庫存報表數據
    getInventoryReport() {
        const items = this.dataManager.getAllItems();
        
        return {
            totalItems: items.length,
            totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
            categories: this.getCategoryStats(items),
            lowStockItems: items.filter(item => 
                item.quantity > 0 && item.quantity <= (item.safetyStock || DEFAULTS.SAFETY_STOCK)
            ),
            expiredItems: items.filter(item => {
                if (!item.expiryDate) return false;
                return new Date(item.expiryDate) < new Date();
            }),
            expiringItems: items.filter(item => {
                if (!item.expiryDate) return false;
                const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry <= DEFAULTS.EXPIRY_WARNING_DAYS && daysUntilExpiry > 0;
            })
        };
    }
    
    // 獲取類別統計
    getCategoryStats(items) {
        const categoryStats = {};
        
        items.forEach(item => {
            if (!categoryStats[item.category]) {
                categoryStats[item.category] = {
                    count: 0,
                    quantity: 0
                };
            }
            
            categoryStats[item.category].count++;
            categoryStats[item.category].quantity += item.quantity;
        });
        
        return categoryStats;
    }
    
    // Line 通知功能 (模擬實現)
    async sendLineNotification(itemData, donorInfo) {
        // 實際實現時需要整合Line Notify API
        console.log('Line通知:', `新增物資 ${itemData.name} ${itemData.quantity}個，捐贈者：${donorInfo}`);
    }
    
    async sendBatchLineNotification(itemsData, donorInfo) {
        const itemList = itemsData.map(item => `${item.name} ${item.quantity}個`).join(', ');
        console.log('Line通知:', `批量新增物資：${itemList}，捐贈者：${donorInfo}`);
    }
}