# Integration Test Layout

- `src/lib/integration/_helpers/`
  - `env.ts`: `.env` / `.env.test` を読み込み、`TEST_` プレフィックスの環境変数を integration test 用に上書きするヘルパー
  - `guards.ts`: 必須環境変数の検証ヘルパー
  - `timeout.ts`: 共通タイムアウト値
- `src/lib/integration/symbol/ticket/`
  - `create.integration.test.ts`: ticket create の統合テスト雛形

この段階では配置のみで、実行ロジックは未実装。
