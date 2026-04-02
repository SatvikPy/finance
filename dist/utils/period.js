"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utcDateFromYmd = utcDateFromYmd;
exports.utcStartOfDay = utcStartOfDay;
exports.utcEndOfDay = utcEndOfDay;
exports.periodKey = periodKey;
exports.comparePeriodKeys = comparePeriodKeys;
function pad2(n) {
    return n.toString().padStart(2, "0");
}
function utcDateFromYmd(dateStr) {
    // Treat incoming YYYY-MM-DD as a UTC date.
    // Example: "2026-04-02" => 2026-04-02T00:00:00.000Z
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m)
        throw new Error("Invalid date format, expected YYYY-MM-DD");
    const [_, y, mo, d] = m;
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), 0, 0, 0, 0));
}
function utcStartOfDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function utcEndOfDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}
function periodKey(date, granularity) {
    if (granularity === "monthly") {
        return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
    }
    // Weekly buckets start on Monday (UTC).
    const day = date.getUTCDay(); // 0=Sun..6=Sat
    const mondayOffset = (day + 6) % 7; // Monday => 0, Sunday => 6
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - mondayOffset);
    const y = monday.getUTCFullYear();
    const m = pad2(monday.getUTCMonth() + 1);
    const dd = pad2(monday.getUTCDate());
    return `${y}-${m}-${dd}`; // Monday date label
}
function comparePeriodKeys(a, b, granularity) {
    // Keys are either YYYY-MM or YYYY-MM-DD; lexical compare works for both.
    // This helper exists only to make sorting explicit.
    if (granularity === "monthly")
        return a.localeCompare(b);
    return a.localeCompare(b);
}
//# sourceMappingURL=period.js.map