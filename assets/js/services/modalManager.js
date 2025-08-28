/**
 * Modal管理模塊
 * 統一管理所有彈窗的開啟、關閉和內容設置
 */
import { DOMUtils } from '../utils/dom.js';

export class ModalManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.activeModals = new Set();
        this.currentEditingIndex = -1;
    }
    
    // 通用modal操作
    openModal(modalId) {
        const modal = DOMUtils.get(modalId);
        if (modal) {
            DOMUtils.removeClass(modal, 'hidden');
            DOMUtils.addClass(modal, 'flex');
            this.activeModals.add(modalId);
        }
    }
    
    closeModal(modalId) {
        const modal = DOMUtils.get(modalId);
        if (modal) {
            DOMUtils.addClass(modal, 'hidden');
            DOMUtils.removeClass(modal, 'flex');
            this.activeModals.delete(modalId);
        }
    }
    
    closeAll() {
        this.activeModals.forEach(modalId => {
            this.closeModal(modalId);
        });
        this.activeModals.clear();
    }
    
    // 物資新增/編輯Modal
    openAddItemModal() {
        this.currentEditingIndex = -1;
        this.setupItemModal('新增物資');
        this.resetItemForm();
        this.populateItemSelects();
        this.openModal('#itemModal');
    }
    
    openEditItemModal(index) {
        this.currentEditingIndex = index;
        const item = this.dataManager.getItemByIndex(index);
        if (!item) return;
        
        this.setupItemModal('編輯物資');
        this.populateItemForm(item);
        this.openModal('#itemModal');
    }
    
    setupItemModal(title) {
        DOMUtils.setText('#modalTitle', title);
    }
    
    resetItemForm() {
        const form = DOMUtils.get('#itemForm');
        if (form) {
            form.reset();
        }
        
        // 重置物資容器
        this.resetItemsContainer();
    }
    
    populateItemForm(item) {
        // 捐贈者資訊部分保持空白（編輯時通常不需要）
        
        // 填入物資資訊
        const firstRow = DOMUtils.get('.item-row');
        if (firstRow) {
            DOMUtils.setValue(firstRow.querySelector('.item-name'), item.name);
            DOMUtils.setValue(firstRow.querySelector('.item-quantity'), item.quantity);
            DOMUtils.setValue(firstRow.querySelector('.item-expiry'), item.expiryDate);
        }
        
        DOMUtils.setValue('#itemNotes', item.notes);
    }
    
    resetItemsContainer() {
        const container = DOMUtils.get('#itemsContainer');
        if (!container) return;
        
        // 保留第一行，移除其他行
        const rows = container.querySelectorAll('.item-row');
        rows.forEach((row, index) => {
            if (index > 0) {
                row.remove();
            }
        });
        
        // 重置第一行
        const firstRow = rows[0];
        if (firstRow) {
            firstRow.querySelector('.item-name').value = '';
            firstRow.querySelector('.item-quantity').value = '';
            firstRow.querySelector('.item-expiry').value = '';
            
            // 隱藏刪除按鈕
            const deleteBtn = firstRow.querySelector('[data-action="remove-row"]');
            if (deleteBtn) {
                DOMUtils.hide(deleteBtn);
            }
        }
    }
    
    populateItemSelects() {
        const selects = DOMUtils.getAll('.item-name');
        const inventoryItems = this.dataManager.getAllItems();
        
        selects.forEach(select => {
            DOMUtils.setHTML(select, '<option value="">請選擇物資名稱</option>');
            
            inventoryItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    }
    
    // 庫存品項新增Modal
    openAddInventoryModal() {
        DOMUtils.setValue('#customItemName', '');
        this.openModal('#addInventoryItemModal');
    }
    
    closeAddInventoryModal() {
        this.closeModal('#addInventoryItemModal');
    }
    
    // 物資領取Modal
    openPickupModal(itemIndex) {
        const item = this.dataManager.getItemByIndex(itemIndex);
        if (!item) return;
        
        // 設置物資資訊
        const itemInfo = DOMUtils.get('#pickupItemInfo');
        if (itemInfo) {
            DOMUtils.setHTML(itemInfo, `
                <h4 class="font-medium text-blue-800 mb-2">${item.name}</h4>
                <p class="text-sm text-blue-700">類別：${item.category}</p>
                <p class="text-sm text-blue-700">目前庫存：${item.quantity} ${item.unit}</p>
                ${item.expiryDate ? `<p class="text-sm text-blue-700">有效期限：${item.expiryDate}</p>` : ''}
            `);
        }
        
        // 設置可領取數量
        DOMUtils.setText('#availableQuantity', item.quantity);
        DOMUtils.get('#pickupQuantity')?.setAttribute('max', item.quantity);
        
        // 重置表單
        this.resetPickupForm();
        
        this.openModal('#pickupModal');
    }
    
    resetPickupForm() {
        DOMUtils.setValue('#pickupQuantity', '');
        DOMUtils.setValue('#recipientUnit', '');
        DOMUtils.setValue('#customUnit', '');
        DOMUtils.setValue('#recipientPhone', '');
        DOMUtils.setValue('#pickupNotes', '');
        DOMUtils.hide('#customUnit');
    }
    
    // 批量領取Modal
    openBatchPickupModal() {
        this.populateBatchItemsList();
        this.resetBatchPickupForm();
        this.openModal('#batchPickupModal');
    }
    
    populateBatchItemsList() {
        const container = DOMUtils.get('#batchItemsList');
        if (!container) return;
        
        const items = this.dataManager.getAllItems();
        const availableItems = items.filter(item => item.quantity > 0);
        
        const html = availableItems.map((item, index) => `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex items-start gap-3">
                    <input type="checkbox" 
                           class="batch-item-checkbox mt-1" 
                           data-item-index="${index}" 
                           id="batch-item-${index}">
                    <label for="batch-item-${index}" class="flex-1 cursor-pointer">
                        <div class="font-medium text-gray-900">${item.name}</div>
                        <div class="text-sm text-gray-600">庫存：${item.quantity} ${item.unit}</div>
                        <div class="mt-2">
                            <input type="number" 
                                   class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                   placeholder="領取數量"
                                   max="${item.quantity}"
                                   min="1"
                                   data-item-index="${index}"
                                   disabled>
                        </div>
                    </label>
                </div>
            </div>
        `).join('');
        
        DOMUtils.setHTML(container, html);
    }
    
    resetBatchPickupForm() {
        DOMUtils.setValue('#batchRecipientUnit', '');
        DOMUtils.setValue('#batchCustomUnit', '');
        DOMUtils.setValue('#batchRecipientPhone', '');
        DOMUtils.setValue('#batchPickupNotes', '');
        DOMUtils.hide('#batchCustomUnit');
        
        // 隱藏已選物資摘要
        DOMUtils.hide('#selectedItemsSummary');
    }
    
    // 收據選擇Modal
    openReceiptSelectionModal() {
        this.populateReceiptSelection();
        this.openModal('#receiptSelectionModal');
    }
    
    populateReceiptSelection() {
        const container = DOMUtils.get('#receiptSelectionTable');
        if (!container) return;
        
        const donationRecords = this.dataManager.getDonationRecords();
        
        const html = donationRecords.map((record, index) => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" 
                           class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                           data-record-index="${index}">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.itemName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.extractDonorInfo(record.notes, 'name')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.extractDonorInfo(record.notes, 'phone')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.extractDonorInfo(record.notes, 'address')}</td>
            </tr>
        `).join('');
        
        DOMUtils.setHTML(container, html);
    }
    
    extractDonorInfo(notes, field) {
        // 從備註中提取捐贈者資訊的簡單解析
        // 實際實現時可能需要更複雜的邏輯
        const match = notes.match(/捐贈者：(.+?)(?:\s-|$)/);
        if (match) {
            const donorInfo = match[1];
            switch (field) {
                case 'name':
                    return donorInfo.split('(')[0].trim();
                case 'phone':
                    const phoneMatch = donorInfo.match(/\((.+?)\)/);
                    return phoneMatch ? phoneMatch[1] : '';
                case 'address':
                    const addressMatch = donorInfo.match(/-\s(.+)/);
                    return addressMatch ? addressMatch[1] : '';
            }
        }
        return '';
    }
    
    // 編輯捐贈記錄Modal
    openEditDonationModal(recordData) {
        DOMUtils.setValue('#editDonationItemName', recordData.itemName);
        DOMUtils.setValue('#editDonationQuantity', recordData.quantity);
        DOMUtils.setValue('#editDonationType', 'donation');
        DOMUtils.setValue('#editDonationDonor', this.extractDonorInfo(recordData.notes, 'name'));
        DOMUtils.setValue('#editDonationNotes', recordData.notes);
        
        this.openModal('#editDonationModal');
    }
    
    // 庫存調整Modal
    openStockAdjustmentModal() {
        this.populateStockAdjustmentTable();
        this.openModal('#stockAdjustmentModal');
    }
    
    populateStockAdjustmentTable() {
        const container = DOMUtils.get('#stockAdjustmentTable');
        if (!container) return;
        
        const items = this.dataManager.getAllItems();
        
        const html = items.map((item, index) => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="number" 
                           class="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                           data-item-index="${index}"
                           placeholder="±數量">
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="text" 
                           class="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                           data-item-index="${index}"
                           placeholder="調整原因">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-purple-600 hover:text-purple-900"
                            data-action="adjust-stock"
                            data-item-index="${index}">
                        確認調整
                    </button>
                </td>
            </tr>
        `).join('');
        
        DOMUtils.setHTML(container, html);
    }
    
    // 通用關閉方法
    closeItemModal() { this.closeModal('#itemModal'); }
    closePickupModal() { this.closeModal('#pickupModal'); }
    closeBatchPickupModal() { this.closeModal('#batchPickupModal'); }
    closeReceiptSelectionModal() { this.closeModal('#receiptSelectionModal'); }
    closeEditDonationModal() { this.closeModal('#editDonationModal'); }
    closeStockAdjustmentModal() { this.closeModal('#stockAdjustmentModal'); }
}