/**
 * 發放管理模塊
 * 處理物資發放和領取相關的業務邏輯
 */
import { Validators } from '../utils/validators.js';
import { RECIPIENT_UNITS } from '../config/constants.js';

export class DistributionManager {
    constructor(dataManager, uiRenderer) {
        this.dataManager = dataManager;
        this.uiRenderer = uiRenderer;
        this.selectedBatchItems = {};
    }
    
    // 單項物資領取
    async pickupItem(itemIndex, pickupData) {
        try {
            // 驗證領取數據
            const validation = Validators.validatePickup(pickupData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            const item = this.dataManager.getItemByIndex(itemIndex);
            if (!item) {
                throw new Error('找不到指定的物資');
            }
            
            if (pickupData.quantity > item.quantity) {
                throw new Error(`領取數量不能超過庫存數量 (${item.quantity})`);
            }
            
            // 建立領取資訊
            const recipientInfo = this.buildRecipientInfo(pickupData);
            
            // 執行領取操作
            const success = this.dataManager.pickupItem(itemIndex, pickupData.quantity, recipientInfo);
            
            if (success) {
                // 更新UI
                this.uiRenderer.renderItems();
                this.uiRenderer.updateStats();
                
                // 檢查庫存警告
                if (item.quantity - pickupData.quantity <= (item.safetyStock || 5)) {
                    console.warn(`警告: ${item.name} 庫存不足`);
                }
                
                return { 
                    success: true, 
                    message: `成功發放 ${item.name} ${pickupData.quantity} 個給 ${pickupData.recipientUnit}` 
                };
            }
            
            return { success: false, message: '物資領取失敗' };
            
        } catch (error) {
            console.error('物資領取失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 批量物資領取
    async batchPickup(recipientInfo, selectedItems) {
        try {
            // 驗證領取單位資訊
            const recipientValidation = this.validateRecipientInfo(recipientInfo);
            if (!recipientValidation.isValid) {
                throw new Error(recipientValidation.errors.join(', '));
            }
            
            if (Object.keys(selectedItems).length === 0) {
                throw new Error('請至少選擇一項物資');
            }
            
            const results = [];
            const recipientInfoStr = this.buildRecipientInfo(recipientInfo);
            
            // 批量處理每項物資
            for (const [itemIndex, quantity] of Object.entries(selectedItems)) {
                const index = parseInt(itemIndex);
                const qty = parseInt(quantity);
                
                if (qty <= 0) continue;
                
                try {
                    const item = this.dataManager.getItemByIndex(index);
                    if (!item) {
                        results.push({ 
                            success: false, 
                            item: `索引 ${index}`, 
                            message: '找不到物資' 
                        });
                        continue;
                    }
                    
                    if (qty > item.quantity) {
                        results.push({ 
                            success: false, 
                            item: item.name, 
                            message: `數量不足 (庫存: ${item.quantity})` 
                        });
                        continue;
                    }
                    
                    // 執行領取
                    const success = this.dataManager.pickupItem(index, qty, recipientInfoStr);
                    
                    results.push({ 
                        success, 
                        item: item.name, 
                        quantity: qty,
                        message: success ? '發放成功' : '發放失敗' 
                    });
                    
                } catch (error) {
                    results.push({ 
                        success: false, 
                        item: `索引 ${index}`, 
                        message: error.message 
                    });
                }
            }
            
            // 統計結果
            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;
            
            // 更新UI
            this.uiRenderer.renderItems();
            this.uiRenderer.updateStats();
            
            // 清空選擇
            this.selectedBatchItems = {};
            
            return { 
                success: successCount === totalCount,
                message: `批量發放完成: 成功 ${successCount}/${totalCount} 項`,
                results 
            };
            
        } catch (error) {
            console.error('批量領取失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 獲取發放記錄
    getPickupRecords(filters = {}) {
        let records = this.dataManager.getPickupRecords();
        
        // 應用篩選
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            records = records.filter(record => 
                record.itemName.toLowerCase().includes(searchTerm) ||
                record.notes.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filters.dateFrom) {
            records = records.filter(record => 
                new Date(record.date) >= new Date(filters.dateFrom)
            );
        }
        
        if (filters.dateTo) {
            records = records.filter(record => 
                new Date(record.date) <= new Date(filters.dateTo)
            );
        }
        
        if (filters.recipientUnit) {
            records = records.filter(record => 
                this.extractRecipientUnit(record.notes) === filters.recipientUnit
            );
        }
        
        return records;
    }
    
    // 編輯發放記錄
    async editPickupRecord(recordIndex, updatedData) {
        try {
            const records = this.dataManager.getPickupRecords();
            const record = records[recordIndex];
            
            if (!record) {
                throw new Error('找不到指定的發放記錄');
            }
            
            // 驗證更新數據
            const validation = this.validatePickupUpdate(updatedData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // 找到對應的物資項目和操作記錄
            const items = this.dataManager.getAllItems();
            let targetItem = null;
            let targetOperation = null;
            
            for (const item of items) {
                const operation = item.operations.find(op => 
                    op.type === 'pickup' && 
                    op.date === record.date &&
                    item.name === record.itemName
                );
                
                if (operation) {
                    targetItem = item;
                    targetOperation = operation;
                    break;
                }
            }
            
            if (!targetItem || !targetOperation) {
                throw new Error('找不到對應的物資記錄');
            }
            
            // 計算數量差異並調整庫存
            const quantityDifference = updatedData.quantity - record.quantity;
            targetItem.quantity -= quantityDifference; // 發放是減少庫存
            
            if (targetItem.quantity < 0) {
                throw new Error('更新後庫存不能為負數');
            }
            
            // 更新操作記錄
            targetOperation.quantity = updatedData.quantity;
            targetOperation.notes = this.buildRecipientInfo(updatedData);
            targetOperation.lastModified = new Date().toLocaleDateString('zh-TW');
            
            // 更新物資資訊
            targetItem.lastUpdated = new Date().toLocaleDateString('zh-TW');
            
            // 儲存數據
            this.dataManager.saveItems();
            
            // 更新UI
            this.uiRenderer.renderPickupRecords();
            this.uiRenderer.renderItems();
            this.uiRenderer.updateStats();
            
            return { success: true, message: '發放記錄更新成功' };
            
        } catch (error) {
            console.error('編輯發放記錄失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 刪除發放記錄
    async deletePickupRecord(recordIndex) {
        try {
            const records = this.dataManager.getPickupRecords();
            const record = records[recordIndex];
            
            if (!record) {
                throw new Error('找不到指定的發放記錄');
            }
            
            // 確認刪除操作
            const confirmMessage = `確定要刪除此發放記錄嗎？\n物資：${record.itemName}\n數量：${record.quantity}\n日期：${record.date}`;
            if (!confirm(confirmMessage)) {
                return { success: false, message: '取消刪除操作' };
            }
            
            // 找到對應的物資項目
            const items = this.dataManager.getAllItems();
            let targetItem = null;
            let operationIndex = -1;
            
            for (const item of items) {
                const index = item.operations.findIndex(op => 
                    op.type === 'pickup' && 
                    op.date === record.date &&
                    item.name === record.itemName &&
                    op.quantity === record.quantity
                );
                
                if (index !== -1) {
                    targetItem = item;
                    operationIndex = index;
                    break;
                }
            }
            
            if (!targetItem || operationIndex === -1) {
                throw new Error('找不到對應的物資記錄');
            }
            
            // 恢復庫存數量 (刪除發放記錄 = 增加庫存)
            targetItem.quantity += record.quantity;
            
            // 刪除操作記錄
            targetItem.operations.splice(operationIndex, 1);
            targetItem.lastUpdated = new Date().toLocaleDateString('zh-TW');
            
            // 儲存數據
            this.dataManager.saveItems();
            
            // 更新UI
            this.uiRenderer.renderPickupRecords();
            this.uiRenderer.renderItems();
            this.uiRenderer.updateStats();
            
            return { success: true, message: '發放記錄刪除成功' };
            
        } catch (error) {
            console.error('刪除發放記錄失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 匯出發放記錄
    async exportPickupRecords(format = 'csv', filters = {}) {
        try {
            const records = this.getPickupRecords(filters);
            
            if (records.length === 0) {
                throw new Error('沒有符合條件的記錄');
            }
            
            let exportData;
            let filename;
            let mimeType;
            
            switch (format) {
                case 'csv':
                    exportData = this.exportToCSV(records);
                    filename = `發放記錄_${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv;charset=utf-8;';
                    break;
                case 'json':
                    exportData = JSON.stringify(records, null, 2);
                    filename = `發放記錄_${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json;charset=utf-8;';
                    break;
                default:
                    throw new Error('不支援的匯出格式');
            }
            
            // 下載檔案
            this.downloadFile(exportData, filename, mimeType);
            
            return { success: true, message: `成功匯出 ${records.length} 筆記錄` };
            
        } catch (error) {
            console.error('匯出發放記錄失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 獲取發放統計
    getDistributionStats(dateRange = null) {
        const records = this.getPickupRecords(dateRange);
        
        // 按日期統計
        const dailyStats = {};
        // 按單位統計
        const unitStats = {};
        // 按物資統計
        const itemStats = {};
        
        records.forEach(record => {
            // 日期統計
            if (!dailyStats[record.date]) {
                dailyStats[record.date] = { count: 0, quantity: 0 };
            }
            dailyStats[record.date].count++;
            dailyStats[record.date].quantity += record.quantity;
            
            // 單位統計
            const unit = this.extractRecipientUnit(record.notes);
            if (!unitStats[unit]) {
                unitStats[unit] = { count: 0, quantity: 0, items: new Set() };
            }
            unitStats[unit].count++;
            unitStats[unit].quantity += record.quantity;
            unitStats[unit].items.add(record.itemName);
            
            // 物資統計
            if (!itemStats[record.itemName]) {
                itemStats[record.itemName] = { count: 0, quantity: 0, units: new Set() };
            }
            itemStats[record.itemName].count++;
            itemStats[record.itemName].quantity += record.quantity;
            itemStats[record.itemName].units.add(unit);
        });
        
        // 轉換 Set 為 Array
        Object.values(unitStats).forEach(stat => {
            stat.items = Array.from(stat.items);
        });
        Object.values(itemStats).forEach(stat => {
            stat.units = Array.from(stat.units);
        });
        
        return {
            totalRecords: records.length,
            totalQuantity: records.reduce((sum, r) => sum + r.quantity, 0),
            dailyStats,
            unitStats,
            itemStats,
            topItems: this.getTopItems(itemStats, 10),
            topUnits: this.getTopUnits(unitStats, 10)
        };
    }
    
    // 批量選擇管理
    updateBatchSelection(itemIndex, quantity) {
        if (quantity > 0) {
            this.selectedBatchItems[itemIndex] = quantity;
        } else {
            delete this.selectedBatchItems[itemIndex];
        }
    }
    
    clearBatchSelection() {
        this.selectedBatchItems = {};
    }
    
    getBatchSelection() {
        return { ...this.selectedBatchItems };
    }
    
    selectAllAvailableItems() {
        const items = this.dataManager.getAllItems();
        items.forEach((item, index) => {
            if (item.quantity > 0) {
                this.selectedBatchItems[index] = Math.min(item.quantity, item.safetyStock || 5);
            }
        });
    }
    
    // 工具方法
    buildRecipientInfo(recipientData) {
        let unit = recipientData.recipientUnit;
        if (unit === '其他' && recipientData.customUnit) {
            unit = recipientData.customUnit;
        }
        
        let info = unit || '未知單位';
        
        if (recipientData.recipientPhone) {
            info += ` (${recipientData.recipientPhone})`;
        }
        
        if (recipientData.pickupNotes) {
            info += ` - ${recipientData.pickupNotes}`;
        }
        
        return info;
    }
    
    validateRecipientInfo(recipientInfo) {
        const errors = [];
        
        if (Validators.isEmpty(recipientInfo.recipientUnit)) {
            errors.push('領取單位不能為空');
        }
        
        if (recipientInfo.recipientUnit === '其他' && Validators.isEmpty(recipientInfo.customUnit)) {
            errors.push('請輸入自訂單位名稱');
        }
        
        if (recipientInfo.recipientPhone && !Validators.isValidPhone(recipientInfo.recipientPhone)) {
            errors.push('聯絡電話格式不正確');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    validatePickupUpdate(data) {
        const errors = [];
        
        if (!Validators.isValidNumber(data.quantity, 1)) {
            errors.push('領取數量必須是大於0的數字');
        }
        
        if (Validators.isEmpty(data.recipientUnit)) {
            errors.push('領取單位不能為空');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    extractRecipientUnit(notes) {
        const match = notes.match(/^(.+?)(?:\s\(|$)/);
        return match ? match[1] : '未知單位';
    }
    
    extractRecipientPhone(notes) {
        const match = notes.match(/\((.+?)\)/);
        return match ? match[1] : '';
    }
    
    extractNotes(notes) {
        const match = notes.match(/-\s(.+)$/);
        return match ? match[1] : '';
    }
    
    getTopItems(itemStats, limit) {
        return Object.entries(itemStats)
            .sort(([,a], [,b]) => b.quantity - a.quantity)
            .slice(0, limit)
            .map(([name, stats]) => ({ name, ...stats }));
    }
    
    getTopUnits(unitStats, limit) {
        return Object.entries(unitStats)
            .sort(([,a], [,b]) => b.quantity - a.quantity)
            .slice(0, limit)
            .map(([name, stats]) => ({ name, ...stats }));
    }
    
    exportToCSV(records) {
        const headers = ['日期', '物資名稱', '發放數量', '領取單位', '聯絡電話', '用途/備註'];
        const csvContent = [
            headers.join(','),
            ...records.map(record => {
                const unit = this.extractRecipientUnit(record.notes);
                const phone = this.extractRecipientPhone(record.notes);
                const notes = this.extractNotes(record.notes);
                
                return [
                    record.date,
                    record.itemName,
                    record.quantity,
                    unit,
                    phone,
                    notes
                ].map(field => `"${field || ''}"`).join(',');
            })
        ].join('\n');
        
        return '\ufeff' + csvContent; // 添加BOM以支援中文
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}