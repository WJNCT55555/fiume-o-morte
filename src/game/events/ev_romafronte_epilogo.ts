import type { GameEvent } from '../content/types';

/* The last node: the order is given, or it is not.

   This one is deliberately NOT a superEvent. A superEvent takes unconditional
   priority in pickEvent, which would let it preempt Bloody Christmas and the
   fascist coup; the march is an alternative to those, not a replacement for the
   engine's own chain of consequences. As an ordinary conditional event it
   competes on the same footing. */
export const evRomafronteEpilogo: GameEvent = {
  id: 'ev_romafronte_epilogo',
  condition: function (s) {
    if (!s.flags.marcia_1920_open || s.flags.coup_done) return false;
    /* Early window: two forces were judged enough. Late: the journal's own gate. */
    if (s.flags.marcia_1920_early) return true;
    var z = s.forze || {};
    /* Read from world.js so this agrees with the journal's own rule. */
    const world = (globalThis as any).Fiume?.World;
    const front: string[] = world.availableForzaFront(s);
    const needed: number = world?.FORZA_FRONT_NEEDED || 3;
    var n = front.filter(function (k: string) { return (z[k] || 0) >= 80; }).length;
    return s.order.milizia >= 10000 && (z.forzearmate || 0) >= 60 && n >= needed;
  },
  title: { zh: '出发前夜：省督府', it: 'La vigilia: il Palazzo del Governo' },
  body: { zh: '火车已经编好组，停在货场上。军团兵把机枪搬上平板车，工人在车皮上刷字。\n\n' +
      '来的人比你预期的多，也比你预期的杂。阿迪蒂老兵和都灵来的工人分住在两节车厢里，' +
      '中间隔着一段空地。无政府主义者拒绝穿制服。法西斯小队自己带了旗，' +
      '那面旗和你的旗不是同一面。\n\n' +
      '你的参谋把路线图摊在桌上：阜姆—蒙法尔科内—帕多瓦—博洛尼亚—罗马。六天。' +
      '蒙法尔科内有一营宪兵，帕多瓦有一个骑兵团，博洛尼亚的火车站是全意大利最大的编组场。\n\n' +
      '他说：「过了博洛尼亚就没有回头路了。到那时候，要么罗马，要么军事法庭。」\n\n' +
      '窗外，广场上有人在唱那首歌。',
    it: 'I treni sono già composti, fermi nel piazzale merci. I legionari caricano le mitragliatrici ' +
      'sui carri pianali, gli operai dipingono scritte sulle fiancate.\n\n' +
      'È venuta più gente del previsto, e più mista. Gli arditi e gli operai di Torino dormono in due ' +
      'carrozze diverse, con uno spiazzo vuoto in mezzo. Gli anarchici rifiutano la divisa. ' +
      'Le squadre fasciste hanno portato la propria bandiera, e non è la tua.\n\n' +
      'Il tuo stato maggiore stende la carta sul tavolo: Fiume, Monfalcone, Padova, Bologna, Roma. Sei giorni. ' +
      'A Monfalcone c\'è un battaglione di carabinieri, a Padova un reggimento di cavalleria, ' +
      'e la stazione di Bologna è il più grande scalo di smistamento d\'Italia.\n\n' +
      'Dice: "Oltre Bologna non si torna indietro. Da lì in poi è Roma, o è il tribunale militare."\n\n' +
      'Fuori, in piazza, qualcuno canta quella canzone.' },
  options: [
    {
      id: 'partire', text: { zh: '出发。', it: 'Partire.' },
      subtitle: { zh: '六天之后，要么你在罗马，要么你在军事法庭上。', it: 'Sei giorni: o sei a Roma, o sei davanti a un tribunale militare.' },
      preview: [{ zh: '进入终局', label: 'epilogo' }],
      effect: function () {
        /* forceEnding, not forceEndingCheck. checkEnd only settles a game on its
           own hard-end conditions (MAX_END, the Rome treaty, the coup, the exile
           counters); a march is none of those, so forceEndingCheck is a no-op
           here — the flag was set and the game simply carried on to the coup.
           Declaring the ending directly is what the dispatcher's forceEnding
           path is for.
           `march_on_rome` is deliberately NOT set: that flag belonged to the
           removed 1922 ev_marcia, and reducers.js checkEnd used to consult it
           when deciding whether a coup ends the game. There is one march ending
           now and it is this one. */
        return {
          flags: { marcia_1920: true },
          order: { violence: 26, fervour: 20, coup: 40 },
          forceEnding: 'ending_marcia_1920'
        };
      }
    },
    {
      id: 'annullare', text: { zh: '取消。把车皮卸下来，让所有人回去。', it: 'Annullare. Scaricare i carri e mandare tutti a casa.' },
      subtitle: { zh: '你会活着，而且你会一直知道你没有去。', it: 'Sopravviverai, e saprai per sempre di non essere partito.' },
      preview: [{ zh: '取消进军', label: 'marcia annullata' }, { zh: '已存在的意大利政治力量关系 −−', label: 'le forze −−' }, { zh: '民众热忱 −−−', label: 'fervore −−−' }],
      effect: function (s) {
        const world = (globalThis as any).Fiume?.World;
        const front: string[] = world.availableForzaFront(s);
        const hit: Record<string, number> = { forzearmate: -10 };
        front.forEach(function (k: string) { hit[k] = -20; });
        return {
          flags: { marcia_1920_open: false, marcia_1920_failed: true, refused_march: true },
          forze: hit,
          order: { fervour: -24, squadre: -6, authority: 4 },
          factions: { arditi: { dis: 24 }, sindacalisti: { dis: 12 }, fascisti: { dis: -8 } }
        };
      }
    }
  ]
};
