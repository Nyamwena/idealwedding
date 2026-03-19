// COPY TO: frontend/src/lib/api.ts

export const API_BASE = '/api';

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'Something went wrong');
    }

    return data;
}