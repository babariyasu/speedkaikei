# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git 運用ルール

コードを変更するたびに、以下の手順で GitHub にプッシュすること。

```bash
git add <変更ファイル>
git commit -m "<変更内容を簡潔に説明するメッセージ>"
git push origin <ブランチ名>
```

- コミットメッセージは日本語でも英語でも可。変更の「なぜ」を優先して書く。
- `git add .` や `git add -A` は使わず、変更したファイルを明示的に指定する。
- `main` ブランチへの force push は行わない。
- フックをスキップ（`--no-verify`）しない。フックが失敗した場合は原因を修正してから再コミットする。
- プッシュ前に `git status` で意図しないファイルが含まれていないか確認する。

## プロジェクト概要

（プロジェクトの説明をここに追記してください）
