'use client';

import { StockData } from '@/lib/stock-api';

interface StockAnalysisProps {
  stockData: StockData | null;
  analysis: {
    buy: {
      isBuySignal: boolean;
      reason: string;
    };
    sell: {
      isSellSignal: boolean;
      reason: string;
    };
  } | null;
}

export default function StockAnalysis({ stockData, analysis }: StockAnalysisProps) {
  if (!stockData || !analysis) {
    return null;
  }
  
  const { buy, sell } = analysis;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold mb-4">銘柄分析</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-4 rounded-lg ${buy.isBuySignal ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">買いシグナル</h3>
            <span className={`px-2 py-1 text-xs font-bold rounded ${buy.isBuySignal ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
              {buy.isBuySignal ? 'あり' : 'なし'}
            </span>
          </div>
          <p className="text-gray-700">{buy.reason}</p>
          
          {buy.isBuySignal && (
            <div className="mt-4 text-sm">
              <p className="font-medium text-green-700">推奨アクション:</p>
              <ul className="list-disc list-inside mt-1 text-gray-700">
                <li>買い注文の検討</li>
                <li>現在の市場状況や企業の最新ニュースも併せて確認する</li>
                <li>投資予算の5-10%程度を目安に</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className={`p-4 rounded-lg ${sell.isSellSignal ? 'bg-red-100 border border-red-300' : 'bg-gray-100 border border-gray-300'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">売りシグナル</h3>
            <span className={`px-2 py-1 text-xs font-bold rounded ${sell.isSellSignal ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}`}>
              {sell.isSellSignal ? 'あり' : 'なし'}
            </span>
          </div>
          <p className="text-gray-700">{sell.reason}</p>
          
          {sell.isSellSignal && (
            <div className="mt-4 text-sm">
              <p className="font-medium text-red-700">推奨アクション:</p>
              <ul className="list-disc list-inside mt-1 text-gray-700">
                <li>保有中の場合は売却を検討</li>
                <li>一部だけ売却して利益を確定するのも選択肢</li>
                <li>損切りラインを設定して監視する</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-800 mb-2">注意事項</h3>
        <p className="text-gray-700 text-sm">
          この分析は技術的指標に基づいた参考情報です。実際の投資判断は、企業の財務状況、市場環境、経済指標など総合的な観点から行ってください。
          投資にはリスクが伴い、資産価値が減少する可能性があります。
        </p>
      </div>
    </div>
  );
} 