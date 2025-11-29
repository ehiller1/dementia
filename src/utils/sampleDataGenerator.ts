
interface TimeSeriesData {
  date: string;
  value: number;
}

export const generateSeasonalData = (
  startDate: string = '2020-01-01',
  periods: number = 48,
  frequency: 'monthly' | 'weekly' | 'daily' = 'monthly'
): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < periods; i++) {
    const currentDate = new Date(start);
    
    // Add time based on frequency
    if (frequency === 'monthly') {
      currentDate.setMonth(start.getMonth() + i);
    } else if (frequency === 'weekly') {
      currentDate.setDate(start.getDate() + (i * 7));
    } else {
      currentDate.setDate(start.getDate() + i);
    }
    
    // Generate seasonal pattern with trend and noise
    const month = currentDate.getMonth() + 1;
    const trend = 1000 + (i * 50); // Growing trend
    const seasonal = 200 * Math.sin((month / 12) * 2 * Math.PI); // Seasonal pattern
    const noise = (Math.random() - 0.5) * 100; // Random noise
    
    const value = Math.max(0, trend + seasonal + noise);
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      value: Math.round(value)
    });
  }
  
  return data;
};

export const generateSalesData = (): TimeSeriesData[] => {
  return generateSeasonalData('2020-01-01', 48, 'monthly').map(item => ({
    ...item,
    value: item.value + Math.floor(Math.random() * 500) // Add more variability for sales
  }));
};

export const generateWebTrafficData = (): TimeSeriesData[] => {
  return generateSeasonalData('2023-01-01', 365, 'daily').map(item => ({
    ...item,
    value: Math.floor(item.value * 0.1) + Math.floor(Math.random() * 50) // Smaller values for daily traffic
  }));
};

export const convertToCSV = (data: TimeSeriesData[]): string => {
  const header = 'date,value\n';
  const rows = data.map(row => `${row.date},${row.value}`).join('\n');
  return header + rows;
};
