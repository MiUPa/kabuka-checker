'use client';

import { useState, useEffect } from 'react';

type AnalysisResult = {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  analysis: {
    isBuySignal: boolean;
    reason: string;
  };
  score: number;
};

export default function StockAnalysis() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeStocks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stocks?action=analyze');
      if (!response.ok) {
        throw new Error('分析中にエラーが発生しました');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">銘柄分析</h2>
        <button
          onClick={analyzeStocks}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? '分析中...' : '全銘柄を分析'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">銘柄を分析中...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.symbol}
              className={`p-4 rounded-lg border ${
                result.analysis.isBuySignal
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold">{result.symbol}</span>
                  <span className="ml-2 text-gray-600">{result.name}</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    result.analysis.isBuySignal
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {result.analysis.isBuySignal ? '買いシグナル' : 'シグナルなし'}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    スコア: {result.score}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div>
                  <span className="text-gray-500">現在価格:</span>
                  <span className="ml-2 font-medium">
                    {result.currentPrice.toLocaleString()} 円
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">前日比:</span>
                  <span className={`ml-2 font-medium ${
                    result.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.change >= 0 ? '+' : ''}{result.change.toLocaleString()} 円
                    ({result.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <p className="text-gray-700">{result.analysis.reason}</p>

              {result.analysis.isBuySignal && (
                <div className="mt-3 text-sm">
                  <p className="font-medium text-green-700">推奨アクション:</p>
                  <ul className="list-disc list-inside mt-1 text-gray-700">
                    <li>買い注文を検討してください</li>
                    <li>段階的な買い方（分割購入）を検討してください</li>
                    <li>損切りラインを設定して監視することをお勧めします</li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">分析結果がありません</p>
          <button
            onClick={analyzeStocks}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            全銘柄を分析する
          </button>
        </div>
      )}
    </div>
  );
} 