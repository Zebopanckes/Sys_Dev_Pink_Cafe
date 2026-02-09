import { useState, useCallback } from 'react';
import { DateRange } from '../types';

export function useChartZoom(fullRange: DateRange | null) {
  const [zoomRange, setZoomRange] = useState<DateRange | null>(null);

  const zoomIn = useCallback((start: Date, end: Date) => {
    setZoomRange({ start, end });
  }, []);

  const resetZoom = useCallback(() => {
    setZoomRange(null);
  }, []);

  const activeRange = zoomRange ?? fullRange;

  return { activeRange, zoomIn, resetZoom, isZoomed: zoomRange !== null };
}
