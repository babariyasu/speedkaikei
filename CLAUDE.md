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
npm run build    # 本番ビルド
npm run preview  # ビルド済みアプリをローカルプレビュー
npm run lint     # ESLint 実行
```

## 技術スタック

- **React 19 + Vite** — SPA フレームワーク
- **TypeScript** — 型安全
- **Tailwind CSS** — スタイリング
- **React Router v7** — クライアントサイドルーティング
- **Supabase** — 認証 / データベース（PostgreSQL）/ ストレージ

## アーキテクチャ概要

### ルーティング

`src/App.tsx` で全ルートを定義。`ProtectedLayout` が認証ガードを担い、未ログイン時は `/login` にリダイレクトする。

```
/              → /login へリダイレクト
/login         → ログインページ（未保護）
/register      → 会員登録ページ（未保護）
/menu          → メニュー一覧（要認証）
/accounting    → 会計・レジ画面（要認証）
/products      → 商品登録・一覧（要認証）
/history       → 会計履歴（要認証）
/settings      → アカウント設定（要認証）
```

### 認証フロー

`src/hooks/useAuth.ts` の `useAuth()` フックが Supabase のセッションを管理する。`ProtectedLayout` がこのフックを使い、未ログインなら `/login` へリダイレクト。

### Supabase 連携

- クライアント: `src/lib/supabase.ts`（環境変数 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を読み込む）
- 環境変数は `.env.local` に保存し、`.gitignore` で除外済み
- DB スキーマ: `supabase-schema.sql`（Supabase ダッシュボードの SQL Editor で実行する）

### データベース構造

```
products               — 商品（名前・金額・分類・画像URL・在庫数）
accounting_records     — 会計記録ヘッダー（合計金額・日時）
accounting_record_items — 会計記録明細（商品名・単価・数量・小計）
```

会計完了時に `products.stock` を自動で差し引く。分類（category）は別テーブルを持たず、`products` の既存値から重複なく取得してプルダウンに表示する。

### 商品画像

Supabase Storage の `product-images` バケット（公開）に保存。`supabase-schema.sql` 内に RLS ポリシーも含む。

### コンポーネント構成

```
src/
  components/
    ProtectedLayout.tsx  — 認証ガード + Navigation を含む共通レイアウト
    Navigation.tsx       — 画面下部の固定タブナビゲーション（4項目）
  pages/                 — 各画面（1ファイル = 1ページ）
  hooks/useAuth.ts       — 認証状態管理フック
  lib/supabase.ts        — Supabaseクライアント
  types/database.ts      — DB テーブルの TypeScript 型定義
```
