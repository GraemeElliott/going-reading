const formatter = new Intl.NumberFormat('en-US');

export const formatUtils = {
  formatNumber(value: number): string {
    return formatter.format(value);
  },

  formatReadingTime(minutes: number): string {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const remainingMinutes = Math.floor(minutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    if (remainingMinutes > 0)
      parts.push(
        `${remainingMinutes} ${remainingMinutes === 1 ? 'min' : 'mins'}`
      );

    return parts.join(' ') || '0 mins';
  },
};
