'use client';

import React from 'react';
import SkeletonGrid from '../ui/SkeletonGrid';

interface ProductSkeletonProps {
  count?: number;
}

export default function ProductSkeleton({ count = 20 }: ProductSkeletonProps) {
  return (
    <SkeletonGrid 
      count={count}
      columns={{ sm: 2, md: 3, lg: 4, xl: 6 }}
    />
  );
} 