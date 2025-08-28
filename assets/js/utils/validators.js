/**
 * 表單驗證工具模塊
 */
export const Validators = {
    // 基本驗證
    isEmpty(value) {
        return !value || value.toString().trim() === '';
    },
    
    isValidNumber(value, min = 0, max = Infinity) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    },
    
    isValidPhone(phone) {
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        return phoneRegex.test(phone);
    },
    
    isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    },
    
    // 物資相關驗證
    validateItem(item) {
        const errors = [];
        
        if (this.isEmpty(item.name)) {
            errors.push('物資名稱不能為空');
        }
        
        if (!this.isValidNumber(item.quantity, 0)) {
            errors.push('數量必須是大於等於0的數字');
        }
        
        if (item.safetyStock !== undefined && !this.isValidNumber(item.safetyStock, 0)) {
            errors.push('安全庫存量必須是大於等於0的數字');
        }
        
        if (item.expiryDate && !this.isValidDate(item.expiryDate)) {
            errors.push('有效日期格式不正確');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    validateDonor(donor) {
        const errors = [];
        
        if (this.isEmpty(donor.name)) {
            errors.push('捐贈者姓名不能為空');
        }
        
        if (donor.phone && !this.isValidPhone(donor.phone)) {
            errors.push('聯絡電話格式不正確');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    validatePickup(pickup) {
        const errors = [];
        
        if (!this.isValidNumber(pickup.quantity, 1)) {
            errors.push('領取數量必須是大於0的數字');
        }
        
        if (this.isEmpty(pickup.recipientUnit)) {
            errors.push('領取單位不能為空');
        }
        
        if (pickup.phone && !this.isValidPhone(pickup.phone)) {
            errors.push('聯絡電話格式不正確');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    // 批量驗證
    validateItemsBatch(items) {
        const results = items.map((item, index) => ({
            index,
            ...this.validateItem(item)
        }));
        
        const allValid = results.every(result => result.isValid);
        const allErrors = results
            .filter(result => !result.isValid)
            .map(result => `第 ${result.index + 1} 項: ${result.errors.join(', ')}`);
        
        return {
            isValid: allValid,
            errors: allErrors,
            results
        };
    }
};