import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  // Corporate Base Currency
  private readonly CORPORATE_BASE = 'USD';

  // Mock exchange rates (In production, fetch from Fixer.io or similar)
  private readonly rates: Record<string, number> = {
    USD: 1.0,
    INR: 83.50,
    GBP: 0.80,
    EUR: 0.93,
  };

  /**
   * Converts an amount from local currency to corporate base currency.
   */
  convertToBase(amount: number | string, fromCurrency: string): { amount: Decimal; rate: Decimal } {
    const rate = this.rates[fromCurrency] || 1.0;
    const decimalAmount = new Decimal(amount);
    const baseAmount = decimalAmount.div(rate);
    
    return {
      amount: baseAmount,
      rate: new Decimal(rate)
    };
  }

  /**
   * Formats currency based on locale.
   */
  format(amount: number, currency: string, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  getRate(currency: string): number {
    return this.rates[currency] || 1.0;
  }
}
