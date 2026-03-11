# Database Design Notes

## 対象

現行の [database.pu](/home/shonoshono/repos/personal/family_kaigi_room/40-feature-modifyDatabaseDesign/database.pu) に記載されている以下の構成を前提にした検討メモ。

- `family`
- `users`
- `sessions`
- `user_infos`
- `UserRole`
- `FamilyRole`

## 問題点

### `families.symbol_priv_key` の保存リスク

- `families.symbol_priv_key` をDBに保存する構成は、漏えい時の影響が大きく、セキュリティ上の懸念がある。
- 本来は外部シークレット管理や暗号化方式まで含めて慎重に扱うべき項目である。
- ただし現時点では設計と実装を優先し、この問題には目を瞑る前提で進める。

## 推奨事項

### 決定事項

- `family` と `users` は `1 : *`
- `users.family_id` は必須
- `users.family_id` は user 作成後に変更不可
- `family` 削除時は `users` を `ON DELETE CASCADE` で連鎖削除する
- `users` 削除時は `sessions` と `user_infos` も `ON DELETE CASCADE` で連鎖削除する
- `role` と `family_role` は別物として扱う
- `users.is_family_owner` は family 作成時に同時作成されるアカウントのみに `true` を設定する
- `users.role` はアプリケーション全体の権限を表す
- `users.role = admin` のユーザーはアプリ初回起動時に1人作成する
- `family.family_name` は `NOT NULL` とする
- `family.currency_mosaic_id` は unique とする
- `family.created_at` を追加する
- `families.symbol_priv_key` の保存リスクは認識したうえで、当面はDB保存を許容する

## 前提上の整理

- `family_role` は `users.family_id` が指す唯一の family に対する立場として解釈する。
- `users.family_id` を変更不可にするため、所属変更による `family_role` の意味のずれは運用上発生しない前提とする。
- `role` はアプリケーション権限、`family_role` は family 内での立場として責務を分離する。
- `is_family_owner` は family 内の特別ユーザーを表し、アプリケーション権限とは分離する。
- `admin` は family とは独立したアプリケーション管理者として扱う。

## 将来の拡張余地

### `FamilyRole` の拡張

- 現時点では `father / mother / child` で運用可能と考える。
- 将来的に以下のような役割が必要になった時点で enum の見直しを検討する。
  - 単親
  - 祖父母
  - 保護者
  - きょうだい
  - パートナー
- `FamilyRole` を表示用ラベルに留めるか、認可ロジックにも使うかは今後の要件次第で再判断する。

## 補足

現時点では、`database.pu` は Prisma schema と完全一致しているとは限らない。
実装へ進める場合は、Prisma schema / migration / API の認可ロジックまで含めて整合確認が必要。
