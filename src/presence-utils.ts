export const DISCORD_ACTIVITY_TEXT_MAX_LENGTH = 128;

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
