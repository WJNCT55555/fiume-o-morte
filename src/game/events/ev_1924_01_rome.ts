import type { GameEvent } from '../content/types';

/* The DIPLOMATIC 1924 crisis — the Treaty of Rome arriving as a document, not as a
   coup. It fires when the Italian fascists never grew strong enough to force the
   issue (`forze.fascisti < 60`): Rome has to enforce the treaty itself, with the
   Royal Army, and does not have a domestic party in Fiume to hand the city to.

   This is deliberately NOT the fascist coup chain. The companion event
   `ev_1924_fascist_coup` handles the case where the party DID grow, and it is the
   hard one. Here refusal still leads to a fight — the treaty has to be
   executed — but a much weaker one: `R.resolveTreaty` prices the attacker without
   any `subversion` term (see W.TREATY_1924). Measured on the same state: 504 here
   against 5 840 for the coup variant. Refusing this one is winnable; refusing that
   one is not.

   The three arms reuse `ev_1924_win` / `_stalemate` / `_lose`, because the three
   outcomes are the same three outcomes. Only the attacker differs. */
const TACTICS: Record<string, number> = { negoziare: 1.0, mobilitare: 1.15, ripiegare: 0.9 };

function fight(state: any, tactic: string) {
  const R = (globalThis as any).Fiume?.Rules;
  const base = R.treatyForces(state, 'defender');
  return R.resolveTreaty(state, { defenderPower: base * (TACTICS[tactic] || 1) });
}

function outcomePatch(r: any) {
  const odds = {
    zh: '守 ' + Math.round(r.defender) + ' / 攻 ' + Math.round(r.attacker),
    it: 'nostri ' + Math.round(r.defender) + ' / nemici ' + Math.round(r.attacker)
  };
  if (r.state === 'victory') {
    return {
      order: { violence: -10, authority: 6 },
      diplo: { italy: -12, league: 8, uk: 5, france: 5 },
      flags: { treaty_rome_refused: true },
      preview: [{ zh: '条约没能执行', label: 'il trattato non è eseguito' }, odds],
      next: 'ev_1924_win'
    };
  }
  if (r.state === 'stalemate') {
    return {
      order: { violence: 20 },
      economy: { population: -500 },
      flags: { treaty_rome_refused: true, bloody_stalemate: true },
      preview: [{ zh: '谁也收不了场', label: 'stallo' }, odds],
      next: 'ev_1924_stalemate'
    };
  }
  return {
    order: { violence: 24, subversion: 30 },
    economy: { population: -700 },
    flags: { treaty_rome_refused: true, coup_done: true, fascist_takeover: true },
    preview: [{ zh: '皇家陆军进城，法西斯随后就到', label: 'l\'esercito entra, i fascisti seguono' }, odds],
    next: 'ev_1924_lose'
  };
}

export const ev192401Rome: GameEvent = {
    id: 'ev_1924_01_rome', date: { y: 1924, m: 1 },
    /* Diplomatic variant only: fascists too weak to force it, and the Regency is
       still its own master. `forze.fascisti` starts at 38, and the one big lever
       is `ev_romafronte_mussolini:patto` (+26) — so this is the DEFAULT 1924,
       and the coup chain is what a player opts into by dealing with Mussolini. */
    condition: function (s) {
      return !s.flags.treaty_rome && !s.flags.coup_done && !s.flags.exile && !s.flags.stay &&
        (s.forze.fascisti || 0) < 60;
    },
    title: { zh: '1924 年 1 月 27 日：《罗马条约》', it: '27 gennaio 1924: il Trattato di Roma' },
    body: { zh: '意大利与南斯拉夫签署条约：阜姆归意大利，苏沙克、波尔托巴罗斯与埃内奥河的整个河床和三角洲归南斯拉夫。条约在 2 月 22 日批准生效。3 月 16 日，维托里奥·埃马努埃莱三世将进城宣布合并。\n\n' +
        '但罗马这次没有帮手。城里的法西斯党始终没有长起来——他们在 1919 年把这座城市当作障碍，' +
        '此后也一直没有能力在这里动手。所以条约要执行，只能靠皇家陆军自己来。\n\n' +
        '一份文件，或者一次登陆。你选。',
      it: 'Italia e Jugoslavia firmano: Fiume all\'Italia, Sussak, Porto Baross e l\'intero alveo e delta dell\'Eneo alla Jugoslavia. ' +
        'Ratifica il 22 febbraio. Il 16 marzo Vittorio Emanuele III entra in città per proclamare l\'annessione.\n\n' +
        'Ma stavolta Roma non ha alleati in città. Il partito fascista locale non è mai cresciuto: nel 1919 considerava questa città un ostacolo, ' +
        'e da allora non ha mai avuto la forza di agire qui. Per eseguire il trattato resta solo il Regio Esercito.\n\n' +
        'Un documento, o uno sbarco. Scegli.' },
    options: [
      {
        id: 'firmare', text: { zh: '签字。让这座城市免掉一场登陆。', it: 'Firmare. Risparmiare alla città uno sbarco.' },
        subtitle: { zh: '不经计算。史实上的选择。', it: 'Nessun calcolo. La scelta storica.' },
        preview: [{ zh: '结局：吞并', label: 'finale: l\'annessione' }],
        effect: function () {
          return {
            flags: { treaty_rome: true, annexation: true },
            order: { violence: -20, coup: -100 },
            diplo: { italy: 12, league: 4 },
            forceEnding: 'ending_annexation'
          };
        }
      },
      {
        id: 'negoziare', text: { zh: '拒绝签字，把条件摆到桌面上：国际保证换撤军。', it: 'Rifiutare la firma e mettere le condizioni sul tavolo: garanzia internazionale contro sgombero.' },
        subtitle: { zh: '稳妥打法，不冒险也不打折扣。', it: 'Il modo prudente: nessun rischio, nessuno sconto.' },
        effect: function (s) { return outcomePatch(fight(s, 'negoziare')); }
      },
      {
        id: 'mobilitare', text: { zh: '总动员。让登陆变成一件代价很高的事。', it: 'Mobilitazione generale. Rendere lo sbarco molto costoso.' },
        subtitle: { zh: '赌一把：只有在军团本身够强时，这一击才划算。', it: 'Un azzardo: conviene solo se la Legione è già forte.' },
        effect: function (s) { return outcomePatch(fight(s, 'mobilitare')); }
      },
      {
        id: 'ripiegare', text: { zh: '让出外圈，把主力收缩到老城。', it: 'Cedere il perimetro, ritirare il grosso nella città vecchia.' },
        subtitle: { zh: '主动削弱自己的阵地，换取谈判余地。', it: 'Indebolisce la posizione per guadagnare spazio negoziale.' },
        effect: function (s) { return outcomePatch(fight(s, 'ripiegare')); }
      }
    ]
  };
