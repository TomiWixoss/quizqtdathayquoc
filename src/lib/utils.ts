import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format số lớn thành dạng ngắn gọn (1K, 1.5M, etc.)
 * @param num - Số cần format
 * @param decimals - Số chữ số thập phân (mặc định 1)
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(decimals)}K`;
  }
  if (num < 1000000000) {
    const m = num / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(decimals)}M`;
  }
  const b = num / 1000000000;
  return b % 1 === 0 ? `${b}B` : `${b.toFixed(decimals)}B`;
}
