/**
 * DOM操作工具模塊
 */
export const DOMUtils = {
    // 獲取元素
    get(selector) {
        return document.querySelector(selector);
    },
    
    getById(id) {
        return document.getElementById(id);
    },
    
    getAll(selector) {
        return document.querySelectorAll(selector);
    },
    
    // 元素操作
    hide(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.add('hidden');
    },
    
    show(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.remove('hidden');
    },
    
    toggle(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.toggle('hidden');
    },
    
    // 類別操作
    addClass(element, className) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.add(className);
    },
    
    removeClass(element, className) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        element?.classList.remove(className);
    },
    
    // 內容操作
    setHTML(element, html) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) {
            element.innerHTML = html;
        }
    },
    
    setText(element, text) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) {
            element.textContent = text;
        }
    },
    
    getValue(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        return element?.value || '';
    },
    
    setValue(element, value) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) {
            element.value = value;
        }
    },
    
    // 事件委託
    delegate(parentSelector, eventType, targetSelector, handler) {
        const parent = this.get(parentSelector);
        if (parent) {
            parent.addEventListener(eventType, (e) => {
                if (e.target.matches(targetSelector)) {
                    handler.call(e.target, e);
                }
            });
        }
    },
    
    // 清空容器
    clear(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) {
            element.innerHTML = '';
        }
    }
};