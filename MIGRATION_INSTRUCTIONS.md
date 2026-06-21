# データ移行手順

## 事前準備

### 1. データベーススキーマの修正

CSVデータに小数（例: 1.5）が含まれているため、データベースのカラム型を INTEGER から NUMERIC に変更する必要があります。

**Supabase SQL Editorで以下のSQLを実行してください：**

```sql
-- inventory_transactionsテーブルのquantityカラムをNUMERICに変更
ALTER TABLE inventory_transactions 
  ALTER COLUMN quantity TYPE NUMERIC(10,2);

-- itemsテーブルのcurrent_quantityカラムをNUMERICに変更
ALTER TABLE items 
  ALTER COLUMN current_quantity TYPE NUMERIC(10,2);
```

実行方法：
1. Supabaseダッシュボードにログイン
2. 左サイドバーの「SQL Editor」をクリック
3. 上記のSQLを貼り付け
4. 「Run」ボタンをクリック

### 2. データ移行の実行

スキーマ修正後、以下のコマンドでデータ移行を実行：

```bash
node migrate.js
```

## 移行内容

- **31件の品目データ**を挿入（既存の重複IDはスキップ）
- **170件のトランザクション履歴**を挿入
- 品目名は自動的に「品目1」「品目2」...となります（後で変更可能）
- 現在の在庫数はCSVの最終残高から自動計算

## 移行後の確認

```bash
npm run dev
```

アプリケーションを起動して、在庫一覧画面でデータが正しく表示されることを確認してください。

## 注意事項

- 品目名は汎用的な「品目ID」形式になっています。必要に応じてアプリケーション上で編集してください。
- トランザクション履歴は全て「CSV移行データ」というメモが付与されます。
- 移行を再実行する場合は、事前にSupabaseのテーブルをクリアしてください：

```sql
TRUNCATE TABLE inventory_transactions CASCADE;
TRUNCATE TABLE items CASCADE;