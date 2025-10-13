#!/bin/bash

# 小红书菜谱爬虫服务部署脚本
# 版本: 1.0.0
# 作者: Your Name

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查系统要求
check_requirements() {
    log_step "检查系统要求..."
    
    # 检查Node.js版本
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js >= 16.0.0"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js 版本过低，需要 >= $REQUIRED_VERSION，当前版本: $NODE_VERSION"
        exit 1
    fi
    
    log_info "Node.js 版本检查通过: $NODE_VERSION"
    
    # 检查MySQL
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL 未安装，请先安装 MySQL >= 5.7"
        exit 1
    fi
    
    log_info "MySQL 检查通过"
    
    # 检查PM2（生产环境）
    if [ "$NODE_ENV" = "production" ] && ! command -v pm2 &> /dev/null; then
        log_warn "PM2 未安装，建议安装 PM2 用于生产环境进程管理"
        log_info "安装命令: npm install -g pm2"
    fi
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在"
        exit 1
    fi
    
    npm install --production
    
    if [ $? -eq 0 ]; then
        log_info "依赖安装完成"
    else
        log_error "依赖安装失败"
        exit 1
    fi
}

# 配置环境变量
setup_environment() {
    log_step "配置环境变量..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_info "已创建 .env 文件，请编辑配置"
        else
            log_error ".env.example 文件不存在"
            exit 1
        fi
    else
        log_info ".env 文件已存在"
    fi
    
    # 检查必要的环境变量
    source .env
    
    if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
        log_error "请配置数据库连接信息"
        exit 1
    fi
    
    log_info "环境变量配置检查通过"
}

# 初始化数据库
init_database() {
    log_step "初始化数据库..."
    
    # 检查数据库连接
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        log_error "数据库连接失败，请检查配置"
        exit 1
    fi
    
    log_info "数据库连接成功"
    
    # 执行数据库初始化脚本
    if [ -f "scripts/init-database.sql" ]; then
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" < scripts/init-database.sql
        
        if [ $? -eq 0 ]; then
            log_info "数据库初始化完成"
        else
            log_error "数据库初始化失败"
            exit 1
        fi
    else
        log_error "数据库初始化脚本不存在"
        exit 1
    fi
}

# 创建日志目录
setup_logs() {
    log_step "创建日志目录..."
    
    mkdir -p logs
    chmod 755 logs
    
    log_info "日志目录创建完成"
}

# 设置系统服务
setup_service() {
    log_step "设置系统服务..."
    
    if [ "$NODE_ENV" = "production" ]; then
        # 创建PM2配置文件
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'xiaohongshu-crawler',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
        
        log_info "PM2 配置文件创建完成"
        
        # 创建systemd服务文件
        if command -v systemctl &> /dev/null; then
            sudo tee /etc/systemd/system/xiaohongshu-crawler.service > /dev/null << EOF
[Unit]
Description=Xiaohongshu Recipe Crawler Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
            
            sudo systemctl daemon-reload
            sudo systemctl enable xiaohongshu-crawler.service
            
            log_info "systemd 服务配置完成"
        fi
    fi
}

# 启动服务
start_service() {
    log_step "启动服务..."
    
    if [ "$NODE_ENV" = "production" ]; then
        if command -v pm2 &> /dev/null; then
            pm2 start ecosystem.config.js
            pm2 save
            pm2 startup
            
            log_info "服务已通过 PM2 启动"
        else
            log_warn "PM2 未安装，使用 systemd 启动"
            sudo systemctl start xiaohongshu-crawler.service
            sudo systemctl status xiaohongshu-crawler.service
        fi
    else
        log_info "开发模式启动"
        npm run dev &
        echo $! > crawler.pid
    fi
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_info "服务启动成功"
    else
        log_error "服务启动失败"
        exit 1
    fi
}

# 设置定时任务
setup_cron() {
    log_step "设置定时任务..."
    
    # 添加系统定时任务
    (crontab -l 2>/dev/null; echo "0 0 * * * cd $(pwd) && node scripts/backup.js") | crontab -
    (crontab -l 2>/dev/null; echo "0 2 * * 0 cd $(pwd) && node scripts/cleanup.js") | crontab -
    
    log_info "定时任务设置完成"
}

# 运行测试
run_tests() {
    log_step "运行测试..."
    
    # 测试数据库连接
    node -e "
    const { testConnection } = require('./config/database');
    testConnection().then(result => {
      if (result) {
        console.log('✅ 数据库连接测试通过');
        process.exit(0);
      } else {
        console.log('❌ 数据库连接测试失败');
        process.exit(1);
      }
    });
    "
    
    # 测试API接口
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_info "API 接口测试通过"
    else
        log_error "API 接口测试失败"
        exit 1
    fi
}

# 显示部署信息
show_deployment_info() {
    log_step "部署信息"
    
    echo "=========================================="
    echo "🎉 小红书菜谱爬虫服务部署完成！"
    echo "=========================================="
    echo "服务地址: http://localhost:3001"
    echo "API文档: http://localhost:3001/api"
    echo "健康检查: http://localhost:3001/api/health"
    echo "日志目录: $(pwd)/logs"
    echo "配置文件: $(pwd)/.env"
    echo "=========================================="
    
    if [ "$NODE_ENV" = "production" ]; then
        echo "管理命令:"
        echo "  查看状态: pm2 status"
        echo "  查看日志: pm2 logs"
        echo "  重启服务: pm2 restart xiaohongshu-crawler"
        echo "  停止服务: pm2 stop xiaohongshu-crawler"
    else
        echo "开发模式:"
        echo "  查看日志: tail -f logs/combined.log"
        echo "  停止服务: kill \$(cat crawler.pid)"
    fi
    
    echo "=========================================="
}

# 主函数
main() {
    log_info "开始部署小红书菜谱爬虫服务..."
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [选项]"
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --test         仅运行测试"
        echo "  --skip-db      跳过数据库初始化"
        exit 0
    fi
    
    # 设置环境变量
    export NODE_ENV=${NODE_ENV:-production}
    
    # 执行部署步骤
    check_requirements
    install_dependencies
    setup_environment
    
    if [ "$1" != "--skip-db" ]; then
        init_database
    fi
    
    setup_logs
    setup_service
    start_service
    setup_cron
    
    if [ "$1" != "--test" ]; then
        run_tests
    fi
    
    show_deployment_info
    
    log_info "部署完成！"
}

# 执行主函数
main "$@"
