/** 中国大陆手机号（1开头 11 位） */
export function isPhone(str: string): boolean {
  return /^1[3-9]\d{9}$/.test(str);
}

/** 18 位身份证号（含末位 X） */
export function isIdCard(str: string): boolean {
  if (!/^\d{17}[\dXx]$/.test(str)) return false;

  // 校验码验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = "10X98765432";
  const sum = str
    .substring(0, 17)
    .split("")
    .reduce((acc, ch, i) => acc + Number(ch) * weights[i], 0);
  return checkCodes[sum % 11] === str[17].toUpperCase();
}

/** 邮箱 */
export function isEmail(str: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str);
}

/** 统一社会信用代码（18 位） */
export function isCreditCode(str: string): boolean {
  return /^[0-9A-HJ-NP-RTUW-Y]{2}\d{6}[0-9A-HJ-NP-RTUW-Y]{10}$/.test(str);
}
