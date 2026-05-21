import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyInr', standalone: true, pure: true })
export class CurrencyInrPipe implements PipeTransform {
  transform(value: number | string, decimals = 0): string {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style:                 'currency',
      currency:              'INR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  }
}
