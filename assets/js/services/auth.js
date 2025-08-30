/**
 * 權限管理模塊
 * 整合 Clerk 身份驗證系統
 */
import { USER_ROLES, ROLE_HIERARCHY, ERROR_MESSAGES } from '../config/constants.js';
import { DOMUtils } from '../utils/dom.js';
import { CLERK_CONFIG, getClerkConfig } from '../config/clerk-config.js';
import { authPage } from '../components/auth-page.js';
import envLoader from '../utils/env-loader.js';

export class AuthManager {
    constructor() {
        this.clerk = null;
        this.currentUser = null;
        this.currentUserRole = null;
        this.isInitialized = false;
        this.isInitializing = false;
        
        // 監聽 Clerk 載入事件
        this.setupClerkLoadListener();
    }
    
    // 設置用戶角色
    setUserRole(role) {
        if (Object.values(USER_ROLES).includes(role)) {
            this.currentUserRole = role;
            this.adjustUIForRole();
        }
    }
    
    // 獲取當前用戶角色
    getCurrentRole() {
        return this.currentUserRole;
    }
    
    // 檢查權限
    checkPermission(requiredRole) {
        return ROLE_HIERARCHY[this.currentUserRole] >= ROLE_HIERARCHY[requiredRole];
    }
    
    // 權限裝飾器
    requirePermission(requiredRole) {
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;
            
            descriptor.value = function(...args) {
                if (!this.authManager.checkPermission(requiredRole)) {
                    console.error('❌ 權限被拒絕:', ERROR_MESSAGES.PERMISSION_DENIED, '需要角色:', requiredRole);
                    return;
                }
                return originalMethod.apply(this, args);
            };
            
            return descriptor;
        };
    }
    
    // 權限檢查函數（用於直接調用）
    withPermission(requiredRole, callback) {
        if (this.checkPermission(requiredRole)) {
            return callback();
        } else {
            console.error('❌ 權限被拒絕:', ERROR_MESSAGES.PERMISSION_DENIED, '需要角色:', requiredRole);
            return null;
        }
    }
    
    // 根據角色調整UI
    adjustUIForRole() {
        const role = this.currentUserRole;
        console.log('🎨 調整 UI for 角色:', role);
        console.log('🎨 用戶登入狀態:', this.isSignedIn());
        
        // 如果用戶未登入，隱藏所有操作按鈕
        if (!this.isSignedIn()) {
            console.log('❌ 用戶未登入，隱藏所有操作按鈕');
            this.hideAllActionButtons();
            this.removeUserButton();
            return;
        }
        
        // 根據角色隱藏/顯示功能按鈕
        const adminOnlyElements = [
            '#stockAdjustBtn',
            '#userManagementBtn'
        ];
        
        const staffOnlyElements = [
            '#addItemBtn',
            '#addInventoryBtn',
            '#batchPickupBtn',
            '#printReceiptBtn'
        ];
        
        const volunteerHiddenElements = [
            ...adminOnlyElements,
            ...staffOnlyElements,
            '#donationTab',
            '#recordsTab'
        ];
        
        // 重置所有元素顯示狀態
        [...adminOnlyElements, ...staffOnlyElements].forEach(selector => {
            const element = DOMUtils.get(selector);
            if (element) {
                DOMUtils.show(element);
            }
        });
        
        // 根據角色隱藏元素
        if (role === USER_ROLES.VOLUNTEER) {
            volunteerHiddenElements.forEach(selector => {
                const element = DOMUtils.get(selector);
                if (element) {
                    DOMUtils.hide(element);
                }
            });
            
            // 隱藏安全庫存編輯功能
            const editToggle = DOMUtils.get('#editSafetyStockToggle');
            if (editToggle && editToggle.parentElement) {
                DOMUtils.hide(editToggle.parentElement);
            }
        } else if (role === USER_ROLES.STAFF) {
            adminOnlyElements.forEach(selector => {
                const element = DOMUtils.get(selector);
                if (element) {
                    DOMUtils.hide(element);
                }
            });
        }
        
        // 添加用戶按鈕
        console.log('🔘 準備添加用戶按鈕到導航欄...');
        this.addUserButtonToNav();
        
        // 顯示角色資訊
        console.log('🏷️ 準備更新角色顯示...');
        this.updateRoleDisplay();
    }
    
    // 隱藏所有操作按鈕 (未登入狀態)
    hideAllActionButtons() {
        const allActionButtons = [
            '#addItemBtn',
            '#addInventoryBtn',
            '#batchPickupBtn',
            '#exportBtn',
            '#stockAdjustBtn',
            '#printReceiptBtn',
            '#userManagementBtn'
        ];
        
        allActionButtons.forEach(selector => {
            const element = DOMUtils.get(selector);
            if (element) {
                DOMUtils.hide(element);
            }
        });
        
        // 隱藏捐贈和發放標籤頁
        const restrictedTabs = ['#donationTab', '#recordsTab'];
        restrictedTabs.forEach(selector => {
            const element = DOMUtils.get(selector);
            if (element) {
                DOMUtils.hide(element);
            }
        });
    }
    
    // 更新角色顯示
    updateRoleDisplay() {
        const roleBadgeContainer = DOMUtils.get('#roleBadgeContainer');
        if (!roleBadgeContainer) {
            return;
        }
        
        if (!this.isSignedIn()) {
            // 清除角色徽章
            roleBadgeContainer.innerHTML = '';
            return;
        }
        
        // 在右側專用容器中顯示當前角色
        if (this.currentUserRole) {
            const roleLabel = this.getRoleLabel(this.currentUserRole);
            
            // 檢查是否已經有相同的角色徽章
            const existingBadge = roleBadgeContainer.querySelector('.role-badge');
            if (existingBadge && existingBadge.textContent === roleLabel) {
                return; // 避免重複創建相同的徽章
            }
            
            // 清除現有的角色徽章
            roleBadgeContainer.innerHTML = '';
            
            const roleBadge = document.createElement('span');
            roleBadge.className = 'role-badge text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium';
            roleBadge.textContent = roleLabel;
            
            roleBadgeContainer.appendChild(roleBadge);
        }
    }
    
    // 檢查標籤頁權限
    canAccessTab(tab) {
        // 如果用戶未登入，只能查看庫存
        if (!this.isSignedIn()) {
            return tab === 'inventory';
        }
        
        if (this.currentUserRole === USER_ROLES.VOLUNTEER) {
            return tab === 'inventory';
        }
        return true;
    }
    
    // 更新用戶角色 (僅限管理員)
    async updateUserRole(userId, newRole) {
        if (!this.checkPermission(USER_ROLES.ADMIN)) {
            console.error('❌ 權限被拒絕:', ERROR_MESSAGES.PERMISSION_DENIED, '需要管理員權限');
            return false;
        }
        
        if (!this.clerk) {
            console.error('Clerk 未初始化');
            return false;
        }
        
        try {
            // 使用 Clerk Backend API 更新用戶 metadata
            // 注意：這需要後端支持，這裡只是示例
            console.log(`更新用戶 ${userId} 角色為 ${newRole}`);
            
            // 實際實現需要呼叫後端 API
            // const response = await fetch('/api/users/update-role', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ userId, role: newRole })
            // });
            
            console.log('✅ 角色更新成功');
            return true;
            
        } catch (error) {
            console.error('❌ 角色更新失敗:', error);
            return false;
        }
    }
    
    // 取得用戶列表 (僅限管理員)
    async getUserList() {
        if (!this.checkPermission(USER_ROLES.ADMIN)) {
            console.error('❌ 權限被拒絕:', ERROR_MESSAGES.PERMISSION_DENIED, '需要管理員權限');
            return [];
        }
        
        // 實際應用中需要後端 API 支持
        console.log('取得用戶列表功能需要後端支持');
        return [];
    }
    
    // 加入用戶按鈕到導航欄
    addUserButtonToNav() {
        console.log('🔘 開始添加用戶按鈕到導航欄');
        console.log('👤 用戶登入狀態:', this.isSignedIn());
        console.log('🔧 Clerk 實例狀態:', !!this.clerk);
        
        if (!this.isSignedIn()) {
            console.log('❌ 用戶未登入，移除用戶按鈕');
            this.removeUserButton();
            return;
        }
        
        // 找到專用的用戶按鈕容器
        const userButtonContainer = DOMUtils.get('#userButton');
        console.log('📦 找到用戶按鈕容器:', !!userButtonContainer);
        
        if (!userButtonContainer) {
            console.error('❌ 找不到 #userButton 容器');
            return;
        }
        
        // 檢查容器的當前狀態
        console.log('📊 容器當前狀態:');
        console.log('  - 子節點數量:', userButtonContainer.childNodes.length);
        console.log('  - innerHTML:', userButtonContainer.innerHTML);
        console.log('  - 是否有 Clerk 按鈕:', !!userButtonContainer.querySelector('[data-clerk-user-button]'));
        
        // 檢查是否已經有 Clerk UserButton 掛載
        const existingClerkButton = userButtonContainer.querySelector('[data-clerk-user-button]') || 
                                   userButtonContainer.querySelector('.cl-userButtonTrigger') ||
                                   userButtonContainer.querySelector('[data-testid="clerk-user-button"]');
        
        if (existingClerkButton) {
            console.log('⚠️ 用戶按鈕已存在，跳過重複掛載');
            return;
        }
        
        console.log('✅ 容器中無 Clerk 按鈕，可以進行掛載');
        
        // 清理容器中的註釋和文本節點，只保留實際元素
        const childNodes = Array.from(userButtonContainer.childNodes);
        childNodes.forEach(node => {
            if (node.nodeType === Node.COMMENT_NODE || 
                (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '')) {
                userButtonContainer.removeChild(node);
            }
        });
        
        console.log('🧹 清理容器後，子節點數量:', userButtonContainer.childNodes.length);
        
        // 掛載 Clerk UserButton
        if (this.clerk) {
            try {
                console.log('🔧 準備掛載 Clerk UserButton...');
                console.log('🔧 Clerk 配置:', CLERK_CONFIG.LOAD_OPTIONS?.appearance);
                
                this.clerk.mountUserButton(userButtonContainer, {
                    appearance: CLERK_CONFIG.LOAD_OPTIONS?.appearance || {},
                    localization: window.ClerkLocalizations?.zhTW || 'zh-TW',
                    userProfileProps: {
                        appearance: CLERK_CONFIG.LOAD_OPTIONS?.appearance || {},
                        localization: window.ClerkLocalizations?.zhTW || 'zh-TW'
                    }
                });
                
                console.log('✅ Clerk UserButton 掛載調用成功');
                
                // 延遲檢查掛載結果
                setTimeout(() => {
                    console.log('🔍 掛載後檢查:');
                    console.log('  - 容器子節點數量:', userButtonContainer.childNodes.length);
                    console.log('  - 容器 innerHTML:', userButtonContainer.innerHTML);
                    console.log('  - 是否有 Clerk 按鈕:', !!userButtonContainer.querySelector('[data-clerk-user-button]'));
                }, 500);
                
            } catch (error) {
                console.error('❌ 掛載用戶按鈕失敗:', error);
                console.error('❌ 錯誤詳情:', error.message);
                console.error('❌ 錯誤堆疊:', error.stack);
            }
        } else {
            console.error('❌ Clerk 實例不存在，無法掛載用戶按鈕');
        }
    }
    
    // 移除用戶按鈕
    removeUserButton() {
        const userButton = DOMUtils.get('#userButton');
        if (userButton) {
            try {
                // 安全地清除內容，避免 DOM 操作錯誤
                while (userButton.firstChild) {
                    userButton.removeChild(userButton.firstChild);
                }
            } catch (error) {
                console.warn('清除用戶按鈕時發生錯誤:', error);
                // 如果移除失敗，嘗試直接設置 innerHTML
                userButton.innerHTML = '';
            }
        }
    }
    
    // 設置 Clerk 載入監聽器
    setupClerkLoadListener() {
        // 監聽 Clerk 成功載入並初始化完成事件
        window.addEventListener('clerk:ready', () => {
            console.log('🎉 Clerk 已準備就緒');
            this.clerk = window.Clerk;
            this.isInitialized = true;
            this.isInitializing = false;
            this.setupClerkListeners();
            this.handleUserChange(this.clerk.user);
            
            // 強制執行初始 UI 更新
            setTimeout(() => {
                console.log('🔄 執行強制 UI 更新...');
                this.updateAuthUI();
            }, 100);
        });

        // 監聽 Clerk 載入失敗事件
        window.addEventListener('clerk:load-failed', () => {
            console.error('❗ Clerk 載入失敗，無法繼續');
            this.isInitialized = true;
            this.showLoginUI();
            authPage.showError('身份驗證系統無法載入，請按照 CLERK_SETUP.md 指南正確設置 Publishable Key');
        });
    }
    
    // 設置 Clerk 監聽器
    setupClerkListeners() {
        if (!this.clerk) {
            console.error('❌ Clerk 實例不存在');
            return;
        }

        // 監聽用戶狀態變化
        this.clerk.addListener(({ user }) => {
            this.handleUserChange(user);
        });

        console.log('✅ Clerk 監聽器設置完成');
    }
    
    
    // 處理用戶狀態變化
    handleUserChange(user) {
        console.log('👤 處理用戶狀態變化:', !!user);
        console.log('👤 用戶詳情:', user ? {
            fullName: user.fullName,
            email: user.primaryEmailAddress?.emailAddress,
            id: user.id,
            hasMetadata: !!user.publicMetadata
        } : 'null');
        
        // 檢查用戶狀態是否真的改變了
        const userChanged = this.currentUser !== user;
        const previousRole = this.currentUserRole;
        
        console.log('🔄 狀態變更檢查:');
        console.log('  - 用戶改變:', userChanged);
        console.log('  - 之前角色:', previousRole);
        
        this.currentUser = user;
        
        if (user) {
            // 用戶已登入，從 metadata 取得角色
            this.currentUserRole = this.getUserRoleFromMetadata(user);
            if (userChanged) {
                console.log(`✅ 用戶已登入: ${user.fullName || user.primaryEmailAddress?.emailAddress}`);
                console.log(`👤 用戶角色: ${this.getRoleLabel(this.currentUserRole)}`);
            }
        } else {
            // 用戶未登入
            this.currentUserRole = null;
            if (userChanged) {
                console.log('🔓 用戶未登入');
            }
        }
        
        console.log('🔄 當前角色:', this.currentUserRole);
        
        // 只有在用戶或角色真的改變時才更新 UI
        if (userChanged || previousRole !== this.currentUserRole) {
            console.log('🔄 需要更新 UI，執行調整...');
            this.adjustUIForRole();
            this.updateAuthUI();
        } else {
            console.log('⏭️ 無需更新 UI，狀態未改變');
        }
    }
    
    // 從用戶 metadata 取得角色
    getUserRoleFromMetadata(user) {
        if (!user || !user.publicMetadata) {
            return CLERK_CONFIG.ROLE_MAPPING.DEFAULT_ROLE;
        }
        
        const role = user.publicMetadata[CLERK_CONFIG.ROLE_MAPPING.ROLE_KEY];
        
        // 驗證角色是否有效
        if (Object.values(USER_ROLES).includes(role)) {
            return role;
        }
        
        return CLERK_CONFIG.ROLE_MAPPING.DEFAULT_ROLE;
    }
    
    // 取得角色中文標籤
    getRoleLabel(role) {
        return CLERK_CONFIG.ROLE_MAPPING.ROLE_LABELS[role] || role;
    }
    
    // 更新認證相關 UI
    updateAuthUI() {
        console.log('🔄 更新認證 UI，用戶登入狀態:', this.isSignedIn());
        
        // 如果用戶未登入，顯示登入界面
        if (!this.isSignedIn()) {
            this.showLoginUI();
            return;
        }
        
        // 如果用戶已登入，顯示主應用
        this.showMainApp();
    }
    
    // 顯示登入界面
    showLoginUI() {
        console.log('🔐 顯示登入界面...');
        console.log('🔍 Clerk 狀態:', !!this.clerk, '初始化狀態:', this.isInitialized);
        
        authPage.show();
        
        // 如果 Clerk 可用，掛載登入組件
        if (this.clerk && this.isInitialized) {
            console.log('✅ 準備掛載 Clerk 登入組件...');
            // 使用 setTimeout 確保 DOM 更新完成
            setTimeout(() => {
                this.mountClerkSignIn();
            }, 50);
        } else {
            console.log('⚠️ Clerk 未準備就緒，等待中...');
            if (!this.clerk) console.log('❌ Clerk 實例不存在');
            if (!this.isInitialized) console.log('❌ AuthManager 未初始化');
        }
    }
    
    // 顯示主應用
    showMainApp() {
        authPage.hide();
    }
    
    // 創建登入容器 (已棄用，現在使用 authPage 組件)
    createLoginContainer() {
        // 這個函數不再使用，所有登入 UI 都由 AuthPage 組件處理
        console.warn('createLoginContainer 已棄用，請使用 AuthPage 組件');
        return;
    }
    
    // 掛載 Clerk 登入組件
    mountClerkSignIn() {
        if (!this.clerk) {
            authPage.showError('身份驗證系統尚未準備就緒');
            return;
        }
        
        // 等待 DOM 元素可用
        const tryMount = () => {
            const signInDiv = document.querySelector('#clerk-auth-container');
            if (signInDiv) {
                try {
                    authPage.hideLoading();
                    this.clerk.mountSignIn(signInDiv, {
                        appearance: CLERK_CONFIG.LOAD_OPTIONS?.appearance || {},
                        localization: window.ClerkLocalizations?.zhTW || 'zh-TW'
                    });
                    console.log('✅ Clerk 登入組件已成功掛載');
                } catch (error) {
                    console.error('掛載 Clerk 登入組件失敗:', error);
                    authPage.showError('無法載入登入介面，請重新整理頁面');
                }
            } else {
                // 如果元素不存在，稍後再試
                console.log('🔍 等待 #clerk-auth-container 元素...');
                setTimeout(tryMount, 100);
            }
        };
        
        tryMount();
    }
    
    // 檢查是否已登入
    isSignedIn() {
        console.log('🔍 檢查登入狀態:');
        console.log('  - isInitialized:', this.isInitialized);
        console.log('  - clerk 存在:', !!this.clerk);
        console.log('  - clerk.user 存在:', !!(this.clerk && this.clerk.user));
        
        if (!this.isInitialized || !this.clerk) {
            console.log('❌ Clerk 未初始化或不存在');
            return false;
        }
        
        // 根據官方文檔，使用 clerk.user 來檢查登入狀態
        const signedIn = !!this.clerk.user;
        console.log('✅ 最終登入狀態:', signedIn);
        return signedIn;
    }
    
    // 登出
    async signOut() {
        if (this.clerk) {
            try {
                await this.clerk.signOut();
                console.log('✅ 用戶已登出');
            } catch (error) {
                console.error('❌ 登出失敗:', error);
            }
        }
    }
    
    // 取得當前用戶資訊
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 初始化權限系統
    async init() {
        if (this.isInitializing) {
            console.log('⚠️ AuthManager 正在初始化中，跳過重複調用');
            return;
        }
        
        if (this.isInitialized) {
            console.log('⚠️ AuthManager 已經初始化，跳過重複調用');
            return;
        }
        
        this.isInitializing = true;
        console.log('🚀 AuthManager 初始化中...');
        
        try {
            // Clerk 初始化會在 setupClerkLoadListener 中處理
            // 初始化完成標記會在 Clerk 事件監聽器中設置
        } catch (error) {
            console.error('❌ AuthManager 初始化失敗:', error);
            this.isInitializing = false;
        }
    }
    
    // 調試用：手動檢查當前狀態
    debugCurrentState() {
        console.log('🐛 === AuthManager 當前狀態 ===');
        console.log('isInitialized:', this.isInitialized);
        console.log('isInitializing:', this.isInitializing);
        console.log('clerk 存在:', !!this.clerk);
        console.log('currentUser:', this.currentUser);
        console.log('currentUserRole:', this.currentUserRole);
        console.log('isSignedIn():', this.isSignedIn());
        
        if (this.clerk) {
            console.log('clerk.user:', this.clerk.user);
        }
        
        const userButtonContainer = document.querySelector('#userButton');
        console.log('userButton 容器存在:', !!userButtonContainer);
        if (userButtonContainer) {
            console.log('userButton 容器內容:', userButtonContainer.innerHTML);
            console.log('userButton 子節點數:', userButtonContainer.childNodes.length);
        }
        
        console.log('=== 狀態檢查完成 ===');
    }
}

// 全域調試函數
window.debugAuth = function() {
    if (window.authManager) {
        window.authManager.debugCurrentState();
    } else {
        console.log('❌ AuthManager 未找到');
    }
};

// 強制重新掛載用戶按鈕
window.forceRemountUserButton = function() {
    if (window.authManager) {
        console.log('🔄 強制重新掛載用戶按鈕...');
        window.authManager.removeUserButton();
        setTimeout(() => {
            window.authManager.addUserButtonToNav();
        }, 100);
    } else {
        console.log('❌ AuthManager 未找到');
    }
};