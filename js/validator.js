/**
 * TodoValidator - 数据验证器
 * 负责验证待办事项数据的合法性和安全性
 */
class TodoValidator {
    constructor() {
        this.rules = {
            text: {
                minLength: 1,
                maxLength: 200,
                required: true,
                pattern: /^[^<>]*$/ // 防止XSS攻击
            },
            id: {
                required: true,
                pattern: /^[a-zA-Z0-9_-]+$/
            },
            completed: {
                required: true,
                type: 'boolean'
            },
            createdAt: {
                required: true,
                type: 'string',
                pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
            },
            updatedAt: {
                required: true,
                type: 'string',
                pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
            }
        };
    }

    /**
     * 验证待办事项文本
     * @param {string} text - 待验证的文本
     * @returns {Object} 验证结果 {isValid: boolean, errors: string[]}
     */
    validateTodoText(text) {
        const errors = [];
        
        if (!this.rules.text.required && (text === undefined || text === null)) {
            return { isValid: true, errors: [] };
        }
        
        if (this.rules.text.required && (!text || text.trim() === '')) {
            errors.push('任务内容不能为空');
        }
        
        if (text && typeof text !== 'string') {
            errors.push('任务内容必须是字符串');
        }
        
        if (text && text.length < this.rules.text.minLength) {
            errors.push(`任务内容至少需要${this.rules.text.minLength}个字符`);
        }
        
        if (text && text.length > this.rules.text.maxLength) {
            errors.push(`任务内容不能超过${this.rules.text.maxLength}个字符`);
        }
        
        if (text && !this.rules.text.pattern.test(text)) {
            errors.push('任务内容包含非法字符');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            sanitizedText: this.sanitizeInput(text)
        };
    }

    /**
     * 验证待办事项ID
     * @param {string} id - 待验证的ID
     * @returns {Object} 验证结果 {isValid: boolean, errors: string[]}
     */
    validateTodoId(id) {
        const errors = [];
        
        if (!this.rules.id.required && (id === undefined || id === null)) {
            return { isValid: true, errors: [] };
        }
        
        if (this.rules.id.required && (!id || id.trim() === '')) {
            errors.push('ID不能为空');
        }
        
        if (id && typeof id !== 'string') {
            errors.push('ID必须是字符串');
        }
        
        if (id && !this.rules.id.pattern.test(id)) {
            errors.push('ID格式不正确');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 验证完成状态
     * @param {boolean} completed - 待验证的完成状态
     * @returns {Object} 验证结果 {isValid: boolean, errors: string[]}
     */
    validateCompleted(completed) {
        const errors = [];
        
        if (this.rules.completed.required && completed === undefined) {
            errors.push('完成状态不能为空');
        }
        
        if (completed !== undefined && typeof completed !== this.rules.completed.type) {
            errors.push('完成状态必须是布尔值');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 验证时间戳
     * @param {string} timestamp - 待验证的时间戳
     * @param {string} fieldName - 字段名称
     * @returns {Object} 验证结果 {isValid: boolean, errors: string[]}
     */
    validateTimestamp(timestamp, fieldName) {
        const errors = [];
        const rule = this.rules[fieldName];
        
        if (!rule.required && (timestamp === undefined || timestamp === null)) {
            return { isValid: true, errors: [] };
        }
        
        if (rule.required && (!timestamp || timestamp.trim() === '')) {
            errors.push(`${fieldName}不能为空`);
        }
        
        if (timestamp && typeof timestamp !== rule.type) {
            errors.push(`${fieldName}必须是字符串`);
        }
        
        if (timestamp && !rule.pattern.test(timestamp)) {
            errors.push(`${fieldName}格式不正确`);
        }
        
        // 验证是否为有效的日期
        if (timestamp && rule.pattern.test(timestamp)) {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                errors.push(`${fieldName}不是有效的日期`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 验证完整的待办事项对象
     * @param {Object} todo - 待验证的待办事项对象
     * @returns {Object} 验证结果 {isValid: boolean, errors: string[], sanitizedTodo: Object}
     */
    validateTodoData(todo) {
        const errors = [];
        let sanitizedTodo = {};
        
        if (!todo || typeof todo !== 'object') {
            errors.push('待办事项必须是对象');
            return { isValid: false, errors: errors, sanitizedTodo: null };
        }
        
        // 验证text字段
        const textValidation = this.validateTodoText(todo.text);
        if (!textValidation.isValid) {
            errors.push(...textValidation.errors);
        }
        sanitizedTodo.text = textValidation.sanitizedText;
        
        // 验证id字段
        const idValidation = this.validateTodoId(todo.id);
        if (!idValidation.isValid) {
            errors.push(...idValidation.errors);
        }
        sanitizedTodo.id = todo.id;
        
        // 验证completed字段
        const completedValidation = this.validateCompleted(todo.completed);
        if (!completedValidation.isValid) {
            errors.push(...completedValidation.errors);
        }
        sanitizedTodo.completed = todo.completed || false;
        
        // 验证createdAt字段
        const createdValidation = this.validateTimestamp(todo.createdAt, 'createdAt');
        if (!createdValidation.isValid) {
            errors.push(...createdValidation.errors);
        }
        sanitizedTodo.createdAt = todo.createdAt || new Date().toISOString();
        
        // 验证updatedAt字段
        const updatedValidation = this.validateTimestamp(todo.updatedAt, 'updatedAt');
        if (!updatedValidation.isValid) {
            errors.push(...updatedValidation.errors);
        }
        sanitizedTodo.updatedAt = todo.updatedAt || new Date().toISOString();
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            sanitizedTodo: sanitizedTodo
        };
    }

    /**
     * 验证待办事项数组
     * @param {Array} todos - 待验证的待办事项数组
     * @returns {Object} 验证结果 {isValid: boolean, errors: string[], validTodos: Array}
     */
    validateTodoArray(todos) {
        const errors = [];
        const validTodos = [];
        
        if (!Array.isArray(todos)) {
            errors.push('待办事项必须是数组');
            return { isValid: false, errors: errors, validTodos: [] };
        }
        
        // 检查重复ID
        const idMap = new Map();
        const duplicateIds = new Set();
        
        todos.forEach((todo, index) => {
            if (todo.id && idMap.has(todo.id)) {
                duplicateIds.add(todo.id);
                errors.push(`发现重复ID: ${todo.id} (索引: ${idMap.get(todo.id)}, ${index})`);
            } else if (todo.id) {
                idMap.set(todo.id, index);
            }
        });
        
        // 验证每个待办事项
        todos.forEach((todo, index) => {
            const validation = this.validateTodoData(todo);
            
            if (validation.isValid) {
                validTodos.push(validation.sanitizedTodo);
            } else {
                errors.push(`待办事项 ${index + 1} 验证失败: ${validation.errors.join(', ')}`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            validTodos: validTodos
        };
    }

    /**
     * 清理和转义输入内容
     * @param {string} input - 输入内容
     * @returns {string} 清理后的内容
     */
    sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }
        
        // 去除首尾空格
        let sanitized = input.trim();
        
        // 转义HTML特殊字符
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // 移除控制字符
        sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
        
        // 限制长度
        if (sanitized.length > this.rules.text.maxLength) {
            sanitized = sanitized.substring(0, this.rules.text.maxLength);
        }
        
        return sanitized;
    }

    /**
     * 生成验证错误消息
     * @param {string} field - 字段名称
     * @param {string} rule - 验证规则
     * @param {string} value - 值
     * @returns {string} 错误消息
     */
    generateErrorMessage(field, rule, value) {
        const messages = {
            required: `${field}不能为空`,
            type: `${field}类型不正确`,
            minLength: `${field}长度不足`,
            maxLength: `${field}长度超出限制`,
            pattern: `${field}格式不正确`
        };
        
        return messages[rule] || `${field}验证失败`;
    }

    /**
     * 验证并创建新的待办事项
     * @param {string} text - 任务文本
     * @returns {Object} 验证结果 {isValid: boolean, errors: string[], todo: Object}
     */
    createValidTodo(text) {
        const textValidation = this.validateTodoText(text);
        
        if (!textValidation.isValid) {
            return {
                isValid: false,
                errors: textValidation.errors,
                todo: null
            };
        }
        
        const now = new Date().toISOString();
        const todo = {
            id: this.generateId(),
            text: textValidation.sanitizedText,
            completed: false,
            createdAt: now,
            updatedAt: now
        };
        
        return {
            isValid: true,
            errors: [],
            todo: todo
        };
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 验证更新数据
     * @param {Object} updates - 更新数据
     * @returns {Object} 验证结果 {isValid: boolean, errors: string[], sanitizedUpdates: Object}
     */
    validateUpdates(updates) {
        const errors = [];
        const sanitizedUpdates = {};
        
        if (!updates || typeof updates !== 'object') {
            errors.push('更新数据必须是对象');
            return { isValid: false, errors: errors, sanitizedUpdates: null };
        }
        
        // 验证允许更新的字段
        const allowedFields = ['text', 'completed'];
        
        for (let field in updates) {
            if (!allowedFields.includes(field)) {
                errors.push(`不允许更新字段: ${field}`);
                continue;
            }
            
            if (field === 'text') {
                const textValidation = this.validateTodoText(updates.text);
                if (!textValidation.isValid) {
                    errors.push(...textValidation.errors);
                } else {
                    sanitizedUpdates.text = textValidation.sanitizedText;
                }
            } else if (field === 'completed') {
                const completedValidation = this.validateCompleted(updates.completed);
                if (!completedValidation.isValid) {
                    errors.push(...completedValidation.errors);
                } else {
                    sanitizedUpdates.completed = updates.completed;
                }
            }
        }
        
        // 添加更新时间戳
        if (Object.keys(sanitizedUpdates).length > 0) {
            sanitizedUpdates.updatedAt = new Date().toISOString();
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            sanitizedUpdates: sanitizedUpdates
        };
    }
}

// 导出TodoValidator类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoValidator;
} else if (typeof window !== 'undefined') {
    window.TodoValidator = TodoValidator;
}