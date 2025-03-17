'use client';

import { useState, useEffect } from 'react';
import StockSearch from '@/components/StockSearch';
import StockChart from '@/components/StockChart';
import StockAnalysis from '@/components/StockAnalysis';
import Portfolio from '@/components/Portfolio';
import { ChartData, StockData } from '@/lib/stock-api';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
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
    if (selectedSymbol) {
      fetchStockData(selectedSymbol);
    }
  }, [selectedSymbol]);
  
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
    setSelectedSymbol(symbol);
    setActiveTab('search');
  };
  
  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">株価チェッカー</h1>
          <p className="mt-2 text-lg text-gray-600">
            株価チャートを分析して、買い時・売り時を判断するツール
          </p>
        </div>
        
        {/* タブ切り替え */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('search')}
          >
            銘柄検索・分析
          </button>
          <button
            className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'portfolio'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('portfolio')}
          >
            ポートフォリオ管理
          </button>
        </div>
        
        {activeTab === 'search' ? (
          <div>
            <StockSearch onSelectStock={handleSelectStock} />
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6">
                <p>{error}</p>
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-500">データを読み込み中...</p>
              </div>
            ) : (
              <>
                {stockData && chartData.length > 0 && (
                  <div className="mt-6">
                    <StockChart 
                      data={chartData} 
                      title={stockData.name} 
                      symbol={stockData.symbol} 
                    />
                    
                    <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                      <h2 className="text-xl font-semibold mb-4">銘柄情報</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="text-gray-500 text-sm">銘柄コード</p>
                          <p className="font-medium">{stockData.symbol}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">銘柄名</p>
                          <p className="font-medium">{stockData.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">現在値</p>
                          <p className="font-medium">{stockData.price.toLocaleString()} 円</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">前日比</p>
                          <p className={`font-medium ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stockData.change >= 0 ? '+' : ''}{stockData.change.toLocaleString()} 円 ({stockData.changePercent.toFixed(2)}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">出来高</p>
                          <p className="font-medium">{stockData.volume.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">時価総額</p>
                          <p className="font-medium">{(stockData.marketCap / 1000000).toFixed(0).toLocaleString()} 百万円</p>
                        </div>
                      </div>
                    </div>
                    
                    <StockAnalysis
                      stockData={stockData}
                      analysis={analysis}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <Portfolio />
        )}
      </div>
    </main>
  );
}
