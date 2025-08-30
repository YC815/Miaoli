// Tailwind CSS 配置
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    'chinese': ['Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', 'sans-serif']
                }
            }
        }
    };
    console.log('🎨 Tailwind CSS 配置已載入');
} else {
    console.warn('⚠️ Tailwind CSS 尚未載入，稍後會重試配置');
    
    // 為中文字體添加 CSS 變數（備用方案）
    if (typeof document !== 'undefined') {
        const style = document.createElement('style');
        style.textContent = `
            .font-chinese {
                font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', sans-serif;
            }
        `;
        document.head.appendChild(style);
    }
}