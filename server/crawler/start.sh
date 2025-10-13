#!/bin/bash

# 小红书菜谱爬虫服务启动脚本
# 版本: 1.0.0

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

# 检查环境
check_environment() {
    log_step "检查运行环境..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js >= 16.0.0"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 检查MySQL
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL 未安装，请先安装 MySQL >= 5.7"
        exit 1
    fi
    
    log_info "环境检查通过"
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在"
        exit 1
    fi
    
    npm install
    
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

# 启动服务
start_service() {
    log_step "启动服务..."
    
    if [ "$NODE_ENV" = "production" ]; then
        if command -v pm2 &> /dev/null; then
            pm2 start ecosystem.config.js
            pm2 save
            log_info "服务已通过 PM2 启动"
        else
            log_warn "PM2 未安装，使用 node 启动"
            nohup node index.js > logs/app.log 2>&1 &
            echo $! > app.pid
            log_info "服务已启动，PID: $(cat app.pid)"
        fi
    else
        log_info "开发模式启动"
        node index.js
    fi
}

# 检查服务状态
check_service() {
    log_step "检查服务状态..."
    
    # 等待服务启动
    sleep 5
    
    # 检查服务是否运行
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_info "服务启动成功"
    else
        log_error "服务启动失败"
        exit 1
    fi
}

# 显示服务信息
show_service_info() {
    log_step "服务信息"
    
    echo "=========================================="
    echo "🎉 小红书菜谱爬虫服务启动完成！"
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
        echo "  停止服务: Ctrl+C"
    fi
    
    echo "=========================================="
}

# 主函数
main() {
    log_info "开始启动小红书菜谱爬虫服务..."
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [选项]"
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --skip-db      跳过数据库初始化"
        echo "  --skip-install 跳过依赖安装"
        exit 0
    fi
    
    # 设置环境变量
    export NODE_ENV=${NODE_ENV:-development}
    
    # 执行启动步骤
    check_environment
    
    if [ "$1" != "--skip-install" ]; then
        install_dependencies
    fi
    
    setup_environment
    
    if [ "$1" != "--skip-db" ]; then
        init_database
    fi
    
    setup_logs
    start_service
    check_service
    show_service_info
    
    log_info "启动完成！"
}

# 执行主函数
main "$@"
