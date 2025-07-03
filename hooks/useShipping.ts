'use client';

import { useState, useCallback } from 'react';

interface ShippingInfo {
  address: string;
  cost: number;
  distance?: number;
  confirmed: boolean;
}

export const useShipping = () => {
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    cost: 0,
    distance: 0,
    confirmed: false
  });

  const updateShippingInfo = useCallback((address: string, cost: number, distance?: number) => {
    setShippingInfo({
      address,
      cost,
      distance,
      confirmed: true
    });
  }, []);

  const clearShippingInfo = useCallback(() => {
    setShippingInfo({
      address: '',
      cost: 0,
      distance: 0,
      confirmed: false
    });
  }, []);

  const updateAddress = useCallback((address: string) => {
    setShippingInfo(prev => ({
      ...prev,
      address,
      confirmed: false
    }));
  }, []);

  return {
    shippingInfo,
    updateShippingInfo,
    clearShippingInfo,
    updateAddress
  };
}; 