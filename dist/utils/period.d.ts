export type Granularity = "monthly" | "weekly";
export declare function utcDateFromYmd(dateStr: string): Date;
export declare function utcStartOfDay(d: Date): Date;
export declare function utcEndOfDay(d: Date): Date;
export declare function periodKey(date: Date, granularity: Granularity): string;
export declare function comparePeriodKeys(a: string, b: string, granularity: Granularity): number;
//# sourceMappingURL=period.d.ts.map