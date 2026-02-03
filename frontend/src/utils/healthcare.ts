/**
 * Formats a blood type string from internal enum format to a user-friendly format.
 * Example: 'A_POS' -> 'A+', 'O_NEG' -> 'O-'
 */
export const formatBloodType = (bloodType: string | undefined): string => {
    if (!bloodType) return 'Not set';

    return bloodType
        .replace('_POS', '+')
        .replace('_NEG', '-')
        .replace('POS', '+')
        .replace('NEG', '-');
};
