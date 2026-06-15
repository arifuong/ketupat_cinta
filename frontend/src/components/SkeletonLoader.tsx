import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Shimmer({ className = '' }: SkeletonProps) {
  return (
    <div className={`shimmer rounded bg-gray-200 ${className}`} />
  );
}

export function ProductSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card-product cursor-default">
          {/* Mock Product Image */}
          <Shimmer className="h-48 w-full rounded-xl mb-4" />
          {/* Mock Product Title */}
          <Shimmer className="h-6 w-3/4 mb-2" />
          {/* Mock Badge */}
          <Shimmer className="h-4 w-1/4 mb-3" />
          {/* Mock Product Description */}
          <div className="space-y-2 mb-4">
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-5/6" />
          </div>
          {/* Mock Price */}
          <div className="flex items-center gap-2 mb-4">
            <Shimmer className="h-8 w-1/3" />
            <Shimmer className="h-4 w-8" />
          </div>
          {/* Mock PO Schedules */}
          <div className="space-y-2">
            <Shimmer className="h-4 w-1/4" />
            <Shimmer className="h-10 w-full rounded-xl" />
            <Shimmer className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card !p-5 flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Shimmer className="h-5 w-32" />
              <Shimmer className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex gap-4">
              <Shimmer className="h-4 w-28" />
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-4 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right space-y-1">
              <Shimmer className="h-6 w-24" />
              <Shimmer className="h-4 w-16 ml-auto" />
            </div>
            <Shimmer className="h-5 w-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InvoiceSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Shimmer className="h-5 w-36" />
                <Shimmer className="h-5 w-24 rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <Shimmer className="h-4 w-2/3" />
                <Shimmer className="h-4 w-1/2" />
                <Shimmer className="h-4 w-1/2" />
                {/* Progress bar mock */}
                <div className="pt-2">
                  <Shimmer className="h-4 w-full rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 w-32">
              <Shimmer className="h-10 w-full rounded-xl" />
              <Shimmer className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Cards Mock */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card !p-5">
            <Shimmer className="h-10 w-10 rounded-xl mb-3" />
            <Shimmer className="h-8 w-24 mb-1" />
            <Shimmer className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Invoices List Section Mock */}
      <div className="space-y-3">
        <Shimmer className="h-6 w-48 mb-2" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card !p-4">
              <Shimmer className="h-4 w-24 mb-2" />
              <Shimmer className="h-6 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Menu Links Mock */}
      <div className="space-y-3">
        <Shimmer className="h-6 w-32 mb-2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card !p-5">
              <div className="flex items-center gap-3 mb-2">
                <Shimmer className="h-5 w-5 rounded-full" />
                <Shimmer className="h-5 w-24" />
              </div>
              <Shimmer className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
