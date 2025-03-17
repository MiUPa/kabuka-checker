'use client';

import { useState } from 'react';

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
}

export default function StockSearch({ onSelectStock }: StockSearchProps) {
  const [symbol, setSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol) {
      setError('銘柄コードを入力してください');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 銘柄の存在確認
      const response = await fetch(`/api/stock?symbol=${symbol}&action=quote`);
      
      if (!response.ok) {
        throw new Error('銘柄が見つかりませんでした');
      }
      
      const data = await response.json();
      
      if (!data) {
        throw new Error('銘柄が見つかりませんでした');
      }
      
      // 検索成功時に親コンポーネントに通知
      onSelectStock(symbol);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '銘柄の検索中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">銘柄検索</h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex items-center">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="銘柄コード（例: 7974.T, AAPL）"
            className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? '検索中...' : '検索'}
          </button>
        </div>
        
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
        
        <div className="mt-2 text-sm text-gray-600">
          <p>日本株は「銘柄コード.T」（例: 7974.T）、米国株はティッカーシンボル（例: AAPL）を入力してください。</p>
        </div>
      </form>
    </div>
  );
} 