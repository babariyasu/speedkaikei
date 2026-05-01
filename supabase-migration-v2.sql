-- ==================================================
-- マイグレーション v2
-- 初回スキーマ適用済みの場合、このファイルを実行してください
-- accounting_records テーブルに新カラムを追加します
-- ==================================================

ALTER TABLE accounting_records
  ADD COLUMN IF NOT EXISTS received_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS change_amount   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate        NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount      NUMERIC NOT NULL DEFAULT 0;
