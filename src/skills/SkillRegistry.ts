export interface SkillDefinition {
  id: string;
  name: string;
  keywords: string[];
  description: string;
  prompt: string;
  outputFormat: string;
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    id: "landing-page",
    name: "Landing Page",
    keywords: ["落地页", "首页", "Landing", "landing page"],
    description: "生成完整落地页原型",
    prompt: `你是一位专业的落地页设计专家。请根据用户需求生成一个完整的落地页原型。

设计要求：
1. 包含 Hero 区域（大标题 + 副标题 + CTA 按钮）
2. 特性展示区（3-4个核心功能卡片）
3. 社会证明区（用户评价/合作伙伴 logo）
4. CTA 区域（号召行动）
5. Footer（底部导航/版权信息）

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    keywords: ["仪表盘", "Dashboard", "数据面板", "后台", "管理后台"],
    description: "生成后台管理面板原型",
    prompt: `你是一位专业的后台管理系统设计专家。请根据用户需求生成一个完整的仪表盘面板原型。

设计要求：
1. 左侧导航栏（可折叠）
2. 顶部信息栏（用户信息/通知）
3. 数据统计卡片（4个关键指标）
4. 图表区域（折线图/柱状图占位）
5. 数据表格（含搜索、筛选、分页）

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "form-design",
    name: "Form Design",
    keywords: ["表单", "注册", "登录", "填写", "签约"],
    description: "生成表单页原型",
    prompt: `你是一位专业的表单设计专家。请根据用户需求生成一个表单页面原型。

设计要求：
1. 清晰的表单标题和说明
2. 合理的输入字段布局（标签 + 输入框）
3. 校验提示样式
4. 提交/取消按钮
5. 如需多步骤，显示进度指示器

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "e-commerce",
    name: "E-Commerce",
    keywords: ["电商", "商品", "购物", "商城", "店铺"],
    description: "生成电商相关页面",
    prompt: `你是电商页面设计专家。请根据用户需求生成电商相关原型页面。

设计要求：
1. 商品展示区域
2. 购物流程
3. 分类与筛选
4. 购物车摘要
5. 促销展示
6. 用户评价

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "data-table",
    name: "Data Table",
    keywords: ["表格", "列表", "数据展示", "CRUD"],
    description: "生成数据表格页",
    prompt: `你是数据表格设计专家。请生成含搜索筛选、分页、操作按钮的数据表格原型页面。

设计要求：
1. 表头区域
2. 表格主体
3. 筛选面板
4. 分页控件
5. 行内操作
6. 空状态和加载状态

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "navigation",
    name: "Navigation",
    keywords: ["导航", "菜单", "侧边栏", "Navbar", "Sidebar"],
    description: "设计导航方案",
    prompt: `你是导航设计专家。请设计顶部导航、侧边导航、面包屑等导航组件方案。

设计要求：
1. 顶部导航栏
2. 侧边导航栏
3. 面包屑导航
4. 响应式适配
5. 权限感知
6. 视觉层次

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "mobile-layout",
    name: "Mobile Layout",
    keywords: ["移动端", "手机端", "H5", "App页面"],
    description: "生成移动端布局",
    prompt: `你是移动端设计专家。请自动切换到移动端画布，生成符合移动端规范的布局原型。

设计要求：
1. 画布尺寸：自动设置为375x812或414x896视口
2. 移动端导航
3. 触控友好
4. 内容优先
5. 手势交互
6. 输入适配

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "card-list",
    name: "Card List",
    keywords: ["卡片", "瀑布流", "Feed", "动态"],
    description: "生成卡片列表布局",
    prompt: `你是卡片布局设计专家。请生成信息卡片、图片卡片、混合内容流的列表布局。

设计要求：
1. 卡片结构
2. 布局模式
3. 内容类型适配
4. 交互状态
5. 加载更多
6. 空状态

输出格式：
{
  "type": "generate",
  "html": "...",
  "css": "...",
  "interactions": [],
  "message": "..."
}`,
    outputFormat: "generate",
  },
  {
    id: "design-system",
    name: "Design System",
    keywords: ["设计系统", "规范", "Design System"],
    description: "生成或更新设计系统规范",
    prompt: `你是设计系统专家。根据项目上下文生成或更新设计系统规范（配色、字体、间距、组件样式）。`,
    outputFormat: "generate",
  },
  {
    id: "accessibility",
    name: "Accessibility",
    keywords: ["无障碍", "可访问性", "Accessibility"],
    description: "无障碍审查和改进",
    prompt: `你是无障碍设计专家。对当前原型做无障碍审查，提出改进建议并自动修复常见问题。`,
    outputFormat: "modify",
  },
  {
    id: "responsive",
    name: "Responsive",
    keywords: ["响应式", "自适应", "多端"],
    description: "响应式布局方案",
    prompt: `你是响应式设计专家。为当前桌面端原型生成响应式布局方案。`,
    outputFormat: "modify",
  },
  {
    id: "interaction",
    name: "Interaction",
    keywords: ["交互动画", "动效", "Animation"],
    description: "添加交互动效",
    prompt: `你是交互动效设计专家。为页面元素添加合适的交互动效描述。`,
    outputFormat: "modify",
  },
  {
    id: "dark-mode",
    name: "Dark Mode",
    keywords: ["暗色模式", "深色", "Dark Mode"],
    description: "转换为暗色主题",
    prompt: `你是暗色模式设计专家。将当前亮色原型转换为暗色版本，保持对比度和可读性。`,
    outputFormat: "modify",
  },
  {
    id: "wireframe",
    name: "Wireframe",
    keywords: ["线框图", "低保真", "Wireframe"],
    description: "生成低保真线框图",
    prompt: `你是线框图设计专家。生成低保真线框图风格原型，灰度、无装饰、专注布局结构。`,
    outputFormat: "generate",
  },
  {
    id: "prototype-polish",
    name: "Prototype Polish",
    keywords: ["美化", "精修", "完善", "Polish"],
    description: "视觉精修原型",
    prompt: `你是视觉精修专家。对当前草稿级原型进行视觉精修：优化间距、配色、字体、对齐。`,
    outputFormat: "modify",
  },
];
