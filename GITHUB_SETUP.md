# WebContainer環境でのGitHub連携手順

WebContainer環境ではGitコマンドが利用できないため、以下の手順でGitHubとの連携を行います。

## 🔄 方法1: ダウンロード & アップロード方式（推奨）

### ステップ1: プロジェクトファイルをダウンロード

1. **ファイルをダウンロード**
   - Boltの左側のファイルエクスプローラーで、プロジェクトのルートフォルダを右クリック
   - 「Download」を選択してZIPファイルをダウンロード

### ステップ2: ローカル環境でGit初期化

```bash
# ダウンロードしたZIPファイルを解凍
unzip training-progress-app.zip
cd training-progress-app

# Gitリポジトリを初期化
git init

# .gitignoreファイルが既に存在するので、そのまま使用

# 全ファイルをステージング
git add .

# 初回コミット
git commit -m "初回コミット: TrainingFlow アプリケーション"
```

### ステップ3: GitHubリポジトリを作成

1. **GitHub.com にアクセス**
   - [github.com](https://github.com) にログイン

2. **新しいリポジトリを作成**
   - 右上の「+」ボタン → 「New repository」
   - リポジトリ名: `training-flow` または `training-study-progress-app`
   - 説明: `Training & Study Progress Manager - React + Supabase`
   - **Public** または **Private** を選択
   - ⚠️ **重要**: 「Add a README file」「Add .gitignore」「Choose a license」は**チェックしない**

### ステップ4: リモートリポジトリと連携

```bash
# リモートリポジトリを追加（あなたのユーザー名とリポジトリ名に置き換え）
git remote add origin https://github.com/sumosumo727/training-study-progress-app.git

# メインブランチ名を設定
git branch -M main

# 初回プッシュ
git push -u origin main
```

## 🔄 方法2: GitHub CLI使用（上級者向け）

ローカル環境でGitHub CLIがインストールされている場合：

```bash
# GitHub CLIでログイン
gh auth login

# リポジトリを作成してプッシュ
gh repo create training-study-progress-app --public --source=. --remote=origin --push
```

## 🔄 方法3: GitHub Desktop使用（GUI派向け）

1. **GitHub Desktopをダウンロード・インストール**
2. **ローカルリポジトリを追加**
   - 「File」→「Add local repository」
   - ダウンロードしたプロジェクトフォルダを選択
3. **GitHubに公開**
   - 「Publish repository」をクリック
   - リポジトリ名と説明を入力
   - 「Publish repository」をクリック

## 📋 今後の開発フロー

### WebContainer → GitHub への更新

1. **Boltで開発・テスト**
2. **変更をダウンロード**
   - 変更したファイルのみ、またはプロジェクト全体をダウンロード
3. **ローカルで更新**
   ```bash
   # 変更をステージング
   git add .
   
   # コミット
   git commit -m "機能追加: カレンダー表示の改善"
   
   # プッシュ
   git push origin main
   ```

### GitHub → WebContainer への同期

1. **GitHubから最新版をダウンロード**
   - GitHubリポジトリページで「Code」→「Download ZIP」
2. **Boltに新しいプロジェクトとしてアップロード**
   - または、変更ファイルのみを手動でコピー

## 🛠️ 自動化のヒント

### VS Code + Git拡張機能

ローカル開発環境でVS Codeを使用する場合：

1. **Git拡張機能をインストール**
   - GitLens
   - Git Graph
   - GitHub Pull Requests and Issues

2. **設定ファイルを追加**
   ```json
   // .vscode/settings.json
   {
     "git.enableSmartCommit": true,
     "git.confirmSync": false,
     "git.autofetch": true
   }
   ```

### GitHub Actions（CI/CD）

将来的に自動デプロイを設定する場合：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './dist'
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📝 重要な注意事項

1. **環境変数の管理**
   - `.env`ファイルはGitにコミットしない
   - GitHubのSecrets機能を使用してデプロイ時に設定

2. **セキュリティ**
   - Supabaseのキーは公開リポジトリにコミットしない
   - 本番環境用とテスト環境用でキーを分ける

3. **バックアップ**
   - 定期的にプロジェクト全体をダウンロード
   - 重要な変更前にはバックアップを作成

## 🎯 推奨ワークフロー

1. **Boltで開発・プロトタイピング**
2. **機能が完成したらダウンロード**
3. **ローカルでGit管理**
4. **GitHubにプッシュ**
5. **本番デプロイ**

この方法により、WebContainer環境の制限を回避しながら、効果的にGitHubでバージョン管理を行うことができます。