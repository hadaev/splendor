/*
 * Codex PreToolUse hook for OpenRouter's Jev Decisions API.
 * Fail-open is intentional: an unavailable classifier must not make Codex unusable.
 */
const https = require("https");

const MAX_INPUT_CHARS = 12000;
const CONFIDENCE_THRESHOLD = 0.9;
const DEBUG = process.env.JEV_GUARD_DEBUG === "1";

function debug(message) {
  if (DEBUG) process.stderr.write(`[jev-guard] ${message}\n`);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function requestDecision(apiKey, state) {
  const body = JSON.stringify({
    model: "~typesafe/jev-latest",
    state,
    questions: {
      high_risk: {
        type: "noul",
        instructions: "Would executing this tool call create a high risk of irreversible data loss, credential/secret disclosure, or an unauthorized external action?",
        criteria: {
          true: "The call deletes or overwrites important data, exposes a secret, disables a security control, or performs an external action without clear user authorization.",
          false: "The call is a normal reversible development action, a read-only inspection, or a requested and clearly scoped change."
        }
      }
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "openrouter.ai",
      path: "/api/alpha/decisions",
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      },
      timeout: 5000
    }, (res) => {
      let response = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { response += chunk; });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Jev returned HTTP ${res.statusCode}`));
          return;
        }
        try { resolve(JSON.parse(response)); } catch (error) { reject(error); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("Jev request timed out")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    debug("OPENROUTER_API_KEY is not available to the hook process.");
    return;
  }

  const event = JSON.parse(await readStdin());
  debug(`received ${event.tool_name ?? "unknown"} tool call`);
  const serializedInput = JSON.stringify(event.tool_input ?? {});
  const state = JSON.stringify({
    tool: event.tool_name,
    input: serializedInput.slice(0, MAX_INPUT_CHARS)
  });
  const result = await requestDecision(apiKey, state);
  const probability = result?.answers?.high_risk?.noul;
  debug(`response keys: ${Object.keys(result ?? {}).join(", ") || "none"}`);

  if (typeof probability === "number" && probability >= CONFIDENCE_THRESHOLD) {
    debug(`blocking call; risk confidence ${probability.toFixed(2)}`);
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Blocked by Jev safety guard (risk confidence ${probability.toFixed(2)}).`
      }
    }));
  } else {
    debug(`allowing call; high_risk probability: ${typeof probability === "number" ? probability.toFixed(2) : "missing"}`);
  }
}

main().catch((error) => {
  debug(`request failed: ${error.message}`);
  process.exit(0);
});
