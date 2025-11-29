
import { toast } from '@/hooks/use-toast';

export interface ProcessedDataPoint {
  timestamp: Date;
  value: number;
  period: number;
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  missingValues: number;
  outliers: number;
  dataType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recommendedPeriod: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ProcessedDataset {
  data: ProcessedDataPoint[];
  qualityReport: DataQualityReport;
  rawData: any[];
  columns: string[];
  errors: string[];
}

export class CSVDataProcessor {
  static processCSVData(csvContent: string): ProcessedDataset {
    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      if (lines.length < 2) {
        throw new Error('CSV must contain at least one data row');
      }

      // Parse raw data
      const rawData = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || null;
        });
        row.rowIndex = index + 2; // +2 for header and 0-based index
        return row;
      });

      // Detect date and value columns
      const { dateColumn, valueColumn } = this.detectColumns(headers, rawData);
      
      if (!dateColumn || !valueColumn) {
        throw new Error('Could not identify date and value columns. Please ensure your CSV has recognizable date and numeric columns.');
      }

      console.log(`Detected columns - Date: ${dateColumn}, Value: ${valueColumn}`);

      // Process data points
      const processedData: ProcessedDataPoint[] = [];
      const errors: string[] = [];
      let validRows = 0;
      let missingValues = 0;

      rawData.forEach((row, index) => {
        try {
          const dateValue = row[dateColumn];
          const numericValue = row[valueColumn];

          if (!dateValue || numericValue === null || numericValue === '') {
            missingValues++;
            return;
          }

          const timestamp = this.parseDate(dateValue);
          const value = this.parseNumber(numericValue);

          if (timestamp && !isNaN(value)) {
            processedData.push({
              timestamp,
              value,
              period: index
            });
            validRows++;
          } else {
            errors.push(`Row ${index + 2}: Invalid date (${dateValue}) or value (${numericValue})`);
          }
        } catch (error) {
          errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Processing error'}`);
        }
      });

      if (processedData.length < 12) {
        throw new Error('Need at least 12 data points for meaningful seasonality analysis');
      }

      // Sort by timestamp
      processedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Detect outliers
      const values = processedData.map(p => p.value);
      const outliers = this.detectOutliers(values);

      // Generate quality report
      const qualityReport = this.generateQualityReport(
        rawData.length,
        validRows,
        missingValues,
        outliers.length,
        processedData
      );

      return {
        data: processedData,
        qualityReport,
        rawData,
        columns: headers,
        errors: errors.slice(0, 10) // Limit error messages
      };

    } catch (error) {
      throw new Error(`CSV Processing Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static detectColumns(headers: string[], sampleData: any[]): { dateColumn: string | null, valueColumn: string | null } {
    let dateColumn: string | null = null;
    let valueColumn: string | null = null;

    // Look for date column
    const dateKeywords = ['date', 'time', 'timestamp', 'period', 'month', 'year', 'day'];
    for (const header of headers) {
      if (dateKeywords.some(keyword => header.toLowerCase().includes(keyword))) {
        // Verify it contains date-like values
        const sampleValue = sampleData[0]?.[header];
        if (sampleValue && this.parseDate(sampleValue)) {
          dateColumn = header;
          break;
        }
      }
    }

    // Look for numeric value column
    const valueKeywords = ['value', 'amount', 'sales', 'revenue', 'count', 'total', 'price', 'volume'];
    for (const header of headers) {
      if (valueKeywords.some(keyword => header.toLowerCase().includes(keyword))) {
        // Verify it contains numeric values
        const sampleValue = sampleData[0]?.[header];
        if (sampleValue && !isNaN(this.parseNumber(sampleValue))) {
          valueColumn = header;
          break;
        }
      }
    }

    // Fallback: use first recognizable columns
    if (!dateColumn) {
      for (const header of headers) {
        const sampleValue = sampleData[0]?.[header];
        if (sampleValue && this.parseDate(sampleValue)) {
          dateColumn = header;
          break;
        }
      }
    }

    if (!valueColumn) {
      for (const header of headers) {
        const sampleValue = sampleData[0]?.[header];
        if (sampleValue && !isNaN(this.parseNumber(sampleValue))) {
          valueColumn = header;
          break;
        }
      }
    }

    return { dateColumn, valueColumn };
  }

  private static parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Try various date formats
    const formats = [
      // ISO formats
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{4}\/\d{2}\/\d{2}$/,
      // US formats
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      /^\d{1,2}-\d{1,2}-\d{4}$/,
      // Month-Year formats
      /^\d{4}-\d{2}$/,
      /^\d{2}\/\d{4}$/
    ];

    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  }

  private static parseNumber(value: string | number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove common formatting
      const cleaned = value.replace(/[$,\s%]/g, '');
      return parseFloat(cleaned);
    }
    return NaN;
  }

  private static detectOutliers(values: number[]): number[] {
    if (values.length < 4) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.filter(v => v < lowerBound || v > upperBound);
  }

  private static generateQualityReport(
    totalRows: number,
    validRows: number,
    missingValues: number,
    outliers: number,
    data: ProcessedDataPoint[]
  ): DataQualityReport {
    // Detect data frequency
    const { dataType, recommendedPeriod } = this.detectFrequency(data);
    
    // Calculate quality score
    const completenessScore = validRows / totalRows;
    const outliersRatio = outliers / validRows;
    
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (completenessScore > 0.95 && outliersRatio < 0.05) quality = 'excellent';
    else if (completenessScore > 0.85 && outliersRatio < 0.1) quality = 'good';
    else if (completenessScore > 0.7 && outliersRatio < 0.15) quality = 'fair';
    else quality = 'poor';

    return {
      totalRows,
      validRows,
      missingValues,
      outliers,
      dataType,
      recommendedPeriod,
      quality
    };
  }

  private static detectFrequency(data: ProcessedDataPoint[]): { dataType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly', recommendedPeriod: number } {
    if (data.length < 2) return { dataType: 'monthly', recommendedPeriod: 12 };

    // Calculate average time difference in days
    const timeDiffs = [];
    for (let i = 1; i < Math.min(data.length, 10); i++) {
      const diff = (data[i].timestamp.getTime() - data[i-1].timestamp.getTime()) / (1000 * 60 * 60 * 24);
      timeDiffs.push(diff);
    }

    const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;

    if (avgDiff <= 1.5) return { dataType: 'daily', recommendedPeriod: 365 };
    if (avgDiff <= 8) return { dataType: 'weekly', recommendedPeriod: 52 };
    if (avgDiff <= 35) return { dataType: 'monthly', recommendedPeriod: 12 };
    if (avgDiff <= 100) return { dataType: 'quarterly', recommendedPeriod: 4 };
    return { dataType: 'yearly', recommendedPeriod: 5 };
  }
}
