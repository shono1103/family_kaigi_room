# ほげほげチケットぷらっとふぉーむ

「ほげほげチケットぷらっとふぉーむ」は、Next.js + Prisma + PostgreSQL で構成されたローカル利用前提のチケット管理アプリです。  
現在は認証/セッション管理機能を実装しており、ログイン後に有効セッションの確認・失効ができます。

## 前提

- ローカル環境での利用を想定しています（インターネット公開前提ではありません）
- DB は PostgreSQL を使用します
- `DATABASE_URL` が必要です

## 主な機能（現状）

- ログイン（`POST /auth`）
- ログアウト（`POST /auth/logout`）
- 新規ユーザー作成（`POST /auth/register`）
- DB セッション管理
  - セッション作成
  - 現在セッションのログアウト
  - 他セッション一括失効
  - 個別セッション失効
- 初期ユーザー自動作成
  - `users` テーブルが空の場合に初期管理者を作成

## 初期ユーザー

`users` テーブルが空のとき、初回アクセス時に以下のユーザーが自動作成されます。

- Email: `admin@example.com`
- Password: `admin`

## セットアップ

1. 依存関係をインストール

```bash
pnpm install
```

2. 環境変数を設定（`.env`）

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hogehoge_ticket_platform?schema=public"
```

3. PostgreSQL を起動（Docker を使う場合）

```bash
docker compose -f docker-compose-dev.yml up -d
```

4. Prisma Client 生成

```bash
pnpm prisma:generate
```

5. マイグレーション適用

```bash
pnpm prisma:migrate:dev
```

6. 開発サーバー起動

```bash
pnpm dev
```

ブラウザで `http://localhost:3000` を開いてください。

## 画面/ルート概要

- `GET /login`
  - ログイン画面
  - `?mode=signup` で新規ユーザー作成フォームに切替
- `POST /auth`
  - ログイン処理
- `POST /auth/register`
  - 新規ユーザー作成処理（作成後にログイン）
- `POST /auth/logout`
  - 現在セッションのログアウト
- `POST /sessions/revoke`
  - 指定セッション失効
- `POST /sessions/revoke-others`
  - 現在セッション以外を一括失効

## 開発用コマンド

```bash
pnpm lint
pnpm prisma:studio
```

## 注意事項

- 本実装はローカル利用を前提にしているため、公開環境向けのセキュリティ対策（CSRF対策、レート制限など）は最小限です。
- 誤って外部公開しない運用を前提にしてください。
- Next.js 実行時にワークスペース直下の複数 lockfile 警告が出る場合があります（動作自体には影響しないことがあります）。
