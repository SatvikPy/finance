"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMoneyToCents = parseMoneyToCents;
exports.formatMoneyFromCents = formatMoneyFromCents;
function parseMoneyToCents(input) {
    if (typeof input === "number") {
        if (!Number.isFinite(input))
            throw new Error("Invalid amount");
        return Math.round(input * 100);
    }
    if (typeof input === "string") {
        const s = input.trim();
        if (!s)
            throw new Error("Invalid amount");
        // Support up to 2 decimals without floating-point drift.
        const match = s.match(/^(-)?(\d+)(?:\.(\d{1,2}))?$/);
        if (!match)
            throw new Error("Invalid amount format");
        const negative = Boolean(match[1]);
        const whole = match[2];
        const frac = match[3] ?? "0";
        const frac2 = frac.padEnd(2, "0");
        const cents = Number(whole) * 100 + Number(frac2);
        return negative ? -cents : cents;
    }
    throw new Error("Invalid amount");
}
function formatMoneyFromCents(cents) {
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    const dollars = Math.floor(abs / 100);
    const rem = abs % 100;
    return `${sign}${dollars}.${rem.toString().padStart(2, "0")}`;
}
//# sourceMappingURL=money.js.map