import type { AppEnv } from "@/src/lib/env";

export type LogLevel = AppEnv["LOG_LEVEL"];
export type LogContext = Readonly<Record<string, unknown>>;

type LogWriter = (line: string) => void;

const writers: Record<Exclude<LogLevel, "silent">, LogWriter> = {
  debug: (line) => console.debug(line),
  error: (line) => console.error(line),
  info: (line) => console.info(line),
  warn: (line) => console.warn(line),
};

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Number.POSITIVE_INFINITY,
};

function writeLog(level: Exclude<LogLevel, "silent">, event: string, context: LogContext = {}): void {
  const configuredLevel = process.env.LOG_LEVEL ?? "info";
  const threshold: LogLevel = logLevelValues.has(configuredLevel as LogLevel)
    ? (configuredLevel as LogLevel)
    : "info";

  if (level !== "error" && levelPriority[level] < levelPriority[threshold]) {
    return;
  }

  writers[level](JSON.stringify({ event, level, ...context }));
}

const logLevelValues = new Set<LogLevel>(["silent", "error", "warn", "info", "debug"]);

export function logDebug(event: string, context?: LogContext): void {
  writeLog("debug", event, context);
}

export function logInfo(event: string, context?: LogContext): void {
  writeLog("info", event, context);
}

export function logWarn(event: string, context?: LogContext): void {
  writeLog("warn", event, context);
}

export function logError(event: string, context?: LogContext): void {
  writeLog("error", event, context);
}
