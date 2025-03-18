'use client';

import { useState, useEffect } from 'react';
import { Portfolio as PortfolioType, PortfolioItem, loadPortfolio, savePortfolio, addToPortfolio, removeFromPortfolio } from '@/lib/portfolio';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { StockData, ChartData } from '@/lib/stock-api';

// 売り時分析結果の型定義
type SellAnalysisResult = {
  item: PortfolioItem;
  stockData: StockData;
  analysis: {
    isSellSignal: boolean;
    reason: string;
  };
};

interface PortfolioProps {
  onSelectStock: (stock: { symbol: string; name: string; data: ChartData[] }) => void;
}

export default function Portfolio({ onSelectStock }: PortfolioProps) {
  const [portfolio, setPortfolio] = useState<PortfolioType>({ items: [] });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    symbol: '',
    shares: '',
    averagePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [portfolioValue, setPortfolioValue] = useState<{
    totalValue: number;
    items: Array<{
      item: PortfolioItem;
      currentPrice: number;
      value: number;
      profit: number;
      profitPercent: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 売り時分析結果を保持するための状態変数
  const [sellAnalysisResults, setSellAnalysisResults] = useState<SellAnalysisResult[] | null>(null);
  
  // ポートフォリオを読み込む
  useEffect(() => {
    const savedPortfolio = loadPortfolio();
    setPortfolio(savedPortfolio);
    
    if (savedPortfolio.items.length > 0) {
      fetchPortfolioValues(savedPortfolio);
    }
  }, []);
  
  // ポートフォリオの価値を計算
  const fetchPortfolioValues = async (portfolioData: PortfolioType) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await Promise.all(
        portfolioData.items.map(async (item) => {
          const response = await fetch(`/api/stock?symbol=${item.symbol}&action=quote`);
          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${item.symbol}`);
          }
          
          const stockData = await response.json();
          if (!stockData) {
            throw new Error(`No data found for ${item.symbol}`);
          }
          
          const currentPrice = stockData.price;
          const value = item.shares * currentPrice;
          const profit = value - (item.shares * item.averagePrice);
          const profitPercent = ((currentPrice - item.averagePrice) / item.averagePrice) * 100;
          
          return {
            item,
            currentPrice,
            value,
            profit,
            profitPercent
          };
        })
      );
      
      const totalValue = results.reduce((sum, item) => sum + item.value, 0);
      
      // 資産額が大きい順に並べ替え
      results.sort((a, b) => b.value - a.value);
      
      setPortfolioValue({
        totalValue,
        items: results
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '銘柄の情報取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 銘柄を追加
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItem.symbol || !newItem.shares || !newItem.averagePrice || !newItem.purchaseDate) {
      setError('必須項目を入力してください');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 銘柄の存在確認
      const response = await fetch(`/api/stock?symbol=${newItem.symbol}&action=quote`);
      
      if (!response.ok) {
        throw new Error('銘柄が見つかりませんでした');
      }
      
      const stockData = await response.json();
      
      if (!stockData) {
        throw new Error('銘柄が見つかりませんでした');
      }
      
      // ポートフォリオに追加
      const updatedPortfolio = addToPortfolio(
        portfolio,
        newItem.symbol,
        stockData.name,
        Number(newItem.shares),
        Number(newItem.averagePrice),
        newItem.purchaseDate,
        newItem.notes
      );
      
      setPortfolio(updatedPortfolio);
      savePortfolio(updatedPortfolio);
      
      // 更新後のポートフォリオ価値を取得
      fetchPortfolioValues(updatedPortfolio);
      
      // モーダルを閉じてフォームをリセット
      setIsAddModalOpen(false);
      setNewItem({
        symbol: '',
        shares: '',
        averagePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '銘柄の追加中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 銘柄を削除
  const handleRemoveStock = (symbol: string) => {
    const updatedPortfolio = removeFromPortfolio(portfolio, symbol);
    setPortfolio(updatedPortfolio);
    savePortfolio(updatedPortfolio);
    
    if (updatedPortfolio.items.length > 0) {
      fetchPortfolioValues(updatedPortfolio);
    } else {
      setPortfolioValue(null);
    }
  };
  
  // 売り時の銘柄を分析
  const analyzeSellSignals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze',
          portfolio: portfolio
        }),
      });
      
      if (!response.ok) {
        throw new Error('分析中にエラーが発生しました');
      }
      
      const results = await response.json();
      
      // デバッグ用のログ出力
      console.log('分析結果:', JSON.stringify(results, null, 2));
      
      // 各銘柄の売り時判定を確認
      if (results && results.length > 0) {
        const sellSignals = results.filter((r: SellAnalysisResult) => r.analysis && r.analysis.isSellSignal);
        console.log(`売り時と判断された銘柄: ${sellSignals.length}件`);
        console.log('売り時の銘柄:', sellSignals.map((r: SellAnalysisResult) => r.item.symbol).join(', ') || 'なし');
      }
      
      setSellAnalysisResults(results);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析中にエラーが発生しました');
      setSellAnalysisResults(null);
    } finally {
      setLoading(false);
    }
  };
  
  // 結果表示用のヘルパー関数
  const renderSellAnalysisResults = () => {
    if (!sellAnalysisResults || sellAnalysisResults.length === 0) return null;
    
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">売り時分析結果</h3>
        <div className="space-y-4">
          {sellAnalysisResults.map((result) => {
            const isSellSignal = result.analysis.isSellSignal;
            const cardClass = isSellSignal 
              ? "p-4 rounded-lg border bg-red-50 border-red-300"
              : "p-4 rounded-lg border bg-gray-50 border-gray-300";
            const badgeClass = isSellSignal
              ? "px-2 py-1 text-xs font-bold rounded bg-red-500 text-white"
              : "px-2 py-1 text-xs font-bold rounded bg-gray-500 text-white";
            const badgeText = isSellSignal ? '売り時' : '保持推奨';
            const profitTextClass = result.stockData.price > result.item.averagePrice 
              ? "ml-2 font-medium text-green-600"
              : "ml-2 font-medium text-red-600";
            const profitPercent = ((result.stockData.price - result.item.averagePrice) / result.item.averagePrice * 100).toFixed(2);
            
            return (
              <div key={result.item.symbol} className={cardClass}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold">{result.item.symbol}</span>
                    <span className="ml-2 text-gray-600">{result.stockData.name}</span>
                  </div>
                  <span className={badgeClass}>{badgeText}</span>
                </div>
                <p className="text-gray-700">{result.analysis.reason}</p>
                {isSellSignal && (
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-red-700">推奨アクション:</p>
                    <ul className="list-disc list-inside mt-1 text-gray-700">
                      <li>売却を検討してください</li>
                      <li>一部だけ売却して利益を確定することも選択肢の一つです</li>
                      <li>損切りラインを設定して監視することをお勧めします</li>
                    </ul>
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">現在価格:</span>
                    <span className="ml-2 font-medium">{result.stockData.price.toLocaleString()} 円</span>
                  </div>
                  <div>
                    <span className="text-gray-500">保有数:</span>
                    <span className="ml-2 font-medium">{result.item.shares.toLocaleString()} 株</span>
                  </div>
                  <div>
                    <span className="text-gray-500">取得価格:</span>
                    <span className="ml-2 font-medium">{result.item.averagePrice.toLocaleString()} 円</span>
                  </div>
                  <div>
                    <span className="text-gray-500">損益:</span>
                    <span className={profitTextClass}>
                      {profitPercent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 銘柄を選択
  const handleSelectStock = async (symbol: string, name: string) => {
    try {
      const response = await fetch(`/api/stock?symbol=${symbol}&action=history`);
      if (!response.ok) {
        throw new Error('株価データの取得に失敗しました');
      }
      
      const data = await response.json();
      onSelectStock({ symbol, name, data });
    } catch (err) {
      setError(err instanceof Error ? err.message : '銘柄の選択中にエラーが発生しました');
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">ポートフォリオ</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          銘柄を追加
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">データを読み込み中...</p>
        </div>
      ) : portfolioValue ? (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">総資産額</p>
            <p className="text-2xl font-bold">{portfolioValue.totalValue.toLocaleString()} 円</p>
          </div>

          <div className="space-y-4">
            {portfolioValue.items.map(({ item, currentPrice, value, profit, profitPercent }) => (
              <div
                key={item.symbol}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectStock(item.symbol, item.name)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold">{item.symbol}</span>
                    <span className="ml-2 text-gray-600">{item.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStock(item.symbol);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    削除
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">保有数</p>
                    <p className="font-medium">{item.shares.toLocaleString()} 株</p>
                  </div>
                  <div>
                    <p className="text-gray-500">平均取得価格</p>
                    <p className="font-medium">{item.averagePrice.toLocaleString()} 円</p>
                  </div>
                  <div>
                    <p className="text-gray-500">現在値</p>
                    <p className="font-medium">{currentPrice.toLocaleString()} 円</p>
                  </div>
                  <div>
                    <p className="text-gray-500">評価額</p>
                    <p className="font-medium">{value.toLocaleString()} 円</p>
                  </div>
                  <div>
                    <p className="text-gray-500">損益</p>
                    <p className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profit >= 0 ? '+' : ''}{profit.toLocaleString()} 円
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">損益率</p>
                    <p className={`font-medium ${profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={analyzeSellSignals}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 mt-4"
            disabled={loading}
          >
            {loading ? '分析中...' : '売り時を分析する'}
          </button>

          {renderSellAnalysisResults()}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">ポートフォリオに銘柄がありません</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            銘柄を追加する
          </button>
        </div>
      )}
      
      {/* 銘柄追加モーダル */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsAddModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    銘柄を追加
                  </Dialog.Title>

                  <form onSubmit={handleAddStock}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          銘柄コード
                        </label>
                        <input
                          type="text"
                          value={newItem.symbol}
                          onChange={(e) => setNewItem({ ...newItem, symbol: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="例: 7203.T"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          保有数
                        </label>
                        <input
                          type="number"
                          value={newItem.shares}
                          onChange={(e) => setNewItem({ ...newItem, shares: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="例: 100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          平均取得価格
                        </label>
                        <input
                          type="number"
                          value={newItem.averagePrice}
                          onChange={(e) => setNewItem({ ...newItem, averagePrice: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="例: 2000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          取得日
                        </label>
                        <input
                          type="date"
                          value={newItem.purchaseDate}
                          onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          メモ
                        </label>
                        <textarea
                          value={newItem.notes}
                          onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          placeholder="メモを入力（任意）"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        {loading ? '追加中...' : '追加'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 