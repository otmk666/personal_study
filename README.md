# 个人题库

一款面向个人备考、知识巩固的本地化题库管理系统，支持自主录入题目、多模式刷题练习、智能错题复习、学习数据可视化，以及基于 AI 的学习监督能力。

## 功能特性

### 📚 题库管理
- 支持 4 种题型：单选题、多选题、判断题、简答题
- 题目支持 Markdown 格式（代码块、表格、列表等）
- 多维度筛选：题型、分类、难度、标签、关键词搜索
- 批量操作：批量删除、复制题目
- 导入导出：JSON、Markdown 格式

### 📂 分类与标签
- 自定义分类管理，支持排序
- 多标签系统，灵活标记知识点
- 分类 + 标签组合筛选

### ✍️ 刷题练习
- **练习模式**：答完即看答案解析，实时反馈
- **考试模式**：批量作答后统一判分，模拟考试
- 自定义刷题范围：分类、难度、标签、错题本、收藏夹
- 随机组卷，支持设置题量
- 答题计时，单题/整卷计时
- 刷题进度持久化

### 📖 错题本与复习
- 错题自动收录，记录错误次数
- 艾宾浩斯遗忘曲线复习机制
- 手动标记「已掌握」
- 错题专项练习

### ⭐ 收藏夹
- 多收藏夹分类管理
- 重点题目收藏
- 收藏夹专项练习

### 📊 数据统计
- 首页数据看板：总题量、刷题数、正确率等
- 刷题趋势图（近 7 天 / 30 天）
- 分类掌握度分析
- 正确率趋势

### 🤖 AI 学习监督（可选）
- 基于 YOLOv8 的实时行为检测
- 专注度评分体系
- 分心行为识别（玩手机、趴桌、离开、视线偏离）
- 专注度数据统计与趋势
- **隐私保障**：所有画面本地处理，不存储影像数据

### 🎨 界面体验
- 浅色 / 深色 / 跟随系统 三种主题
- 响应式布局，适配移动端
- 简洁清爽的工具风设计
- 流畅的交互动画

## 技术栈

### 后端
- Python 3.10+
- FastAPI（Web 框架）
- SQLAlchemy 2.0（ORM）
- SQLite（默认数据库，可切换 PostgreSQL）
- Pydantic v2（数据校验）
- Uvicorn（ASGI 服务器）
- Ultralytics YOLOv8（AI 视觉检测，可选）

### 前端
- React 18 + Vite
- TailwindCSS 3（样式）
- Zustand（状态管理）
- React Router DOM（路由）
- Lucide React（图标）
- React Markdown（Markdown 渲染）
- Recharts（数据可视化）
- Axios（网络请求）

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+（前端开发）

### 后端启动

#### Windows 系统（推荐）

直接双击运行 `backend/start.bat`，脚本会自动检查环境、安装依赖、初始化数据并启动服务。

#### 手动启动

1. 进入后端目录
```bash
cd backend
```

2. 安装依赖
```bash
# Windows
py -m pip install -r requirements.txt

# macOS/Linux
pip install -r requirements.txt
```

3. 初始化数据库（首次运行）
```bash
# Windows
py init_data.py

# macOS/Linux
python init_data.py
```

4. 启动服务
```bash
# Windows
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# macOS/Linux
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- 接口文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/api/health

### 前端启动

#### Windows 系统（推荐）

直接双击运行 `frontend/start.bat`，脚本会自动检查环境、安装依赖并启动开发服务器。

> **注意**：启动前端前请确保后端服务已启动。

#### 手动启动

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

- 访问地址：http://localhost:5173

### AI 监督模块（可选）

1. 安装额外依赖
```bash
pip install ultralytics opencv-python
```

2. 下载 YOLOv8 模型
```bash
# 模型会自动下载，也可手动放置到指定路径
```

3. 在 `.env` 中启用
```
AI_ENABLED=true
YOLO_MODEL_PATH=yolov8n-pose.pt
```

## 项目结构

```
个人复习题库/
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── ai/              # AI 检测模块
│   │   ├── core/            # 核心配置
│   │   ├── crud/            # 数据库操作
│   │   ├── models/          # 数据模型
│   │   ├── routers/         # 路由接口
│   │   ├── schemas/         # 请求/响应模型
│   │   └── utils/           # 工具函数
│   ├── data/                # 数据文件
│   ├── init_data.py         # 初始化脚本
│   ├── requirements.txt     # Python 依赖
│   └── start.bat            # 启动脚本
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── api/             # API 封装
│   │   ├── assets/          # 静态资源
│   │   ├── components/      # 组件
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── pages/           # 页面
│   │   ├── store/           # 状态管理
│   │   └── utils/           # 工具函数
│   ├── package.json
│   └── start.bat
└── README.md
```

## API 接口

所有接口统一响应格式：
```json
{
  "code": 200,
  "data": {},
  "msg": "success"
}
```

### 主要接口
- `GET /api/questions` - 获取题目列表
- `POST /api/questions` - 创建题目
- `PUT /api/questions/{id}` - 更新题目
- `DELETE /api/questions/{id}` - 删除题目
- `POST /api/practice/session` - 创建练习会话
- `POST /api/practice/answer` - 提交答案
- `GET /api/wrong` - 错题列表
- `GET /api/stats/dashboard` - 仪表盘统计
- 更多接口见 Swagger 文档

## 数据备份

- **导出**：系统设置 → 数据管理 → 导出全部数据
- **导入**：系统设置 → 数据管理 → 从备份文件导入
- 支持 JSON 格式全量备份

## 隐私说明

- 所有数据默认存储在本地
- AI 监督模式下，摄像头画面仅在本地处理
- 不存储任何影像数据，仅保存专注度数值和行为统计
- 可随时一键清空专注度历史记录

## License

MIT
