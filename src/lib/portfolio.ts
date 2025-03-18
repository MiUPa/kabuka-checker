import { StockData, getStockQuote, getStockHistory, analyzeStockToSell } from './stock-api';

export type PortfolioItem = {
  symbol: string;        // 銘柄コード
  name: string;          // 銘柄名
  shares: number;        // 保有株数
  averagePrice: number;  // 平均取得価格
  purchaseDate: string;  // 購入日
  notes: string;         // メモ
};

export type Portfolio = {
  items: PortfolioItem[];
};

// ローカルストレージからポートフォリオを読み込む
export function loadPortfolio(): Portfolio {
  if (typeof window === 'undefined') {
    return { items: [] };
  }
  
  try {
    const storedData = localStorage.getItem('portfolio');
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error loading portfolio:', error);
  }
  
  return { items: [] };
}

// ポートフォリオをローカルストレージに保存
export function savePortfolio(portfolio: Portfolio): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  } catch (error) {
    console.error('Error saving portfolio:', error);
  }
}

// ポートフォリオに銘柄を追加
export function addToPortfolio(
  portfolio: Portfolio,
  symbol: string,
  name: string,
  shares: number,
  averagePrice: number,
  purchaseDate: string,
  notes: string = ''
): Portfolio {
  const existingItem = portfolio.items.find(item => item.symbol === symbol);
  
  if (existingItem) {
    // 既存の銘柄の場合は、平均取得価格と株数を更新
    const totalShares = existingItem.shares + shares;
    const totalValue = existingItem.shares * existingItem.averagePrice + shares * averagePrice;
    const newAveragePrice = totalValue / totalShares;
    
    const updatedItems = portfolio.items.map(item => {
      if (item.symbol === symbol) {
        return {
          ...item,
          shares: totalShares,
          averagePrice: newAveragePrice,
          notes: notes || item.notes
        };
      }
      return item;
    });
    
    return { items: updatedItems };
  } else {
    // 新規銘柄の場合は追加
    return {
      items: [
        ...portfolio.items,
        { symbol, name, shares, averagePrice, purchaseDate, notes }
      ]
    };
  }
}

// ポートフォリオから銘柄を削除
export function removeFromPortfolio(portfolio: Portfolio, symbol: string): Portfolio {
  return {
    items: portfolio.items.filter(item => item.symbol !== symbol)
  };
}

// ポートフォリオの銘柄を更新
export function updatePortfolioItem(
  portfolio: Portfolio,
  symbol: string,
  updates: Partial<PortfolioItem>
): Portfolio {
  return {
    items: portfolio.items.map(item => {
      if (item.symbol === symbol) {
        return { ...item, ...updates };
      }
      return item;
    })
  };
}

// 保有銘柄の現在価値を計算
export async function calculatePortfolioValue(portfolio: Portfolio): Promise<{
  totalValue: number;
  items: Array<{
    item: PortfolioItem;
    currentPrice: number;
    value: number;
    profit: number;
    profitPercent: number;
  }>;
}> {
  const result = {
    totalValue: 0,
    items: [] as Array<{
      item: PortfolioItem;
      currentPrice: number;
      value: number;
      profit: number;
      profitPercent: number;
    }>
  };
  
  await Promise.all(
    portfolio.items.map(async (item) => {
      const stockData = await getStockQuote(item.symbol);
      
      if (stockData) {
        const currentPrice = stockData.price;
        const value = item.shares * currentPrice;
        const profit = value - (item.shares * item.averagePrice);
        const profitPercent = ((currentPrice - item.averagePrice) / item.averagePrice) * 100;
        
        result.items.push({
          item,
          currentPrice,
          value,
          profit,
          profitPercent
        });
        
        result.totalValue += value;
      }
    })
  );
  
  // 資産額が大きい順に並べ替え
  result.items.sort((a, b) => b.value - a.value);
  
  return result;
}

// 売り時の銘柄を分析
export async function analyzeSellSignals(portfolio: Portfolio): Promise<Array<{
  item: PortfolioItem;
  stockData: StockData;
  analysis: {
    isSellSignal: boolean;
    reason: string;
  };
}>> {
  const results = [] as Array<{
    item: PortfolioItem;
    stockData: StockData;
    analysis: {
      isSellSignal: boolean;
      reason: string;
    };
  }>;
  
  await Promise.all(
    portfolio.items.map(async (item) => {
      const stockData = await getStockQuote(item.symbol);
      
      if (stockData) {
        const historyData = await getStockHistory(item.symbol);
        const analysis = analyzeStockToSell(stockData, historyData);
        
        results.push({
          item,
          stockData,
          analysis
        });
      }
    })
  );
  
  // 売りシグナルがある銘柄を先頭に
  results.sort((a, b) => {
    if (a.analysis.isSellSignal && !b.analysis.isSellSignal) return -1;
    if (!a.analysis.isSellSignal && b.analysis.isSellSignal) return 1;
    return 0;
  });
  
  return results;
} 