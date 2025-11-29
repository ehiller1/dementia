
export const seasonalityKnowledgeEntries = [
  {
    title: "STL Decomposition Analysis",
    content: `STL (Seasonal and Trend decomposition using Loess) is a powerful method for decomposing time series data into three components:

**Components:**
- **Trend**: Long-term movement in the data
- **Seasonal**: Regular, predictable patterns that repeat over fixed periods
- **Residual**: Random variation after removing trend and seasonal effects

**When to Use:**
- You have time series data with clear seasonal patterns
- Need to understand underlying trends separate from seasonal effects
- Planning inventory, staffing, or budget based on seasonal cycles
- Data has at least 2-3 complete seasonal cycles

**Business Applications:**
- Retail sales forecasting
- Energy consumption planning
- Tourism demand analysis
- Financial performance tracking

**Parameters:**
- **Period**: Length of seasonal cycle (12 for monthly data, 4 for quarterly)
- **Seasonal Window**: Controls seasonal component smoothing
- **Trend Window**: Controls trend component smoothing

To analyze your data with STL decomposition, simply ask: "Analyze my data using STL decomposition" and upload your CSV file.`,
    team: "finance",
    agent_class: "analyst"
  },
  {
    title: "Seasonal Pattern Detection",
    content: `Automatic detection of seasonal patterns in your business data without requiring technical knowledge.

**What it Does:**
- Identifies recurring patterns in your data
- Determines the strength of seasonality
- Finds peak and low seasons
- Calculates seasonal indices for planning

**Key Insights Provided:**
- **Seasonal Strength**: How much of your data variation is due to seasonal factors
- **Peak Periods**: Which months/quarters perform best
- **Trend Direction**: Whether your business is growing, stable, or declining
- **Predictability**: How reliably you can forecast future performance

**Business Value:**
- Optimize inventory levels by season
- Plan marketing campaigns for peak periods
- Adjust staffing based on seasonal demand
- Set realistic budgets and targets
- Identify opportunities for counter-seasonal strategies

**Data Requirements:**
- At least 24 data points (2 years of monthly data recommended)
- Consistent time intervals
- No missing values (we can help with data cleaning)

To detect seasonal patterns, tell me: "Find seasonal patterns in my data" and I'll guide you through the process.`,
    team: "marketing",
    agent_class: "analyst"
  },
  {
    title: "Business Forecasting with Seasonality",
    content: `Generate accurate business forecasts that account for seasonal patterns and trends in your data.

**Forecasting Methods Available:**
- **Seasonal Naive**: Simple, reliable baseline forecasts
- **Exponential Smoothing**: Weighted approach giving more importance to recent data
- **ARIMA with Seasonality**: Advanced statistical modeling
- **Trend-Seasonal Hybrid**: Combines multiple approaches for robust predictions

**Forecast Outputs:**
- Point forecasts for future periods
- Confidence intervals showing uncertainty ranges
- Seasonal adjustment factors
- Business scenario planning (optimistic/pessimistic cases)

**Business Planning Applications:**
- **Sales Forecasting**: Predict revenue by month/quarter
- **Demand Planning**: Anticipate product/service demand
- **Resource Planning**: Staff and inventory optimization
- **Budget Planning**: Data-driven financial projections
- **Risk Assessment**: Identify potential shortfalls or surpluses

**Accuracy Metrics:**
- Mean Absolute Percentage Error (MAPE)
- Forecast accuracy by season
- Trend accuracy assessment
- Historical performance validation

Simply ask: "Create forecasts for my business data" and I'll generate comprehensive predictions with confidence intervals and business recommendations.`,
    team: "sales",
    agent_class: "strategist"
  },
  {
    title: "Data Upload and Processing",
    content: `Upload your business data in CSV format for professional seasonality analysis. I'll handle all the technical processing behind the scenes.

**Supported Data Formats:**
- CSV files with date and value columns
- Excel exports (save as CSV first)
- Standard business data formats
- Time series data with consistent intervals

**Data Requirements:**
- **Date Column**: Dates in standard format (YYYY-MM-DD, MM/DD/YYYY, etc.)
- **Value Column**: Numeric data (sales, revenue, units, etc.)
- **Minimum Data**: 24 data points recommended for seasonal analysis
- **Consistency**: Regular time intervals (monthly, quarterly, weekly)

**Automatic Data Processing:**
- Date format standardization
- Missing value handling
- Outlier detection and treatment
- Data quality assessment
- Statistical validation

**What Happens After Upload:**
1. **Data Validation**: I check data quality and completeness
2. **Pattern Recognition**: Automatic detection of trends and seasonality
3. **Statistical Analysis**: Professional-grade calculations using proven methods
4. **Business Insights**: Translation of results into actionable recommendations
5. **Visual Reports**: Charts and graphs for easy understanding

**Privacy & Security:**
- Your data is processed securely
- No data is stored permanently
- All processing happens in real-time
- Complete confidentiality maintained

To upload your data, simply say: "I want to analyze my data" and I'll guide you through the upload process.`,
    team: "finance",
    agent_class: "specialist"
  },
  {
    title: "Seasonality Analysis Troubleshooting",
    content: `Common issues and solutions when analyzing seasonal patterns in business data.

**Data Quality Issues:**

**Problem**: "No clear seasonal pattern detected"
**Solutions**: 
- Ensure you have at least 2 complete seasonal cycles
- Check for consistent time intervals in your data
- Consider different seasonal periods (weekly, monthly, quarterly)
- Look for external factors masking seasonality

**Problem**: "Inconsistent or weak seasonality"
**Solutions**:
- Try different decomposition methods (STL vs X11)
- Adjust seasonal window parameters
- Consider business calendar effects (holidays, fiscal years)
- Separate analysis by product/region if data is aggregated

**Problem**: "Trend dominates seasonal effects"
**Solutions**:
- Use percentage-based seasonal indices
- Detrend data before seasonal analysis
- Focus on seasonal multipliers rather than absolute values
- Consider growth-adjusted seasonal patterns

**Statistical Validation:**
- **Autocorrelation tests**: Confirm seasonal lags
- **Stationarity checks**: Ensure trend stability
- **Residual analysis**: Validate decomposition quality
- **Cross-validation**: Test forecast accuracy

**Business Context Considerations:**
- Market changes affecting historical patterns
- New product launches or discontinuations
- Promotional calendar impacts
- Economic cycle effects
- Competitive landscape changes

**When Seasonality Analysis May Not Apply:**
- Completely new products/markets
- Highly volatile or irregular data
- Strong external factor dominance
- Very short data history

For troubleshooting help, describe your specific issue and I'll provide targeted solutions.`,
    team: "finance",
    agent_class: "specialist"
  }
];
