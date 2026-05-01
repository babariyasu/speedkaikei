-- ==================================================
-- speedkaikei - Supabase データベーススキーマ（最新版）
-- Supabase ダッシュボードの SQL Editor で実行してください
-- ==================================================

-- 商品テーブル（価格は税込みで保存）
CREATE TABLE products (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  price      NUMERIC NOT NULL CHECK (price >= 0),  -- 税込み価格
  category   TEXT NOT NULL,
  image_url  TEXT,
  stock      INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 会計記録テーブル
CREATE TABLE accounting_records (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount    NUMERIC NOT NULL CHECK (total_amount >= 0),  -- 税込み合計
  received_amount NUMERIC NOT NULL DEFAULT 0,                  -- お預かり金額
  change_amount   NUMERIC NOT NULL DEFAULT 0,                  -- お釣り
  tax_rate        NUMERIC NOT NULL DEFAULT 0,                  -- 会計時の税率（%）
  tax_amount      NUMERIC NOT NULL DEFAULT 0,                  -- 消費税額（内税）
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 会計記録明細テーブル（1会計につき複数の商品を持つ）
CREATE TABLE accounting_record_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id    UUID REFERENCES accounting_records(id) ON DELETE CASCADE NOT NULL,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,    -- 商品削除後も履歴に名前が残るよう保持
  price        NUMERIC NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  subtotal     NUMERIC NOT NULL
);

-- ==================================================
-- Row Level Security (RLS) の設定
-- ==================================================

ALTER TABLE products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_record_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分の商品のみ操作可能" ON products
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の会計記録のみ操作可能" ON accounting_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の会計明細のみ操作可能" ON accounting_record_items
  FOR ALL USING (
    record_id IN (
      SELECT id FROM accounting_records WHERE user_id = auth.uid()
    )
  );

-- ==================================================
-- Supabase Storage の設定
-- ==================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "認証済みユーザーは画像をアップロード可能" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "画像は誰でも参照可能" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "ユーザーは自分の画像のみ削除可能" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
