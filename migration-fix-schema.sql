-- データ型を INTEGER から NUMERIC に変更（小数対応）
-- このSQLをSupabaseのSQL Editorで実行してください

-- inventory_transactionsテーブルのquantityカラムをNUMERICに変更
ALTER TABLE inventory_transactions 
  ALTER COLUMN quantity TYPE NUMERIC(10,2);

-- itemsテーブルのcurrent_quantityカラムをNUMERICに変更
ALTER TABLE items 
  ALTER COLUMN current_quantity TYPE NUMERIC(10,2);

-- インデックスは再作成不要（データ型変更しても保持される）

-- 確認
SELECT 
  table_name, 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale
FROM information_schema.columns
WHERE table_name IN ('items', 'inventory_transactions')
  AND column_name IN ('current_quantity', 'quantity')
ORDER BY table_name, column_name;