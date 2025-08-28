/**
 * 數據管理模塊
 */
import { StorageManager } from '../utils/storage.js';
import { Validators } from '../utils/validators.js';
import { INVENTORY_ITEMS_LIST, DEFAULTS, STORAGE_KEYS, OPERATION_TYPES } from '../config/constants.js';

export class DataManager {
    constructor() {
        this.items = [];
        this.init();
    }
    
    // 初始化數據
    init() {
        const storedItems = StorageManager.getItems();
        if (storedItems.length === 0) {
            // 如果沒有存儲數據，初始化預設庫存
            this.items = this.initDefaultInventory();
            this.saveItems();
        } else {
            this.items = storedItems;
        }
    }
    
    // 初始化預設庫存
    initDefaultInventory() {
        return INVENTORY_ITEMS_LIST.map(item => ({
            name: item.name,
            category: item.category,
            barcode: '',
            unit: DEFAULTS.ITEM_UNIT,
            quantity: 0,
            safetyStock: DEFAULTS.SAFETY_STOCK,
            notes: '',
            expiryDate: '',
            createdDate: new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
            lastUpdated: new Date().toLocaleDateString('zh-TW'),
            image: null,
            lineNotify: false,
            operations: []
        }));
    }
    
    // 獲取所有物資
    getAllItems() {
        return [...this.items];
    }
    
    // 根據索引獲取物資
    getItemByIndex(index) {
        return this.items[index] || null;
    }
    
    // 根據名稱查找物資
    findItemByName(name) {
        return this.items.find(item => item.name === name);
    }
    
    // 添加物資操作記錄
    addOperation(itemIndex, operation) {
        if (this.items[itemIndex]) {
            this.items[itemIndex].operations.push({
                ...operation,
                date: new Date().toLocaleDateString('zh-TW'),
                timestamp: Date.now()
            });
            this.items[itemIndex].lastUpdated = new Date().toLocaleDateString('zh-TW');
        }
    }
    
    // 新增物資捐贈
    addDonation(itemData, donorInfo, notes = '') {
        const validation = Validators.validateItem(itemData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const existingIndex = this.items.findIndex(item => item.name === itemData.name);
        
        if (existingIndex !== -1) {
            // 更新現有物資
            const existingItem = this.items[existingIndex];
            existingItem.quantity += itemData.quantity;
            if (itemData.expiryDate) {
                existingItem.expiryDate = itemData.expiryDate;
            }
            
            this.addOperation(existingIndex, {
                type: OPERATION_TYPES.DONATION,
                quantity: itemData.quantity,
                notes: `捐贈者：${donorInfo}${notes ? ` - ${notes}` : ''}`
            });
        } else {
            // 新增物資
            const newItem = {
                name: itemData.name,
                category: this.getItemCategory(itemData.name),
                barcode: '',
                unit: DEFAULTS.ITEM_UNIT,
                quantity: itemData.quantity,
                safetyStock: DEFAULTS.SAFETY_STOCK,
                notes: notes,
                expiryDate: itemData.expiryDate || '',
                createdDate: new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
                lastUpdated: new Date().toLocaleDateString('zh-TW'),
                image: null,
                lineNotify: false,
                operations: [{
                    type: OPERATION_TYPES.DONATION,
                    quantity: itemData.quantity,
                    date: new Date().toLocaleDateString('zh-TW'),
                    notes: `捐贈者：${donorInfo}${notes ? ` - ${notes}` : ''}`,
                    timestamp: Date.now()
                }]
            };
            this.items.push(newItem);
        }
        
        this.saveItems();
        return true;
    }
    
    // 物資領取
    pickupItem(itemIndex, quantity, recipientInfo) {
        const item = this.items[itemIndex];
        if (!item) {
            throw new Error('物資不存在');
        }
        
        if (quantity > item.quantity) {
            throw new Error('領取數量超過庫存');
        }
        
        item.quantity -= quantity;
        this.addOperation(itemIndex, {
            type: OPERATION_TYPES.PICKUP,
            quantity: quantity,
            notes: `發放給：${recipientInfo}`
        });
        
        this.saveItems();
        return true;
    }
    
    // 庫存調整
    adjustStock(itemIndex, newQuantity, reason = '') {
        const item = this.items[itemIndex];
        if (!item) {
            throw new Error('物資不存在');
        }
        
        const oldQuantity = item.quantity;
        const adjustment = newQuantity - oldQuantity;
        
        item.quantity = newQuantity;
        this.addOperation(itemIndex, {
            type: OPERATION_TYPES.ADJUSTMENT,
            quantity: adjustment,
            notes: `庫存調整：${oldQuantity} → ${newQuantity}${reason ? ` (${reason})` : ''}`
        });
        
        this.saveItems();
        return true;
    }
    
    // 更新安全庫存量
    updateSafetyStock(itemIndex, safetyStock) {
        const item = this.items[itemIndex];
        if (!item) {
            throw new Error('物資不存在');
        }
        
        item.safetyStock = safetyStock;
        item.lastUpdated = new Date().toLocaleDateString('zh-TW');
        
        this.saveItems();
        return true;
    }
    
    // 刪除物資
    deleteItem(itemIndex) {
        if (itemIndex >= 0 && itemIndex < this.items.length) {
            this.items.splice(itemIndex, 1);
            this.saveItems();
            return true;
        }
        return false;
    }
    
    // 獲取物資類別
    getItemCategory(itemName) {
        const item = INVENTORY_ITEMS_LIST.find(inv => inv.name === itemName);
        return item ? item.category : '其他類';
    }
    
    // 獲取統計數據
    getStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyDonations = this.items.reduce((count, item) => {
            return count + item.operations.filter(op => {
                if (op.type !== OPERATION_TYPES.DONATION) return false;
                const opDate = new Date(op.date);
                return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
            }).length;
        }, 0);
        
        const monthlyDistributions = this.items.reduce((count, item) => {
            return count + item.operations.filter(op => {
                if (op.type !== OPERATION_TYPES.PICKUP) return false;
                const opDate = new Date(op.date);
                return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
            }).length;
        }, 0);
        
        const lowStockItems = this.items.filter(item => 
            item.quantity > 0 && item.quantity <= (item.safetyStock || DEFAULTS.SAFETY_STOCK)
        ).length;
        
        return {
            totalItems: this.items.length,
            monthlyDonation: monthlyDonations,
            monthlyDistribution: monthlyDistributions,
            lowStock: lowStockItems
        };
    }
    
    // 獲取捐贈記錄
    getDonationRecords() {
        const records = [];
        this.items.forEach(item => {
            item.operations.forEach(op => {
                if (op.type === OPERATION_TYPES.DONATION) {
                    records.push({
                        itemName: item.name,
                        quantity: op.quantity,
                        date: op.date,
                        notes: op.notes,
                        timestamp: op.timestamp || 0
                    });
                }
            });
        });
        
        return records.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // 獲取發放記錄
    getPickupRecords() {
        const records = [];
        this.items.forEach(item => {
            item.operations.forEach(op => {
                if (op.type === OPERATION_TYPES.PICKUP) {
                    records.push({
                        itemName: item.name,
                        quantity: op.quantity,
                        date: op.date,
                        notes: op.notes,
                        timestamp: op.timestamp || 0
                    });
                }
            });
        });
        
        return records.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // 儲存數據
    saveItems() {
        const success = StorageManager.saveItems(this.items);
        if (!success) {
            throw new Error('儲存失敗');
        }
        return true;
    }
    
    // 備份數據
    backup() {
        return StorageManager.backup();
    }
    
    // 恢復數據
    restore(data) {
        const success = StorageManager.restore(data);
        if (success) {
            this.init();
        }
        return success;
    }
}