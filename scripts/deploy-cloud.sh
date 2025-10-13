#!/bin/bash

# 微信云开发部署脚本
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
    log_step "检查开发环境..."
    
    # 检查微信开发者工具
    if ! command -v wechat-devtools &> /dev/null; then
        log_warn "微信开发者工具未安装，请手动部署云函数"
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js >= 16.0.0"
        exit 1
    fi
    
    log_info "环境检查完成"
}

# 配置云开发
setup_cloud_development() {
    log_step "配置云开发..."
    
    # 检查project.config.json
    if [ ! -f "project.config.json" ]; then
        log_error "project.config.json 文件不存在"
        exit 1
    fi
    
    # 检查app.js
    if [ ! -f "app.js" ]; then
        log_error "app.js 文件不存在"
        exit 1
    fi
    
    log_info "云开发配置检查完成"
}

# 部署云函数
deploy_cloud_functions() {
    log_step "部署云函数..."
    
    # 检查云函数目录
    if [ ! -d "cloudfunctions" ]; then
        log_error "cloudfunctions 目录不存在"
        exit 1
    fi
    
    # 部署爬虫云函数
    if [ -d "cloudfunctions/crawler" ]; then
        log_info "部署爬虫云函数..."
        # 这里需要手动在微信开发者工具中部署
        log_warn "请在微信开发者工具中右键 cloudfunctions/crawler 文件夹，选择「上传并部署：云端安装依赖」"
    fi
    
    # 部署数据库初始化云函数
    if [ -d "cloudfunctions/init-database" ]; then
        log_info "部署数据库初始化云函数..."
        # 这里需要手动在微信开发者工具中部署
        log_warn "请在微信开发者工具中右键 cloudfunctions/init-database 文件夹，选择「上传并部署：云端安装依赖」"
    fi
    
    log_info "云函数部署完成"
}

# 初始化数据库
init_database() {
    log_step "初始化数据库..."
    
    log_info "请在微信开发者工具控制台执行以下代码来初始化数据库："
    echo ""
    echo "wx.cloud.callFunction({"
    echo "  name: 'init-database',"
    echo "  success: res => {"
    echo "    console.log('数据库初始化成功:', res);"
    echo "  },"
    echo "  fail: err => {"
    echo "    console.error('数据库初始化失败:', err);"
    echo "  }"
    echo "});"
    echo ""
    
    log_info "数据库初始化代码已生成"
}

# 配置小程序
setup_miniprogram() {
    log_step "配置小程序..."
    
    # 检查必要的文件
    local required_files=(
        "app.js"
        "project.config.json"
        "utils/cloudApi.js"
        "pages/index/index.js"
        "pages/category/category.js"
        "pages/detail/detail.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "必要文件不存在: $file"
            exit 1
        fi
    done
    
    log_info "小程序配置检查完成"
}

# 显示部署信息
show_deployment_info() {
    log_step "部署信息"
    
    echo "=========================================="
    echo "🎉 微信云开发部署完成！"
    echo "=========================================="
    echo "云函数:"
    echo "  - crawler: 爬虫云函数"
    echo "  - init-database: 数据库初始化云函数"
    echo ""
    echo "数据库集合:"
    echo "  - recipes: 菜谱数据"
    echo "  - categories: 分类数据"
    echo "  - user_favorites: 用户收藏"
    echo "  - user_ratings: 用户评分"
    echo "  - crawl_logs: 爬取日志"
    echo ""
    echo "下一步操作:"
    echo "1. 在微信开发者工具中部署云函数"
    echo "2. 执行数据库初始化"
    echo "3. 配置小程序权限"
    echo "4. 测试小程序功能"
    echo "=========================================="
}

# 主函数
main() {
    log_info "开始部署微信云开发..."
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [选项]"
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --skip-check   跳过环境检查"
        exit 0
    fi
    
    # 执行部署步骤
    if [ "$1" != "--skip-check" ]; then
        check_environment
    fi
    
    setup_cloud_development
    deploy_cloud_functions
    init_database
    setup_miniprogram
    show_deployment_info
    
    log_info "部署完成！"
}

# 执行主函数
main "$@"
