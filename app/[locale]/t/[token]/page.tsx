'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { normalizeTableNumber } from '@/hooks/useCurrentTable';
import { useMenuStore } from '@/stores/menuStore';

/**
 * Token Consumption Page - Consumes token and establishes table session
 * صفحه مصرف توکن - مصرف توکن و برقراری نشست میز
 */
export default function TokenConsumePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const locale = params.locale as string;
  const { setMenuType } = useMenuStore();
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState<{ tableId: string; tableNumber: string; tableLabel?: string } | null>(null);

  useEffect(() => {
    const consumeToken = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        const response = await fetch(
          `${apiUrl}/api/qr/consume/${token}`,
          {
            method: 'GET',
            credentials: 'include', // Important for HttpOnly cookie
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 410) {
            throw new Error('این QR منقضی شده یا قبلاً استفاده شده است');
          } else if (response.status === 409) {
            throw new Error('این QR از دستگاه دیگری صادر شده است');
          } else if (response.status === 429) {
            throw new Error('درخواست‌های زیادی ارسال شده');
          }
          throw new Error('خطا در تأیید QR');
        }

        const data = await response.json();
        const tableLabel = data.tableNumber ?? data.name ?? '';
        const normalizedTableNumber = normalizeTableNumber(tableLabel);
        setTableInfo({
          tableId: data.tableId,
          tableNumber: normalizedTableNumber ?? (typeof tableLabel === 'string' ? tableLabel.trim() : ''),
          tableLabel,
        });

        // Store table info in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentTable', JSON.stringify({
            tableId: data.tableId,
            tableNumber: normalizedTableNumber ?? tableLabel ?? '',
            tableLabel,
            name: normalizedTableNumber ?? tableLabel ?? '',
            sessionId: data.sessionId,
            sessionExpiresAt: data.sessionExpiresAt,
            establishedAt: data.establishedAt,
          }));
          window.dispatchEvent(new CustomEvent('currentTableUpdated'));
        }

        // Set default menu type (CAFE) for QR flow
        setMenuType('CAFE');

        // Redirect to locale home after 1.5 seconds
        setTimeout(() => {
          router.replace(`/${locale}`);
        }, 1500);

      } catch (err: any) {
        setError(err.message || 'خطای ناشناخته');
        setIsLoading(false);
      }
    };

    consumeToken();
  }, [token, router, locale, setMenuType]);

  if (isLoading && !tableInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">در حال تأیید QR کد...</p>
        </div>
      </div>
    );
  }

  if (tableInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center animate-fade-in">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">خوش آمدید!</h1>
          <p className="text-xl text-gray-600 mb-4">
            {tableInfo.tableNumber}
          </p>
          <p className="text-gray-500 mb-6">
            در حال انتقال به منو...
          </p>
          <div className="animate-pulse">
            <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">QR نامعتبر</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">لطفاً دوباره QR کد روی میز را اسکن کنید</p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition w-full"
            >
              بازگشت به خانه
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
