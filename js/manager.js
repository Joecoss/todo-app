/**
 * TodoManager - 数据管理器
 * 负责待办事项的CRUD操作和数据状态管理
 */
class TodoManager {
    constructor(storageManager, validator) {
        this.storageManager = storageManager;
        this.validator = validator;
        this.todos = [];
        this.listeners = [];
        this.initialized = false;
        
        // 绑定方法
        this.addTodo = this.addTodo.bind(this);
        this.toggleTodo = this.toggleTodo.bind(this);
        this.deleteTodo = this.deleteTodo.bind(this);
        this.updateTodo = this.updateTodo.bind(this);
        this.loadTodos = this.loadTodos.bind(this);
        this.saveTodos = this.saveTodos.bind(this);
    }

    /**
     * 初始化管理器
     * @returns {Promise<boolean>} 初始化是否成功
     */
    async initialize() {
        try {
            await this.loadTodos();
            this.initialized = true;
            this.emit('initialized', { todos: this.todos });
            return true;
        } catch (error) {
            console.error('TodoManager初始化失败:', error);
            this.emit('error', { type: 'initialization', error: error });
            return false;
        }
    }

    /**
     * 添加新的待办事项
     * @param {string} text - 任务文本
     * @returns {Object|null} 添加的待办事项，失败返回null
     */
    addTodo(text) {
        if (!this.initialized) {
            console.warn('TodoManager未初始化');
            return null;
        }

        // 创建并验证新的待办事项
        const result = this.validator.createValidTodo(text);
        
        if (!result.isValid) {
            this.emit('validation-error', { 
                type: 'add', 
                errors: result.errors,
                input: text 
            });
            return null;
        }

        // 添加到数组开头（最新的在前）
        this.todos.unshift(result.todo);
        
        // 保存到存储
        if (this.saveTodos()) {
            this.emit('todo-added', { todo: result.todo });
            return result.todo;
        } else {
            // 保存失败，回滚
            this.todos.shift();
            this.emit('error', { type: 'save', action: 'add' });
            return null;
        }
    }

    /**
     * 切换待办事项的完成状态
     * @param {string} id - 待办事项ID
     * @returns {boolean} 操作是否成功
     */
    toggleTodo(id) {
        if (!this.initialized) {
            console.warn('TodoManager未初始化');
            return false;
        }

        const todo = this.todos.find(t => t.id === id);
        if (!todo) {
            this.emit('not-found', { type: 'toggle', id: id });
            return false;
        }

        // 切换状态
        todo.completed = !todo.completed;
        todo.updatedAt = new Date().toISOString();

        // 保存到存储
        if (this.saveTodos()) {
            this.emit('todo-toggled', { todo: todo });
            return true;
        } else {
            // 保存失败，回滚
            todo.completed = !todo.completed;
            this.emit('error', { type: 'save', action: 'toggle' });
            return false;
        }
    }

    /**
     * 删除待办事项
     * @param {string} id - 待办事项ID
     * @returns {boolean} 操作是否成功
     */
    deleteTodo(id) {
        if (!this.initialized) {
            console.warn('TodoManager未初始化');
            return false;
        }

        const index = this.todos.findIndex(t => t.id === id);
        if (index === -1) {
            this.emit('not-found', { type: 'delete', id: id });
            return false;
        }

        const deletedTodo = this.todos[index];
        
        // 从数组中移除
        this.todos.splice(index, 1);

        // 保存到存储
        if (this.saveTodos()) {
            this.emit('todo-deleted', { todo: deletedTodo });
            return true;
        } else {
            // 保存失败，回滚
            this.todos.splice(index, 0, deletedTodo);
            this.emit('error', { type: 'save', action: 'delete' });
            return false;
        }
    }

    /**
     * 更新待办事项
     * @param {string} id - 待办事项ID
     * @param {Object} updates - 更新数据
     * @returns {boolean} 操作是否成功
     */
    updateTodo(id, updates) {
        if (!this.initialized) {
            console.warn('TodoManager未初始化');
            return false;
        }

        const todo = this.todos.find(t => t.id === id);
        if (!todo) {
            this.emit('not-found', { type: 'update', id: id });
            return false;
        }

        // 验证更新数据
        const validation = this.validator.validateUpdates(updates);
        if (!validation.isValid) {
            this.emit('validation-error', { 
                type: 'update', 
                errors: validation.errors,
                id: id 
            });
            return false;
        }

        // 保存原始数据用于回滚
        const originalTodo = { ...todo };
        
        // 应用更新
        Object.assign(todo, validation.sanitizedUpdates);

        // 保存到存储
        if (this.saveTodos()) {
            this.emit('todo-updated', { todo: todo, updates: validation.sanitizedUpdates });
            return true;
        } else {
            // 保存失败，回滚
            Object.assign(todo, originalTodo);
            this.emit('error', { type: 'save', action: 'update' });
            return false;
        }
    }

    /**
     * 获取所有待办事项
     * @returns {Array} 待办事项数组
     */
    getAllTodos() {
        return [...this.todos];
    }

    /**
     * 获取已完成的待办事项
     * @returns {Array} 已完成的待办事项数组
     */
    getCompletedTodos() {
        return this.todos.filter(todo => todo.completed);
    }

    /**
     * 获取待完成的待办事项
     * @returns {Array} 待完成的待办事项数组
     */
    getPendingTodos() {
        return this.todos.filter(todo => !todo.completed);
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const total = this.todos.length;
        const completed = this.getCompletedTodos().length;
        const pending = this.getPendingTodos().length;
        const completionRate = total > 0 ? (completed / total) : 0;

        return {
            total,
            completed,
            pending,
            completionRate: Math.round(completionRate * 100) / 100
        };
    }

    /**
     * 根据ID查找待办事项
     * @param {string} id - 待办事项ID
     * @returns {Object|null} 找到的待办事项，未找到返回null
     */
    getTodoById(id) {
        return this.todos.find(t => t.id === id) || null;
    }

    /**
     * 搜索待办事项
     * @param {string} query - 搜索关键词
     * @returns {Array} 匹配的待办事项数组
     */
    searchTodos(query) {
        if (!query || typeof query !== 'string') {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        return this.todos.filter(todo => 
            todo.text.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * 清空所有待办事项
     * @returns {boolean} 操作是否成功
     */
    clearAllTodos() {
        if (!this.initialized) {
            console.warn('TodoManager未初始化');
            return false;
        }

        const clearedTodos = [...this.todos];
        this.todos = [];

        if (this.saveTodos()) {
            this.emit('all-todos-cleared', { clearedTodos });
            return true;
        } else {
            // 保存失败，回滚
            this.todos = clearedTodos;
            this.emit('error', { type: 'save', action: 'clear' });
            return false;
        }
    }

    /**
     * 批量操作待办事项
     * @param {Array} ids - 待办事项ID数组
     * @param {string} action - 操作类型 ('complete', 'incomplete', 'delete')
     * @returns {Object} 操作结果
     */
    batchOperation(ids, action) {
        if (!this.initialized) {
            console.warn('TodoManager未初始化');
            return { success: false, processed: 0 };
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return { success: false, processed: 0 };
        }

        const validActions = ['complete', 'incomplete', 'delete'];
        if (!validActions.includes(action)) {
            return { success: false, processed: 0 };
        }

        let processed = 0;
        const affectedTodos = [];

        // 备份当前数据
        const originalTodos = [...this.todos];

        try {
            for (let id of ids) {
                const todo = this.todos.find(t => t.id === id);
                if (!todo) continue;

                affectedTodos.push({ ...todo });

                switch (action) {
                    case 'complete':
                        if (!todo.completed) {
                            todo.completed = true;
                            todo.updatedAt = new Date().toISOString();
                            processed++;
                        }
                        break;
                    case 'incomplete':
                        if (todo.completed) {
                            todo.completed = false;
                            todo.updatedAt = new Date().toISOString();
                            processed++;
                        }
                        break;
                    case 'delete':
                        const index = this.todos.findIndex(t => t.id === id);
                        if (index !== -1) {
                            this.todos.splice(index, 1);
                            processed++;
                        }
                        break;
                }
            }

            if (processed > 0 && this.saveTodos()) {
                this.emit('batch-operation', { 
                    action, 
                    processed, 
                    affectedTodos 
                });
                return { success: true, processed };
            } else {
                // 保存失败，回滚
                this.todos = originalTodos;
                this.emit('error', { type: 'save', action: 'batch' });
                return { success: false, processed: 0 };
            }
        } catch (error) {
            // 发生错误，回滚
            this.todos = originalTodos;
            this.emit('error', { type: 'batch', error: error });
            return { success: false, processed: 0 };
        }
    }

    /**
     * 从存储加载待办事项
     * @returns {boolean} 加载是否成功
     */
    loadTodos() {
        try {
            const data = this.storageManager.loadTodos();
            
            // 验证数据
            const validation = this.validator.validateTodoArray(data.todos);
            if (!validation.isValid) {
                console.warn('待办事项数据验证失败，使用清理后的数据:', validation.errors);
                this.todos = validation.validTodos;
            } else {
                this.todos = validation.validTodos;
            }

            // 按创建时间排序（最新的在前）
            this.todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            this.emit('todos-loaded', { todos: this.todos });
            return true;
        } catch (error) {
            console.error('加载待办事项失败:', error);
            this.todos = [];
            this.emit('error', { type: 'load', error: error });
            return false;
        }
    }

    /**
     * 保存待办事项到存储
     * @returns {boolean} 保存是否成功
     */
    saveTodos() {
        try {
            const success = this.storageManager.saveTodos(this.todos);
            if (success) {
                this.emit('todos-saved', { todos: this.todos });
            }
            return success;
        } catch (error) {
            console.error('保存待办事项失败:', error);
            this.emit('error', { type: 'save', error: error });
            return false;
        }
    }

    /**
     * 添加事件监听器
     * @param {string} event - 事件名称
     * @param {Function} listener - 监听器函数
     */
    on(event, listener) {
        this.listeners.push({ event, listener });
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} listener - 监听器函数
     */
    off(event, listener) {
        this.listeners = this.listeners.filter(
            l => !(l.event === event && l.listener === listener)
        );
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    emit(event, data) {
        this.listeners.forEach(({ event: e, listener }) => {
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
     * 销毁管理器
     */
    destroy() {
        this.listeners = [];
        this.todos = [];
        this.initialized = false;
        this.emit('destroyed');
    }

    /**
     * 导出数据
     * @returns {string} 导出的JSON数据
     */
    exportData() {
        return this.storageManager.exportData();
    }

    /**
     * 导入数据
     * @param {string} jsonData - JSON数据
     * @returns {boolean} 导入是否成功
     */
    importData(jsonData) {
        try {
            const success = this.storageManager.importData(jsonData);
            if (success) {
                this.loadTodos();
                this.emit('data-imported');
            }
            return success;
        } catch (error) {
            console.error('导入数据失败:', error);
            this.emit('error', { type: 'import', error: error });
            return false;
        }
    }
}

// 导出TodoManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoManager;
} else if (typeof window !== 'undefined') {
    window.TodoManager = TodoManager;
}