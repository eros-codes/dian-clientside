import { ApiError } from './api';

export interface StockError {
  productId: string;
  current: number;
  requested: number;
}

export class ErrorHelper {
  static getErrorMessage(error: ApiError): string {
    if (error.data && typeof error.data === 'object' && 'message' in error.data) {
      return String((error.data as any).message);
    }
    return error.message;
  }

  static parseStockError(error: ApiError): StockError | null {
    // If backend returns structured data about shortages, prefer that
    let message = '';
    try {
      const data = (error as any)?.data;
      // New backend format: ApiError.data may contain { shortages: [...] }
      if (data && Array.isArray((data as any).shortages) && (data as any).shortages.length > 0) {
        const first = (data as any).shortages[0];
        return {
          productId: String(first.productId ?? first.id ?? first.name ?? ''),
          current: Number(first.available ?? first.current ?? 0),
          requested: Number(first.requested ?? first.quantity ?? 0),
        };
      }

      message = this.getErrorMessage(error);

      // Try Persian pattern first (existing behavior)
      // e.g. "موجودی محصول کافی نیست: <productId>. موجودی: 3, درخواستی: 6"
      if (message.includes('موجودی') && /موجودی/.test(message)) {
        const persianMatch = message.match(/(?:کافی نیست[:：]?\s*)?([^\.\n]+)[\.\n\s].*?موجودی[:：]?\s*(\d+).*?در?خواس?تی?[:：]?\s*(\d+)/i);
        if (persianMatch) {
          const productId = (persianMatch[1] || '').trim();
          const current = Number(persianMatch[2] || '0');
          const requested = Number(persianMatch[3] || '0');
          if (productId) return { productId, current, requested };
        }
      }

      // Fallback: English pattern
      // e.g. "Insufficient stock for products: aeq (available: 3, requested: 6)"
      const engMatch = message.match(/Insufficient stock for products?:\s*([^()\n,]+)\s*\(\s*available[:：]?\s*(\d+)\s*,\s*requested[:：]?\s*(\d+)\s*\)/i);
      if (engMatch) {
        const productId = (engMatch[1] || '').trim();
        const current = Number(engMatch[2] || '0');
        const requested = Number(engMatch[3] || '0');
        return { productId, current, requested };
      }

      // Another English variant where server lists multiple items separated by commas
      // e.g. "Insufficient stock for products: aeq (available: 3, requested: 6), foo (available: 0, requested: 2)"
      const engMultiMatch = message.match(/Insufficient stock for products?:\s*(.+)/i);
      if (engMultiMatch) {
        const rest = engMultiMatch[1];
        const firstItemMatch = rest.match(/([^()\n,]+)\s*\(\s*available[:：]?\s*(\d+)\s*,\s*requested[:：]?\s*(\d+)\s*\)/i);
        if (firstItemMatch) {
          const productId = (firstItemMatch[1] || '').trim();
          const current = Number(firstItemMatch[2] || '0');
          const requested = Number(firstItemMatch[3] || '0');
          return { productId, current, requested };
        }
      }

      return null;
    } catch (e) {
      // If parsing fails for any reason, do not crash the UI; return null so caller falls back
      // to generic error handling.
      return null;
    }
  }
}