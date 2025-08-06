/**
 * StorageManager - 本地存储管理器
 * 负责处理数据的持久化存储和读取
 */
class StorageManager {
    constructor() {
        this.storageKey = 'todo-app-data';
        this.version = '1.0';
        this.isAvailable = this.checkAvailability();
        this.fallbackStorage = this.isAvailable ? null : {};
    }

    /**
     * 检查localStorage是否可用
     * @returns {boolean} localStorage是否可用
     */
    checkAvailability() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('localStorage不可用，将使用内存存储:', e);
            return false;
        }
    }

    /**
     * 保存数据到存储
     * @param {string} key - 存储键
     * @param {any} data - 要保存的数据
     * @returns {boolean} 保存是否成功
     */
    save(key, data) {
        try {
            const serializedData = JSON.stringify(data);
            
            if (this.isAvailable) {
                localStorage.setItem(key, serializedData);
            } else {
                this.fallbackStorage[key] = serializedData;
            }
            
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            this.handleStorageError(e);
            return false;
        }
    }

    /**
     * 从存储中加载数据
     * @param {string} key - 存储键
     * @param {any} defaultValue - 默认值
     * @returns {any} 加载的数据
     */
    load(key, defaultValue = null) {
        try {
            let serializedData;
            
            if (this.isAvailable) {
                serializedData = localStorage.getItem(key);
            } else {
                serializedData = this.fallbackStorage[key] || null;
            }
            
            if (serializedData === null) {
                return defaultValue;
            }
            
            return JSON.parse(serializedData);
        } catch (e) {
            console.error('加载数据失败:', e);
            this.handleStorageError(e);
            return defaultValue;
        }
    }

    /**
     * 删除存储中的数据
     * @param {string} key - 存储键
     * @returns {boolean} 删除是否成功
     */
    remove(key) {
        try {
            if (this.isAvailable) {
                localStorage.removeItem(key);
            } else {
                delete this.fallbackStorage[key];
            }
            return true;
        } catch (e) {
            console.error('删除数据失败:', e);
            return false;
        }
    }

    /**
     * 清空所有存储数据
     * @returns {boolean} 清空是否成功
     */
    clear() {
        try {
            if (this.isAvailable) {
                localStorage.clear();
            } else {
                this.fallbackStorage = {};
            }
            return true;
        } catch (e) {
            console.error('清空数据失败:', e);
            return false;
        }
    }

    /**
     * 获取存储使用情况
     * @returns {Object} 存储使用情况信息
     */
    getStorageInfo() {
        if (!this.isAvailable) {
            return {
                available: false,
                used: 0,
                total: 0,
                usage: 0
            };
        }

        try {
            let used = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length;
                }
            }

            // 估算localStorage总容量（通常为5MB）
            const total = 5 * 1024 * 1024; // 5MB
            const usage = (used / total) * 100;

            return {
                available: true,
                used: used,
                total: total,
                usage: usage
            };
        } catch (e) {
            console.error('获取存储信息失败:', e);
            return {
                available: false,
                used: 0,
                total: 0,
                usage: 0
            };
        }
    }

    /**
     * 处理存储错误
     * @param {Error} error - 错误对象
     */
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            console.error('存储空间不足，请清理一些数据');
            // 可以触发自定义事件通知用户
            this.dispatchEvent('storage-error', { 
                type: 'quota_exceeded', 
                message: '存储空间不足' 
            });
        } else if (error.name === 'SecurityError') {
            console.error('存储访问被拒绝，可能是隐私模式');
            this.dispatchEvent('storage-error', { 
                type: 'security_error', 
                message: '存储访问被拒绝' 
            });
        } else {
            console.error('未知存储错误:', error);
            this.dispatchEvent('storage-error', { 
                type: 'unknown_error', 
                message: '存储操作失败' 
            });
        }
    }

    /**
     * 分发自定义事件
     * @param {string} eventName - 事件名称
     * @param {Object} data - 事件数据
     */
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(eventName, { 
            detail: data,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    /**
     * 保存待办事项数据
     * @param {Array} todos - 待办事项数组
     * @returns {boolean} 保存是否成功
     */
    saveTodos(todos) {
        const data = {
            todos: todos,
            version: this.version,
            lastSync: new Date().toISOString()
        };
        
        return this.save(this.storageKey, data);
    }

    /**
     * 加载待办事项数据
     * @returns {Object} 包含todos和其他元数据的对象
     */
    loadTodos() {
        const defaultData = {
            todos: [],
            version: this.version,
            lastSync: null
        };
        
        const data = this.load(this.storageKey, defaultData);
        
        // 数据迁移和验证
        if (data.todos && Array.isArray(data.todos)) {
            // 确保每个todo都有必要的字段
            data.todos = data.todos.map(todo => ({
                id: todo.id || this.generateId(),
                text: todo.text || '',
                completed: todo.completed || false,
                createdAt: todo.createdAt || new Date().toISOString(),
                updatedAt: todo.updatedAt || new Date().toISOString()
            }));
        } else {
            data.todos = [];
        }
        
        return data;
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 备份数据
     * @returns {string} 备份数据的JSON字符串
     */
    exportData() {
        const data = this.loadTodos();
        return JSON.stringify(data, null, 2);
    }

    /**
     * 导入数据
     * @param {string} jsonData - JSON格式的数据字符串
     * @returns {boolean} 导入是否成功
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // 验证数据格式
            if (!data.todos || !Array.isArray(data.todos)) {
                throw new Error('无效的数据格式');
            }
            
            // 验证每个todo项
            for (let todo of data.todos) {
                if (!todo.text || typeof todo.text !== 'string') {
                    throw new Error('无效的待办事项数据');
                }
            }
            
            return this.saveTodos(data.todos);
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }
}

// 导出StorageManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
} else if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}