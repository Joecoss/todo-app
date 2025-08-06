/**
 * TodoApp - 主应用控制器
 * 负责应用初始化、生命周期管理和组件协调
 */
class TodoApp {
    constructor() {
        this.initialized = false;
        this.components = {};
        this.config = {
            storageKey: 'todo-app-data',
            version: '1.0.0',
            debug: false
        };
        
        // 绑定方法
        this.initialize = this.initialize.bind(this);
        this.destroy = this.destroy.bind(this);
        this.handleError = this.handleError.bind(this);
        this.log = this.log.bind(this);
    }

    /**
     * 初始化应用
     * @returns {Promise<boolean>} 初始化是否成功
     */
    async initialize() {
        try {
            this.log('开始初始化TodoApp...');
            
            // 检查浏览器兼容性
            if (!this.checkBrowserCompatibility()) {
                this.showBrowserCompatibilityError();
                return false;
            }
            
            // 初始化组件
            await this.initializeComponents();
            
            // 设置全局错误处理
            this.setupGlobalErrorHandling();
            
            // 初始化完成
            this.initialized = true;
            this.log('TodoApp初始化完成');
            
            // 触发初始化完成事件
            this.emit('app-initialized');
            
            return true;
        } catch (error) {
            this.handleError('应用初始化失败', error);
            return false;
        }
    }

    /**
     * 检查浏览器兼容性
     * @returns {boolean} 浏览器是否兼容
     */
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'localStorage',
            'JSON',
            'Promise',
            'classList',
            'addEventListener',
            'querySelector',
            'querySelectorAll'
        ];
        
        const missingFeatures = [];
        
        requiredFeatures.forEach(feature => {
            if (feature === 'localStorage') {
                try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                } catch (e) {
                    missingFeatures.push(feature);
                }
            } else if (feature === 'JSON') {
                if (typeof JSON === 'undefined') {
                    missingFeatures.push(feature);
                }
            } else if (feature === 'Promise') {
                if (typeof Promise === 'undefined') {
                    missingFeatures.push(feature);
                }
            } else if (feature === 'classList') {
                // Check if classList is supported on elements
                if (typeof document.documentElement.classList === 'undefined') {
                    missingFeatures.push(feature);
                }
            } else if (feature === 'addEventListener') {
                // Check if addEventListener is supported on elements
                if (typeof document.documentElement.addEventListener === 'undefined') {
                    missingFeatures.push(feature);
                }
            } else if (feature === 'querySelector' || feature === 'querySelectorAll') {
                // Check if querySelector/querySelectorAll are supported on document
                if (typeof document[feature] === 'undefined') {
                    missingFeatures.push(feature);
                }
            }
        });
        
        if (missingFeatures.length > 0) {
            console.error('浏览器缺少必要功能:', missingFeatures);
            return false;
        }
        
        return true;
    }

    /**
     * 显示浏览器兼容性错误
     */
    showBrowserCompatibilityError() {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
            color: white;
        `;
        errorDiv.innerHTML = `
            <div>
                <h2>浏览器兼容性错误</h2>
                <p>您的浏览器缺少运行此应用所需的必要功能。</p>
                <p>请使用现代浏览器（Chrome 60+、Firefox 55+、Safari 12+、Edge 79+）访问此应用。</p>
                <button onclick="window.location.reload()" style="
                    padding: 10px 20px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                ">刷新页面</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        // 记录错误到控制台
        console.error('浏览器兼容性错误：缺少必要功能');
    }

    /**
     * 初始化组件
     * @returns {Promise<void>}
     */
    async initializeComponents() {
        this.log('初始化组件...');
        
        // 初始化存储管理器
        this.components.storageManager = new StorageManager();
        this.log('StorageManager初始化完成');
        
        // 初始化验证器
        this.components.validator = new TodoValidator();
        this.log('TodoValidator初始化完成');
        
        // 初始化数据管理器
        this.components.todoManager = new TodoManager(
            this.components.storageManager,
            this.components.validator
        );
        
        // 初始化数据管理器
        const managerInitialized = await this.components.todoManager.initialize();
        if (!managerInitialized) {
            throw new Error('TodoManager初始化失败');
        }
        this.log('TodoManager初始化完成');
        
        // 初始化渲染器
        this.components.renderer = new TodoRenderer(this.components.todoManager);
        this.components.renderer.initialize();
        this.log('TodoRenderer初始化完成');
        
        // 设置组件间的事件监听
        this.setupComponentEvents();
        
        this.log('所有组件初始化完成');
    }

    /**
     * 设置组件间事件监听
     */
    setupComponentEvents() {
        const { todoManager, renderer } = this.components;
        
        // 监听TodoManager的错误事件
        todoManager.on('error', (data) => {
            this.handleError('TodoManager错误', data.error);
            
            // 根据错误类型显示用户提示
            if (data.type === 'save') {
                renderer.showNotification('保存失败，请重试', 'error');
            } else if (data.type === 'load') {
                renderer.showNotification('加载数据失败', 'error');
            }
        });
        
        // 监听TodoManager的验证错误事件
        todoManager.on('validation-error', (data) => {
            if (data.type === 'add') {
                renderer.showError(data.errors[0] || '输入验证失败');
            }
        });
        
        // 监听TodoManager的成功事件
        todoManager.on('todo-added', () => {
            renderer.showNotification('任务添加成功', 'success');
        });
        
        todoManager.on('todo-deleted', () => {
            renderer.showNotification('任务删除成功', 'success');
        });
        
        // 监听存储错误事件
        document.addEventListener('storage-error', (event) => {
            const { detail } = event;
            this.handleError('存储错误', detail);
            
            if (detail.type === 'quota_exceeded') {
                renderer.showNotification('存储空间不足，请清理一些数据', 'error');
            } else if (detail.type === 'security_error') {
                renderer.showNotification('存储访问被拒绝，请检查浏览器设置', 'error');
            } else {
                renderer.showNotification('存储操作失败', 'error');
            }
        });
        
        // 监听应用初始化事件
        this.on('app-initialized', () => {
            // 显示欢迎信息或恢复状态
            const todos = todoManager.getAllTodos();
            if (todos.length > 0) {
                renderer.showNotification(`已加载 ${todos.length} 个任务`, 'success');
            } else {
                renderer.focusInput();
            }
        });
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalErrorHandling() {
        // 捕获未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('未处理的Promise拒绝', event.reason);
            event.preventDefault();
        });
        
        // 捕获全局错误
        window.addEventListener('error', (event) => {
            this.handleError('全局错误', event.error);
            event.preventDefault();
        });
        
        // 捕获未处理的错误
        window.addEventListener('error', (event) => {
            if (event.message && event.filename && event.lineno) {
                this.handleError('脚本错误', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            }
        });
    }

    /**
     * 处理错误
     * @param {string} message - 错误消息
     * @param {Error} error - 错误对象
     */
    handleError(message, error) {
        console.error(`[TodoApp Error] ${message}:`, error);
        
        // 显示用户友好的错误信息
        if (this.components.renderer) {
            const errorMessage = this.getUserFriendlyErrorMessage(message, error);
            this.components.renderer.showNotification(errorMessage, 'error');
        }
        
        // 触发错误事件
        this.emit('app-error', { message, error });
    }

    /**
     * 获取用户友好的错误消息
     * @param {string} message - 错误消息
     * @param {Error} error - 错误对象
     * @returns {string} 用户友好的错误消息
     */
    getUserFriendlyErrorMessage(message, error) {
        if (!error) return message;
        
        // 根据错误类型返回友好的消息
        if (error.name === 'QuotaExceededError') {
            return '存储空间不足，请清理一些数据';
        }
        
        if (error.name === 'SecurityError') {
            return '存储访问被拒绝，请检查浏览器设置';
        }
        
        if (error.name === 'NetworkError') {
            return '网络连接失败，请检查网络设置';
        }
        
        if (error.message && error.message.includes('localStorage')) {
            return '本地存储不可用，数据将保存在内存中';
        }
        
        return '操作失败，请重试';
    }

    /**
     * 日志记录
     * @param {string} message - 日志消息
     * @param {string} level - 日志级别
     */
    log(message, level = 'info') {
        if (this.config.debug) {
            const timestamp = new Date().toISOString();
            console.log(`[TodoApp ${timestamp}] [${level.toUpperCase()}] ${message}`);
        }
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} listener - 监听器函数
     */
    on(event, listener) {
        if (!this.eventListeners) {
            this.eventListeners = [];
        }
        this.eventListeners.push({ event, listener });
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} listener - 监听器函数
     */
    off(event, listener) {
        if (!this.eventListeners) return;
        
        this.eventListeners = this.eventListeners.filter(
            l => !(l.event === event && l.listener === listener)
        );
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    emit(event, data) {
        if (!this.eventListeners) return;
        
        this.eventListeners.forEach(({ event: e, listener }) => {
            if (e === event) {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`事件监听器执行失败 (${event}):`, error);
                }
            }
        });
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态信息
     */
    getAppState() {
        const { todoManager, storageManager, validator } = this.components;
        
        return {
            initialized: this.initialized,
            version: this.config.version,
            todos: todoManager ? todoManager.getAllTodos() : [],
            stats: todoManager ? todoManager.getStats() : null,
            storage: storageManager ? storageManager.getStorageInfo() : null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 导出应用数据
     * @returns {string} 导出的JSON数据
     */
    exportData() {
        if (this.components.storageManager) {
            return this.components.storageManager.exportData();
        }
        return '{}';
    }

    /**
     * 导入应用数据
     * @param {string} jsonData - JSON数据
     * @returns {boolean} 导入是否成功
     */
    importData(jsonData) {
        if (this.components.todoManager) {
            return this.components.todoManager.importData(jsonData);
        }
        return false;
    }

    /**
     * 清空所有数据
     * @returns {boolean} 操作是否成功
     */
    clearAllData() {
        if (this.components.todoManager) {
            return this.components.todoManager.clearAllTodos();
        }
        return false;
    }

    /**
     * 获取性能统计
     * @returns {Object} 性能统计信息
     */
    getPerformanceStats() {
        const stats = {
            memory: {},
            timing: {},
            todos: {}
        };
        
        // 内存使用情况
        if (performance.memory) {
            stats.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // 时间统计
        if (performance.timing) {
            stats.timing = {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            };
        }
        
        // 待办事项统计
        if (this.components.todoManager) {
            const todoStats = this.components.todoManager.getStats();
            stats.todos = {
                total: todoStats.total,
                completed: todoStats.completed,
                pending: todoStats.pending,
                completionRate: todoStats.completionRate
            };
        }
        
        return stats;
    }

    /**
     * 销毁应用
     */
    destroy() {
        this.log('开始销毁TodoApp...');
        
        try {
            // 销毁渲染器
            if (this.components.renderer) {
                this.components.renderer.destroy();
            }
            
            // 销毁数据管理器
            if (this.components.todoManager) {
                this.components.todoManager.destroy();
            }
            
            // 清理事件监听器
            if (this.eventListeners) {
                this.eventListeners = [];
            }
            
            // 清理组件引用
            this.components = {};
            
            // 重置状态
            this.initialized = false;
            
            this.log('TodoApp销毁完成');
            
            // 触发销毁事件
            this.emit('app-destroyed');
            
        } catch (error) {
            this.handleError('应用销毁失败', error);
        }
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    const app = new TodoApp();
    
    try {
        const initialized = await app.initialize();
        
        if (!initialized) {
            console.error('TodoApp初始化失败');
            // 显示错误页面或降级处理
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            `;
            errorDiv.innerHTML = `
                <div>
                    <h2>应用初始化失败</h2>
                    <p>请刷新页面重试</p>
                    <button onclick="window.location.reload()" style="
                        padding: 10px 20px;
                        background: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-top: 10px;
                    ">刷新页面</button>
                </div>
            `;
            document.body.appendChild(errorDiv);
        }
    } catch (error) {
        console.error('TodoApp启动失败:', error);
    }
    
    // 将app实例暴露到全局，便于调试
    window.todoApp = app;
});

// 导出TodoApp类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoApp;
} else if (typeof window !== 'undefined') {
    window.TodoApp = TodoApp;
}