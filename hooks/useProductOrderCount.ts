import { useEffect, useState } from 'react';
import { ordersApi } from '@/lib/api';

interface OrderCount {
  productId: string;
  count: number;
}

export function useProductOrderCount(productId: string) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderCount() {
      try {
        // Get all orders and count items for this product
        const response = await ordersApi.getOrders();
        const orders = response.data || [];
        
        let totalCount = 0;
        orders.forEach((order: any) => {
          if (order.items) {
            order.items.forEach((item: any) => {
              if (item.productId === productId) {
                totalCount += item.quantity;
              }
            });
          }
        });
        
        setCount(totalCount);
      } catch (error) {
        console.error('Failed to fetch product order count:', error);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchOrderCount();
      
      // Set up real-time updates every 10 seconds
      const interval = setInterval(fetchOrderCount, 10000);
      
      return () => clearInterval(interval);
    }
  }, [productId]);

  return { count, loading };
}
