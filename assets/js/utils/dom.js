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
        let parent;
        if (typeof parentSelector === 'string') {
            parent = this.get(parentSelector);
        } else if (parentSelector && parentSelector.nodeType) {
            // 如果傳入的是DOM元素
            parent = parentSelector;
        }
        
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
    },
    
    // 移除元素
    remove(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },
    
    // 創建元素
    createElement(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);
        
        // 設置屬性
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        // 設置文字內容
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    },
    
    // 檢查元素是否存在
    exists(selector) {
        return !!this.get(selector);
    }
};