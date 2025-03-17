import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, getStockHistory, analyzeStockToSell } from '@/lib/stock-api';
import { Portfolio } from '@/lib/portfolio';

// サーバーサイドでポートフォリオをシミュレートするための一時的なストレージ
// 本来は永続化層（データベース）を使用する
let serverPortfolio: Portfolio = {
  items: []
};

export async function GET() {
  return NextResponse.json(serverPortfolio);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'add': {
        const { symbol, shares, averagePrice, purchaseDate, notes } = body;
        
        if (!symbol || !shares || !averagePrice || !purchaseDate) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }
        
        // 銘柄の存在確認
        const stockData = await getStockQuote(symbol);
        if (!stockData) {
          return NextResponse.json(
            { error: 'Invalid stock symbol' },
            { status: 400 }
          );
        }
        
        // 既存の銘柄かどうかをチェック
        const existingItem = serverPortfolio.items.find(item => item.symbol === symbol);
        
        if (existingItem) {
          // 既存の銘柄の場合は更新
          const totalShares = existingItem.shares + Number(shares);
          const totalValue = existingItem.shares * existingItem.averagePrice + Number(shares) * Number(averagePrice);
          const newAveragePrice = totalValue / totalShares;
          
          serverPortfolio = {
            items: serverPortfolio.items.map(item => {
              if (item.symbol === symbol) {
                return {
                  ...item,
                  shares: totalShares,
                  averagePrice: newAveragePrice,
                  notes: notes || item.notes
                };
              }
              return item;
            })
          };
        } else {
          // 新規銘柄の場合は追加
          serverPortfolio = {
            items: [
              ...serverPortfolio.items,
              {
                symbol,
                shares: Number(shares),
                averagePrice: Number(averagePrice),
                purchaseDate,
                notes: notes || ''
              }
            ]
          };
        }
        
        return NextResponse.json(serverPortfolio);
      }
      
      case 'update': {
        const { symbol, updates } = body;
        
        if (!symbol || !updates) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }
        
        serverPortfolio = {
          items: serverPortfolio.items.map(item => {
            if (item.symbol === symbol) {
              return { ...item, ...updates };
            }
            return item;
          })
        };
        
        return NextResponse.json(serverPortfolio);
      }
      
      case 'remove': {
        const { symbol } = body;
        
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol parameter is required' },
            { status: 400 }
          );
        }
        
        serverPortfolio = {
          items: serverPortfolio.items.filter(item => item.symbol !== symbol)
        };
        
        return NextResponse.json(serverPortfolio);
      }
      
      case 'analyze': {
        const results = await Promise.all(
          serverPortfolio.items.map(async (item) => {
            const stockData = await getStockQuote(item.symbol);
            
            if (stockData) {
              const historyData = await getStockHistory(item.symbol);
              const analysis = analyzeStockToSell(stockData, historyData);
              
              return {
                item,
                stockData,
                analysis
              };
            }
            
            return null;
          })
        );
        
        // nullの項目を除外
        const filteredResults = results.filter(result => result !== null);
        
        // 売りシグナルがある銘柄を先頭に
        filteredResults.sort((a, b) => {
          if (!a || !b) return 0;
          if (a.analysis.isSellSignal && !b.analysis.isSellSignal) return -1;
          if (!a.analysis.isSellSignal && b.analysis.isSellSignal) return 1;
          return 0;
        });
        
        return NextResponse.json(filteredResults);
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 