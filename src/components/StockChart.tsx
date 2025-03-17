'use client';

import { useState } from 'react';
import { 
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { ChartData } from '@/lib/stock-api';

interface StockChartProps {
  data: ChartData[];
  title: string;
  symbol: string;
}

export default function StockChart({ data, title, symbol }: StockChartProps) {
  const [period, setPeriod] = useState<'1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y'>('6mo');
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500">データが見つかりません</p>
        </div>
      </div>
    );
  }
  
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(),
    tooltip_date: new Date(item.date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
  }));
  
  // データの最大値・最小値を計算してY軸の範囲を設定
  const maxPrice = Math.max(...formattedData.map(item => item.high)) * 1.05;
  const minPrice = Math.min(...formattedData.map(item => item.low)) * 0.95;
  
  // 期間選択を変更した時の処理
  const handlePeriodChange = (newPeriod: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y') => {
    setPeriod(newPeriod);
    // ここで新しい期間のデータを取得する処理を実装（親コンポーネントから渡されたデータを使用する場合は不要）
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title} ({symbol})</h2>
        <div className="space-x-2">
          {(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-2 py-1 text-sm rounded ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value, index) => {
                if (formattedData.length <= 10) return value;
                // データが多い場合は適度に間引く
                return index % Math.ceil(formattedData.length / 10) === 0 ? value : '';
              }}
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => 
                value.toLocaleString(undefined, { maximumFractionDigits: 0 })
              }
            />
            <Tooltip
              formatter={(value: number) => [
                value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                ''
              ]}
              labelFormatter={(label) => {
                return label;
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#8884d8"
              fillOpacity={0.3}
              fill="#8884d8"
              name="終値"
            />
            <Line
              type="monotone"
              dataKey="high"
              stroke="#ff0000"
              dot={false}
              name="高値"
            />
            <Line
              type="monotone"
              dataKey="low"
              stroke="#0000ff"
              dot={false}
              name="安値"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 