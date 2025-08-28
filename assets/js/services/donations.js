/**
 * 捐贈管理模塊
 * 處理捐贈記錄和收據生成相關功能
 */
import { Validators } from '../utils/validators.js';
import { DONATION_TYPES } from '../config/constants.js';

export class DonationsManager {
    constructor(dataManager, uiRenderer) {
        this.dataManager = dataManager;
        this.uiRenderer = uiRenderer;
    }
    
    // 獲取捐贈記錄
    getDonationRecords(filters = {}) {
        let records = this.dataManager.getDonationRecords();
        
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
        
        if (filters.donationType) {
            records = records.filter(record => 
                this.extractDonationType(record.notes) === filters.donationType
            );
        }
        
        return records;
    }
    
    // 編輯捐贈記錄
    async editDonationRecord(recordIndex, updatedData) {
        try {
            const records = this.dataManager.getDonationRecords();
            const record = records[recordIndex];
            
            if (!record) {
                throw new Error('找不到指定的捐贈記錄');
            }
            
            // 驗證更新數據
            const validation = this.validateDonationUpdate(updatedData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // 找到對應的物資項目和操作記錄
            const items = this.dataManager.getAllItems();
            let targetItem = null;
            let targetOperation = null;
            
            for (const item of items) {
                const operation = item.operations.find(op => 
                    op.type === 'donation' && 
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
            
            // 更新庫存數量 (先減去舊數量，再加上新數量)
            const quantityDifference = updatedData.quantity - record.quantity;
            targetItem.quantity += quantityDifference;
            
            if (targetItem.quantity < 0) {
                throw new Error('更新後庫存不能為負數');
            }
            
            // 更新操作記錄
            targetOperation.quantity = updatedData.quantity;
            targetOperation.notes = this.buildDonationNotes(updatedData);
            targetOperation.lastModified = new Date().toLocaleDateString('zh-TW');
            
            // 更新物資資訊
            targetItem.lastUpdated = new Date().toLocaleDateString('zh-TW');
            
            // 儲存數據
            this.dataManager.saveItems();
            
            // 更新UI
            this.uiRenderer.renderDonationRecords();
            this.uiRenderer.renderItems();
            this.uiRenderer.updateStats();
            
            return { success: true, message: '捐贈記錄更新成功' };
            
        } catch (error) {
            console.error('編輯捐贈記錄失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 刪除捐贈記錄
    async deleteDonationRecord(recordIndex) {
        try {
            const records = this.dataManager.getDonationRecords();
            const record = records[recordIndex];
            
            if (!record) {
                throw new Error('找不到指定的捐贈記錄');
            }
            
            // 找到對應的物資項目
            const items = this.dataManager.getAllItems();
            let targetItem = null;
            let operationIndex = -1;
            
            for (const item of items) {
                const index = item.operations.findIndex(op => 
                    op.type === 'donation' && 
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
            
            // 確認刪除操作
            const confirmMessage = `確定要刪除此捐贈記錄嗎？\n物資：${record.itemName}\n數量：${record.quantity}\n日期：${record.date}`;
            if (!confirm(confirmMessage)) {
                return { success: false, message: '取消刪除操作' };
            }
            
            // 調整庫存數量
            targetItem.quantity -= record.quantity;
            
            if (targetItem.quantity < 0) {
                throw new Error('刪除後庫存不能為負數，請先處理相關發放記錄');
            }
            
            // 刪除操作記錄
            targetItem.operations.splice(operationIndex, 1);
            targetItem.lastUpdated = new Date().toLocaleDateString('zh-TW');
            
            // 如果物資沒有其他記錄且數量為0，詢問是否刪除物資項目
            if (targetItem.operations.length === 0 && targetItem.quantity === 0) {
                const deleteItem = confirm('此物資沒有其他記錄且庫存為0，是否一併刪除物資項目？');
                if (deleteItem) {
                    const itemIndex = items.findIndex(item => item === targetItem);
                    this.dataManager.deleteItem(itemIndex);
                }
            }
            
            // 儲存數據
            this.dataManager.saveItems();
            
            // 更新UI
            this.uiRenderer.renderDonationRecords();
            this.uiRenderer.renderItems();
            this.uiRenderer.updateStats();
            
            return { success: true, message: '捐贈記錄刪除成功' };
            
        } catch (error) {
            console.error('刪除捐贈記錄失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 生成捐贈收據
    async generateReceipt(recordIndices) {
        try {
            const records = this.dataManager.getDonationRecords();
            const selectedRecords = recordIndices.map(index => records[index]).filter(Boolean);
            
            if (selectedRecords.length === 0) {
                throw new Error('沒有選擇任何記錄');
            }
            
            // 按捐贈者分組
            const groupedRecords = this.groupRecordsByDonor(selectedRecords);
            
            // 生成收據HTML
            const receiptsHTML = Object.entries(groupedRecords).map(([donorInfo, donorRecords]) => 
                this.generateReceiptHTML(donorInfo, donorRecords)
            ).join('<div style="page-break-after: always;"></div>');
            
            // 開啟列印預覽
            this.openPrintPreview(receiptsHTML);
            
            return { success: true, message: '收據生成成功' };
            
        } catch (error) {
            console.error('生成收據失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 按捐贈者分組記錄
    groupRecordsByDonor(records) {
        const grouped = {};
        
        records.forEach(record => {
            const donorInfo = this.extractDonorInfo(record.notes);
            const key = `${donorInfo.name}_${donorInfo.phone}_${donorInfo.address}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    donor: donorInfo,
                    records: []
                };
            }
            
            grouped[key].records.push(record);
        });
        
        return grouped;
    }
    
    // 生成收據HTML
    generateReceiptHTML(donorKey, groupData) {
        const { donor, records } = groupData;
        const totalItems = records.length;
        const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0);
        
        return `
            <div class="receipt-page" style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: 'Microsoft JhengHei', Arial, sans-serif;">
                <div class="receipt-header" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                    <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">苗栗社福促進協會</h1>
                    <h2 style="color: #666; font-size: 20px; margin-bottom: 5px;">愛心物資捐贈收據</h2>
                    <p style="color: #888; font-size: 14px;">T-Cross x苗栗物資共享站</p>
                </div>
                
                <div class="receipt-content" style="margin-bottom: 30px;">
                    <div class="donor-info" style="margin-bottom: 25px; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #333; font-size: 16px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">捐贈者資訊</h3>
                        <table style="width: 100%; font-size: 14px; line-height: 1.6;">
                            <tr>
                                <td style="width: 80px; color: #666; font-weight: bold;">姓名/抬頭：</td>
                                <td style="color: #333;">${donor.name || '未提供'}</td>
                            </tr>
                            <tr>
                                <td style="color: #666; font-weight: bold;">電話/統編：</td>
                                <td style="color: #333;">${donor.phone || '未提供'}</td>
                            </tr>
                            <tr>
                                <td style="color: #666; font-weight: bold;">地址：</td>
                                <td style="color: #333;">${donor.address || '未提供'}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="donation-items" style="margin-bottom: 25px;">
                        <h3 style="color: #333; font-size: 16px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">捐贈明細</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background-color: #f1f5f9;">
                                    <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: left; color: #666;">捐贈日期</th>
                                    <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: left; color: #666;">物資名稱</th>
                                    <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: center; color: #666;">數量</th>
                                    <th style="border: 1px solid #ddd; padding: 12px 8px; text-align: left; color: #666;">備註</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${records.map(record => `
                                    <tr>
                                        <td style="border: 1px solid #ddd; padding: 10px 8px; color: #333;">${record.date}</td>
                                        <td style="border: 1px solid #ddd; padding: 10px 8px; color: #333; font-weight: 500;">${record.itemName}</td>
                                        <td style="border: 1px solid #ddd; padding: 10px 8px; text-align: center; color: #333; font-weight: bold;">${record.quantity}</td>
                                        <td style="border: 1px solid #ddd; padding: 10px 8px; color: #666; font-size: 12px;">${this.extractNotes(record.notes)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="summary" style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                        <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: bold;">
                            總計：${totalItems} 項物資，共 ${totalQuantity} 個單位
                        </p>
                    </div>
                </div>
                
                <div class="receipt-footer" style="border-top: 2px solid #333; padding-top: 20px; text-align: center;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                        <div style="text-align: left;">
                            <p style="margin-bottom: 40px; color: #666; font-size: 14px;">開立日期：${new Date().toLocaleDateString('zh-TW')}</p>
                            <div style="border-top: 1px solid #666; width: 150px; text-align: center; padding-top: 5px; color: #666; font-size: 12px;">
                                捐贈者簽名
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin-bottom: 40px; color: #666; font-size: 14px;">收據編號：${this.generateReceiptNumber()}</p>
                            <div style="border-top: 1px solid #666; width: 150px; text-align: center; padding-top: 5px; color: #666; font-size: 12px;">
                                機構代表簽章
                            </div>
                        </div>
                    </div>
                    <p style="color: #888; font-size: 12px; margin-bottom: 10px;">
                        感謝您的愛心捐贈，您的善舉將幫助更多需要幫助的人
                    </p>
                    <p style="color: #888; font-size: 12px;">
                        苗栗社福促進協會 | 聯絡電話: (037) 123-4567 | 地址: 苗栗縣苗栗市中正路123號
                    </p>
                </div>
            </div>
        `;
    }
    
    // 開啟列印預覽
    openPrintPreview(receiptsHTML) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>愛心物資捐贈收據</title>
                <style>
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                    body { font-family: 'Microsoft JhengHei', Arial, sans-serif; }
                </style>
            </head>
            <body>
                <div class="no-print" style="text-align: center; padding: 20px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
                    <button onclick="window.print()" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">列印收據</button>
                    <button onclick="window.close()" style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">關閉預覽</button>
                </div>
                ${receiptsHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    // 匯出捐贈記錄
    async exportDonationRecords(format = 'csv', filters = {}) {
        try {
            const records = this.getDonationRecords(filters);
            
            if (records.length === 0) {
                throw new Error('沒有符合條件的記錄');
            }
            
            let exportData;
            let filename;
            let mimeType;
            
            switch (format) {
                case 'csv':
                    exportData = this.exportToCSV(records);
                    filename = `捐贈記錄_${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv;charset=utf-8;';
                    break;
                case 'json':
                    exportData = JSON.stringify(records, null, 2);
                    filename = `捐贈記錄_${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json;charset=utf-8;';
                    break;
                default:
                    throw new Error('不支援的匯出格式');
            }
            
            // 下載檔案
            this.downloadFile(exportData, filename, mimeType);
            
            return { success: true, message: `成功匯出 ${records.length} 筆記錄` };
            
        } catch (error) {
            console.error('匯出捐贈記錄失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 工具方法
    validateDonationUpdate(data) {
        const errors = [];
        
        if (!Validators.isValidNumber(data.quantity, 1)) {
            errors.push('捐贈數量必須是大於0的數字');
        }
        
        if (Validators.isEmpty(data.donor)) {
            errors.push('捐贈者不能為空');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    buildDonationNotes(data) {
        return `捐贈者：${data.donor}${data.phone ? ` (${data.phone})` : ''}${data.address ? ` - ${data.address}` : ''}${data.notes ? ` - ${data.notes}` : ''}`;
    }
    
    extractDonorInfo(notes) {
        const match = notes.match(/捐贈者：(.+?)(?:\s\((.+?)\))?(?:\s-\s(.+?))?(?:\s-\s|$)/);
        if (match) {
            return {
                name: match[1] || '',
                phone: match[2] || '',
                address: match[3] || ''
            };
        }
        return { name: '', phone: '', address: '' };
    }
    
    extractDonationType(notes) {
        // 簡單的類型推斷邏輯，可根據需要擴展
        if (notes.includes('企業') || notes.includes('公司')) {
            return 'corporate';
        } else if (notes.includes('指定')) {
            return 'designated';
        } else {
            return 'donation';
        }
    }
    
    extractNotes(notes) {
        const match = notes.match(/(?:-\s(.+))?$/);
        return match && match[1] ? match[1] : '';
    }
    
    generateReceiptNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = Date.now().toString().slice(-6);
        
        return `MLS${year}${month}${day}${timestamp}`;
    }
    
    exportToCSV(records) {
        const headers = ['日期', '物資名稱', '數量', '捐贈者', '聯絡方式', '備註'];
        const csvContent = [
            headers.join(','),
            ...records.map(record => {
                const donor = this.extractDonorInfo(record.notes);
                return [
                    record.date,
                    record.itemName,
                    record.quantity,
                    donor.name,
                    donor.phone,
                    this.extractNotes(record.notes)
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