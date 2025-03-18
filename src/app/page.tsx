'use client';

import { useState, useEffect } from 'react';
import StockSearch from '@/components/StockSearch';
import StockChart from '@/components/StockChart';
import StockAnalysis from '@/components/StockAnalysis';
import Portfolio from '@/components/Portfolio';
import { ChartData, StockData } from '@/lib/stock-api';

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    name: string;
    data: ChartData[];
  } | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [analysis, setAnalysis] = useState<{
    buy: { isBuySignal: boolean; reason: string };
    sell: { isSellSignal: boolean; reason: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'portfolio'>('search');
  
  // 銘柄が選択されたときに株価データとチャートを取得
  useEffect(() => {
    if (selectedStock) {
      fetchStockData(selectedStock.symbol);
    }
  }, [selectedStock]);
  
  // 株価データとチャートを取得
  const fetchStockData = async (symbol: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stock?symbol=${symbol}&action=analyze`);
      
      if (!response.ok) {
        throw new Error('銘柄データの取得に失敗しました');
      }
      
      const data = await response.json();
      
      if (!data.quote) {
        throw new Error('銘柄データが見つかりませんでした');
      }
      
      setStockData(data.quote);
      setChartData(data.history || []);
      setAnalysis(data.analysis || null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得中にエラーが発生しました');
      setStockData(null);
      setChartData([]);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 銘柄検索後の処理
  const handleSelectStock = (symbol: string) => {
    setSelectedStock({ symbol, name: '', data: [] });
    setActiveTab('search');
  };
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">株価分析ツール</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {selectedStock ? (
            <StockChart
              data={selectedStock.data}
              title={selectedStock.name}
              symbol={selectedStock.symbol}
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">株価チャート</h2>
              <div className="h-[400px] flex items-center justify-center">
                <p className="text-gray-500">銘柄を選択してください</p>
              </div>
            </div>
          )}
        </div>
        <div>
          <Portfolio onSelectStock={setSelectedStock} />
        </div>
      </div>

      <div className="mt-8">
        <StockAnalysis />
      </div>
    </main>
  );
}
