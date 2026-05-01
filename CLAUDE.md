# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git 運用ルール

コードを変更するたびに、以下の手順で GitHub にプッシュすること。

```bash
git add <変更ファイル>
git commit -m "<変更内容を簡潔に説明するメッセージ>"
git push origin main
```

- コミットメッセージは日本語でも英語でも可。変更の「なぜ」を優先して書く。
- `git add .` や `git add -A` は使わず、変更したファイルを明示的に指定する。
- `main` ブランチへの force push は行わない。
- フックをスキップ（`--no-verify`）しない。
- プッシュ前に `git status` で意図しないファイルが含まれていないか確認する。

## コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:5173）
npm run build    # 本番ビルド（tsc + vite build）
npm run preview  # ビルド済みアプリをローカルプレビュー
```

## 技術スタック

- **React 19 + Vite** — SPA フレームワーク
- **TypeScript** — 型安全
- **Tailwind CSS** — スタイリング
- **React Router v7** — クライアントサイドルーティング
- **Supabase** — 認証 / PostgreSQL / Storage（商品画像）

## アーキテクチャ概要

### ルーティング

```
/              → /login へリダイレクト
/login         → ログイン（未保護）
/register      → 会員登録（未保護）
/sales         → 販売画面（要認証）← ログイン後の起点
/checkout      → 会計画面（要認証、ナビバーなし）
/products      → 商品登録・一覧（要認証）
/history       → 会計履歴（要認証）
/settings      → 設定（要認証）
```

### 画面フロー

```
販売画面（/sales）
  └─ 商品を選択・数量を決定
  └─ 「会計へ進む」ボタン → 会計画面（/checkout）
       └─ お預かり金額を入力 → お釣り自動計算
       └─ 「会計完了」→ DB保存・在庫更新 → 販売画面に戻る
```

### グローバル状態（Context）

| Context | 役割 |
|---------|------|
| `CartContext` | 販売画面〜会計画面でカートを共有 |
| `SettingsContext` | 税率（localStorage に永続化）をアプリ全体で共有 |

### 税率の仕組み

- 商品価格は**税込み**で登録・保存する
- `SettingsContext` の `taxRate`（%）から税抜き価格・税額を逆算  
  - 税抜き = `Math.round(価格 / (1 + taxRate / 100))`  
  - 税額 = `Math.round(合計 * taxRate / (100 + taxRate))`

### ナビゲーション

`Navigation.tsx` は `/checkout` では非表示にする（フル会計画面のため）。

### Supabase 連携

- クライアント: `src/lib/supabase.ts`（環境変数 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`）
- 環境変数は `.env.local` で管理し `.gitignore` で除外
- DB スキーマ: `supabase-schema.sql`（初回）、`supabase-migration-v2.sql`（追加カラム）

### データベース構造

```
products               — 商品（名前・税込み価格・分類・画像URL・在庫数）
accounting_records     — 会計記録（合計・預かり額・お釣り・税率・税額）
accounting_record_items — 会計明細（商品名・単価・数量・小計）
```

### ファイル構成

```
src/
  context/
    CartContext.tsx      — カート状態（販売→会計で共有）
    SettingsContext.tsx  — 税率（localStorage に永続化）
  components/
    ProtectedLayout.tsx  — 認証ガード + Navigation 配置
    Navigation.tsx       — 画面下部固定タブ（/checkout では非表示）
  pages/
    LoginPage.tsx        — ログイン
    RegisterPage.tsx     — 会員登録
    SalesPage.tsx        — 販売（分類タブ + 商品グリッド + カートバー）
    CheckoutPage.tsx     — 会計（明細・税・お預かり・お釣り・会計完了）
    ProductsPage.tsx     — 商品登録・一覧
    HistoryPage.tsx      — 会計履歴（明細・税・お釣り表示）
    SettingsPage.tsx     — 税率設定・パスワード変更・ログアウト
  hooks/useAuth.ts       — 認証状態フック
  lib/supabase.ts        — Supabase クライアント
  types/database.ts      — DB テーブルの TypeScript 型定義
```

## デプロイ情報

- 本番URL：https://speed-obs1.vercel.app
- Supabaseプロジェクト名：speedkadai
