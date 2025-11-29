// Mock data for Signals Dashboard with realistic activity

export interface SignalActivity {
  timestamp: string;
  eventType: string;
  count: number;
  status: 'success' | 'warning' | 'error';
}

export const mockSignalActivities: Record<string, SignalActivity[]> = {
  'Google Analytics': [
    { timestamp: '2025-10-17 05:15:00', eventType: 'page_view', count: 1247, status: 'success' },
    { timestamp: '2025-10-17 05:10:00', eventType: 'conversion', count: 34, status: 'success' },
    { timestamp: '2025-10-17 05:05:00', eventType: 'bounce', count: 89, status: 'warning' },
  ],
  'Salesforce CRM': [
    { timestamp: '2025-10-17 05:12:00', eventType: 'lead_created', count: 12, status: 'success' },
    { timestamp: '2025-10-17 05:08:00', eventType: 'opportunity_updated', count: 8, status: 'success' },
  ],
  'Slack': [
    { timestamp: '2025-10-17 05:14:00', eventType: 'message_sent', count: 156, status: 'success' },
    { timestamp: '2025-10-17 05:09:00', eventType: 'channel_created', count: 2, status: 'success' },
  ],
  'Demand Forecasting': [
    { timestamp: '2025-10-17 05:00:00', eventType: 'forecast_updated', count: 450, status: 'success' },
  ],
};

export const mockSignalMetrics = {
  totalEventsToday: 45782,
  activeSignals: 12,
  errorRate: 0.02,
  avgLatency: 145, // ms
};
