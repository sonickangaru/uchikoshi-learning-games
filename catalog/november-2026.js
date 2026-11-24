// Owner-published titles. The existing card wins when a URL or a known title is already listed.
const games = [
  {
    id: "solar-observation-atlas", title: "SOLAR ATLAS｜太陽系観測室", icon: "🪐", subject: "science", grade: "3",
    aliases: ["SOLAR ATLAS", "太陽系観測室"],
    unit: "太陽系と天体の動き", learningGoal: "時間や視点を変えて、惑星や衛星の位置と動きを比べる。",
    craftPoint: "同じ天体を追いながら、観測日、時刻、視点を別々に変えられる。",
    description: "土星の環を横から見たら、どんな形？　観測日を変えたり、衛星を追いかけたりしながら太陽系を巡ろう。気づいたことは観測ノートに残せるよ。"
  },
  {
    id: "energy-atlas-lab", title: "ENERGY ATLAS｜仕事とエネルギーの遊園地", icon: "🎢", subject: "science", grade: "3",
    aliases: ["ENERGY ATLAS", "ENERGY ATLAS｜仕事とエネルギーの実験室"],
    unit: "仕事とエネルギー", learningGoal: "装置の条件を変え、速さやエネルギーの変化を観察する。",
    craftPoint: "遊園地の好きな実験を選んで、装置を直接操作できる。",
    description: "コースターがいちばん速くなるのはどこ？　3D遊園地の23の実験で、滑車を動かしたり発電したりしながら、自分の予想を試してみよう。"
  },
  {
    id: "circle-angle-touch-lab", title: "円周角ラボ｜さわって、見つける。", icon: "📐", subject: "math", grade: "3",
    aliases: ["円周角ラボ"],
    unit: "円周角の定理", learningGoal: "同じ弧に対する円周角を比べ、中心角との関係を見つける。",
    craftPoint: "弧の両端を固定したまま別の点を動かし、円周角の値を追える。",
    description: "円の上で点を動かすと、三角形の形は変わる。では、角度はどうなる？　指で確かめたら角度クイズへ。7問ごとに難問が登場！"
  },
  {
    id: "energy-solar-quiz", title: "JOULE VOYAGER｜宇宙を進む理科", icon: "🚀", subject: "science", grade: "3",
    aliases: ["JOULE VOYAGER", "エネルギーと宇宙｜第4回テスト 四択ラボ"],
    unit: "エネルギー・地球と宇宙", learningGoal: "エネルギーや天体の特徴を四択で繰り返し確かめる。",
    craftPoint: "四択の連続正解と天体カードの組み合わせが航行に結びつく。",
    description: "理科の四択に正解して、京都から宇宙へ出発！　天体カードを集めて装備を工夫し、連続正解で自分の船をもっと遠くまで飛ばそう。"
  },
  {
    id: "pulley-rise", title: "LIFT UP!｜滑車の自由実験室", icon: "🏗️", subject: "science", grade: "3",
    aliases: ["LIFT UP! 滑車の自由実験室", "LIFT UP! 滑車で世界を持ち上げろ"],
    unit: "滑車と仕事の原理", learningGoal: "同じ荷物を同じ高さまで上げるとき、必要な力と引く距離の関係を確かめる。",
    craftPoint: "荷物や高さをそろえ、滑車の組み方だけを変えた記録を並べられる。",
    description: "同じ木箱を同じ高さまで上げるなら、ロープは何メートル必要？　定滑車と動滑車を組み替えて、力・距離・仕事を実験ノートで見比べよう。"
  },
  {
    id: "joule-energy-raid", title: "JOULE RAID｜エネルギー討伐戦", icon: "🤝", subject: "science", grade: "3",
    aliases: ["JOULE RAID", "JOULE RAID｜みんなでエネルギー討伐戦"],
    unit: "エネルギー変換・熱・発電・放射線", learningGoal: "熱の伝わり方や発電など、エネルギーに関する知識を復習する。",
    craftPoint: "各自が解いた四択の正解で、クラス共通のゲージがたまる。",
    description: "このバトルは全員が味方。四択の正解でチームのエネルギーをため、力を合わせて巨大ボスに挑もう。ひとりでも味方BOTと操作を練習できるよ。"
  },
  {
    id: "work-battle", title: "JOULE!｜仕事の計算バトル", icon: "⚡", subject: "science", grade: "3",
    aliases: ["JOULE! 仕事の計算バトル", "仕事の計算バトル"],
    unit: "仕事・仕事の原理・仕事率", learningGoal: "力、距離、時間から仕事や仕事率を求める。",
    craftPoint: "計算と対戦が交互に進み、ひとり用の練習も選べる。",
    description: "仕事の計算に3問正解したら、3発装填！　ひとりで練習するもよし、友達とチーム戦・トリオ・サバイバルで腕を試すもよし。"
  },
  {
    id: "material-smash", title: "物質スマッシュ｜名前で戦う理科バトル", icon: "⚗️", subject: "science", grade: "all",
    aliases: ["物質スマッシュ", "物質スマッシュ｜MATERIAL SMASH"],
    unit: "物質の性質と化学変化", learningGoal: "実在する物質の性質や反応を、キャラクターの技と結びつける。",
    craftPoint: "登録されている物質には、性質や反応にちなんだ技がある。",
    description: "食塩と砂糖、水を受けたときにどんな違いが出る？　物質名を入力すると、その性質を技にしたキャラが誕生。気になる2体を自由対戦で比べてみよう。"
  },
  {
    id: "science-test3-review", title: "理科リトライ｜第3回定期テスト", icon: "📝", subject: "science", grade: "3",
    aliases: ["理科リトライ 第3回定期テスト"],
    unit: "酸・アルカリと中和、力と運動", learningGoal: "図や模範解答で考え方を確かめ、類題で解き直す。",
    craftPoint: "元の問題を解き直した後、同じ考え方を使う類題に進める。",
    description: "中和、浮力、記録タイマーなど、つまずいた問題を選んで解き直そう。図と模範解答で考え方を確かめたら、48問の類題で腕試し。"
  },
  {
    id: "science-test-four-choice", title: "理科 四択トレーニング", icon: "🍀", subject: "science", grade: "all",
    aliases: ["理科四択トレーニング"],
    unit: "中学理科の総復習", learningGoal: "学年や単元を選び、四択問題で理解を確かめる。",
    craftPoint: "単元を選んで四択に答えると、相棒の育成や図鑑の収集が進む。",
    description: "復習したい範囲を選んで四択に挑もう。正解すると相棒が攻撃！　モンスターを育てて図鑑を埋め、対戦やレイドにも挑戦できるよ。"
  },
  {
    id: "muko-furusato-study", title: "向日市ふるさと検定", icon: "🌻", subject: "social", grade: "all",
    aliases: ["むこう日和｜向日市ふるさと検定"],
    unit: "地域の歴史・地理・文化", learningGoal: "向日市の史跡や特産品を通して、身近な地域の特色を知る。",
    craftPoint: "写真問題、苦手分野の練習、模擬検定を切り替えられる。",
    description: "長岡宮跡や地元の特産品、どこまで知ってる？　向日市の歴史と暮らしを写真つきの四択で学ぼう。練習の後は100問の模擬検定にも挑めるよ。"
  }
];

const publishedAt = Date.parse("2026-11-24T11:50:00+09:00");
const titleKey = title => String(title || "").normalize("NFKC").toLowerCase().replace(/[\s|｜・!！。]+/gu, "");

function siteKey(rawUrl) {
  try {
    const url = new URL(rawUrl);
    // Every title in this release has its own site, including links to subpages.
    return url.hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function addNovemberGames(existing) {
  const result = [...existing];
  const sites = new Set(existing.map(g => siteKey(g.url)));
  for (const {aliases, ...game} of games) {
    const host = game.id + ".sonickangaru.chatgpt.site";
    if (sites.has(host)) continue;
    const names = [game.title, ...aliases].map(titleKey);
    const match = result.findIndex(row =>
      row.id === game.id || (titleKey(row.creator) === titleKey("打越T") && names.includes(titleKey(row.title)))
    );
    const url = "https://" + host + "/";
    if (match === -1) {
      result.push({...game, creator: "打越T", url, isNew: true, approvedAt: publishedAt, submittedAt: publishedAt});
    } else if (!result[match].url) {
      // Complete an existing placeholder without changing its ID, author or position.
      result[match] = {...game, ...result[match], url};
    }
  }
  return result;
}
