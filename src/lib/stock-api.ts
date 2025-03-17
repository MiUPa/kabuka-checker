import yahooFinance from 'yahoo-finance2';

export type StockData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  averageVolume: number;
  marketCap: number;
};

export type ChartData = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// Yahoo Finance APIのヒストリカルデータの型定義
interface YahooHistoricalData {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  adjClose?: number | null;
}

// 銘柄の基本情報を取得
export async function getStockQuote(symbol: string): Promise<StockData | null> {
  try {
    const quote = await yahooFinance.quote(symbol);
    
    if (!quote) return null;
    
    return {
      symbol: quote.symbol || '',
      name: quote.longName || quote.shortName || '',
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      open: quote.regularMarketOpen || 0,
      dayHigh: quote.regularMarketDayHigh || 0,
      dayLow: quote.regularMarketDayLow || 0,
      volume: quote.regularMarketVolume || 0,
      averageVolume: quote.averageDailyVolume10Day || 0,
      marketCap: quote.marketCap || 0,
    };
  } catch (error) {
    console.error(`Error fetching stock quote for ${symbol}:`, error);
    return null;
  }
}

// 株価のチャートデータを取得
export async function getStockHistory(
  symbol: string,
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' = '6mo',
  interval: '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo' = '1d'
): Promise<ChartData[]> {
  try {
    // Yahoo Finance APIの制約に合わせてintervalを調整
    let validInterval: '1d' | '1wk' | '1mo' = '1d';
    
    if (interval === '1wk') {
      validInterval = '1wk';
    } else if (interval === '1mo') {
      validInterval = '1mo';
    }
    
    const result = await yahooFinance.historical(symbol, {
      period1: getStartDate(period),
      interval: validInterval,
    });
    
    return result.map((item: YahooHistoricalData) => ({
      date: new Date(item.date),
      open: item.open || 0,
      high: item.high || 0,
      low: item.low || 0,
      close: item.close || 0,
      volume: item.volume || 0,
    }));
  } catch (error) {
    console.error(`Error fetching stock history for ${symbol}:`, error);
    return [];
  }
}

// 期間に基づいて開始日を計算
function getStartDate(period: string): Date {
  const today = new Date();
  
  switch (period) {
    case '1d':
      return new Date(today.setDate(today.getDate() - 1));
    case '5d':
      return new Date(today.setDate(today.getDate() - 5));
    case '1mo':
      return new Date(today.setMonth(today.getMonth() - 1));
    case '3mo':
      return new Date(today.setMonth(today.getMonth() - 3));
    case '6mo':
      return new Date(today.setMonth(today.getMonth() - 6));
    case '1y':
      return new Date(today.setFullYear(today.getFullYear() - 1));
    case '2y':
      return new Date(today.setFullYear(today.getFullYear() - 2));
    case '5y':
      return new Date(today.setFullYear(today.getFullYear() - 5));
    case 'max':
      return new Date(1970, 0, 1);
    default:
      return new Date(today.setMonth(today.getMonth() - 6));
  }
}

// 買い時かどうかを判断するシンプルな分析
export function analyzeStockToBuy(stockData: StockData, chartData: ChartData[]): { 
  isBuySignal: boolean; 
  reason: string 
} {
  if (!stockData || chartData.length < 10) {
    return { isBuySignal: false, reason: 'データが不足しています' };
  }

  // 移動平均の計算（短期：5日、長期：20日）
  const shortTermMA = calculateMovingAverage(chartData, 5);
  const longTermMA = calculateMovingAverage(chartData, 20);

  // 最近のトレンド判定
  const recentTrend = calculateRecentTrend(chartData);

  // 上昇トレンドかつ短期MAが長期MAを上回った（ゴールデンクロス）
  if (recentTrend === 'up' && isGoldenCross(shortTermMA, longTermMA)) {
    return { 
      isBuySignal: true, 
      reason: 'ゴールデンクロスが発生し、上昇トレンドにあります' 
    };
  }

  // 下落からの反発の兆候
  if (isPriceRebounding(chartData)) {
    return { 
      isBuySignal: true, 
      reason: '株価が下落後に反発の兆候を示しています'
    };
  }

  // 出来高の増加
  if (isVolumeIncreasing(chartData)) {
    return { 
      isBuySignal: true, 
      reason: '出来高が増加しており、注目が高まっています' 
    };
  }

  return { 
    isBuySignal: false, 
    reason: '現在は買いシグナルは検出されていません' 
  };
}

// 売り時かどうかを判断するシンプルな分析
export function analyzeStockToSell(stockData: StockData, chartData: ChartData[]): { 
  isSellSignal: boolean; 
  reason: string 
} {
  if (!stockData || chartData.length < 10) {
    return { isSellSignal: false, reason: 'データが不足しています' };
  }

  // 移動平均の計算（短期：5日、長期：20日）
  const shortTermMA = calculateMovingAverage(chartData, 5);
  const longTermMA = calculateMovingAverage(chartData, 20);

  // 最近のトレンド判定
  const recentTrend = calculateRecentTrend(chartData);

  // 下降トレンドかつ短期MAが長期MAを下回った（デッドクロス）
  if (recentTrend === 'down' && isDeadCross(shortTermMA, longTermMA)) {
    return { 
      isSellSignal: true, 
      reason: 'デッドクロスが発生し、下降トレンドにあります' 
    };
  }

  // 急激な上昇後の天井圏
  if (isPricePeaking(chartData)) {
    return { 
      isSellSignal: true, 
      reason: '急激な上昇後に天井圏に達している可能性があります' 
    };
  }

  // 出来高の減少（上昇中）
  if (isVolumeDecreasing(chartData) && recentTrend === 'up') {
    return { 
      isSellSignal: true, 
      reason: '上昇中に出来高が減少しています。上値が重くなっている可能性があります' 
    };
  }

  return { 
    isSellSignal: false, 
    reason: '現在は売りシグナルは検出されていません' 
  };
}

// 移動平均を計算
function calculateMovingAverage(data: ChartData[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    
    result.push(sum / period);
  }
  
  return result;
}

// ゴールデンクロスを検出（短期MAが長期MAを上回る）
function isGoldenCross(shortTermMA: number[], longTermMA: number[]): boolean {
  if (shortTermMA.length < 2 || longTermMA.length < 2) return false;
  
  const lastIndex = shortTermMA.length - 1;
  const prevIndex = lastIndex - 1;
  
  return shortTermMA[prevIndex] <= longTermMA[prevIndex] && 
         shortTermMA[lastIndex] > longTermMA[lastIndex];
}

// デッドクロスを検出（短期MAが長期MAを下回る）
function isDeadCross(shortTermMA: number[], longTermMA: number[]): boolean {
  if (shortTermMA.length < 2 || longTermMA.length < 2) return false;
  
  const lastIndex = shortTermMA.length - 1;
  const prevIndex = lastIndex - 1;
  
  return shortTermMA[prevIndex] >= longTermMA[prevIndex] && 
         shortTermMA[lastIndex] < longTermMA[lastIndex];
}

// 最近のトレンドを計算
function calculateRecentTrend(data: ChartData[]): 'up' | 'down' | 'neutral' {
  if (data.length < 10) return 'neutral';
  
  const recentData = data.slice(-10);
  let upDays = 0;
  let downDays = 0;
  
  for (let i = 1; i < recentData.length; i++) {
    if (recentData[i].close > recentData[i-1].close) {
      upDays++;
    } else if (recentData[i].close < recentData[i-1].close) {
      downDays++;
    }
  }
  
  if (upDays > downDays + 2) return 'up';
  if (downDays > upDays + 2) return 'down';
  return 'neutral';
}

// 反発の兆候を検出
function isPriceRebounding(data: ChartData[]): boolean {
  if (data.length < 5) return false;
  
  const recentData = data.slice(-5);
  let downDays = 0;
  
  // 最初の3日間で下落傾向
  for (let i = 1; i < 3; i++) {
    if (recentData[i].close < recentData[i-1].close) {
      downDays++;
    }
  }
  
  // 下落後、直近2日間で上昇
  return downDays >= 2 && 
         recentData[3].close > recentData[2].close && 
         recentData[4].close > recentData[3].close;
}

// 天井圏かどうか検出
function isPricePeaking(data: ChartData[]): boolean {
  if (data.length < 10) return false;
  
  const recentData = data.slice(-10);
  
  // 急激な上昇（10日間で10%以上）
  const priceIncrease = (recentData[9].close - recentData[0].close) / recentData[0].close;
  
  // 直近3日間で上昇が鈍化
  const recent3Days = recentData.slice(-3);
  const isSlowing = recent3Days[2].close <= recent3Days[1].close && 
                    recent3Days[1].close <= recent3Days[0].close * 1.01; // 1%以下の上昇
  
  return priceIncrease > 0.1 && isSlowing;
}

// 出来高増加を検出
function isVolumeIncreasing(data: ChartData[]): boolean {
  if (data.length < 5) return false;
  
  const recentData = data.slice(-5);
  const avgVolumeBefore = (recentData[0].volume + recentData[1].volume) / 2;
  const avgVolumeAfter = (recentData[3].volume + recentData[4].volume) / 2;
  
  return avgVolumeAfter > avgVolumeBefore * 1.5; // 50%以上の出来高増加
}

// 出来高減少を検出
function isVolumeDecreasing(data: ChartData[]): boolean {
  if (data.length < 5) return false;
  
  const recentData = data.slice(-5);
  const avgVolumeBefore = (recentData[0].volume + recentData[1].volume) / 2;
  const avgVolumeAfter = (recentData[3].volume + recentData[4].volume) / 2;
  
  return avgVolumeAfter < avgVolumeBefore * 0.7; // 30%以上の出来高減少
} 