export const DISCORD_ACTIVITY_TEXT_MAX_LENGTH = 128;
export const DEFAULT_SENSITIVE_FILE_PATTERNS = [
    ".env*",
    "*.pem",
    "*.key",
    "*credentials*",
    "*secret*",
] as const;

export function normalizeActivityText(value: string): string | undefined {
    const normalized = value.trim().replace(/\s+/g, " ");
    const truncated = Array.from(normalized)
        .slice(0, DISCORD_ACTIVITY_TEXT_MAX_LENGTH)
        .join("")
        .trimEnd();

    return Array.from(truncated).length >= 2 ? truncated : undefined;
}

export function selectWorkspaceName(
    documentWorkspaceName: string | undefined,
    firstWorkspaceName: string | undefined,
    fallback: string
): string {
    return documentWorkspaceName || firstWorkspaceName || fallback;
}

function wildcardExpression(pattern: string): RegExp | undefined {
    const normalized = pattern.trim().replace(/\\/g, "/");
    if (!normalized) return undefined;
    const escaped = normalized
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".");
    return new RegExp(`^${escaped}$`, "i");
}

export function matchesAnyPattern(value: string, patterns: readonly string[]): boolean {
    const normalized = value.replace(/\\/g, "/");
    return patterns.some(pattern => wildcardExpression(pattern)?.test(normalized) ?? false);
}

export function isSensitiveFile(fileName: string, patterns: readonly string[]): boolean {
    const baseName = fileName.split(/[/\\]/).pop() ?? fileName;
    return matchesAnyPattern(baseName, patterns);
}

export function isWorkspaceExcluded(
    workspaceName: string | undefined,
    workspacePath: string | undefined,
    patterns: readonly string[]
): boolean {
    return (!!workspaceName && matchesAnyPattern(workspaceName, patterns)) ||
        (!!workspacePath && matchesAnyPattern(workspacePath, patterns));
}

type ScheduleTimer = (callback: () => void, delayMs: number) => unknown;
type CancelTimer = (timer: unknown) => void;

export class ActivityIdleTracker {
    private timer: unknown;
    private idle = false;

    constructor(
        private readonly onIdle: () => void,
        private readonly schedule: ScheduleTimer = (callback, delayMs) => setTimeout(callback, delayMs),
        private readonly cancel: CancelTimer = timer => clearTimeout(timer as ReturnType<typeof setTimeout>)
    ) {}

    get isIdle(): boolean {
        return this.idle;
    }

    recordActivity(timeoutSeconds: number): boolean {
        const wasIdle = this.idle;
        this.idle = false;
        this.arm(timeoutSeconds);
        return wasIdle;
    }

    arm(timeoutSeconds: number): void {
        this.clearTimer();
        if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) return;
        this.timer = this.schedule(() => {
            this.timer = undefined;
            this.idle = true;
            this.onIdle();
        }, timeoutSeconds * 1000);
    }

    dispose(): void {
        this.clearTimer();
    }

    private clearTimer(): void {
        if (this.timer !== undefined) {
            this.cancel(this.timer);
            this.timer = undefined;
        }
    }
}
