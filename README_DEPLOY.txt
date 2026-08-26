打越Tの中学学習ゲー — Git Build版

■ 重要
この版は EdgeOne の「Direct Upload」ではなく、「Git Integration」で公開してください。

理由：
Direct Upload は npm install を実行しないため、
@edgeone/pages-blob が入らず共有APIが起動できません。

Git Integrationでは package.json を検出して npm install が実行されます。

■ 公開手順
1. GitHubで新しいリポジトリを作成
2. このZIPを解凍し、中のファイルをリポジトリ直下へアップロード
   必ずルート直下に以下がある状態：
   index.html
   package.json
   edgeone.json
   cloud-functions/
3. EdgeOne Makers → Create Project → Git Integration
4. 上のGitHubリポジトリを選択してDeploy

■ 動作確認
公開後：
/api/health
を開く。

正常なら：
{"ok":true,"service":"uchikoshi-learning-games","functions":"online"}

その後トップページに
COMMUNITY SAVE ONLINE
と出れば完全成功。

■ ADMIN
PIN: 9312

■ 機能
・9教科
・LATEST
・誰でも投稿
・承認制
・ADMIN編集／削除／並べ替え
・訪問数
・PLAY回数
・人気ランキング
・7日間アクセス推移
