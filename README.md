# TrainingFlow - Training & Study Progress Manager

TrainingFlowは、トレーニングと学習進捗を管理するためのWebアプリケーションです。

## 🚀 機能

### 📅 カレンダー機能
- 日次のトレーニング記録（ランニング・筋力トレーニング）
- 学習進捗の記録（書籍・章単位）
- 視覚的なカレンダー表示
- 日付クリックによる詳細記録・編集

### 📚 書籍管理
- 書籍の追加・編集・削除
- 章の管理（個別入力・一括入力対応）
- 進捗状況の可視化
- 完了率の表示

### 📊 統計・分析
- 月次統計の表示
- トレーニング実施率
- 学習進捗の分析
- グラフによる可視化

### 🔐 認証・ユーザー管理
- Supabase Authによる認証
- 管理者による承認制
- ユーザープロファイル管理

## 🛠️ 技術スタック

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Charts**: Recharts
- **Calendar**: React Calendar

## 📦 セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn
- Supabaseアカウント

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd training-progress-app
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env
```

`.env`ファイルを編集し、SupabaseのURLとAPIキーを設定：
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Supabaseデータベースのマイグレーションを実行
```bash
# Supabase CLIを使用する場合
supabase db push
```

5. 開発サーバーを起動
```bash
npm run dev
```

## 🗄️ データベース構造

### テーブル構成
- `users`: ユーザー情報
- `books`: 書籍情報
- `chapters`: 章情報
- `daily_records`: 日次記録
- `study_progress`: 学習進捗

### 主要な関係
- Users → Books (1:N)
- Books → Chapters (1:N)
- Users → Daily Records (1:N)
- Daily Records → Study Progress (1:N)

## 🔧 開発

### 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# リンター実行
npm run lint

# プレビュー（ビルド後）
npm run preview
```

### コード構成

```
src/
├── components/          # Reactコンポーネント
│   ├── auth/           # 認証関連
│   ├── books/          # 書籍管理
│   ├── calendar/       # カレンダー
│   ├── dashboard/      # ダッシュボード
│   ├── layout/         # レイアウト
│   └── ui/             # 共通UIコンポーネント
├── lib/                # ライブラリ設定
├── pages/              # ページコンポーネント
├── store/              # 状態管理
├── types/              # TypeScript型定義
└── utils/              # ユーティリティ関数
```

## 🚀 デプロイ

### Netlifyでのデプロイ

1. プロジェクトをGitHubにプッシュ
2. Netlifyでリポジトリを連携
3. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. 環境変数を設定（Supabase URL/Key）

### その他のプラットフォーム

- Vercel
- AWS Amplify
- Firebase Hosting

## 📝 使用方法

### 初回セットアップ

1. アカウント登録
2. 管理者による承認待ち
3. 承認後、ログイン可能

### 基本的な使い方

1. **書籍追加**: Booksページで学習教材を登録
2. **日次記録**: Calendarページで日々の活動を記録
3. **進捗確認**: 統計ページで進捗を分析

## 🤝 コントリビューション

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🆘 サポート

問題や質問がある場合は、GitHubのIssuesページで報告してください。

## 🔄 更新履歴

### v1.0.0 (2024-XX-XX)
- 初回リリース
- 基本的なトレーニング・学習記録機能
- カレンダー表示
- 書籍管理機能
- 統計表示機能