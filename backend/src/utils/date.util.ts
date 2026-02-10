/**
 * Date Utility for handling IST (India Standard Time) conversions.
 * IST is UTC+5:30
 */

/**
 * Returns the day of the week (0-6) for a given date in IST.
 */
export const getISTDay = (date: Date): number => {
    // IST is 5h 30m ahead of UTC
    const istDate = new Date(date.getTime() + (5 * 60 + 30) * 60000);
    return istDate.getUTCDay();
};

/**
 * Returns time string in "HH:mm" 24h format for a given date in IST.
 */
export const getISTTimeString = (date: Date): string => {
    const istDate = new Date(date.getTime() + (5 * 60 + 30) * 60000);
    const hours = istDate.getUTCHours().toString().padStart(2, '0');
    const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Formats a date to a descriptive string in IST (e.g., "12 February 2026").
 */
export const formatToISTDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
};

/**
 * Formats a time to a descriptive string in IST (e.g., "09:30 AM").
 */
export const formatToISTTime = (date: Date): string => {
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
};
/**
 * Returns date string in "YYYY-MM-DD" format for a given date in IST.
 */
export const getISTDateKey = (date: Date): string => {
    const istDate = new Date(date.getTime() + (5 * 60 + 30) * 60000);
    const year = istDate.getUTCFullYear();
    const month = (istDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = istDate.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
