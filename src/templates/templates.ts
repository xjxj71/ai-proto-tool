import { v4 as uuidv4 } from "uuid";
import { Canvas, Rect, IText, Circle } from "fabric";
import type { ComponentTemplate } from "@/stores/componentStore";

export interface TemplateFactory {
  name: string;
  tags: string[];
  isBuiltIn: true;
  previewPath: string;
  create: (canvas: Canvas) => void;
}

function addObject(canvas: Canvas, obj: Rect | IText | Circle): void {
  obj.set("elementId" as never, uuidv4());
  canvas.add(obj);
}

export const BUILT_IN_TEMPLATE_FACTORIES: TemplateFactory[] = [
  {
    name: "顶部导航栏",
    tags: ["navbar", "导航", "顶部"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 0, top: 0, width: 1440, height: 60, fill: "#1a1a2e" }));
      addObject(canvas, new IText("Logo", { left: 24, top: 18, fontSize: 20, fill: "#e0e0e0" }));
      addObject(canvas, new IText("首页  产品  关于  联系", { left: 600, top: 20, fontSize: 14, fill: "#a0a0b8" }));
      addObject(canvas, new Rect({ left: 1300, top: 14, width: 80, height: 32, rx: 4, fill: "#7c6aef" }));
      addObject(canvas, new IText("登录", { left: 1316, top: 22, fontSize: 12, fill: "#ffffff" }));
    },
  },
  {
    name: "侧边导航栏",
    tags: ["sidebar", "侧边", "导航"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 0, top: 0, width: 240, height: 900, fill: "#16213e" }));
      addObject(canvas, new IText("Logo", { left: 24, top: 24, fontSize: 18, fill: "#e0e0e0" }));
      addObject(canvas, new Rect({ left: 16, top: 72, width: 208, height: 36, rx: 4, fill: "#0f3460" }));
      addObject(canvas, new IText("概览", { left: 32, top: 82, fontSize: 13, fill: "#7c6aef" }));
      addObject(canvas, new IText("数据", { left: 32, top: 124, fontSize: 13, fill: "#a0a0b8" }));
      addObject(canvas, new IText("用户", { left: 32, top: 160, fontSize: 13, fill: "#a0a0b8" }));
      addObject(canvas, new IText("设置", { left: 32, top: 196, fontSize: 13, fill: "#a0a0b8" }));
    },
  },
  {
    name: "登录表单",
    tags: ["form", "登录", "表单"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 470, top: 200, width: 500, height: 440, rx: 8, fill: "#1e1e3a", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new IText("登录", { left: 620, top: 240, fontSize: 24, fill: "#e0e0e0" }));
      addObject(canvas, new IText("邮箱", { left: 530, top: 310, fontSize: 12, fill: "#a0a0b8" }));
      addObject(canvas, new Rect({ left: 530, top: 332, width: 380, height: 40, rx: 4, fill: "#1a1a2e", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new IText("密码", { left: 530, top: 396, fontSize: 12, fill: "#a0a0b8" }));
      addObject(canvas, new Rect({ left: 530, top: 418, width: 380, height: 40, rx: 4, fill: "#1a1a2e", stroke: "#2a2a4a", strokeWidth: 1 }));
      addObject(canvas, new Rect({ left: 530, top: 490, width: 380, height: 44, rx: 4, fill: "#7c6aef" }));
      addObject(canvas, new IText("登 录", { left: 680, top: 504, fontSize: 14, fill: "#ffffff" }));
    },
  },
  {
    name: "数据卡片组",
    tags: ["card", "数据", "统计"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      const cardData = [
        { x: 260, label: "总用户", value: "12,345", change: "+12%" },
        { x: 500, label: "活跃用户", value: "8,901", change: "+8%" },
        { x: 740, label: "收入", value: "¥56,789", change: "+23%" },
        { x: 980, label: "订单", value: "1,234", change: "+5%" },
      ];
      for (const c of cardData) {
        addObject(canvas, new Rect({ left: c.x, top: 80, width: 220, height: 120, rx: 8, fill: "#1e1e3a", stroke: "#2a2a4a", strokeWidth: 1 }));
        addObject(canvas, new IText(c.label, { left: c.x + 20, top: 100, fontSize: 12, fill: "#a0a0b8" }));
        addObject(canvas, new IText(c.value, { left: c.x + 20, top: 132, fontSize: 28, fill: "#e0e0e0" }));
        addObject(canvas, new IText(c.change, { left: c.x + 20, top: 168, fontSize: 11, fill: "#22c55e" }));
      }
    },
  },
  {
    name: "表格",
    tags: ["table", "表格", "数据"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 260, top: 240, width: 920, height: 40, fill: "#16213e" }));
      const headers = ["ID", "名称", "状态", "日期", "操作"];
      const positions = [280, 380, 600, 780, 920];
      headers.forEach((h, i) => {
        addObject(canvas, new IText(h, { left: positions[i], top: 254, fontSize: 11, fill: "#a0a0b8" }));
      });
    },
  },
  {
    name: "轮播图",
    tags: ["carousel", "轮播", "banner"],
    isBuiltIn: true,
    previewPath: "",
    create: (canvas) => {
      addObject(canvas, new Rect({ left: 260, top: 80, width: 920, height: 400, rx: 8, fill: "#16213e" }));
      addObject(canvas, new IText("轮播图区域", { left: 560, top: 240, fontSize: 24, fill: "#a0a0b8" }));
      addObject(canvas, new Circle({ left: 680, top: 440, radius: 6, fill: "#7c6aef" }));
      addObject(canvas, new Circle({ left: 700, top: 440, radius: 6, fill: "#2a2a4a" }));
      addObject(canvas, new Circle({ left: 720, top: 440, radius: 6, fill: "#2a2a4a" }));
    },
  },
];

export function getBuiltInTemplatesForStore(): Omit<ComponentTemplate, "id">[] {
  return BUILT_IN_TEMPLATE_FACTORIES.map((factory) => ({
    name: factory.name,
    tags: factory.tags,
    isBuiltIn: true,
    previewPath: factory.previewPath,
    templateData: `factory:${factory.name}`,
  }));
}
