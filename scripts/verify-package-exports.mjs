import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const load = file => import(pathToFileURL(path.join(root, "dist", file)).href);

const [topLevel, bridge, hooks, utils] = await Promise.all([
  load("index.mjs"),
  load("bridge/index.mjs"),
  load("hooks/index.mjs"),
  load("utils/index.mjs"),
]);

for (const name of [
  "invokeMbaseCapability",
  "postMbaseMessage",
  "waitForMbaseAppBridge",
  "getMbaseTransportStatus",
  "configureMbaseBridge",
]) {
  assert.equal(typeof bridge[name], "function", `./bridge 缺少运行时导出 ${name}`);
  assert.equal(typeof topLevel[name], "function", `主入口缺少运行时导出 ${name}`);
}

assert.equal(typeof bridge.MbaseBridgeError, "function");
assert.equal(typeof hooks.useCamera, "function");
assert.equal(typeof utils.compressImage, "function");

console.log("npm 子路径运行时导出校验通过：主入口、bridge、hooks、utils 一致");
