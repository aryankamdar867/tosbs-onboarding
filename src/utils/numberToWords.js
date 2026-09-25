export function numberToWordsIndian(num) {
  if (!num || isNaN(num)) return '';
  num = Math.round(Number(num));
  if (num === 0) return 'Zero';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const formatTwoDigits = (n) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '');
  };

  const formatThreeDigits = (n) => {
    let str = '';
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      str += formatTwoDigits(n);
    }
    return str.trim();
  };

  let result = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  if (crore > 0) result += formatThreeDigits(crore) + ' Crore ';
  if (lakh > 0) result += formatThreeDigits(lakh) + ' Lakh ';
  if (thousand > 0) result += formatThreeDigits(thousand) + ' Thousand ';
  if (remainder > 0) result += formatThreeDigits(remainder);

  return result.trim();
}
