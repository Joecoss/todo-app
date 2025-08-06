/**
 * TodoRenderer - 界面渲染器
 * 负责DOM操作和用户交互处理
 */
class TodoRenderer {
    constructor(todoManager) {
        this.todoManager = todoManager;
        this.elements = {};
        this.confirmDialog = null;
        this.notifications = [];
        
        // 绑定方法
        this.render = this.render.bind(this);
        this.renderTodoList = this.renderTodoList.bind(this);
        this.renderTodoItem = this.renderTodoItem.bind(this);
        this.renderStats = this.renderStats.bind(this);
        this.renderEmptyState = this.renderEmptyState.bind(this);
        this.handleAddTodo = this.handleAddTodo.bind(this);
        this.handleToggleTodo = this.handleToggleTodo.bind(this);
        this.handleDeleteTodo = this.handleDeleteTodo.bind(this);
        this.handleInputKeydown = this.handleInputKeydown.bind(this);
        this.showConfirmDialog = this.showConfirmDialog.bind(this);
        this.hideConfirmDialog = this.hideConfirmDialog.bind(this);
        this.showNotification = this.showNotification.bind(this);
        this.hideNotification = this.hideNotification.bind(this);
        this.showError = this.showError.bind(this);
        this.hideError = this.hideError.bind(this);
    }

    /**
     * 初始化渲染器
     */
    initialize() {
        this.getElements();
        this.bindEvents();
        this.setupEventListeners();
        this.createConfirmDialog();
        this.render();
    }

    /**
     * 获取DOM元素
     */
    getElements() {
        this.elements = {
            todoInput: document.getElementById('todo-input'),
            addBtn: document.getElementById('add-btn'),
            todoList: document.getElementById('todo-list'),
            emptyState: document.getElementById('empty-state'),
            totalCount: document.getElementById('total-count'),
            completedCount: document.getElementById('completed-count'),
            pendingCount: document.getElementById('pending-count'),
            errorMessage: document.getElementById('error-message')
        };
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        if (this.elements.addBtn) {
            this.elements.addBtn.addEventListener('click', this.handleAddTodo);
        }
        
        if (this.elements.todoInput) {
            this.elements.todoInput.addEventListener('keydown', this.handleInputKeydown);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听TodoManager事件
        this.todoManager.on('todo-added', () => this.render());
        this.todoManager.on('todo-toggled', () => this.render());
        this.todoManager.on('todo-deleted', () => this.render());
        this.todoManager.on('todo-updated', () => this.render());
        this.todoManager.on('todos-loaded', () => this.render());
        this.todoManager.on('all-todos-cleared', () => this.render());
        this.todoManager.on('batch-operation', () => this.render());
        
        // 监听验证错误
        this.todoManager.on('validation-error', (data) => {
            if (data.type === 'add') {
                this.showError(data.errors[0] || '输入验证失败');
            }
        });
        
        // 监听错误事件
        this.todoManager.on('error', (data) => {
            console.error('TodoManager错误:', data);
            if (data.type === 'save') {
                this.showError('保存失败，请重试');
            }
        });
    }

    /**
     * 创建确认对话框
     */
    createConfirmDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-dialog-content">
                <h3 class="confirm-dialog-title">确认删除</h3>
                <p class="confirm-dialog-message">确定要删除这个待办事项吗？此操作无法撤销。</p>
                <div class="confirm-dialog-actions">
                    <button class="confirm-btn confirm-btn-cancel" data-action="cancel">取消</button>
                    <button class="confirm-btn confirm-btn-delete" data-action="delete">删除</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.confirmDialog = dialog;
        
        // 绑定事件
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                this.hideConfirmDialog();
            }
        });
        
        dialog.querySelectorAll('.confirm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'cancel') {
                    this.hideConfirmDialog();
                } else if (action === 'delete') {
                    if (this.pendingDeleteId) {
                        this.todoManager.deleteTodo(this.pendingDeleteId);
                        this.hideConfirmDialog();
                    }
                }
            });
        });
    }

    /**
     * 渲染整个界面
     */
    render() {
        this.renderTodoList();
        this.renderStats();
        this.renderEmptyState();
    }

    /**
     * 渲染待办事项列表
     */
    renderTodoList() {
        if (!this.elements.todoList) return;
        
        const todos = this.todoManager.getAllTodos();
        this.elements.todoList.innerHTML = '';
        
        if (todos.length === 0) {
            return;
        }
        
        todos.forEach(todo => {
            const todoElement = this.renderTodoItem(todo);
            this.elements.todoList.appendChild(todoElement);
        });
    }

    /**
     * 渲染单个待办事项
     * @param {Object} todo - 待办事项对象
     * @returns {HTMLElement} 渲染的DOM元素
     */
    renderTodoItem(todo) {
        const item = document.createElement('div');
        item.className = `todo-item ${todo.completed ? 'completed' : ''} fade-in`;
        item.dataset.id = todo.id;
        
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMinutes < 1) return '刚刚';
            if (diffMinutes < 60) return `${diffMinutes}分钟前`;
            if (diffHours < 24) return `${diffHours}小时前`;
            if (diffDays < 7) return `${diffDays}天前`;
            
            return date.toLocaleDateString('zh-CN');
        };
        
        item.innerHTML = `
            <div class="todo-checkbox" data-id="${todo.id}" role="button" tabindex="0" aria-label="标记为${todo.completed ? '未完成' : '已完成'}"></div>
            <div class="todo-text">${this.escapeHtml(todo.text)}</div>
            <div class="todo-meta">
                <span class="todo-date">${formatDate(todo.createdAt)}</span>
            </div>
            <div class="todo-actions">
                <button class="delete-btn" data-id="${todo.id}" aria-label="删除待办事项">×</button>
            </div>
        `;
        
        // 绑定事件
        const checkbox = item.querySelector('.todo-checkbox');
        const deleteBtn = item.querySelector('.delete-btn');
        
        checkbox.addEventListener('click', () => this.handleToggleTodo(todo.id));
        checkbox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleToggleTodo(todo.id);
            }
        });
        
        deleteBtn.addEventListener('click', () => this.handleDeleteTodo(todo.id));
        
        return item;
    }

    /**
     * 渲染统计信息
     */
    renderStats() {
        const stats = this.todoManager.getStats();
        
        if (this.elements.totalCount) {
            this.elements.totalCount.textContent = stats.total;
        }
        
        if (this.elements.completedCount) {
            this.elements.completedCount.textContent = stats.completed;
        }
        
        if (this.elements.pendingCount) {
            this.elements.pendingCount.textContent = stats.pending;
        }
    }

    /**
     * 渲染空状态
     */
    renderEmptyState() {
        const todos = this.todoManager.getAllTodos();
        const isEmpty = todos.length === 0;
        
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.toggle('show', isEmpty);
        }
        
        if (this.elements.todoList) {
            this.elements.todoList.style.display = isEmpty ? 'none' : 'flex';
        }
    }

    /**
     * 处理添加待办事项
     */
    handleAddTodo() {
        if (!this.elements.todoInput) return;
        
        const text = this.elements.todoInput.value.trim();
        
        if (!text) {
            this.showError('请输入任务内容');
            return;
        }
        
        const todo = this.todoManager.addTodo(text);
        
        if (todo) {
            this.elements.todoInput.value = '';
            this.hideError();
            this.showNotification('任务添加成功', 'success');
            this.elements.todoInput.focus();
        }
    }

    /**
     * 处理切换待办事项状态
     * @param {string} id - 待办事项ID
     */
    handleToggleTodo(id) {
        const success = this.todoManager.toggleTodo(id);
        
        if (success) {
            const todo = this.todoManager.getTodoById(id);
            const message = todo?.completed ? '任务已完成' : '任务已标记为未完成';
            this.showNotification(message, 'success');
        }
    }

    /**
     * 处理删除待办事项
     * @param {string} id - 待办事项ID
     */
    handleDeleteTodo(id) {
        this.pendingDeleteId = id;
        this.showConfirmDialog();
    }

    /**
     * 处理输入框键盘事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleInputKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleAddTodo();
        } else if (e.key === 'Escape') {
            this.elements.todoInput.value = '';
            this.hideError();
        }
    }

    /**
     * 显示确认对话框
     */
    showConfirmDialog() {
        if (this.confirmDialog) {
            this.confirmDialog.classList.add('show');
        }
    }

    /**
     * 隐藏确认对话框
     */
    hideConfirmDialog() {
        if (this.confirmDialog) {
            this.confirmDialog.classList.remove('show');
        }
        this.pendingDeleteId = null;
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 触发重排以启动动画
        notification.offsetHeight;
        notification.classList.add('show');
        
        this.notifications.push(notification);
        
        // 自动隐藏
        setTimeout(() => {
            this.hideNotification(notification);
        }, 3000);
    }

    /**
     * 隐藏通知
     * @param {HTMLElement} notification - 通知元素
     */
    hideNotification(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.remove('show');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    /**
     * 显示错误消息
     * @param {string} message - 错误消息
     */
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.classList.add('show');
        }
    }

    /**
     * 隐藏错误消息
     */
    hideError() {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.classList.remove('show');
        }
    }

    /**
     * 转义HTML特殊字符
     * @param {string} text - 要转义的文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 更新待办事项
     * @param {string} id - 待办事项ID
     * @param {Object} updates - 更新数据
     */
    updateTodoItem(id, updates) {
        const item = document.querySelector(`.todo-item[data-id="${id}"]`);
        if (!item) return;
        
        if (updates.completed !== undefined) {
            item.classList.toggle('completed', updates.completed);
        }
        
        if (updates.text !== undefined) {
            const textElement = item.querySelector('.todo-text');
            if (textElement) {
                textElement.textContent = this.escapeHtml(updates.text);
            }
        }
        
        // 更新时间显示
        if (updates.updatedAt) {
            const dateElement = item.querySelector('.todo-date');
            if (dateElement) {
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    
                    if (diffMinutes < 1) return '刚刚';
                    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
                    if (diffHours < 24) return `${diffHours}小时前`;
                    if (diffDays < 7) return `${diffDays}天前`;
                    
                    return date.toLocaleDateString('zh-CN');
                };
                
                dateElement.textContent = formatDate(updates.updatedAt);
            }
        }
    }

    /**
     * 移除待办事项
     * @param {string} id - 待办事项ID
     */
    removeTodoItem(id) {
        const item = document.querySelector(`.todo-item[data-id="${id}"]`);
        if (item) {
            item.classList.add('fade-out');
            setTimeout(() => {
                if (item.parentNode) {
                    item.parentNode.removeChild(item);
                }
            }, 300);
        }
    }

    /**
     * 设置加载状态
     * @param {boolean} loading - 是否加载中
     */
    setLoading(loading) {
        if (this.elements.addBtn) {
            this.elements.addBtn.disabled = loading;
            this.elements.addBtn.innerHTML = loading ? 
                '<span class="loading"></span>' : '添加';
        }
        
        if (this.elements.todoInput) {
            this.elements.todoInput.disabled = loading;
        }
    }

    /**
     * 聚焦到输入框
     */
    focusInput() {
        if (this.elements.todoInput) {
            this.elements.todoInput.focus();
        }
    }

    /**
     * 清空输入框
     */
    clearInput() {
        if (this.elements.todoInput) {
            this.elements.todoInput.value = '';
        }
    }

    /**
     * 销毁渲染器
     */
    destroy() {
        // 清理事件监听器
        if (this.elements.addBtn) {
            this.elements.addBtn.removeEventListener('click', this.handleAddTodo);
        }
        
        if (this.elements.todoInput) {
            this.elements.todoInput.removeEventListener('keydown', this.handleInputKeydown);
        }
        
        // 清理通知
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        this.notifications = [];
        
        // 清理确认对话框
        if (this.confirmDialog && this.confirmDialog.parentNode) {
            this.confirmDialog.parentNode.removeChild(this.confirmDialog);
        }
        
        // 清理元素引用
        this.elements = {};
    }
}

// 导出TodoRenderer类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoRenderer;
} else if (typeof window !== 'undefined') {
    window.TodoRenderer = TodoRenderer;
}