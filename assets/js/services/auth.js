/**
 * 權限管理模塊
 */
import { USER_ROLES, ROLE_HIERARCHY, ERROR_MESSAGES } from '../config/constants.js';
import { DOMUtils } from '../utils/dom.js';

export class AuthManager {
    constructor() {
        this.currentUserRole = USER_ROLES.ADMIN; // 預設管理員權限
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
                    alert(ERROR_MESSAGES.PERMISSION_DENIED);
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
            alert(ERROR_MESSAGES.PERMISSION_DENIED);
            return null;
        }
    }
    
    // 根據角色調整UI
    adjustUIForRole() {
        const role = this.currentUserRole;
        
        // 根據角色隱藏/顯示功能按鈕
        const adminOnlyElements = [
            '#stockAdjustBtn'
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
    }
    
    // 檢查標籤頁權限
    canAccessTab(tab) {
        if (this.currentUserRole === USER_ROLES.VOLUNTEER) {
            return tab === 'inventory';
        }
        return true;
    }
    
    // 初始化權限系統
    init() {
        this.adjustUIForRole();
    }
}