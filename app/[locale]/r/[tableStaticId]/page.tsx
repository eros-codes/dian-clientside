'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * QR Issue Page - Scans QR and gets session token
 * صفحه صدور توکن - اسکن QR و دریافت توکن نشست
 */
export default function QrIssuePage() {
  const params = useParams();
  const router = useRouter();
  const tableStaticId = params.tableStaticId as string;
  const locale = params.locale as string;
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const issueToken = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(
          `${apiUrl}/api/qr/issue/${tableStaticId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('درخواست‌های زیادی ارسال شده. لطفاً کمی صبر کنید');
          }
          throw new Error('خطا در صدور توکن');
        }

        const json = await response.json();
        const payload = json?.data ?? json;
        const token = payload?.token;

        if (!token) {
          throw new Error('توکن دریافتی نامعتبر است');
        }

        // Redirect to token consumption page
        router.replace(`/${locale}/t/${token}`);
      } catch (err: any) {
        setError(err.message || 'خطای ناشناخته');
        setIsLoading(false);
      }
    };

    issueToken();
  }, [tableStaticId, router, locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">خطا</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return null;
}
