# Firebase Realtime Database REST API vs SDK Behavior Verification

このプロジェクトは、Firebase Realtime DatabaseにおけるREST APIとFirebase SDKのパス処理の挙動の違いを検証するためのツールです。特に、先頭スラッシュ（`/`）の有無による挙動の差異を詳細に分析します。

## 📋 背景

Firebase Realtime DatabaseのREST APIとFirebase SDKで、先頭スラッシュを含むパスの処理に違いがある可能性が判明しました。この検証ツールは、その挙動の違いを明確にし、根本原因を特定することを目的としています。

## 🎯 検証項目

### 1. パス形式による挙動の違い
- **先頭スラッシュあり**: `/path/to/data`
- **先頭スラッシュなし**: `path/to/data`
- **ネストしたパス**: `/parent/child/grandchild` vs `parent/child/grandchild`
- **エッジケース**: 空パス、ダブルスラッシュ、末尾スラッシュ

### 2. 検証対象API/メソッド

**REST API (axios使用)**
- `PUT` メソッドでの完全置換
- `PATCH` メソッドでの部分更新
- Multi-path updates（複数パスの同時更新）

**Firebase SDK**
- `set()` メソッド
- `update()` メソッド
- Multi-path updates

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、Firebase プロジェクトの情報を設定します：

```bash
cp .env.example .env
```

必要な環境変数：
- `FIREBASE_API_KEY`: Firebase APIキー
- `FIREBASE_DATABASE_URL`: Realtime Database URL
- `FIREBASE_PROJECT_ID`: プロジェクトID
- その他の設定は `.env.example` を参照

### 3. テストの実行

#### インタラクティブモード（推奨）
```bash
npm start
```

#### 一括実行
```bash
npm run test:all
```

## 📝 使用方法

### コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm start` | インタラクティブメニューを起動 |
| `npm run setup` | データベースの初期設定 |
| `npm run test:rest` | REST APIテストのみ実行 |
| `npm run test:sdk` | SDK テストのみ実行 |
| `npm run test:all` | 全テストを実行し、分析・レポート生成 |
| `npm run compare` | 既存の結果を分析 |
| `npm run report` | 分析結果からレポート生成 |
| `npm run cleanup` | テストデータをクリーンアップ |

### インタラクティブメニュー

`npm start` を実行すると、以下のオプションが表示されます：

1. **🚀 Run Complete Test Suite** - セットアップから レポート生成まで一括実行
2. **🔧 Setup Database** - テスト用データベース構造を初期化
3. **🌐 Run REST API Tests Only** - REST APIのパス挙動をテスト
4. **🔥 Run SDK Tests Only** - Firebase SDKのパス挙動をテスト
5. **🔍 Analyze Existing Results** - 過去のテスト結果を比較分析
6. **📊 Generate Report** - 分析結果からマークダウンレポート生成
7. **🧹 Cleanup Database** - すべてのテストデータを削除

## 📁 プロジェクト構造

```
study-realtime-db/
├── src/
│   ├── config/               # 設定ファイル
│   │   ├── firebase.js       # Firebase初期化
│   │   └── constants.js      # 定数定義
│   ├── rest-api/             # REST API検証
│   │   ├── axios-client.js   # Axiosクライアント
│   │   ├── path-tests.js     # 単一パステスト
│   │   └── multi-path-tests.js # マルチパステスト
│   ├── sdk/                  # Firebase SDK検証
│   │   ├── sdk-client.js     # SDKクライアント
│   │   ├── path-tests.js     # 単一パステスト
│   │   └── multi-path-tests.js # マルチパステスト
│   ├── comparison/           # 比較・分析
│   │   ├── analyzer.js       # 結果分析
│   │   └── report-generator.js # レポート生成
│   └── utils/                # ユーティリティ
│       ├── logger.js         # ロギング
│       ├── test-data.js      # テストデータ生成
│       └── db-helper.js      # DB操作ヘルパー
├── scripts/                  # 実行スクリプト
│   ├── setup-db.js          # DB初期化
│   ├── run-tests.js         # テスト実行
│   └── cleanup-db.js        # クリーンアップ
├── results/                  # テスト結果出力
├── .env.example             # 環境変数サンプル
└── package.json
```

## 📊 出力結果

### テスト結果ファイル

`results/` ディレクトリに以下のファイルが生成されます：

- `rest-api-results-{timestamp}.json` - REST APIテスト結果
- `sdk-results-{timestamp}.json` - SDKテスト結果
- `analysis-{timestamp}.json` - 比較分析結果
- `report-{timestamp}.md` - マークダウン形式のレポート

### レポート内容

生成されるレポートには以下が含まれます：

1. **エグゼクティブサマリー** - テスト結果の概要
2. **パス挙動分析** - パスパターン別の挙動比較
3. **操作別分析** - API操作別の挙動比較
4. **重要な差異** - 注意が必要な挙動の違い
5. **推奨事項** - ベストプラクティスと移行ガイド

## 🔍 テストシナリオ

### 単一パステスト
- 絶対パス vs 相対パス
- 先頭スラッシュの有無
- ネストレベルの違い
- エッジケース（空パス、ルートパス、ダブルスラッシュ）

### マルチパス更新テスト
- 全て絶対パスの場合
- 全て相対パスの場合
- 混在パターン
- 複雑なネスト構造での更新

### 検証ポイント
- データの書き込み位置
- パス解決の優先順位
- エラーハンドリング
- パフォーマンス

## ⚠️ 注意事項

1. **Firebase セキュリティルール**: テストを実行するには、データベースへの読み書き権限が必要です
2. **データの削除**: クリーンアップ機能はテストデータを削除します。本番環境では使用しないでください
3. **認証トークン**: REST APIテストには有効な認証トークンが必要な場合があります

## 🤝 貢献

問題を発見した場合や改善提案がある場合は、Issueを作成してください。

## 📄 ライセンス

MIT

## 🔗 関連リンク

- [Firebase Realtime Database ドキュメント](https://firebase.google.com/docs/database)
- [Firebase REST API リファレンス](https://firebase.google.com/docs/reference/rest/database)