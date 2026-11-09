import { spawn } from "node:child_process";

function duration(value) {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h)?$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  return Number(match[1]) * ({ ms: 1, s: 1000, m: 60000, h: 3600000 }[match[2] || "s"]);
}

const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error("A command is required.");
const limit = duration(process.env.SITES_BUILD_TIMEOUT || "3m");
const grace = duration(process.env.SITES_BUILD_KILL_AFTER || "10s");
const child = spawn(command, args, { stdio: "inherit", detached: process.platform !== "win32" });
let timedOut = false;
let killTimer;
function signalChild(signal) {
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}
const timer = setTimeout(() => {
  timedOut = true;
  signalChild("SIGTERM");
  killTimer = setTimeout(() => signalChild("SIGKILL"), grace);
}, limit);
child.on("error", error => {
  clearTimeout(timer);
  console.error(error.message);
  process.exitCode = 69;
});
child.on("exit", (code, signal) => {
  clearTimeout(timer);
  clearTimeout(killTimer);
  process.exitCode = timedOut ? 124 : (code ?? (signal ? 1 : 0));
});
