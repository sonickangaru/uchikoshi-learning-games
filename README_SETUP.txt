打越Tの中学学習ゲー — ANALYTICS版

【追加した計測】
ADMIN画面に ANALYTICS を追加。

見られるもの：
・TODAY VISITS
・TOTAL VISITS
・TOTAL PLAYS
・公開ゲーム数
・人気ゲーム PLAYランキング TOP10
・直近7日間の訪問推移

【VISITSの数え方】
同じブラウザの1セッションにつき1回だけ加算します。
ブラウザの sessionStorage を使って「このセッションで数えたか」だけ判定します。

EdgeOne側に保存するのは集計数だけです。
IPアドレス、氏名、メール、ユーザーID、閲覧履歴などは保存しません。

【PLAY】
PLAY GAMEを押した時点で、そのゲームのPLAY数を+1します。

【保存場所】
EdgeOne Pages Blob
ストア：uchikoshi-learning-games

games.json       公開ゲーム
pending.json     承認待ち
analytics.json   匿名集計データ

【ADMIN】
PIN：9312
ANALYTICS / PENDING / 編集 / 削除 / 並べ替え

【広告】
この版には広告機能を入れていません。
将来追加できますが、現在は計測のみです。
