const FIRST_LOGIN_FLAG_KEYS = [
    'isFirstLogin',
    'firstLogin',
    'isNewUser',
    'first_login',
    'is_first_login',
] as const;

/** True if any supported source carries a first-login / new-user flag (auth API user body, envelope, or JWT claims). */
export function readFirstLoginFlag(
    ...sources: (Record<string, unknown> | null | undefined)[]
): boolean {
    const scan = (source: Record<string, unknown>): boolean => {
        for (const k of FIRST_LOGIN_FLAG_KEYS) {
            const v = source[k];
            if (v === true) return true;
            if (v === 'true' || v === 1 || v === '1') return true;
        }
        return false;
    };

    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        if (scan(source)) return true;
        const nested = source.user;
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
            if (scan(nested as Record<string, unknown>)) return true;
        }
    }
    return false;
}
