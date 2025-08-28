    // 預設使用者角色為管理員
    let userRole = 'admin';

    // 全域變數
    let currentTab = 'inventory';
    let currentSort = { field: 'name', direction: 'asc' };
    let currentFilters = { category: '', stock: '' };
    let selectedBatchItems = {};
    let editingDonationRecord = null;
    let receiptRecords = [];
    let safetyStockEditMode = false;

    const statsData = [
        {
            id: 'totalItems',
            label: '總物資種類',
            color: 'bg-green-100 text-green-600',
            icon: `<svg class="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`
        },
        {
            id: 'monthlyDonation',
            label: '本月捐贈',
            color: 'bg-blue-100 text-blue-600',
            icon: `<svg class="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`
        },
        {
            id: 'monthlyDistribution',
            label: '本月發放',
            color: 'bg-orange-100 text-orange-600',
            icon: `<svg class="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`
        },
        {
            id: 'lowStock',
            label: '庫存不足',
            color: 'bg-red-100 text-red-600',
            icon: `<svg class="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>`
        }
    ];

    function renderStatsCards() {
        const container = document.getElementById('statsContainer');
        const template = document.getElementById('stats-card-template');

        statsData.forEach(stat => {
            const clone = template.content.cloneNode(true);
            const iconWrapper = clone.querySelector('.icon-wrapper');
            stat.color.split(' ').forEach(cls => iconWrapper.classList.add(cls));
            iconWrapper.innerHTML = stat.icon;
            clone.querySelector('.label').textContent = stat.label;
            const valueEl = clone.querySelector('.value');
            valueEl.id = stat.id;
            container.appendChild(clone);
        });
    }
    
    // 庫存品項清單
    const inventoryItemsList = [
        { category: '常用類', name: '成人尿布' },
        { category: '常用類', name: '濕紙巾' },
        { category: '常用類', name: '衛生棉' },
        { category: '常用類', name: '麥片' },
        { category: '常用類', name: '八寶粥' },
        { category: '常用類', name: '泡麵' },
        { category: '常用類', name: '麵' },
        { category: '常用類', name: '油' },
        { category: '常用類', name: '醬油' },
        { category: '常用類', name: '口罩' },
        { category: '常用類', name: '沐浴露' },
        { category: '常用類', name: '洗髮露' },
        { category: '常用類', name: '洗衣精' },
        { category: '常用類', name: '肥皂' },
        { category: '常用類', name: '牙刷' },
        { category: '常用類', name: '牙膏' },
        { category: '常用類', name: '酒精' },
        { category: '常用類', name: '衛生紙' },
        { category: '常用類', name: '米' },
        { category: '常用類', name: '罐頭' },
        { category: '常用類', name: '奶粉' },
        { category: '常用類', name: '刮鬍刀' },
        { category: '常用類', name: '餅乾.零食' },
        { category: '常用類', name: '砂糖' },
        { category: '常用類', name: '鹽巴' },
        { category: '常用類', name: '兒童尿布' },
        { category: '常用類', name: '洗碗精' },
        { category: '常用類', name: '漂白水' },
        { category: '常用類', name: '肉鬆' },
        { category: '常用類', name: '礦泉水' }
    ];
    
    // 物資資料存儲
    let items = JSON.parse(localStorage.getItem('charityItems')) || inventoryItemsList.map(item => ({
        name: item.name,
        category: item.category,
        barcode: '',
        unit: '個',
        quantity: 0,
        safetyStock: 5,
        notes: '',
        expiryDate: '',
        createdDate: new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
        lastUpdated: new Date().toLocaleDateString('zh-TW'),
        image: null,
        lineNotify: false,
        operations: []
    }));
    let editingIndex = -1;
    let pickupItemIndex = -1;
    let codeReader = null;

    function adjustUIForRole() {
        // 根據用戶角色調整介面
        if (userRole === 'volunteer') {
            // 志工只能查看，隱藏所有操作按鈕
            document.getElementById('addItemBtn').style.display = 'none';
            document.getElementById('addInventoryBtn').style.display = 'none';
            document.getElementById('batchPickupBtn').style.display = 'none';
            document.getElementById('stockAdjustBtn').style.display = 'none';
            document.getElementById('printReceiptBtn').style.display = 'none';
            
            // 隱藏捐贈和發放紀錄標籤頁
            document.getElementById('donationTab').style.display = 'none';
            document.getElementById('recordsTab').style.display = 'none';
            
            // 隱藏篩選中的編輯功能
            document.getElementById('editSafetyStockToggle').parentElement.style.display = 'none';
        } else if (userRole === 'staff') {
            // 工作人員可以進行物資管理，但不能調整庫存
            document.getElementById('stockAdjustBtn').style.display = 'none';
        }
        // 管理員可以看到所有功能
    }

    function checkPermission(requiredRole) {
        const roleHierarchy = { 'volunteer': 0, 'staff': 1, 'admin': 2 };
        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }

    // 標籤頁切換功能
    function switchTab(tab) {
        // 權限檢查
        if (userRole === 'volunteer' && (tab === 'donation' || tab === 'records')) {
            alert('您沒有權限查看此頁面');
            return;
        }
        
        currentTab = tab;
        
        const inventoryTab = document.getElementById('inventoryTab');
        const donationTab = document.getElementById('donationTab');
        const recordsTab = document.getElementById('recordsTab');
        
        inventoryTab.className = 'flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 text-gray-500 hover:text-gray-700';
        donationTab.className = 'flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 text-gray-500 hover:text-gray-700';
        recordsTab.className = 'flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 text-gray-500 hover:text-gray-700';
        
        document.getElementById('normalView').classList.add('hidden');
        document.getElementById('donationView').classList.add('hidden');
        document.getElementById('recordsView').classList.add('hidden');
        
        if (tab === 'inventory') {
            inventoryTab.className = 'flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 bg-white text-blue-600 shadow-sm';
            document.getElementById('normalView').classList.remove('hidden');
            
        } else if (tab === 'donation') {
            donationTab.className = 'flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 bg-white text-blue-600 shadow-sm';
            document.getElementById('donationView').classList.remove('hidden');
            renderDonationRecords();
            
        } else if (tab === 'records') {
            recordsTab.className = 'flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 bg-white text-blue-600 shadow-sm';
            document.getElementById('recordsView').classList.remove('hidden');
            renderPickupRecords();
        }
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
        renderStatsCards();
        adjustUIForRole();
        renderItems();
        updateStats();
        populateInventorySelect();
        populateCategoryFilter();

        // 搜尋功能
        document.getElementById('searchInput').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchItems();
            }
        });

        // 初始化條碼掃描器
        try {
            codeReader = new ZXing.BrowserBarcodeReader();
        } catch (error) {
            console.log('條碼掃描器初始化失敗:', error);
        }
        
        // 領取紀錄搜尋框 Enter 鍵支援
        document.getElementById('recordSearchInput').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchPickupRecords();
            }
        });
        
        // 捐贈紀錄搜尋框 Enter 鍵支援
        document.getElementById('donationSearchInput').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchDonationRecords();
            }
        });
    });

    // 開啟 Modal（加入權限檢查）
    function openModal(mode, index = -1) {
        if (!checkPermission('staff')) {
            alert('您沒有權限執行此操作');
            return;
        }
        
        const modal = document.getElementById('itemModal');
        const title = document.getElementById('modalTitle');
        
        if (mode === 'add') {
            title.textContent = '新增物資';
            document.getElementById('itemForm').reset();
            editingIndex = -1;
            
            resetItemsContainer();
            populateAllItemSelects();
            
        } else if (mode === 'edit') {
            title.textContent = '編輯物資';
            const item = items[index];
            
            resetItemsContainer();
            populateAllItemSelects();
            
            const firstRow = document.querySelector('.item-row');
            firstRow.querySelector('.item-name').value = item.name;
            firstRow.querySelector('.item-quantity').value = item.quantity;
            firstRow.querySelector('.item-expiry').value = item.expiryDate || '';
            document.getElementById('itemNotes').value = item.notes || '';
            editingIndex = index;
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    // 關閉 Modal
    function closeModal() {
        const modal = document.getElementById('itemModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    // 儲存物資
    function saveItem() {
        if (!checkPermission('staff')) {
            alert('您沒有權限執行此操作');
            return;
        }
        
        const donorName = document.getElementById('donorName').value.trim();
        const donorPhone = document.getElementById('donorPhone').value.trim();
        const donorAddress = document.getElementById('donorAddress').value.trim();
        const notes = document.getElementById('itemNotes').value.trim();
        const lineNotify = document.getElementById('lineNotify').checked;
        
        const itemRows = document.querySelectorAll('.item-row');
        const itemsData = [];
        
        for (let i = 0; i < itemRows.length; i++) {
            const row = itemRows[i];
            const name = row.querySelector('.item-name').value;
            const quantity = parseInt(row.querySelector('.item-quantity').value);
            const expiryDate = row.querySelector('.item-expiry').value;
            
            if (!name || !quantity || quantity <= 0) {
                alert(`請完整填寫第 ${i + 1} 項物資資訊`);
                return;
            }
            
            itemsData.push({ name, quantity, expiryDate });
        }
        
        if (itemsData.length === 0) {
            alert('請至少新增一項物資');
            return;
        }
        
        const donorInfo = `${donorName}${donorPhone ? ` (${donorPhone})` : ''}${donorAddress ? ` - ${donorAddress}` : ''}`;
        
        if (editingIndex === -1) {
            itemsData.forEach(itemData => {
                saveItemData(itemData, donorInfo, notes, 5, lineNotify);
            });
        } else {
            const itemData = itemsData[0];
            updateExistingItem(editingIndex, itemData, donorInfo, notes, 5, lineNotify);
        }
        
        localStorage.setItem('charityItems', JSON.stringify(items));
        renderItems();
        updateStats();
        closeModal();
    }

    function saveItemData(itemData, donorInfo, notes, safetyStock, lineNotify) {
        const existingIndex = items.findIndex(item => 
            item.name === itemData.name
        );
        
        if (existingIndex !== -1) {
            const existingItem = items[existingIndex];
            existingItem.quantity += itemData.quantity;
            existingItem.lastUpdated = new Date().toLocaleDateString('zh-TW');
            if (itemData.expiryDate) {
                existingItem.expiryDate = itemData.expiryDate;
            }
            
            existingItem.operations.push({
                type: 'donation',
                quantity: itemData.quantity,
                date: new Date().toLocaleDateString('zh-TW'),
                notes: `捐贈者：${donorInfo}${notes ? ` - ${notes}` : ''}`
            });
        } else {
            const newItem = {
                name: itemData.name,
                category: getItemCategory(itemData.name),
                barcode: '',
                unit: '個',
                quantity: itemData.quantity,
                safetyStock: safetyStock,
                notes: notes,
                expiryDate: itemData.expiryDate || '',
                createdDate: new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
                lastUpdated: new Date().toLocaleDateString('zh-TW'),
                image: null,
                lineNotify: lineNotify,
                operations: [{
                    type: 'donation',
                    quantity: itemData.quantity,
                    date: new Date().toLocaleDateString('zh-TW'),
                    notes: `捐贈者：${donorInfo}${notes ? ` - ${notes}` : ''}`
                }]
            };
            items.push(newItem);
        }
    }
    
    function updateExistingItem(index, itemData, donorInfo, notes, safetyStock, lineNotify) {
        const existingItem = items[index];
        existingItem.name = itemData.name;
        existingItem.quantity = itemData.quantity;
        existingItem.safetyStock = safetyStock;
        existingItem.notes = notes;
        existingItem.expiryDate = itemData.expiryDate || '';
        existingItem.lastUpdated = new Date().toLocaleDateString('zh-TW');
        existingItem.lineNotify = lineNotify;
        
        existingItem.operations.push({
            type: 'edit',
            quantity: itemData.quantity,
            date: new Date().toLocaleDateString('zh-TW'),
            notes: `編輯 - 捐贈者：${donorInfo}${notes ? ` - ${notes}` : ''}`
        });
    }
    
    function getItemCategory(itemName) {
        const item = inventoryItemsList.find(inv => inv.name === itemName);
        return item ? item.category : '常用類';
    }

    // 渲染物資列表
    function renderItems(filteredItems = null) {
        const tbody = document.getElementById('itemsTable');
        const mobileList = document.getElementById('mobileItemsList');
        const itemsToRender = filteredItems || getFilteredAndSortedItems();
        
        if (itemsToRender.length === 0) {
            tbody.innerHTML = `
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
            
            mobileList.innerHTML = `
                <div class="text-center py-12">
                    <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7"></path>
                    </svg>
                    <p class="text-lg font-medium text-gray-500">尚無物資資料</p>
                    <p class="text-sm text-gray-400">點擊「新增」開始建立物資庫存</p>
                </div>
            `;
            return;
        }

        // 桌面版表格
        tbody.innerHTML = itemsToRender.map((item, index) => {
            const categoryName = item.category ? item.category.replace(/^[A-Z]-/, '') : '其他';
            const actualIndex = items.findIndex(i => i.name === item.name && i.category === item.category);
            
            // 檢查是否即將過期（30天內）
            let expiryWarning = '';
            if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry <= 0) {
                    expiryWarning = '<div class="text-xs text-red-500">已過期</div>';
                } else if (daysUntilExpiry <= 30) {
                    expiryWarning = `<div class="text-xs text-orange-500">${daysUntilExpiry}天後過期</div>`;
                }
            }
            
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
                        <div class="text-sm font-medium ${item.quantity === 0 ? 'text-red-600' : item.quantity <= (item.safetyStock || 5) ? 'text-orange-600' : 'text-green-600'}">${item.quantity} ${item.unit}</div>
                        ${item.quantity === 0 ? '<div class="text-xs text-red-500">發送完畢</div>' : item.quantity <= (item.safetyStock || 5) ? '<div class="text-xs text-orange-500">庫存不足</div>' : ''}
                    </td>
                    <td class="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <input type="number" 
                               value="${item.safetyStock || 5}" 
                               min="0" 
                               onchange="updateSafetyStock(${actualIndex}, this.value)"
                               class="safety-stock-input w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                               disabled
                               style="display: none;">
                        <span class="safety-stock-display text-sm text-gray-900">${item.safetyStock || 5}</span>
                    </td>
                </tr>
            `;
        }).join('');

        // 手機版卡片
        mobileList.innerHTML = itemsToRender.map((item, originalIndex) => {
            const actualIndex = items.findIndex(i => i.name === item.name && i.category === item.category);
            const categoryName = item.category ? item.category.replace(/^[A-Z]-/, '') : '其他';
            
            // 檢查是否即將過期
            let expiryWarning = '';
            if (item.expiryDate) {
                const expiryDate = new Date(item.expiryDate);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry <= 0) {
                    expiryWarning = '<div class="text-xs text-red-500 mt-1">已過期</div>';
                } else if (daysUntilExpiry <= 30) {
                    expiryWarning = `<div class="text-xs text-orange-500 mt-1">${daysUntilExpiry}天後過期</div>`;
                }
            }
            
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
                                <div class="text-lg font-bold ${item.quantity === 0 ? 'text-red-600' : item.quantity <= (item.safetyStock || 5) ? 'text-orange-600' : 'text-green-600'}">${item.quantity}</div>
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
                                       value="${item.safetyStock || 5}" 
                                       min="0" 
                                       onchange="updateSafetyStock(${actualIndex}, this.value)"
                                       class="safety-stock-input w-12 border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                       disabled
                                       style="display: none;">
                                <span class="safety-stock-display text-xs text-gray-900">${item.safetyStock || 5}</span>
                            </div>
                        </div>
                        
                        ${item.quantity === 0 ? '<div class="text-xs text-red-500 mt-1">發送完畢</div>' : item.quantity <= (item.safetyStock || 5) ? '<div class="text-xs text-orange-500 mt-1">庫存不足</div>' : ''}
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    // 刪除物資（加入權限檢查）
    function deleteItem(index) {
        if (!checkPermission('admin')) {
            alert('您沒有權限執行此操作');
            return;
        }
        
        if (confirm('確定要刪除此物資嗎？')) {
            items.splice(index, 1);
            localStorage.setItem('charityItems', JSON.stringify(items));
            renderItems();
            updateStats();
        }
    }

    // 搜尋物資
    function searchItems() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm === '') {
            renderItems();
        } else {
            const baseItems = getFilteredAndSortedItems();
            const filteredItems = baseItems.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                (item.barcode && item.barcode.includes(searchTerm))
            );
            renderItems(filteredItems);
        }
    }

    // 物資行管理功能
    function addItemRow() {
        const container = document.getElementById('itemsContainer');
        const currentRows = container.querySelectorAll('.item-row');
        const newRowNumber = currentRows.length + 1;
        
        const newRow = document.createElement('div');
        newRow.className = 'item-row bg-white p-3 rounded border border-gray-200 space-y-3';
        newRow.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">物資 #${newRowNumber}</span>
                <button type="button" onclick="removeItemRow(this)" class="text-red-600 hover:text-red-800 text-sm">
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
        
        container.appendChild(newRow);
        populateItemSelect(newRow.querySelector('.item-name'));
        updateDeleteButtons();
    }
    
    function removeItemRow(button) {
        const row = button.closest('.item-row');
        const container = document.getElementById('itemsContainer');
        
        if (container.querySelectorAll('.item-row').length > 1) {
            row.remove();
            updateRowNumbers();
            updateDeleteButtons();
        }
    }
    function updateRowNumbers() {
        const rows = document.querySelectorAll('.item-row');
        rows.forEach((row, index) => {
            const numberSpan = row.querySelector('span');
            numberSpan.textContent = `物資 #${index + 1}`;
        });
        }
