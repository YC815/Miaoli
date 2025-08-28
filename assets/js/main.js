/**
 * 苗栗物資管理平台 - 重構版主程序
 * 整合所有模塊，提供統一的應用程序入口
 */

// 模塊導入
import { DOMUtils } from './utils/dom.js';
import { StorageManager } from './utils/storage.js';
import { Validators } from './utils/validators.js';
import { USER_ROLES } from './config/constants.js';

import { AuthManager } from './services/auth.js';
import { DataManager } from './services/dataManager.js';
import { UIRenderer } from './services/uiRenderer.js';
import { EventManager } from './services/eventManager.js';
import { ModalManager } from './services/modalManager.js';
import { InventoryManager } from './services/inventory.js';
import { DonationsManager } from './services/donations.js';
import { DistributionManager } from './services/distribution.js';
import { FormHandler } from './services/formHandler.js';

/**
 * 苗栗物資管理應用程序主類
 */
class MiaoliApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        
        this.initModules();
        this.bindGlobalEvents();
        
        console.log('苗栗物資管理平台已啟動');
    }
    
    /**
     * 初始化所有模塊
     */
    initModules() {
        try {
            // 核心模塊初始化
            this.modules.auth = new AuthManager();
            this.modules.dataManager = new DataManager();
            
            // UI模塊初始化
            this.modules.uiRenderer = new UIRenderer(this.modules.dataManager, this.modules.auth);
            this.modules.modalManager = new ModalManager(this.modules.dataManager);
            
            // 業務邏輯模塊初始化
            this.modules.inventory = new InventoryManager(this.modules.dataManager, this.modules.uiRenderer);
            this.modules.donations = new DonationsManager(this.modules.dataManager, this.modules.uiRenderer);
            this.modules.distribution = new DistributionManager(this.modules.dataManager, this.modules.uiRenderer);
            
            // 表單處理模塊初始化
            this.modules.formHandler = new FormHandler(
                this.modules.dataManager,
                this.modules.inventory,
                this.modules.donations,
                this.modules.distribution
            );
            
            // 事件管理模塊初始化 (最後初始化，因為需要依賴其他模塊)
            this.modules.eventManager = new EventManager(
                this.modules.auth,
                this.modules.dataManager,
                this.modules.modalManager,
                this.modules.uiRenderer
            );
            
            // 設置模塊間的交叉引用
            this.setupModuleReferences();
            
            console.log('所有模塊初始化完成');
            
        } catch (error) {
            console.error('模塊初始化失敗:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * 設置模塊間的交叉引用
     */
    setupModuleReferences() {
        // EventManager 需要訪問業務邏輯模塊
        this.modules.eventManager.inventoryManager = this.modules.inventory;
        this.modules.eventManager.donationsManager = this.modules.donations;
        this.modules.eventManager.distributionManager = this.modules.distribution;
        this.modules.eventManager.formHandler = this.modules.formHandler;
        
        // UIRenderer 需要訪問業務邏輯模塊
        this.modules.uiRenderer.inventoryManager = this.modules.inventory;
        this.modules.uiRenderer.donationsManager = this.modules.donations;
        this.modules.uiRenderer.distributionManager = this.modules.distribution;
    }
    
    /**
     * 應用程序初始化
     */
    async init() {
        if (this.isInitialized) {
            console.warn('應用程序已經初始化');
            return;
        }
        
        try {
            // 等待DOM完全載入
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // 初始化各模塊
            await this.initializeModules();
            
            // 設置初始狀態
            this.setupInitialState();
            
            // 標記為已初始化
            this.isInitialized = true;
            
            console.log('苗栗物資管理平台初始化完成');
            
        } catch (error) {
            console.error('應用程序初始化失敗:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * 初始化各個模塊
     */
    async initializeModules() {
        // 權限系統初始化
        this.modules.auth.init();
        
        // UI渲染器初始化
        this.modules.uiRenderer.init();
        
        // 表單處理器初始化
        this.modules.formHandler.init();
        
        // 事件管理器初始化 (最後初始化)
        this.modules.eventManager.init();
        
        console.log('所有模塊初始化完成');
    }
    
    /**
     * 設置初始狀態
     */
    setupInitialState() {
        // 設置默認標籤頁
        this.modules.uiRenderer.switchTab('inventory');
        
        // 檢查庫存警告
        const warnings = this.modules.inventory.checkStockWarnings();
        if (warnings.length > 0) {
            console.log('庫存警告:', warnings);
            // 可以在這裡顯示警告通知
        }
        
        // 設置條碼掃描器 (如果需要)
        this.initializeBarcodeScanner();
    }
    
    /**
     * 初始化條碼掃描器
     */
    initializeBarcodeScanner() {
        try {
            // 檢查是否載入了 ZXing 庫
            if (typeof ZXing !== 'undefined') {
                this.codeReader = new ZXing.BrowserBarcodeReader();
                console.log('條碼掃描器初始化成功');
            } else {
                console.warn('ZXing 庫未載入，條碼掃描功能不可用');
            }
        } catch (error) {
            console.warn('條碼掃描器初始化失敗:', error);
        }
    }
    
    /**
     * 綁定全域事件
     */
    bindGlobalEvents() {
        // 視窗大小改變事件
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        
        // 頁面卸載前事件
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // 錯誤處理
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }
    
    /**
     * 處理視窗大小改變
     */
    handleWindowResize() {
        // 響應式處理邏輯
        this.modules.uiRenderer?.handleResize();
    }
    
    /**
     * 處理頁面卸載前事件
     */
    handleBeforeUnload(event) {
        // 檢查是否有未儲存的變更
        const hasUnsavedChanges = this.checkUnsavedChanges();
        if (hasUnsavedChanges) {
            event.preventDefault();
            event.returnValue = '您有未儲存的變更，確定要離開嗎？';
            return event.returnValue;
        }
    }
    
    /**
     * 檢查未儲存的變更
     */
    checkUnsavedChanges() {
        // 檢查表單是否有未儲存的內容
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const formData = new FormData(form);
            const hasData = Array.from(formData.entries()).some(([key, value]) => 
                value && value.toString().trim() !== ''
            );
            if (hasData && !form.closest('.hidden')) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 處理全域錯誤
     */
    handleGlobalError(event) {
        console.error('全域錯誤:', event.error);
        this.showErrorMessage('發生未預期的錯誤，請重新整理頁面或聯繫系統管理員');
    }
    
    /**
     * 處理未捕捉的Promise拒絕
     */
    handleUnhandledRejection(event) {
        console.error('未處理的Promise拒絕:', event.reason);
        this.showErrorMessage('操作失敗，請稍後重試');
        
        // 防止錯誤顯示在控制台
        event.preventDefault();
    }
    
    /**
     * 處理鍵盤快捷鍵
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S: 儲存
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.handleQuickSave();
        }
        
        // Escape: 關閉所有 Modal
        if (event.key === 'Escape') {
            this.modules.modalManager?.closeAll();
        }
        
        // F1: 顯示說明
        if (event.key === 'F1') {
            event.preventDefault();
            this.showHelp();
        }
    }
    
    /**
     * 快速儲存處理
     */
    handleQuickSave() {
        // 檢查當前是否有開啟的表單
        const activeModal = document.querySelector('.fixed:not(.hidden)');
        if (activeModal) {
            const saveButton = activeModal.querySelector('[data-action="save-item"], [data-action="confirm-pickup"]');
            if (saveButton) {
                saveButton.click();
            }
        }
    }
    
    /**
     * 顯示說明
     */
    showHelp() {
        const helpContent = `
            <h3>快捷鍵說明</h3>
            <ul>
                <li>Ctrl/Cmd + S: 儲存當前表單</li>
                <li>Escape: 關閉彈窗</li>
                <li>F1: 顯示此說明</li>
            </ul>
            <h3>功能說明</h3>
            <ul>
                <li>物資管理: 新增、編輯、領取物資</li>
                <li>捐贈管理: 記錄捐贈、產生收據</li>
                <li>發放管理: 單項或批量發放物資</li>
            </ul>
        `;
        
        this.showInfoMessage(helpContent, '使用說明');
    }
    
    /**
     * 處理初始化錯誤
     */
    handleInitializationError(error) {
        const errorMessage = `
            應用程序初始化失敗。<br>
            錯誤訊息: ${error.message}<br><br>
            請嘗試以下解決方案：<br>
            1. 重新整理頁面<br>
            2. 清除瀏覽器快取<br>
            3. 檢查網路連線<br>
            4. 聯繫系統管理員
        `;
        
        this.showErrorMessage(errorMessage);
    }
    
    /**
     * 顯示錯誤訊息
     */
    showErrorMessage(message, title = '錯誤') {
        // 可以替換為更優雅的通知系統
        alert(`${title}\n\n${message}`);
    }
    
    /**
     * 顯示資訊訊息
     */
    showInfoMessage(message, title = '資訊') {
        // 可以替換為更優雅的通知系統
        alert(`${title}\n\n${message}`);
    }
    
    /**
     * 顯示成功訊息
     */
    showSuccessMessage(message, title = '成功') {
        // 可以替換為更優雅的通知系統
        console.log(`${title}: ${message}`);
    }
    
    /**
     * 應用程序銷毀
     */
    destroy() {
        // 清理事件監聽器
        window.removeEventListener('resize', this.handleWindowResize.bind(this));
        window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.removeEventListener('error', this.handleGlobalError.bind(this));
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        document.removeEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // 清理模塊
        Object.values(this.modules).forEach(module => {
            if (typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.modules = {};
        this.isInitialized = false;
        
        console.log('應用程序已銷毀');
    }
    
    /**
     * 獲取模塊實例 (用於調試)
     */
    getModule(moduleName) {
        return this.modules[moduleName];
    }
    
    /**
     * 獲取應用狀態 (用於調試)
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            modules: Object.keys(this.modules),
            dataStats: this.modules.dataManager?.getStats(),
            currentUser: this.modules.auth?.getCurrentRole()
        };
    }
}

/**
 * 全域應用程序實例
 */
let app = null;

/**
 * 應用程序啟動函數
 */
async function startApp() {
    if (app) {
        console.warn('應用程序已經在運行');
        return app;
    }
    
    try {
        app = new MiaoliApp();
        await app.init();
        
        // 將應用程序實例掛載到全域範圍 (便於調試)
        window.MiaoliApp = app;
        
        return app;
        
    } catch (error) {
        console.error('應用程序啟動失敗:', error);
        throw error;
    }
}

/**
 * 應用程序重啟函數
 */
async function restartApp() {
    if (app) {
        app.destroy();
        app = null;
    }
    
    return await startApp();
}

// 自動啟動應用程序
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// 導出主要接口
export { MiaoliApp, startApp, restartApp };