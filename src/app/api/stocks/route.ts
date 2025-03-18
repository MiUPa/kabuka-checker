import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, getStockHistory, analyzeStockToBuy } from '@/lib/stock-api';

// 東証の主要な銘柄コード（テスト用）
const TSE_SYMBOLS = [
  '7203.T', // トヨタ自動車
  '9984.T', // ソフトバンクグループ
  '6758.T', // ソニーグループ
  '6861.T', // キーエンス
  '8306.T', // 三菱UFJフィナンシャル・グループ
  '6367.T', // ダイキン工業
  '9983.T', // ファーストリテイリング
  '4502.T', // 武田薬品工業
  '9432.T', // 日本電信電話
  '9433.T', // KDDI
  '4503.T', // アステラス製薬
  '6369.T', // 大金工業
  '8308.T', // りそなホールディングス
  '6368.T', // オルガノ
  '8309.T', // 三井住友フィナンシャルグループ
  '6366.T', // 日立製作所
  '6367.T', // ダイキン工業
  '6368.T', // オルガノ
  '6369.T', // 大金工業
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'analyze') {
      // 全銘柄の分析を実行
      const analysisResults = await Promise.all(
        TSE_SYMBOLS.map(async (symbol) => {
          try {
            const stockData = await getStockQuote(symbol);
            if (!stockData) return null;

            const historyData = await getStockHistory(symbol);
            const analysis = analyzeStockToBuy(stockData, historyData);

            // スコアの計算（買いシグナルの強さを数値化）
            let score = 0;
            if (analysis.isBuySignal) {
              // 買いシグナルの理由に基づいてスコアを加算
              if (analysis.reason.includes('ゴールデンクロス')) score += 3;
              if (analysis.reason.includes('反発')) score += 2;
              if (analysis.reason.includes('出来高')) score += 1;
            }

            return {
              symbol,
              name: stockData.name,
              currentPrice: stockData.price,
              change: stockData.change,
              changePercent: stockData.changePercent,
              analysis,
              score
            };
          } catch (error) {
            console.error(`Error analyzing ${symbol}:`, error);
            return null;
          }
        })
      );

      // nullを除外し、スコアの高い順にソート
      const filteredResults = analysisResults
        .filter((result): result is NonNullable<typeof result> => result !== null)
        .sort((a, b) => b.score - a.score);

      return NextResponse.json(filteredResults);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 