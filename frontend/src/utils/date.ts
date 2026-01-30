/**
 * Format a date string or object into a human-readable format
 * e.g., "Jan 30, 2026"
 */
export const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Format a time from a date string or object
 * e.g., "10:00 AM"
 */
export const formatTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format a duration between two dates in minutes
 */
export const formatDuration = (start: string | Date, end: string | Date): string => {
    const s = typeof start === 'string' ? new Date(start) : start;
    const e = typeof end === 'string' ? new Date(end) : end;
    const diffMs = e.getTime() - s.getTime();
    const diffMins = Math.round(diffMs / 60000);
    return `${diffMins} mins`;
};
