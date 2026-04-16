/**
 * 日期格式化
 * @param date Date 对象或时间戳
 * @param pattern 格式模板，支持 YYYY MM DD HH mm ss
 */
export function formatDate(
  date: Date | number | string,
  pattern = "YYYY-MM-DD HH:mm:ss",
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    DD: String(d.getDate()).padStart(2, "0"),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
    ss: String(d.getSeconds()).padStart(2, "0"),
  };

  return pattern.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
}

/**
 * 金额千分位格式化
 * @param amount 数值
 * @param decimals 小数位数，默认 2
 */
export function formatMoney(amount: number, decimals = 2): string {
  const fixed = amount.toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${intFormatted}.${dec}` : intFormatted;
}
