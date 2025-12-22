"use client";

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export function useOrderSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to same origin by default. You can set NEXT_PUBLIC_WS_URL to override.
    const url = (process.env.NEXT_PUBLIC_WS_URL as string) || undefined;
    const socket = url ? io(url) : io();
    socketRef.current = socket;

    socket.on('connect', () => {
      // console.log('order socket connected', socket.id);
    });

    socket.on('orderUpdated', (payload: { orderId: string } & any) => {
      try {
        const id = payload?.orderId;
        // Invalidate orders list and single order to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        if (id) queryClient.invalidateQueries({ queryKey: ['order', id] });
      } catch (e) {
        // ignore
      }
    });

    socket.on('productUpdated', (payload: { id?: string; product?: any } & any) => {
      try {
        // Invalidate product lists and specific product
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['products', 'popular'] });
        if (payload?.id) queryClient.invalidateQueries({ queryKey: ['product', payload.id] });
      } catch (e) {}
    });

    socket.on('settingsUpdated', (payload: any) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['footerSettings'] });
      } catch (e) {}
    });

    socket.on('bannersUpdated', (payload: any) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['banners'] });
      } catch (e) {}
    });

    socket.on('disconnect', () => {
      // console.log('order socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);
}

export default useOrderSocket;
