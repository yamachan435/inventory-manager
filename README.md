# 在庫管理アプリ

自宅で使うためのシンプルな在庫管理ツールです。

## 機能

- ✅ 品目追加（名前、単位、アラート閾値、棚卸順）
- ✅ 入庫（在庫を増やす）
- ✅ 出庫（在庫を減らす）
- ✅ 棚卸（実在庫の一括入力）
- ✅ 在庫日数の自動計算（平均出庫量から推定）
- ✅ アラート色分け（赤：切迫、橙：注意、黄：残り少ない、緑：正常）
- ✅ レスポンシブ対応（スマホでも使いやすい）

## 技術スタック

- **フロントエンド**: React + Vite
- **データベース**: Supabase（PostgreSQL）
- **ホスティング**: Supabase（無料枠使用）

## セットアップ方法

### 1. 必要な環境

- Node.js 18以上
- npm または yarn
- Supabaseアカウント（無料）

### 2. Supabaseのセットアップ

1. [Supabase](https://supabase.com/) でアカウント作成
2. 新規プロジェクト作成
3. SQL Editorで以下のSQLを実行：

```sql
-- itemsテーブル（品目マスタ）
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '個',
  current_quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  inventory_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- inventory_transactionsテーブル（入出庫履歴）
CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_transactions_created_at ON inventory_transactions(created_at DESC);

-- Row Level Securityを無効化（簡易化のため）
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
```

4. Settings → API で以下を取得：
   - Project URL
   - anon public API key

### 3. アプリのセットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
# .env.exampleを参考に.envファイルを作成
cp .env.example .env

# .envファイルを編集して、Supabaseの認証情報を設定
VITE_SUPABASE_URL=あなたのProject URL
VITE_SUPABASE_ANON_KEY=あなたのanon public key

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:5173/ にアクセス

## 使い方

### 品目追加
1. ヘッダーの「品目追加」をクリック
2. 品目名、単位、アラート閾値、棚卸順を入力
3. 「追加」ボタンをクリック

### 入庫・出庫
1. 一覧画面で該当品目の「入庫」または「出庫」ボタンをクリック
2. 数量とメモ（任意）を入力
3. 「実行」ボタンをクリック

### 棚卸
1. ヘッダーの「棚卸」をクリック
2. 各品目の実在庫数を入力
3. 「棚卸完了」ボタンをクリック

## 画面の見方

- **緑の枠線**: 在庫が正常
- **黄の枠線**: 在庫日数が7日未満
- **橙の枠線**: 在庫数が閾値を下回っている
- **赤の枠線**: 在庫切れ

## 注意事項

- これは個人使用向けの簡易アプリです
- 複数人での同時使用は想定されていません
- データはSupabaseに保存されます（無料枠：500MB）

## ライセンス

MIT