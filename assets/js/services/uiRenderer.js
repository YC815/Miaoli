/**
 * UI渲染模塊
 * 統一管理所有UI更新和渲染邏輯
 */
import { DOMUtils } from '../utils/dom.js';
import { STATS_CONFIG, DEFAULTS, TABS } from '../config/constants.js';

export class UIRenderer {
    constructor(dataManager, authManager) {
        this.dataManager = dataManager;
        this.authManager = authManager;
        this.currentSort = { field: 'name', direction: 'asc' };
        this.currentFilters = { category: '', stock: '', search: '' };
        this.currentTab = TABS.INVENTORY;
    }
    
    // 初始化UI
    init() {
        this.renderStatsCards();
        this.renderItems();
        this.updateStats();
        this.populateCategoryFilter();
    }
    
    // 渲染統計卡片
    renderStatsCards() {
        const container = DOMUtils.get('#statsContainer');
        const template = DOMUtils.get('#stats-card-template');
        
        if (!container || !template) return;
        
        STATS_CONFIG.forEach(stat => {
            const clone = template.content.cloneNode(true);
            const iconWrapper = clone.querySelector('.icon-wrapper');
            
            // 添加樣式類
            stat.color.split(' ').forEach(cls => iconWrapper.classList.add(cls));
            iconWrapper.innerHTML = stat.icon;
            
            clone.querySelector('.label').textContent = stat.label;
            const valueEl = clone.querySelector('.value');
            valueEl.id = stat.id;
            
            container.appendChild(clone);
        });
    }
    
    // 更新統計數據
    updateStats() {
        const stats = this.dataManager.getStats();
        
        // 更新各統計卡片的數值
        DOMUtils.setText('#totalItems', stats.totalItems);
        DOMUtils.setText('#monthlyDonation', stats.monthlyDonation);
        DOMUtils.setText('#monthlyDistribution', stats.monthlyDistribution);
        DOMUtils.setText('#lowStock', stats.lowStock);
    }
    
    // 渲染物資列表
    renderItems(filteredItems = null) {
        const tbody = DOMUtils.get('#itemsTable');
        const mobileList = DOMUtils.get('#mobileItemsList');
        
        if (!tbody || !mobileList) return;
        
        const itemsToRender = filteredItems || this.getFilteredAndSortedItems();
        
        if (itemsToRender.length === 0) {
            this.renderEmptyState(tbody, mobileList);
            return;
        }
        
        // 渲染桌面版表格
        this.renderDesktopTable(tbody, itemsToRender);
        
        // 渲染手機版卡片
        this.renderMobileCards(mobileList, itemsToRender);
    }
    
    renderEmptyState(tbody, mobileList) {
        const emptyHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"></path>
                        </svg>
                        <p class="text-lg font-medium">尚無物資資料</p>
                        <p class="text-sm">點擊「新增物資」開始建立愛心物資庫存</p>
                    </div>
                </td>
            </tr>
        `;
        
        DOMUtils.setHTML(tbody, emptyHTML);
        
        const mobileEmptyHTML = `
            <div class="text-center py-12">
                <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"></path>
                </svg>
                <p class="text-lg font-medium text-gray-500">尚無物資資料</p>
                <p class="text-sm text-gray-400">點擊「新增」開始建立物資庫存</p>
            </div>
        `;
        
        DOMUtils.setHTML(mobileList, mobileEmptyHTML);
    }
    
    renderDesktopTable(tbody, items) {
        const html = items.map((item, index) => {
            const actualIndex = this.dataManager.getAllItems().findIndex(i => 
                i.name === item.name && i.category === item.category
            );
            
            const categoryName = item.category ? item.category.replace(/^[A-Z]-/, '') : '其他';
            const expiryWarning = this.getExpiryWarning(item.expiryDate);
            const stockStatus = this.getStockStatus(item);
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ${categoryName}
                        </span>
                    </td>
                    <td class="px-3 lg:px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">${item.name}</div>
                        ${item.expiryDate ? `<div class="text-xs text-gray-500">效期：${item.expiryDate}</div>` : ''}
                        ${expiryWarning}
                        ${item.notes ? `<div class="text-xs text-gray-500 truncate max-w-32">${item.notes}</div>` : ''}
                    </td>
                    <td class="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium ${stockStatus.color}">${item.quantity} ${item.unit}</div>
                        ${stockStatus.warning}
                    </td>
                    <td class="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <input type="number" 
                               value="${item.safetyStock || DEFAULTS.SAFETY_STOCK}" 
                               min="0" 
                               data-action="update-safety-stock"
                               data-item-index="${actualIndex}"
                               class="safety-stock-input w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                               disabled
                               style="display: none;">
                        <span class="safety-stock-display text-sm text-gray-900">${item.safetyStock || DEFAULTS.SAFETY_STOCK}</span>
                    </td>
                </tr>
            `;
        }).join('');
        
        DOMUtils.setHTML(tbody, html);
    }
    
    renderMobileCards(mobileList, items) {
        const html = items.map((item) => {
            const actualIndex = this.dataManager.getAllItems().findIndex(i => 
                i.name === item.name && i.category === item.category
            );
            
            const categoryName = item.category ? item.category.replace(/^[A-Z]-/, '') : '其他';
            const expiryWarning = this.getExpiryWarning(item.expiryDate);
            const stockStatus = this.getStockStatus(item);
            
            return `
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-start gap-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex-1">
                                    <h3 class="text-base font-medium text-gray-900 truncate">${item.name}</h3>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                        ${categoryName}
                                    </span>
                                </div>
                                <div class="text-right ml-2">
                                    <div class="text-lg font-bold ${stockStatus.color}">${item.quantity}</div>
                                    <div class="text-xs text-gray-500">${item.unit}</div>
                                </div>
                            </div>
                            
                            <div class="space-y-2 text-sm text-gray-600">
                                ${item.expiryDate ? `<div class="text-xs text-gray-500">效期：${item.expiryDate}</div>` : ''}
                                ${expiryWarning}
                                ${item.notes ? `<div class="text-xs text-gray-500 line-clamp-2">${item.notes}</div>` : ''}
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-500">安全庫存量:</span>
                                    <input type="number" 
                                           value="${item.safetyStock || DEFAULTS.SAFETY_STOCK}" 
                                           min="0" 
                                           data-action="update-safety-stock"
                                           data-item-index="${actualIndex}"
                                           class="safety-stock-input w-12 border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                           disabled
                                           style="display: none;">
                                    <span class="safety-stock-display text-xs text-gray-900">${item.safetyStock || DEFAULTS.SAFETY_STOCK}</span>
                                </div>
                            </div>
                            
                            ${stockStatus.warning}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        DOMUtils.setHTML(mobileList, html);
    }
    
    // 獲取過期警告
    getExpiryWarning(expiryDate) {
        if (!expiryDate) return '';
        
        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
            return '<div class="text-xs text-red-500 mt-1">已過期</div>';
        } else if (daysUntilExpiry <= DEFAULTS.EXPIRY_WARNING_DAYS) {
            return `<div class="text-xs text-orange-500 mt-1">${daysUntilExpiry}天後過期</div>`;
        }
        
        return '';
    }
    
    // 獲取庫存狀態
    getStockStatus(item) {
        if (item.quantity === 0) {
            return {
                color: 'text-red-600',
                warning: '<div class="text-xs text-red-500 mt-1">發送完畢</div>'
            };
        } else if (item.quantity <= (item.safetyStock || DEFAULTS.SAFETY_STOCK)) {
            return {
                color: 'text-orange-600',
                warning: '<div class="text-xs text-orange-500 mt-1">庫存不足</div>'
            };
        } else {
            return {
                color: 'text-green-600',
                warning: ''
            };
        }
    }
    
    // 標籤頁切換
    switchTab(tab) {
        this.currentTab = tab;
        
        // 更新標籤頁樣式
        const tabs = ['inventory', 'donation', 'records'];
        tabs.forEach(tabName => {
            const tabElement = DOMUtils.get(`#${tabName}Tab`);
            if (tabElement) {
                if (tabName === tab) {
                    tabElement.className = 'flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 bg-white text-blue-600 shadow-sm';
                } else {
                    tabElement.className = 'flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 text-gray-500 hover:text-gray-700';
                }
            }
        });
        
        // 顯示對應的視圖
        DOMUtils.hide('#normalView');
        DOMUtils.hide('#donationView');
        DOMUtils.hide('#recordsView');
        
        switch (tab) {
            case TABS.INVENTORY:
                DOMUtils.show('#normalView');
                this.renderItems();
                break;
            case TABS.DONATION:
                DOMUtils.show('#donationView');
                this.renderDonationRecords();
                break;
            case TABS.RECORDS:
                DOMUtils.show('#recordsView');
                this.renderPickupRecords();
                break;
        }
    }
    
    // 渲染捐贈記錄
    renderDonationRecords() {
        const tbody = DOMUtils.get('#donationRecordsTable');
        const noDataMsg = DOMUtils.get('#noDonationMessage');
        
        if (!tbody) return;
        
        const records = this.dataManager.getDonationRecords();
        
        if (records.length === 0) {
            DOMUtils.setHTML(tbody, '');
            DOMUtils.show(noDataMsg);
            return;
        }
        
        DOMUtils.hide(noDataMsg);
        
        const html = records.map((record, index) => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.itemName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">個人捐贈</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.extractDonorName(record.notes)}</td>
                <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">${record.notes}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900"
                            data-action="edit-donation"
                            data-record-index="${index}">
                        編輯
                    </button>
                </td>
            </tr>
        `).join('');
        
        DOMUtils.setHTML(tbody, html);
    }
    
    // 渲染發放記錄
    renderPickupRecords() {
        const tbody = DOMUtils.get('#pickupRecordsTable');
        const noDataMsg = DOMUtils.get('#noRecordsMessage');
        
        if (!tbody) return;
        
        const records = this.dataManager.getPickupRecords();
        
        if (records.length === 0) {
            DOMUtils.setHTML(tbody, '');
            DOMUtils.show(noDataMsg);
            return;
        }
        
        DOMUtils.hide(noDataMsg);
        
        const html = records.map(record => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.itemName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.extractRecipientUnit(record.notes)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">${record.notes}</td>
            </tr>
        `).join('');
        
        DOMUtils.setHTML(tbody, html);
    }
    
    // 篩選和排序
    getFilteredAndSortedItems() {
        let items = [...this.dataManager.getAllItems()];
        
        // 應用篩選
        if (this.currentFilters.category) {
            items = items.filter(item => item.category === this.currentFilters.category);
        }
        
        if (this.currentFilters.stock) {
            items = items.filter(item => {
                switch (this.currentFilters.stock) {
                    case 'available':
                        return item.quantity > (item.safetyStock || DEFAULTS.SAFETY_STOCK);
                    case 'low':
                        return item.quantity > 0 && item.quantity <= (item.safetyStock || DEFAULTS.SAFETY_STOCK);
                    case 'empty':
                        return item.quantity === 0;
                    default:
                        return true;
                }
            });
        }
        
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            items = items.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                (item.barcode && item.barcode.includes(searchTerm))
            );
        }
        
        // 應用排序
        items.sort((a, b) => {
            let aValue = a[this.currentSort.field];
            let bValue = b[this.currentSort.field];
            
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (this.currentSort.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return items;
    }
    
    // 篩選控制
    filterItems(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.renderItems();
    }
    
    // 排序控制
    sortItems(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        this.renderItems();
    }
    
    // 安全庫存編輯切換
    toggleSafetyStockEdit(enabled) {
        const inputs = DOMUtils.getAll('.safety-stock-input');
        const displays = DOMUtils.getAll('.safety-stock-display');
        
        inputs.forEach(input => {
            input.disabled = !enabled;
            if (enabled) {
                DOMUtils.show(input);
            } else {
                DOMUtils.hide(input);
            }
        });
        
        displays.forEach(display => {
            if (enabled) {
                DOMUtils.hide(display);
            } else {
                DOMUtils.show(display);
            }
        });
    }
    
    // 填充類別篩選選項
    populateCategoryFilter() {
        const select = DOMUtils.get('#categoryFilter');
        if (!select) return;
        
        const categories = [...new Set(this.dataManager.getAllItems().map(item => item.category))];
        
        const options = categories.map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
        
        DOMUtils.setHTML(select, `<option value="">全部類別</option>${options}`);
    }
    
    // 工具方法
    extractDonorName(notes) {
        const match = notes.match(/捐贈者：(.+?)(?:\s\(|$)/);
        return match ? match[1] : '未知';
    }
    
    extractRecipientUnit(notes) {
        const match = notes.match(/發放給：(.+)/);
        return match ? match[1] : '未知';
    }
}