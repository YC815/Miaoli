/**
 * 表單處理模塊
 * 統一管理表單驗證、提交和動態表單操作
 */
import { DOMUtils } from '../utils/dom.js';
import { Validators } from '../utils/validators.js';
import { INVENTORY_ITEMS_LIST, RECIPIENT_UNITS } from '../config/constants.js';

export class FormHandler {
    constructor(dataManager, inventoryManager, donationsManager, distributionManager) {
        this.dataManager = dataManager;
        this.inventoryManager = inventoryManager;
        this.donationsManager = donationsManager;
        this.distributionManager = distributionManager;
        this.itemRowCounter = 1;
    }
    
    // 初始化表單
    init() {
        this.populateSelects();
        this.bindFormEvents();
    }
    
    // 處理物資新增/編輯表單提交
    async handleItemFormSubmit(isEditing = false, editIndex = -1) {
        try {
            // 獲取捐贈者資訊
            const donorData = this.getDonorData();
            const validation = Validators.validateDonor(donorData);
            
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return { success: false, message: validation.errors.join(', ') };
            }
            
            // 獲取物資資訊
            const itemsData = this.getItemsData();
            
            if (itemsData.length === 0) {
                this.showValidationErrors(['請至少新增一項物資']);
                return { success: false, message: '請至少新增一項物資' };
            }
            
            // 驗證每項物資
            const batchValidation = Validators.validateItemsBatch(itemsData);
            if (!batchValidation.isValid) {
                this.showValidationErrors(batchValidation.errors);
                return { success: false, message: batchValidation.errors.join('\n') };
            }
            
            const notes = DOMUtils.getValue('#itemNotes');
            const lineNotify = DOMUtils.get('#lineNotify')?.checked || false;
            const donorInfo = this.buildDonorInfo(donorData);
            
            let result;
            
            if (isEditing) {
                // 編輯模式 - 只處理第一項物資
                result = await this.inventoryManager.editItem(editIndex, itemsData[0], donorInfo, notes, lineNotify);
            } else {
                // 新增模式
                if (itemsData.length === 1) {
                    result = await this.inventoryManager.addItem(itemsData[0], donorInfo, notes, lineNotify);
                } else {
                    result = await this.inventoryManager.addItemsBatch(itemsData, donorInfo, notes, lineNotify);
                }
            }
            
            if (result.success) {
                this.resetItemForm();
            }
            
            return result;
            
        } catch (error) {
            console.error('表單提交失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 處理物資領取表單提交
    async handlePickupFormSubmit(itemIndex) {
        try {
            const pickupData = this.getPickupData();
            const result = await this.distributionManager.pickupItem(itemIndex, pickupData);
            
            if (result.success) {
                this.resetPickupForm();
            }
            
            return result;
            
        } catch (error) {
            console.error('領取表單提交失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 處理批量領取表單提交
    async handleBatchPickupFormSubmit() {
        try {
            const recipientInfo = this.getBatchRecipientData();
            const selectedItems = this.distributionManager.getBatchSelection();
            
            const result = await this.distributionManager.batchPickup(recipientInfo, selectedItems);
            
            if (result.success) {
                this.resetBatchPickupForm();
            }
            
            return result;
            
        } catch (error) {
            console.error('批量領取表單提交失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 處理自訂品項新增表單提交
    async handleCustomItemFormSubmit() {
        try {
            const itemName = DOMUtils.getValue('#customItemName').trim();
            const result = await this.inventoryManager.addCustomInventoryItem(itemName);
            
            if (result.success) {
                this.resetCustomItemForm();
                this.populateItemSelects(); // 重新填充選項
            }
            
            return result;
            
        } catch (error) {
            console.error('自訂品項新增失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    // 動態表單行管理
    addItemRow() {
        const container = DOMUtils.get('#itemsContainer');
        if (!container) return;
        
        const currentRows = container.querySelectorAll('.item-row');
        this.itemRowCounter = currentRows.length + 1;
        
        const newRow = this.createItemRow(this.itemRowCounter);
        container.appendChild(newRow);
        
        // 填充新行的選項
        this.populateItemSelect(newRow.querySelector('.item-name'));
        
        // 顯示所有刪除按鈕
        this.updateDeleteButtons();
        
        return newRow;
    }
    
    removeItemRow(button) {
        const row = button.closest('.item-row');
        const container = DOMUtils.get('#itemsContainer');
        
        if (!row || !container) return;
        
        if (container.querySelectorAll('.item-row').length > 1) {
            row.remove();
            this.updateRowNumbers();
            this.updateDeleteButtons();
        }
    }
    
    createItemRow(rowNumber) {
        const newRow = document.createElement('div');
        newRow.className = 'item-row bg-white p-3 rounded border border-gray-200 space-y-3';
        newRow.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">物資 #${rowNumber}</span>
                <button type="button" data-action="remove-row" class="text-red-600 hover:text-red-800 text-sm remove-row-btn">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">物資名稱</label>
                <select class="item-name w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                    <option value="">請選擇物資名稱</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">數量</label>
                    <input type="number" class="item-quantity w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" required min="0" placeholder="0">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">有效日期（選填）</label>
                    <input type="date" class="item-expiry w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
            </div>
        `;
        
        return newRow;
    }
    
    updateRowNumbers() {
        const rows = DOMUtils.getAll('.item-row');
        rows.forEach((row, index) => {
            const numberSpan = row.querySelector('span');
            if (numberSpan) {
                numberSpan.textContent = `物資 #${index + 1}`;
            }
        });
    }
    
    updateDeleteButtons() {
        const buttons = DOMUtils.getAll('.remove-row-btn');
        const showButtons = buttons.length > 1;
        
        buttons.forEach(button => {
            if (showButtons) {
                DOMUtils.show(button);
            } else {
                DOMUtils.hide(button);
            }
        });
    }
    
    // 單位選擇處理
    handleUnitSelection(selectElement) {
        const customInput = selectElement.parentElement.parentElement.querySelector('[data-custom-input]') ||
                          selectElement.parentElement.querySelector('[data-custom-input]');
                          
        if (selectElement.value === '其他') {
            DOMUtils.show(customInput);
            customInput.required = true;
        } else {
            DOMUtils.hide(customInput);
            customInput.required = false;
            DOMUtils.setValue(customInput, '');
        }
    }
    
    // 批量選擇處理
    handleBatchItemSelection(checkbox) {
        const itemIndex = parseInt(checkbox.dataset.itemIndex);
        const quantityInput = checkbox.parentElement.parentElement.querySelector('input[type="number"]');
        
        if (checkbox.checked) {
            quantityInput.disabled = false;
            quantityInput.focus();
            
            // 預設填入建議數量
            if (!quantityInput.value) {
                const item = this.dataManager.getItemByIndex(itemIndex);
                if (item) {
                    const suggestedQty = Math.min(item.quantity, item.safetyStock || 5);
                    quantityInput.value = suggestedQty;
                    this.distributionManager.updateBatchSelection(itemIndex, suggestedQty);
                }
            }
        } else {
            quantityInput.disabled = true;
            quantityInput.value = '';
            this.distributionManager.updateBatchSelection(itemIndex, 0);
        }
        
        this.updateBatchSummary();
    }
    
    handleBatchQuantityChange(input) {
        const itemIndex = parseInt(input.dataset.itemIndex);
        const quantity = parseInt(input.value) || 0;
        
        this.distributionManager.updateBatchSelection(itemIndex, quantity);
        this.updateBatchSummary();
    }
    
    updateBatchSummary() {
        const selectedItems = this.distributionManager.getBatchSelection();
        const summaryContainer = DOMUtils.get('#selectedItemsSummary');
        const summaryList = DOMUtils.get('#selectedItemsList');
        
        if (!summaryContainer || !summaryList) return;
        
        const itemCount = Object.keys(selectedItems).length;
        
        if (itemCount === 0) {
            DOMUtils.hide(summaryContainer);
            return;
        }
        
        const items = this.dataManager.getAllItems();
        const summaryHTML = Object.entries(selectedItems).map(([index, quantity]) => {
            const item = items[parseInt(index)];
            return `<div>${item?.name || '未知物資'}: ${quantity} 個</div>`;
        }).join('');
        
        DOMUtils.setHTML(summaryList, summaryHTML);
        DOMUtils.show(summaryContainer);
    }
    
    // 數據獲取方法
    getDonorData() {
        return {
            name: DOMUtils.getValue('#donorName').trim(),
            phone: DOMUtils.getValue('#donorPhone').trim(),
            address: DOMUtils.getValue('#donorAddress').trim()
        };
    }
    
    getItemsData() {
        const itemRows = DOMUtils.getAll('.item-row');
        const itemsData = [];
        
        itemRows.forEach(row => {
            const name = DOMUtils.getValue(row.querySelector('.item-name'));
            const quantity = parseInt(DOMUtils.getValue(row.querySelector('.item-quantity'))) || 0;
            const expiryDate = DOMUtils.getValue(row.querySelector('.item-expiry'));
            
            if (name && quantity > 0) {
                itemsData.push({ name, quantity, expiryDate });
            }
        });
        
        return itemsData;
    }
    
    getPickupData() {
        const recipientUnit = DOMUtils.getValue('#recipientUnit');
        const customUnit = DOMUtils.getValue('#customUnit');
        
        return {
            quantity: parseInt(DOMUtils.getValue('#pickupQuantity')) || 0,
            recipientUnit: recipientUnit === '其他' ? customUnit : recipientUnit,
            recipientPhone: DOMUtils.getValue('#recipientPhone').trim(),
            pickupNotes: DOMUtils.getValue('#pickupNotes').trim()
        };
    }
    
    getBatchRecipientData() {
        const recipientUnit = DOMUtils.getValue('#batchRecipientUnit');
        const customUnit = DOMUtils.getValue('#batchCustomUnit');
        
        return {
            recipientUnit: recipientUnit === '其他' ? customUnit : recipientUnit,
            recipientPhone: DOMUtils.getValue('#batchRecipientPhone').trim(),
            pickupNotes: DOMUtils.getValue('#batchPickupNotes').trim()
        };
    }
    
    buildDonorInfo(donorData) {
        let info = donorData.name;
        
        if (donorData.phone) {
            info += ` (${donorData.phone})`;
        }
        
        if (donorData.address) {
            info += ` - ${donorData.address}`;
        }
        
        return info;
    }
    
    // 表單重置方法
    resetItemForm() {
        // 重置捐贈者資訊
        DOMUtils.setValue('#donorName', '');
        DOMUtils.setValue('#donorPhone', '');
        DOMUtils.setValue('#donorAddress', '');
        
        // 重置物資清單 - 保留第一行，移除其他行
        const container = DOMUtils.get('#itemsContainer');
        if (container) {
            const rows = container.querySelectorAll('.item-row');
            rows.forEach((row, index) => {
                if (index > 0) {
                    row.remove();
                }
            });
            
            // 重置第一行
            const firstRow = rows[0];
            if (firstRow) {
                DOMUtils.setValue(firstRow.querySelector('.item-name'), '');
                DOMUtils.setValue(firstRow.querySelector('.item-quantity'), '');
                DOMUtils.setValue(firstRow.querySelector('.item-expiry'), '');
            }
        }
        
        DOMUtils.setValue('#itemNotes', '');
        
        const lineNotifyCheckbox = DOMUtils.get('#lineNotify');
        if (lineNotifyCheckbox) {
            lineNotifyCheckbox.checked = false;
        }
        
        this.updateDeleteButtons();
    }
    
    resetPickupForm() {
        DOMUtils.setValue('#pickupQuantity', '');
        DOMUtils.setValue('#recipientUnit', '');
        DOMUtils.setValue('#customUnit', '');
        DOMUtils.setValue('#recipientPhone', '');
        DOMUtils.setValue('#pickupNotes', '');
        
        const evidenceInput = DOMUtils.get('#pickupEvidence');
        if (evidenceInput) {
            evidenceInput.value = '';
        }
        
        DOMUtils.hide('#customUnit');
    }
    
    resetBatchPickupForm() {
        DOMUtils.setValue('#batchRecipientUnit', '');
        DOMUtils.setValue('#batchCustomUnit', '');
        DOMUtils.setValue('#batchRecipientPhone', '');
        DOMUtils.setValue('#batchPickupNotes', '');
        
        DOMUtils.hide('#batchCustomUnit');
        
        // 清空所有選擇
        const checkboxes = DOMUtils.getAll('.batch-item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            const quantityInput = checkbox.parentElement.parentElement.querySelector('input[type="number"]');
            if (quantityInput) {
                quantityInput.disabled = true;
                quantityInput.value = '';
            }
        });
        
        this.distributionManager.clearBatchSelection();
        DOMUtils.hide('#selectedItemsSummary');
    }
    
    resetCustomItemForm() {
        DOMUtils.setValue('#customItemName', '');
    }
    
    // 選項填充方法
    populateSelects() {
        this.populateItemSelects();
        this.populateRecipientUnitSelects();
    }
    
    populateItemSelects() {
        const selects = DOMUtils.getAll('.item-name');
        selects.forEach(select => {
            this.populateItemSelect(select);
        });
    }
    
    populateItemSelect(select) {
        if (!select) return;
        
        const items = this.dataManager.getAllItems();
        
        let options = '<option value="">請選擇物資名稱</option>';
        items.forEach(item => {
            options += `<option value="${item.name}">${item.name}</option>`;
        });
        
        DOMUtils.setHTML(select, options);
    }
    
    populateRecipientUnitSelects() {
        const selects = DOMUtils.getAll('#recipientUnit, #batchRecipientUnit');
        
        const options = RECIPIENT_UNITS.map(unit => 
            `<option value="${unit}">${unit}</option>`
        ).join('');
        
        selects.forEach(select => {
            DOMUtils.setHTML(select, `<option value="">請選擇領取單位</option>${options}`);
        });
    }
    
    // 事件綁定
    bindFormEvents() {
        // 單位選擇事件
        DOMUtils.delegate(document.body, 'change', '[data-unit-select]', (e) => {
            this.handleUnitSelection(e.target);
        });
        
        // 批量選擇事件
        DOMUtils.delegate('#batchItemsList', 'change', '.batch-item-checkbox', (e) => {
            this.handleBatchItemSelection(e.target);
        });
        
        DOMUtils.delegate('#batchItemsList', 'input', 'input[type="number"]', (e) => {
            this.handleBatchQuantityChange(e.target);
        });
        
        // 動態表單行事件
        DOMUtils.delegate('#itemsContainer', 'click', '[data-action="remove-row"]', (e) => {
            this.removeItemRow(e.target);
        });
    }
    
    // 錯誤顯示
    showValidationErrors(errors) {
        const errorMessage = errors.join(', ');
        console.error('❌ 表單驗證錯誤:', errorMessage);
        console.error('📋 錯誤詳情:', errors);
    }
}