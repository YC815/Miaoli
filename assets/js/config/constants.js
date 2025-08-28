/**
 * 應用程序常數配置
 */

// 用戶角色配置
export const USER_ROLES = {
    VOLUNTEER: 'volunteer',
    STAFF: 'staff',
    ADMIN: 'admin'
};

export const ROLE_HIERARCHY = {
    [USER_ROLES.VOLUNTEER]: 0,
    [USER_ROLES.STAFF]: 1,
    [USER_ROLES.ADMIN]: 2
};

// 統計數據配置
export const STATS_CONFIG = [
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

// 預設庫存品項
export const INVENTORY_ITEMS_LIST = [
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

// 領取單位選項
export const RECIPIENT_UNITS = [
    '苗栗縣政府社會處',
    '苗栗家扶中心',
    '苗栗縣愛心協會',
    '苗栗縣老人福利協進會',
    '苗栗縣身心障礙福利協進會',
    '苗栗縣單親家庭服務中心',
    '苗栗縣兒童及少年關懷協會',
    '頭份市公所',
    '竹南鎮公所',
    '苗栗市公所',
    '通霄鎮公所',
    '卓蘭鎮公所',
    '造橋鄉公所',
    '頭屋鄉公所',
    '公館鄉公所',
    '大湖鄉公所',
    '泰安鄉公所',
    '銅鑼鄉公所',
    '三義鄉公所',
    '西湖鄉公所',
    '三灣鄉公所',
    '南庄鄉公所',
    '獅潭鄉公所',
    '後龍鎮公所',
    '個人領取',
    '其他'
];

// 捐贈類型
export const DONATION_TYPES = [
    { value: 'donation', label: '個人捐贈' },
    { value: 'corporate', label: '企業捐贈' },
    { value: 'designated', label: '指定捐贈' }
];

// 操作類型
export const OPERATION_TYPES = {
    DONATION: 'donation',
    PICKUP: 'pickup',
    ADJUSTMENT: 'adjustment',
    EDIT: 'edit'
};

// 庫存狀態
export const STOCK_STATUS = {
    AVAILABLE: 'available',
    LOW: 'low',
    EMPTY: 'empty'
};

// 標籤頁
export const TABS = {
    INVENTORY: 'inventory',
    DONATION: 'donation',
    RECORDS: 'records'
};

// 預設值
export const DEFAULTS = {
    SAFETY_STOCK: 5,
    ITEM_UNIT: '個',
    EXPIRY_WARNING_DAYS: 30
};

// 本地儲存鍵名
export const STORAGE_KEYS = {
    CHARITY_ITEMS: 'charityItems',
    USER_ROLE: 'userRole',
    SETTINGS: 'appSettings'
};

// 錯誤訊息
export const ERROR_MESSAGES = {
    PERMISSION_DENIED: '您沒有權限執行此操作',
    INVALID_QUANTITY: '請輸入有效的數量',
    REQUIRED_FIELD: '此欄位為必填',
    INVALID_DATA: '數據格式不正確',
    STORAGE_ERROR: '儲存失敗，請重試',
    NETWORK_ERROR: '網路連線失敗'
};