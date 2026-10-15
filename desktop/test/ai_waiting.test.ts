// 等待气泡的进度显示：等待期间显示"模型正在干什么"（工具调用进度），
// 让用户一眼分辨"在干活"还是"真挂了"，而不是靠猜（等不住关掉页面会中止本轮）。
import assert from "node:assert/strict";
import { createElement } from "react";
import test from "node:test";
import { textOf, withRenderer } from "./helpers/render.ts";

const PROGRESS = { active: true, elapsed_ms: 4_200, tool_calls: 2, running_tool: "fetch_endpoint", last_tool: "search_web" };
const label = (n: string) => (n === "fetch_endpoint" ? "获取数据" : n === "search_web" ? "联网搜索" : n);

test("等待气泡:有后端进度时显示正在干什么,工具名走垂类文案", async () => {
  await withRenderer(async (r) => {
    const { AiWaiting } = await r.load("/src/core/ai/AiMessages.tsx");
    const text = textOf(r.html(AiWaiting, { progress: PROGRESS, toolLabel: label }));
    assert.match(text, /等待回答/);
    assert.match(text, /正在获取数据（第 3 次工具调用）/);
    // 没有正在执行的工具、但有已完成的调用:显示计数与最近一次
    const idle = textOf(r.html(AiWaiting, { progress: { ...PROGRESS, running_tool: null, tool_calls: 2, last_tool: "search_web" }, toolLabel: label }));
    assert.match(idle, /模型已调用工具 2 次（最近：联网搜索）/);
  });
});

test("等待气泡:拿不到进度（没通道/查询失败）时降级为只有秒表,不编造状态", async () => {
  await withRenderer(async (r) => {
    const { AiWaiting } = await r.load("/src/core/ai/AiMessages.tsx");
    const bare = textOf(r.html(AiWaiting, {}));
    assert.match(bare, /等待回答/);
    assert.doesNotMatch(bare, /工具调用|正在/);
    // 没有任何工具活动时不显示进度行
    const empty = textOf(r.html(AiWaiting, { progress: { active: true, elapsed_ms: 900, tool_calls: 0, running_tool: null, last_tool: null } }));
    assert.doesNotMatch(empty, /工具调用/);
  });
});

test("对话气泡区把进度传进等待气泡（AiMessages 级）", async () => {
  await withRenderer(async (r) => {
    const { AiMessages } = await r.load("/src/core/ai/AiMessages.tsx");
    const text = textOf(r.html(AiMessages, { msgs: [], loading: true, progress: PROGRESS, toolLabel: label, err: null }));
    assert.match(text, /等待回答/);
    assert.match(text, /正在获取数据/);
  });
});
