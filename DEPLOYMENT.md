# 待办事项应用 - 部署指南

## 概述

待办事项应用是一个纯前端的单页应用，使用原生JavaScript开发，无需后端服务器支持。本指南将详细介绍如何部署应用到各种环境。

## 应用特性

- **技术栈**: 纯JavaScript + CSS3 + HTML5
- **存储方案**: localStorage (本地存储)
- **依赖**: 无外部依赖
- **兼容性**: 支持现代浏览器
- **响应式**: 适配桌面和移动设备

## 快速部署

### 方法1: 直接文件部署

1. **下载应用文件**
   ```bash
   # 下载完整应用包
   # 包含所有必要文件
   ```

2. **解压文件**
   ```bash
   unzip todo-app.zip
   cd todo-app
   ```

3. **部署到Web服务器**
   ```bash
   # 复制到Web服务器目录
   cp -r todo-app/* /var/www/html/
   
   # 或者使用任何静态文件服务器
   python -m http.server 8000
   ```

4. **访问应用**
   ```
   http://your-domain.com/todo-app/
   http://localhost:8000
   ```

### 方法2: GitHub Pages部署

1. **创建GitHub仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/todo-app.git
   git push -u origin main
   ```

2. **启用GitHub Pages**
   - 进入仓库设置
   - 找到"Pages"部分
   - 选择"main"分支
   - 点击"Save"

3. **访问应用**
   ```
   https://your-username.github.io/todo-app/
   ```

### 方法3: Netlify部署

1. **拖拽部署**
   - 访问 [netlify.com](https://netlify.com)
   - 拖拽todo-app文件夹到部署区域
   - 自动生成随机域名

2. **自定义域名**
   ```bash
   # 在Netlify设置中添加自定义域名
   # 配置DNS指向Netlify
   ```

## 详细部署指南

### 文件结构

```
todo-app/
├── index.html          # 主页面
├── README.md          # 使用说明
├── css/
│   └── style.css      # 样式文件
├── js/
│   ├── app.js         # 主应用逻辑
│   ├── manager.js     # 数据管理
│   ├── renderer.js    # 界面渲染
│   ├── storage.js     # 存储管理
│   └── validator.js   # 数据验证
└── tests/             # 测试文件
    ├── test.html      # 单元测试
    ├── integration.html # 集成测试
    └── uat.html       # 用户验收测试
```

### 服务器要求

#### 最低要求
- Web服务器 (Apache, Nginx, IIS等)
- 支持静态文件服务
- HTTPS支持 (推荐)

#### 推荐配置
- **带宽**: 不限 (应用大小约50KB)
- **存储**: 不限 (用户数据存储在本地)
- **SSL**: 启用HTTPS
- **缓存**: 启用静态文件缓存

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/todo-app;
    index index.html;
    
    # 启用缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### Apache配置示例

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/todo-app
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # 启用缓存
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
    
    # SPA路由支持
    <Directory "/var/www/todo-app">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## 云平台部署

### AWS S3 + CloudFront

1. **创建S3存储桶**
   ```bash
   aws s3 mb s3://your-todo-app-bucket
   aws s3 sync todo-app/ s3://your-todo-app-bucket/ --delete
   ```

2. **配置静态网站托管**
   ```bash
   aws s3 website s3://your-todo-app-bucket/ \
     --index-document index.html \
     --error-document index.html
   ```

3. **创建CloudFront分发**
   - 源: S3存储桶
   - 缓存行为: 优化缓存
   - SSL证书: AWS Certificate Manager

### Vercel部署

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署应用**
   ```bash
   cd todo-app
   vercel
   ```

3. **配置域名**
   ```bash
   vercel domains add your-domain.com
   ```

### Firebase Hosting

1. **安装Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **初始化项目**
   ```bash
   cd todo-app
   firebase init hosting
   ```

3. **部署应用**
   ```bash
   firebase deploy
   ```

## Docker部署

### Dockerfile

```dockerfile
FROM nginx:alpine

# 复制应用文件
COPY . /usr/share/nginx/html

# 配置nginx
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  todo-app:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

### 构建和运行

```bash
# 构建镜像
docker build -t todo-app .

# 运行容器
docker run -d -p 80:80 --name todo-app todo-app

# 使用docker-compose
docker-compose up -d
```

## 性能优化

### 1. 资源优化

```bash
# 压缩JavaScript文件
uglifyjs js/app.js -o js/app.min.js

# 压缩CSS文件
cssnano css/style.css css/style.min.css

# 压缩HTML文件
html-minifier index.html -o index.min.html
```

### 2. CDN配置

```html
<!-- 使用CDN加速静态资源 -->
<link rel="stylesheet" href="https://cdn.example.com/style.css">
<script src="https://cdn.example.com/app.js"></script>
```

### 3. 缓存策略

```html
<!-- 设置缓存头 -->
<meta http-equiv="Cache-Control" content="max-age=31536000">
```

## 监控和分析

### 1. Google Analytics

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### 2. 性能监控

```javascript
// Web Vitals监控
import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 安全配置

### 1. HTTPS配置

```nginx
# 强制HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. 安全头设置

```nginx
# 安全头
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

### 3. robots.txt

```
User-agent: *
Disallow: /tests/
Disallow: /private/
```

## 故障排除

### 常见问题

1. **应用无法加载**
   - 检查文件路径是否正确
   - 确认Web服务器配置
   - 检查浏览器控制台错误

2. **数据不保存**
   - 确认浏览器支持localStorage
   - 检查隐私模式设置
   - 验证存储权限

3. **样式问题**
   - 检查CSS文件路径
   - 确认MIME类型配置
   - 验证浏览器兼容性

### 调试方法

```javascript
// 启用调试模式
window.todoApp.config.debug = true;

// 查看应用状态
console.log(window.todoApp.getAppState());

// 查看性能统计
console.log(window.todoApp.getPerformanceStats());
```

## 维护和更新

### 1. 版本管理

```bash
# 创建版本标签
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

### 2. 备份策略

```bash
# 备份用户数据 (导出功能)
# 应用内置数据导出功能
```

### 3. 更新流程

1. **测试新版本**
   ```bash
   # 运行测试套件
   # 进行用户验收测试
   ```

2. **部署新版本**
   ```bash
   # 备份当前版本
   # 部署新版本
   # 验证功能正常
   ```

3. **监控用户反馈**
   ```javascript
   // 收集用户反馈
   // 监控错误日志
   ```

## 联系支持

如果遇到部署问题或有改进建议，请通过以下方式联系：

- **GitHub Issues**: [项目Issues页面]
- **Email**: [联系邮箱]
- **文档**: [完整文档]

---

**最后更新**: 2025-08-06  
**版本**: 1.0.0  
**维护者**: 开发团队