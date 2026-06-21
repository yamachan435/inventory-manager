# Supabaseセットアップ手順

## 1. Supabaseアカウント作成

1. https://supabase.com/ にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでログイン（またはメールアドレスで新規登録）

## 2. 新規プロジェクト作成

1. 「New project」をクリック
2. 以下を入力：
   - **Name**: inventory-manager（任意）
   - **Database Password**: 強力なパスワードを設定（メモしておく）
   - **Region**: Northeast Asia (Tokyo) を選択（日本から近い）
   - **Pricing Plan**: Free（無料枠）
3. 「Create new project」をクリック
4. プロジェクトの準備が完了するまで待機（1〜2分）

## 3. テーブル作成

プロジェクト作成後、以下のSQLを実行してテーブルを作成：

### SQL Editorを開く
1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック

### 実行するSQL

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

-- インデックス作成（検索高速化）
CREATE INDEX idx_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_transactions_created_at ON inventory_transactions(created_at DESC);

-- Row Level Securityを無効化（簡易化のため）
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
```

3. 「Run」ボタンをクリックして実行

## 4. APIキーの取得

1. 左サイドバーの「Settings」→「API」をクリック
2. 以下をコピー（後で使います）：
   - **Project URL**（例: https://xxxxx.supabase.co）
   - **anon public** API key

## 5. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```env
VITE_SUPABASE_URL=あなたのProject URL
VITE_SUPABASE_ANON_KEY=あなたのanon public key
```

## 完了

これでSupabaseのセットアップは完了です。次のステップでフロントエンドを実装します。