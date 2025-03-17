# 株価チェッカー（Kabuka Checker）

株価チャートを取得・分析し、買い時・売り時を判断するWebアプリケーションです。

## 機能

- 株の個別銘柄のチャートを取得する
- 取得した個別銘柄のチャートから、どの株が今買い時なのか教える
- 保有している株を入力し、管理する
- 保有している株が売り時なら教える

## 技術スタック

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型安全な JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファーストCSSフレームワーク
- [Recharts](https://recharts.org/) - ReactベースのチャートライブラリDレ
- [Yahoo Finance API](https://www.npmjs.com/package/yahoo-finance2) - 株価データ取得用ライブラリ
- [Headless UI](https://headlessui.com/) - アクセシブルなUIコンポーネント

## セットアップ

1. リポジトリをクローン:

```bash
git clone https://github.com/yourusername/kabuka-checker.git
cd kabuka-checker
```

2. 依存関係をインストール:

```bash
npm install
```

3. 開発サーバーを起動:

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを表示

## 使い方

### 銘柄検索・分析

1. 「銘柄検索・分析」タブを選択
2. 検索フォームに銘柄コード（日本株は `7974.T` のように `.T` を付加）またはティッカーシンボル（米国株）を入力
3. 表示される株価チャートと分析結果を確認
4. 買いシグナル・売りシグナルの有無と理由を確認

### ポートフォリオ管理

1. 「ポートフォリオ管理」タブを選択
2. 「銘柄を追加」ボタンをクリックして保有銘柄を登録
   - 銘柄コード、保有株数、平均取得価格、購入日を入力
3. 登録した銘柄の現在価値や損益状況を確認
4. 「売り時を分析する」ボタンをクリックして、保有銘柄の売り時分析を実行

## 注意事項

- 本アプリケーションの分析結果は参考情報であり、投資判断の責任は利用者にあります
- 実際の投資判断は、企業の財務状況、市場環境、経済指標など総合的な観点から行ってください
- 投資にはリスクが伴い、資産価値が減少する可能性があります

## ライセンス

MIT
