import type { GameEvent } from '../content/types';

/* The 1924 FASCIST crisis — the one the user described: the Treaty of Rome is the
   ultimatum and the Blackshirts are the enforcement. It fires when the Italian
   fascists HAVE grown (`forze.fascisti >= 60`), which in practice means the player
   dealt with Mussolini: `ev_romafronte_mussolini:patto` is +26, taking the opening
   38 to 64.

   That is the point of splitting the two events. Accepting Mussolini's support
   buys the march on Rome and then comes back as the hardest crisis in the game:
   `R.resolveAnnexation` prices this attacker at 5 840 against the diplomatic
   variant's 504 on the same state, because `subversion` (the party you helped
   build) is the term that did not exist in 1920.

   Same three-state shape, same outcome nodes as the diplomatic variant; only the
   attacker and the framing differ. */
const TACTICS: Record<string, number> = { trattare: 1.0, barricare: 1.15, cedere: 0.9 };

function fight(state: any, tactic: string) {
  const R = (globalThis as any).Fiume?.Rules;
  const base = R.annexationForces(state, 'defender');
  return R.resolveAnnexation(state, { defenderPower: base * (TACTICS[tactic] || 1) });
}

function outcomePatch(r: any) {
  const odds = {
    zh: '守 ' + Math.round(r.defender) + ' / 攻 ' + Math.round(r.attacker),
    it: 'nostri ' + Math.round(r.defender) + ' / nemici ' + Math.round(r.attacker)
  };
  if (r.state === 'victory') {
    return {
      order: { subversion: -100, violence: -12, authority: 6 },
      diplo: { italy: -10, league: 8, uk: 4, france: 4 },
      flags: { treaty_rome_refused: true },
      preview: [{ zh: '顶住了最后通牒', label: 'l\'ultimatum è respinto' }, odds],
      next: 'ev_1924_win'
    };
  }
  if (r.state === 'stalemate') {
    return {
      order: { subversion: -100, violence: 20 },
      economy: { population: -500 },
      flags: { treaty_rome_refused: true, bloody_stalemate: true },
      preview: [{ zh: '谁也收不了场', label: 'stallo' }, odds],
      next: 'ev_1924_stalemate'
    };
  }
  return {
    order: { subversion: -100, violence: 24 },
    economy: { population: -700 },
    flags: { treaty_rome_refused: true, coup_done: true, fascist_takeover: true },
    preview: [{ zh: '黑衫军上了楼梯', label: 'le camicie nere salgono le scale' }, odds],
    next: 'ev_1924_lose'
  };
}

export const ev1924FascistCoup: GameEvent = {
    id: 'ev_1924_fascist_coup', date: { y: 1924, m: 1 },
    /* The fascists grew strong enough to be the enforcement arm. Mutually
       exclusive with `ev_1924_01_rome` by the `forze.fascisti` threshold; both
       also require an independent Regency. */
    condition: function (s) {
      return !s.flags.treaty_rome && !s.flags.coup_done && !s.flags.exile && !s.flags.stay &&
        (s.forze.fascisti || 0) >= 60;
    },
    title: { zh: '1924 年 1 月 27 日：《罗马条约》与黑衫军', it: '27 gennaio 1924: il Trattato di Roma e le camicie nere' },
    body: { zh: '意大利与南斯拉夫签署条约：阜姆归意大利。2 月 22 日批准生效，3 月 16 日维托里奥·埃马努埃莱三世进城。\n\n' +
        '但这一次不止有一份文件。消息传到城里的同一天，黑衫军开始向省督府集中——' +
        '他们在意大利已经是一支能决定政府的力量，而这条线你亲手帮他们铺过。\n\n' +
        '签字，或者再打一次。这一次的对手不是一个来收文件的政府，是一个已经准备好接管这座城市的党。',
      it: 'Italia e Jugoslavia firmano: Fiume all\'Italia. Ratifica il 22 febbraio, il 16 marzo Vittorio Emanuele III entra in città.\n\n' +
        'Ma questa volta non c\'è solo un documento. Lo stesso giorno in cui la notizia arriva, le camicie nere cominciano a raccogliersi verso il Palazzo: ' +
        'in Italia sono ormai una forza che decide i governi, e quella strada l\'hai aperta tu.\n\n' +
        'Firmare, o combattere un\'altra volta. Stavolta l\'avversario non è un governo che viene a ritirare un documento: ' +
        'è un partito che si è preparato a prendersi questa città.' },
    options: [
      {
        id: 'firmare', text: { zh: '签字。让这座城市免掉一场屠杀。', it: 'Firmare. Risparmiare alla città un massacro.' },
        subtitle: { zh: '不经计算。史实上的选择。', it: 'Nessun calcolo. La scelta storica.' },
        preview: [{ zh: '结局：吞并', label: 'finale: l\'annessione' }],
        effect: function () {
          return {
            flags: { treaty_rome: true, annexation: true },
            order: { subversion: -100, violence: -20, coup: -100 },
            diplo: { italy: 12, league: 4 },
            forceEnding: 'ending_annexation'
          };
        }
      },
      {
        id: 'trattare', text: { zh: '拒绝签字，但把条件摆到桌面上：国际保证换撤军。', it: 'Rifiutare la firma, ma mettere le condizioni sul tavolo: garanzia internazionale contro sgombero.' },
        subtitle: { zh: '稳妥打法。不冒险，也不打折扣。', it: 'Il modo prudente. Nessun rischio, nessuno sconto.' },
        effect: function (s) { return outcomePatch(fight(s, 'trattare')); }
      },
      {
        id: 'barricare', text: { zh: '把军团集中起来，抢在黑衫军进城之前动手。', it: 'Concentrare la Legione e agire prima che le camicie nere entrino in città.' },
        subtitle: { zh: '赌一把：只有在军团本身够强时，这一击才划算。', it: 'Un azzardo: conviene solo se la Legione è già forte.' },
        effect: function (s) { return outcomePatch(fight(s, 'barricare')); }
      },
      {
        id: 'cedere', text: { zh: '先让出广场，把主力留到最后。', it: 'Cedere la piazza, tenere il grosso per dopo.' },
        subtitle: { zh: '主动削弱自己的阵地，换取谈判余地。', it: 'Indebolisce la posizione per guadagnare spazio negoziale.' },
        effect: function (s) { return outcomePatch(fight(s, 'cedere')); }
      }
    ]
  };
