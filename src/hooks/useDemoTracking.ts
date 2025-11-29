import { useRef } from 'react';
import { DemoTrackingService } from '../services/DemoTrackingService';

/**
 * React hook for demo tracking functionality
 */
export function useDemoTracking() {
  const trackingServiceRef = useRef<DemoTrackingService>();
  
  if (!trackingServiceRef.current) {
    trackingServiceRef.current = new DemoTrackingService();
  }

  return trackingServiceRef.current;
}
