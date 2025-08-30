/**
 * 登入頁面組件
 * 顯示登入/註冊介面
 */

export class AuthPage {
    constructor() {
        this.element = null;
    }

    /**
     * 創建登入頁面元素
     * @returns {HTMLElement} 登入頁面元素
     */
    createElement() {
        const authPageHTML = `
            <div id="authPage" class="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <!-- 背景裝飾 -->
                <div class="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-100"></div>
                
                <!-- 主要內容 -->
                <div class="relative z-10 w-full max-w-md mx-auto px-4">
                    <!-- Logo 區域 -->
                    <div class="text-center mb-8">
                        <div class="inline-block p-3 rounded-full bg-green-100 mb-4">
                            <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">苗栗物資管理平台</h1>
                        <p class="text-gray-600">T-Cross x 苗栗物資共享站 合作開發</p>
                    </div>

                    <!-- 純 Clerk 身份驗證區域 -->
                    <div id="clerk-auth-container" class="w-full">
                        <!-- Clerk 登入/註冊組件將在這裡載入 -->
                    </div>

                    <!-- 載入狀態 -->
                    <div id="auth-loading" class="text-center py-8">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p class="text-gray-600 mt-2">正在載入登入系統...</p>
                    </div>

                    <!-- 錯誤訊息 -->
                    <div id="auth-error" class="hidden bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div class="flex items-start">
                            <svg class="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                            </svg>
                            <div>
                                <h3 class="text-sm font-medium text-red-800">登入系統載入失敗</h3>
                                <p class="text-sm text-red-700 mt-1" id="auth-error-message">
                                    請檢查網路連線或按照設置指南配置 Clerk 身份驗證
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 頁腳資訊 -->
                    <div class="text-center mt-8 text-sm text-gray-500">
                        <p>&copy; 2024 苗栗社福促進協會 x T-Cross</p>
                        <p class="mt-1">
                            <a href="#" class="text-green-600 hover:text-green-700">隱私政策</a>
                            <span class="mx-2">•</span>
                            <a href="#" class="text-green-600 hover:text-green-700">服務條款</a>
                        </p>
                    </div>
                </div>
            </div>
        `;

        // 創建元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = authPageHTML;
        this.element = tempDiv.firstElementChild;

        // 綁定事件
        this.bindEvents();

        return this.element;
    }

    /**
     * 綁定事件處理器
     */
    bindEvents() {
        // 移除離線模式相關事件綁定
        // 未來可能需要綁定其他事件
    }


    /**
     * 顯示錯誤訊息
     * @param {string} message 錯誤訊息
     */
    showError(message) {
        if (!this.element) return;

        const errorElement = this.element.querySelector('#auth-error');
        const errorMessageElement = this.element.querySelector('#auth-error-message');
        const loadingElement = this.element.querySelector('#auth-loading');

        if (errorElement && errorMessageElement) {
            errorMessageElement.textContent = message;
            errorElement.classList.remove('hidden');
        }

        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * 隱藏載入狀態
     */
    hideLoading() {
        if (!this.element) return;

        const loadingElement = this.element.querySelector('#auth-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * 顯示登入頁面
     */
    show() {
        if (!this.element) {
            this.createElement();
        }
        
        // 添加到 body
        document.body.appendChild(this.element);
        
        // 隱藏主應用
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'none';
        }
    }

    /**
     * 隱藏登入頁面
     */
    hide() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // 顯示主應用
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'block';
        }
    }

    /**
     * 清理資源
     */
    destroy() {
        this.hide();
        this.element = null;
    }
}

// 匯出單例實例
export const authPage = new AuthPage();