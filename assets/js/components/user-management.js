/**
 * 用戶管理組件
 * 僅供管理員使用的用戶角色管理界面
 */

import { USER_ROLES } from '../config/constants.js';
import { CLERK_CONFIG } from '../config/clerk-config.js';
import { DOMUtils } from '../utils/dom.js';

export class UserManagement {
    constructor(authManager) {
        this.authManager = authManager;
        this.users = [];
    }
    
    // 創建用戶管理 Modal
    createUserManagementModal() {
        if (!this.authManager.checkPermission(USER_ROLES.ADMIN)) {
            console.error('❌ 權限被拒絕: 您沒有權限管理用戶');
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'userManagementModal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900">用戶管理</h3>
                        <button onclick="closeUserManagementModal()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="mb-4">
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 class="text-sm font-medium text-blue-800 mb-2">注意事項</h4>
                            <p class="text-sm text-blue-700">
                                • 用戶管理功能需要後端 API 支持<br>
                                • 當前版本僅支援前端角色測試<br>
                                • 實際部署需要配置 Clerk Backend API
                            </p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 class="text-sm font-medium text-green-800 mb-2">
                                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                                    </svg>
                                    志工權限
                                </h4>
                                <p class="text-xs text-green-700">僅能查看物資庫存清單</p>
                            </div>
                            
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 class="text-sm font-medium text-blue-800 mb-2">
                                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2"></path>
                                    </svg>
                                    工作人員權限
                                </h4>
                                <p class="text-xs text-blue-700">可管理物資、捐贈、發放記錄</p>
                            </div>
                            
                            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h4 class="text-sm font-medium text-purple-800 mb-2">
                                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                    管理員權限
                                </h4>
                                <p class="text-xs text-purple-700">完整系統管理權限</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h4 class="text-lg font-medium text-gray-900 mb-3">測試角色切換</h4>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p class="text-sm text-gray-600 mb-3">選擇要測試的角色 (僅限開發/測試環境):</p>
                            <div class="flex gap-3">
                                <button onclick="testRole('volunteer')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    切換到志工
                                </button>
                                <button onclick="testRole('staff')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    切換到工作人員
                                </button>
                                <button onclick="testRole('admin')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    切換到管理員
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-2">
                                當前角色: <span id="currentRoleDisplay" class="font-medium text-gray-700">${this.authManager.getRoleLabel(this.authManager.getCurrentRole())}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="text-lg font-medium text-gray-900 mb-3">Clerk 設置指南</h4>
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h5 class="text-sm font-medium text-yellow-800 mb-2">設置步驟:</h5>
                            <ol class="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
                                <li>前往 <a href="https://dashboard.clerk.com" target="_blank" class="underline">Clerk Dashboard</a></li>
                                <li>獲取您的 Publishable Key</li>
                                <li>更新 <code class="bg-yellow-100 px-1 rounded">assets/js/config/clerk-config.js</code> 中的 PUBLISHABLE_KEY</li>
                                <li>在 Clerk Dashboard 中為用戶設置 metadata: <code class="bg-yellow-100 px-1 rounded">miaoli_role</code></li>
                                <li>重新載入頁面測試登入功能</li>
                            </ol>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button onclick="closeUserManagementModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200">
                        關閉
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // 測試角色切換 (僅限開發環境)
    testRoleSwitch(role) {
        if (!Object.values(USER_ROLES).includes(role)) {
            console.error('無效的角色:', role);
            return;
        }
        
        console.log(`🔧 測試模式: 切換角色到 ${role}`);
        this.authManager.currentUserRole = role;
        this.authManager.adjustUIForRole();
        
        // 更新顯示
        const currentRoleDisplay = document.getElementById('currentRoleDisplay');
        if (currentRoleDisplay) {
            currentRoleDisplay.textContent = this.authManager.getRoleLabel(role);
        }
        
        console.log('✅ 角色切換成功:', this.authManager.getRoleLabel(role));
    }
    
    // 關閉用戶管理 Modal
    closeModal() {
        const modal = DOMUtils.get('#userManagementModal');
        if (modal) {
            DOMUtils.remove(modal);
        }
    }
}

// 全域函數，供 HTML onclick 使用
window.closeUserManagementModal = function() {
    const modal = DOMUtils.get('#userManagementModal');
    if (modal) {
        DOMUtils.remove(modal);
    }
};

window.testRole = function(role) {
    if (window.MiaoliApp) {
        const authManager = window.MiaoliApp.getModule('auth');
        const userManagement = new UserManagement(authManager);
        userManagement.testRoleSwitch(role);
    }
};

export default UserManagement;