/**
 * 事件管理模塊
 * 統一管理所有事件處理，替代HTML中的內聯事件
 */
import { DOMUtils } from '../utils/dom.js';

export class EventManager {
    constructor(authManager, dataManager, modalManager, uiRenderer) {
        this.authManager = authManager;
        this.dataManager = dataManager;
        this.modalManager = modalManager;
        this.uiRenderer = uiRenderer;
        this.currentTab = 'inventory';
    }
    
    // 初始化所有事件監聽器
    init() {
        this.initButtonEvents();
        this.initSearchEvents();
        this.initTabEvents();
        this.initFormEvents();
        this.initTableEvents();
    }
    
    // 初始化按鈕事件
    initButtonEvents() {
        // 主要操作按鈕
        this.bindClick('#addItemBtn', () => this.handleAddItem());
        this.bindClick('#addInventoryBtn', () => this.handleAddInventoryItem());
        this.bindClick('#batchPickupBtn', () => this.handleBatchPickup());
        this.bindClick('#exportBtn', () => this.handleExport());
        this.bindClick('#stockAdjustBtn', () => this.handleStockAdjust());
        this.bindClick('#printReceiptBtn', () => this.handlePrintReceipt());
        
        // Modal 控制按鈕 - 使用事件委託
        DOMUtils.delegate(document.body, 'click', '[data-action="close-modal"]', (e) => {
            this.modalManager.closeAll();
        });
        
        DOMUtils.delegate(document.body, 'click', '[data-action="save-item"]', (e) => {
            this.handleSaveItem();
        });
        
        // 物資操作按鈕
        DOMUtils.delegate('#itemsTable', 'click', '[data-action="pickup"]', (e) => {
            const index = e.target.dataset.itemIndex;
            this.handlePickupItem(parseInt(index));
        });
        
        DOMUtils.delegate('#itemsTable', 'click', '[data-action="edit"]', (e) => {
            const index = e.target.dataset.itemIndex;
            this.handleEditItem(parseInt(index));
        });
        
        DOMUtils.delegate('#itemsTable', 'click', '[data-action="delete"]', (e) => {
            const index = e.target.dataset.itemIndex;
            this.handleDeleteItem(parseInt(index));
        });
    }
    
    // 初始化搜尋事件
    initSearchEvents() {
        // 主搜尋框
        const searchInput = DOMUtils.get('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
        
        // 捐贈記錄搜尋
        const donationSearchInput = DOMUtils.get('#donationSearchInput');
        if (donationSearchInput) {
            donationSearchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.handleDonationSearch();
                }
            });
        }
        
        // 發放記錄搜尋
        const recordSearchInput = DOMUtils.get('#recordSearchInput');
        if (recordSearchInput) {
            recordSearchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.handleRecordSearch();
                }
            });
        }
        
        // 搜尋按鈕
        this.bindClick('[data-action="search"]', () => this.handleSearch());
        this.bindClick('[data-action="search-donation"]', () => this.handleDonationSearch());
        this.bindClick('[data-action="search-records"]', () => this.handleRecordSearch());
    }
    
    // 初始化標籤頁事件
    initTabEvents() {
        this.bindClick('#inventoryTab', () => this.handleTabSwitch('inventory'));
        this.bindClick('#donationTab', () => this.handleTabSwitch('donation'));
        this.bindClick('#recordsTab', () => this.handleTabSwitch('records'));
    }
    
    // 初始化表單事件
    initFormEvents() {
        // 篩選控制
        const categoryFilter = DOMUtils.get('#categoryFilter');
        const stockFilter = DOMUtils.get('#stockFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.handleFilter());
        }
        
        if (stockFilter) {
            stockFilter.addEventListener('change', () => this.handleFilter());
        }
        
        // 安全庫存編輯切換
        const editToggle = DOMUtils.get('#editSafetyStockToggle');
        if (editToggle) {
            editToggle.addEventListener('change', () => this.handleSafetyStockToggle());
        }
        
        // 單位選擇
        DOMUtils.delegate(document.body, 'change', '[data-unit-select]', (e) => {
            this.handleUnitSelection(e.target);
        });
        
        // 動態表單行管理
        DOMUtils.delegate('#itemsContainer', 'click', '[data-action="add-row"]', () => {
            this.handleAddItemRow();
        });
        
        DOMUtils.delegate('#itemsContainer', 'click', '[data-action="remove-row"]', (e) => {
            this.handleRemoveItemRow(e.target);
        });
    }
    
    // 初始化表格事件
    initTableEvents() {
        // 表格排序
        DOMUtils.delegate('#itemsTable', 'click', '[data-sort]', (e) => {
            const sortField = e.target.dataset.sort;
            this.handleSort(sortField);
        });
        
        // 安全庫存量更新
        DOMUtils.delegate('#itemsTable', 'change', '.safety-stock-input', (e) => {
            const index = parseInt(e.target.dataset.itemIndex);
            const newValue = parseInt(e.target.value);
            this.handleUpdateSafetyStock(index, newValue);
        });
        
        // 批量選擇
        DOMUtils.delegate('#batchItemsList', 'change', '.batch-item-checkbox', (e) => {
            this.handleBatchSelection(e.target);
        });
    }
    
    // 事件處理方法
    handleAddItem() {
        this.authManager.withPermission('staff', () => {
            this.modalManager.openAddItemModal();
        });
    }
    
    handleAddInventoryItem() {
        this.authManager.withPermission('staff', () => {
            this.modalManager.openAddInventoryModal();
        });
    }
    
    handleBatchPickup() {
        this.authManager.withPermission('staff', () => {
            this.modalManager.openBatchPickupModal();
        });
    }
    
    handleExport() {
        // 導出邏輯
        console.log('Export data');
    }
    
    handleStockAdjust() {
        this.authManager.withPermission('admin', () => {
            this.modalManager.openStockAdjustmentModal();
        });
    }
    
    handlePrintReceipt() {
        this.authManager.withPermission('staff', () => {
            this.modalManager.openReceiptSelectionModal();
        });
    }
    
    handleSaveItem() {
        this.authManager.withPermission('staff', () => {
            // 保存邏輯將在後續實現
            console.log('Save item');
        });
    }
    
    handlePickupItem(index) {
        this.authManager.withPermission('staff', () => {
            this.modalManager.openPickupModal(index);
        });
    }
    
    handleEditItem(index) {
        this.authManager.withPermission('staff', () => {
            this.modalManager.openEditItemModal(index);
        });
    }
    
    handleDeleteItem(index) {
        this.authManager.withPermission('admin', () => {
            if (confirm('確定要刪除此物資嗎？')) {
                this.dataManager.deleteItem(index);
                this.uiRenderer.renderItems();
                this.uiRenderer.updateStats();
            }
        });
    }
    
    handleSearch() {
        const searchTerm = DOMUtils.getValue('#searchInput');
        this.uiRenderer.filterItems({ search: searchTerm });
    }
    
    handleDonationSearch() {
        const searchTerm = DOMUtils.getValue('#donationSearchInput');
        this.uiRenderer.filterDonationRecords(searchTerm);
    }
    
    handleRecordSearch() {
        const searchTerm = DOMUtils.getValue('#recordSearchInput');
        this.uiRenderer.filterPickupRecords(searchTerm);
    }
    
    handleTabSwitch(tab) {
        if (!this.authManager.canAccessTab(tab)) {
            console.error('❌ 權限被拒絕: 您沒有權限查看此頁面', '標籤頁:', tab);
            return;
        }
        
        this.currentTab = tab;
        this.uiRenderer.switchTab(tab);
    }
    
    handleFilter() {
        const categoryFilter = DOMUtils.getValue('#categoryFilter');
        const stockFilter = DOMUtils.getValue('#stockFilter');
        
        this.uiRenderer.filterItems({
            category: categoryFilter,
            stock: stockFilter
        });
    }
    
    handleSafetyStockToggle() {
        const isEnabled = DOMUtils.get('#editSafetyStockToggle').checked;
        this.uiRenderer.toggleSafetyStockEdit(isEnabled);
    }
    
    handleUnitSelection(selectElement) {
        const customInput = selectElement.parentElement.querySelector('[data-custom-input]');
        if (selectElement.value === '其他') {
            DOMUtils.show(customInput);
        } else {
            DOMUtils.hide(customInput);
        }
    }
    
    handleAddItemRow() {
        // 動態添加物資行的邏輯
        console.log('Add item row');
    }
    
    handleRemoveItemRow(button) {
        const row = button.closest('.item-row');
        const container = DOMUtils.get('#itemsContainer');
        
        if (container.querySelectorAll('.item-row').length > 1) {
            row.remove();
            this.updateRowNumbers();
        }
    }
    
    handleSort(field) {
        this.uiRenderer.sortItems(field);
    }
    
    handleUpdateSafetyStock(index, newValue) {
        this.authManager.withPermission('admin', () => {
            this.dataManager.updateSafetyStock(index, newValue);
        });
    }
    
    handleBatchSelection(checkbox) {
        // 批量選擇邏輯
        console.log('Batch selection:', checkbox.checked);
    }
    
    // 工具方法
    bindClick(selector, handler) {
        const element = DOMUtils.get(selector);
        if (element) {
            element.addEventListener('click', handler);
        }
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
}