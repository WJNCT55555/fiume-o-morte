import type { GameEvent } from '../content/types';

/* The siege is resolved by COMPARING the two sides, not by picking a line — see
   `R.resolveBattle`. Three outcomes fall out of one calculation:
     victory    the Legion holds and the Regency survives the siege;
     stalemate  neither side can finish it, so the city splits;
     defeat     the Royal Army takes the streets and the Regency is over.
   An option therefore does not choose the outcome, it shifts the balance: hold
   the bridges, or spend the Legion's remaining strength on one counter-attack.
   `arrendersi` is the only true choice — it skips the calculation. */
/* Per-option multipliers on the defender's priced strength. Holding is the safe
   play; a sortie is a gamble that pays only if the Legion is already strong. */
const TACTICS: Record<string, number> = { tenere: 1.0, sortita: 1.15, cessate: 0.9 };

/* `Rules` is a UMD module (`globalThis.Fiume.Rules`), read lazily inside the
   function like every other event that needs it — a top-level import would run
   before the registry has been populated. */
function fight(state: any, tactic: string) {
  const R = (globalThis as any).Fiume?.Rules;
  const base = R.battleForces(state, 'defender');
  const r = R.resolveBattle(state, { defenderPower: base * (TACTICS[tactic] || 1) });
  return r;
}

function outcomePatch(r: any) {
  /* Every arm reads out the same three-way result, so a new tactic cannot drift
     away from the resolver. */
  const odds = { zh: '守 ' + Math.round(r.defender) + ' / 攻 ' + Math.round(r.attacker), it: 'nostri ' + Math.round(r.defender) + ' / nemici ' + Math.round(r.attacker) };
  if (r.state === 'victory') {
    return {
      order: { coup: -100, violence: -14, milizia: -600, fervour: 8, authority: 4 },
      diplo: { italy: -8, league: 6 },
      flags: { natale_done: true, bloody_christmas: true, siege_held: true },
      journals: ['garanzia'],
      preview: [{ zh: '军团守住了街道', label: 'assedio respinto' }, odds],
      next: 'ev_natale_win'
    };
  }
  if (r.state === 'stalemate') {
    return {
      order: { coup: -100, violence: 18, milizia: -1500 },
      economy: { population: -400 },
      flags: { natale_done: true, bloody_christmas: true, siege_stalemate: true },
      preview: [{ zh: '谁也打不完这一仗', label: 'stallo' }, odds],
      next: 'ev_natale_stalemate'
    };
  }
  return {
    order: { coup: -100, milizia: -2400, violence: 22 },
    economy: { population: -600 },
    flags: { natale_done: true, bloody_christmas: true, siege_lost: true },
    preview: [{ zh: '街道守不住了', label: 'le strade sono perdute' }, odds],
    next: 'ev_natale_lose'
  };
}

export const evNataleFight: GameEvent = {
    id: 'ev_natale_fight', chain: true,
    title: { zh: '五天的巷战', it: 'Cinque giorni di strada' },
    body: { zh: '死的人不多——二十二名军团兵、十七名意大利士兵、五名平民——但每一具尸体都属于这座城市。\n\n' +
        '弹药在减少。医院在地下室里。12 月 28 日，你召集了摄政委员会。\n\n' +
        '这一次不是你来决定结局。你只能决定怎么打：皇家陆军有军舰、有补给、有全国；' +
        '你只有街垒后面那些人。守得住守不住，是算出来的。',
      it: 'I morti non sono molti — ventidue legionari, diciassette soldati italiani, cinque civili — ma ogni cadavere appartiene a questa città.\n\n' +
        'Le munizioni calano. Gli ospedali sono nelle cantine. Il 28 dicembre riunisci il Consiglio della Reggenza.\n\n' +
        'Questa volta non decidi tu come finisce. Decidi solo come si combatte: il Regio Esercito ha le navi, i rifornimenti, il Paese intero; ' +
        'tu hai soltanto gli uomini dietro i sacchi di sabbia. Se le strade tengano o no, si calcola.' },
    options: [
      {
        id: 'tenere', text: { zh: '守住桥与街口。把军团摊在整条防线上。', it: 'Tenere i ponti e gli sbocchi. Distendere la Legione su tutta la linea.' },
        subtitle: { zh: '稳妥打法：不打折扣，但也不冒险。', it: 'Il modo prudente: nessuno sconto, nessun rischio.' },
        effect: function (s) { return outcomePatch(fight(s, 'tenere')); }
      },
      {
        id: 'sortita', text: { zh: '集中兵力反击一次。要么撕开包围，要么就此耗尽。', it: 'Concentrare tutto in un contrattacco. O si sfonda l\'accerchiamento, o si consuma qui.' },
        subtitle: { zh: '赌一把：只有在军团本身够强时，这一击才划算。', it: 'Un azzardo: conviene solo se la Legione è già forte.' },
        effect: function (s) { return outcomePatch(fight(s, 'sortita')); }
      },
      {
        id: 'cessate', text: { zh: '就地停火，把残破的阵地留作谈判筹码。', it: 'Cessate il fuoco sul posto: le posizioni tenute valgono come merce di scambio.' },
        subtitle: { zh: '主动削弱自己的阵地，换取政治余地。', it: 'Indebolisce la posizione per guadagnare spazio politico.' },
        effect: function (s) { return outcomePatch(fight(s, 'cessate')); }
      },
      {
        id: 'arrendersi', text: { zh: '投降。签字，走人，去威尼斯写回忆录。', it: 'Arrendersi. Firmare, andarsene, scrivere le memorie a Venezia.' },
        subtitle: { zh: '不经计算。史实上的选择。', it: 'Nessun calcolo. La scelta storica.' },
        preview: [{ zh: '历史线：诗人离开', label: 'linea storica' }],
        effect: function () { return { order: { coup: -100, milizia: -2400, fervour: -30, violence: -18 }, flags: { natale_done: true, dannunzio_left: true }, forceEnding: 'ending_fuga' }; }
      }
    ]
  };
