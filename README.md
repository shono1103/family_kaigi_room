# 家族会議室

家族会議室は、家族単位のユーザー管理、Symbol ベースの `Voice` 配布、クエスト発行を扱う Next.js アプリです。  
家族ごとに 1 つの会議室を作成し、owner が家族ユーザーを追加し、各ユーザーが Voice を受け取りながら運用する前提になっています。

## 現在の主な機能

- 家族会議室の新規作成
  - 家族名、owner のメールアドレス、パスワード、owner の Symbol 秘密鍵を入力して作成
  - 作成時に family 用 Symbol アカウントと family Voice Mosaic を生成
  - owner へ初期 10 Voice を付与
- ログイン / ログアウト
- 初回ログインフロー
  - owner 以外の追加ユーザーは `is_first = true` で作成
  - 初回ログイン時にパスワード再設定
  - 新規 Symbol アカウント生成
  - family から初期 10 Voice を受け取り
  - 秘密鍵 / 公開鍵 / アドレスを確認
- 家族メンバー一覧表示
- family owner による家族ユーザー追加
  - email を初期パスワードとして normal user を作成
  - name と family role を同時登録
- クエスト機能
  - 同一 family の他ユーザーを対象にクエスト発行
  - 自分が発行したクエスト一覧
  - 自分が対象のクエスト一覧
- ヘッダーへの自分の Voice 所持量表示

## 技術スタック

- Next.js 16
- React 19
- Prisma
- PostgreSQL
- Symbol SDK
- Vitest

## データモデル概要

主要テーブルは以下です。

- `families`
  - family 名
  - family Symbol 公開鍵 / 秘密鍵
  - `family_voice_mosaic_id`
- `users`
  - email / password
  - `family_id`
  - `is_family_owner`
  - `is_first`
- `user_infos`
  - name
  - family role
  - `symbol_pub_key`
- `quests`
  - title / detail
  - issuer / target
  - `is_resolved`
- `sessions`

詳細設計は [docs/database.pu](/home/shonoshono/repos/personal/family_kaigi_room/46-feature-issueQuest/docs/database.pu) を参照してください。

## セットアップ

### 1. 依存関係をインストール

```bash
pnpm install
```

### 2. `.env` を用意

最低限、次の値が必要です。

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hogehoge_ticket_platform?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/hogehoge_ticket_platform_test?schema=public"

SYMBOL_NETWORK="testnet"
SYMBOL_TESTNET_NODE_URL_LIST="https://your-symbol-node.example.com:3001"

INITIAL_ADMIN_EMAIL="admin@example.com"
INITIAL_ADMIN_PASSWORD="admin"
INITIAL_ADMIN_SYMBOL_PRIVATE_KEY="YOUR_64_HEX_PRIVATE_KEY"
```

補足:

- `SYMBOL_NETWORK` は未指定時 `testnet` 扱いです
- `SYMBOL_MAINNET_NODE_URL_LIST` / `SYMBOL_TESTNET_NODE_URL_LIST` はカンマ区切りで複数指定できます
- アプリ起動時に `users` が 0 件なら `scripts/init.ts` が初期 admin ユーザーを作成します
- 初期 admin 作成には `INITIAL_ADMIN_*` と Symbol ノード接続先が必要です

### 3. PostgreSQL を起動

```bash
pnpm docker:db:up
```

integration test 用 DB も必要なら:

```bash
pnpm docker:db:test:up
```

### 4. Prisma を生成して migration を適用

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
```

### 5. 開発サーバーを起動

```bash
pnpm dev
```

`pnpm dev` / `pnpm build` / `pnpm start` では、起動前に `scripts/init.ts` が実行されます。

## 主要ルート

- `GET /login`
  - ログイン画面
  - `?mode=signup` で家族会議室作成フォームに切り替え
- `POST /api/auth`
  - ログイン
- `POST /api/auth/register`
  - 家族会議室作成
- `GET /`
  - ホーム
  - `is_first = true` の場合は初回ログイン導線へ遷移
- `GET /first-login/password`
  - 初回ログイン時のパスワード再設定
- `GET /first-login/symbolAccountReview`
  - 初回ログイン完了後の Symbol アカウント確認
- `POST /api/auth/first-login`
  - 初回ログイン完了処理
- `POST /api/family-user`
  - family owner による家族ユーザー追加
- `POST /api/quest/issue`
  - クエスト発行
- `POST /api/user-info`
  - ユーザー基本情報更新

## 開発用コマンド

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:integration
pnpm test:integration:symbol
pnpm prisma:studio
```

## 実装上の注意

- Voice は family ごとの Mosaic です
- 現在の Voice は metadata なしで発行しています
- owner 以外の追加ユーザーは、初回ログイン完了まで Symbol 公開鍵を持ちません
- 初回ログイン完了時に生成される Symbol 秘密鍵はサーバー保存していません
  - ユーザー自身が保管する前提です
- `Family.role` ではなく `user_infos.family_role` が家族内ロールです
- `users.role` はアプリ全体のロールです

## ディレクトリの見どころ

- [src/app](/home/shonoshono/repos/personal/family_kaigi_room/46-feature-issueQuest/src/app)
  - 画面と API route
- [src/lib/useCase/family](/home/shonoshono/repos/personal/family_kaigi_room/46-feature-issueQuest/src/lib/useCase/family)
  - 家族会議室関連ユースケース
- [src/lib/useCase/quest](/home/shonoshono/repos/personal/family_kaigi_room/46-feature-issueQuest/src/lib/useCase/quest)
  - クエスト関連ユースケース
- [src/lib/useCase/user](/home/shonoshono/repos/personal/family_kaigi_room/46-feature-issueQuest/src/lib/useCase/user)
  - 初回ログインや user の Voice 参照
- [src/lib/symbol](/home/shonoshono/repos/personal/family_kaigi_room/46-feature-issueQuest/src/lib/symbol)
  - Symbol 連携ロジック
- [prisma/schema.prisma](/home/shonoshono/repos/personal/family_kaigi_room/46-feature-issueQuest/prisma/schema.prisma)
  - Prisma schema

## 現時点で未整理な点

- `quests.is_resolved` は文字列で保持しており、boolean ではありません
- family / quest 周辺は機能追加途中で、命名や責務の再整理余地があります
- Symbol ノードに依存する integration test は、ノード状態により不安定になることがあります
