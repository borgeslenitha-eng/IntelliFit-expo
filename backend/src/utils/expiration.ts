export const MAX_EXPIRATION_YEARS = 10;

export type ExpirationStatus = "EXPIRED" | "TODAY" | "VALID";
export type ExpirationAttentionStatus = "EXPIRED" | "TODAY" | "ATTENTION" | "VALID";
export type ExpirationValidationReason = "INVALID" | "PAST" | "TOO_FAR";

export type ExpirationValidation =
    | { valid: true }
    | {
        valid: false;
        reason: ExpirationValidationReason;
        maxDate: string;
    };

export function todayInBrazilIso(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function isIsoDate(value: string): boolean {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

export function maxExpirationDateIso(
    referenceDate = todayInBrazilIso()
): string {
    const date = new Date(`${referenceDate}T12:00:00Z`);
    date.setUTCFullYear(date.getUTCFullYear() + MAX_EXPIRATION_YEARS);
    return date.toISOString().slice(0, 10);
}

export function validateExpirationDate(
    isoDate: string,
    options?: {
        allowPast?: boolean;
        referenceDate?: string;
    }
): ExpirationValidation {
    const referenceDate = options?.referenceDate ?? todayInBrazilIso();
    const maxDate = maxExpirationDateIso(referenceDate);

    if (!isIsoDate(isoDate)) {
        return { valid: false, reason: "INVALID", maxDate };
    }

    if (!options?.allowPast && isoDate < referenceDate) {
        return { valid: false, reason: "PAST", maxDate };
    }

    if (isoDate > maxDate) {
        return { valid: false, reason: "TOO_FAR", maxDate };
    }

    return { valid: true };
}

export function daysUntilExpiration(
    dateValue: string | Date,
    referenceDate = todayInBrazilIso()
): number {
    const isoDate = dateValue instanceof Date
        ? dateValue.toISOString().slice(0, 10)
        : String(dateValue).slice(0, 10);

    const today = new Date(`${referenceDate}T12:00:00Z`);
    const expiration = new Date(`${isoDate}T12:00:00Z`);

    return Math.round(
        (expiration.getTime() - today.getTime()) / 86400000
    );
}

export function getExpirationStatus(
    dateValue: string | Date,
    referenceDate = todayInBrazilIso()
): ExpirationStatus {
    const days = daysUntilExpiration(dateValue, referenceDate);

    if (days < 0) {
        return "EXPIRED";
    }

    if (days === 0) {
        return "TODAY";
    }

    return "VALID";
}


export function getExpirationAttentionStatus(
    dateValue: string | Date,
    referenceDate = todayInBrazilIso()
): ExpirationAttentionStatus {
    const days = daysUntilExpiration(dateValue, referenceDate);

    if (days < 0) {
        return "EXPIRED";
    }

    if (days === 0) {
        return "TODAY";
    }

    if (days <= 7) {
        return "ATTENTION";
    }

    return "VALID";
}

export function formatExpirationDateForUser(
    dateValue: string | Date,
    referenceDate = todayInBrazilIso()
): string {
    const isoDate = dateValue instanceof Date
        ? dateValue.toISOString().slice(0, 10)
        : String(dateValue).slice(0, 10);

    const days = daysUntilExpiration(isoDate, referenceDate);

    if (days === 0) {
        return "hoje";
    }

    if (days === 1) {
        return "amanhã";
    }

    const [year, month, day] = isoDate.split("-");
    return year && month && day
        ? `${day}/${month}/${year}`
        : isoDate;
}
