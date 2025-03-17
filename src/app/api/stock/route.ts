import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, getStockHistory, analyzeStockToBuy, analyzeStockToSell } from '@/lib/stock-api';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const action = searchParams.get('action') || 'quote';
  const period = searchParams.get('period') as '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' || '6mo';
  const interval = searchParams.get('interval') as '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo' || '1d';

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case 'quote': {
        const data = await getStockQuote(symbol);
        return NextResponse.json(data);
      }
      
      case 'history': {
        const data = await getStockHistory(symbol, period, interval);
        return NextResponse.json(data);
      }
      
      case 'analyze': {
        const quoteData = await getStockQuote(symbol);
        const historyData = await getStockHistory(symbol, period, interval);
        
        if (!quoteData) {
          return NextResponse.json(
            { error: 'Failed to fetch stock data' },
            { status: 500 }
          );
        }
        
        const buyAnalysis = analyzeStockToBuy(quoteData, historyData);
        const sellAnalysis = analyzeStockToSell(quoteData, historyData);
        
        return NextResponse.json({
          quote: quoteData,
          history: historyData,
          analysis: {
            buy: buyAnalysis,
            sell: sellAnalysis
          }
        });
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