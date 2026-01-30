export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    NAME: /^[A-Za-z]{2,}$/,
    PHONE: /^\d{10}$/,
    DATE: /^\d{4}-\d{2}-\d{2}$/,
    TIME: /^([01]\d|2[0-3]):([0-5]\d)$/,
} as const;