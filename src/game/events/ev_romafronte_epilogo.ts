import type { GameEvent } from '../content/types';

/* The last node: the order is given, or it is not.

   This one is deliberately NOT a superEvent. A superEvent takes unconditional
   priority in pickEvent, which would let it preempt Bloody Christmas and the
   fascist coup; the march is an alternative to those, not a replacement for the
   engine's own chain of consequences. As an ordinary conditional event it
   competes on the same footing.

   The order no longer settles the outcome by itself. The journal's three gates
   buy the departure; `W.marciaBalance` decides the arrival. The arithmetic is
   shown to the player as the event's `result` tally, so the choice to leave is
   made with the two camps in front of them:
     support = Σ over forces at 80+ of (relationship × the force's men)
             + (officer relationship × ITALIAN_ARMY)
             + (milizia × (1 - factionDissent))
     oppose  = Σ over forces below 80 of (relationship × the force's men)
             + ((1 - officer relationship) × ITALIAN_ARMY)
   A force below 80 is not with you, and the share of it that is mobilized
   marches against you; the near-allies (70-79) are the most dangerous. A tie
   goes to the defence: the column stops. The two endings are
   `ending_marcia_1920_win` and `ending_marcia_1920` ("la notte lunga"). */
export const evRomafronteEpilogo: GameEvent = {
  id: 'ev_romafronte_epilogo',
  condition: function (s) {
    if (!s.flags.marcia_1920_open || s.flags.coup_done) return false;
    /* The deadline belongs to the whole line, not only to the journal: if the
       epilogue is held back by a super-event past 28 October 1922, Mussolini is
       already in Rome and the train must not leave. */
    const world = (globalThis as any).Fiume?.World;
    if (world && world.marciaClosed && world.marciaClosed(s)) return false;
    /* Early window: two forces were judged enough. Late: the journal's own gate. */
    if (s.flags.marcia_1920_early) return true;
    var z = s.forze || {};
    /* Read from world.js so this agrees with the journal's own rule. */
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
      '然后他把第二张纸推过来。不是路线图，是一张名单，上面不是名字，是人数：' +
      '每一股能带多少人上车，军官团能拉走多少陆军，军团自己还剩多少能站着的。\n\n' +
      '「八十以上的，带人跟你走，」他说，「八十以下的，带人挡你的路。' +
      '最麻烦的是那些差一点够八十的：人最多，也最不服气。彻底散掉的，才不挡路；' +
      '已经掉头的，全员挡路。」\n\n' +
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
      'Poi spinge sul tavolo un secondo foglio. Non è una carta ferroviaria, è una lista: ' +
      'non nomi, ma uomini. Quanti ne porta ogni forza, quanti ne porta via il corpo ufficiale, ' +
      'quanti ne restano in piedi alla Legione.\n\n' +
      '"Sopra ottanta, portano i loro uomini con te," dice. "Sotto ottanta, li portano contro di te. ' +
      'I più fastidiosi sono quelli che ottanta non l\'hanno raggiunto per un soffio: ' +
      'sono i più numerosi e i più risentiti. Solo chi si è dissolto non blocca la strada; ' +
      'chi ha già voltato faccia la blocca con tutti i suoi."\n\n' +
      'Dice: "Oltre Bologna non si torna indietro. Da lì in poi è Roma, o è il tribunale militare."\n\n' +
      'Fuori, in piazza, qualcuno canta quella canzone.' },
  /* The tally the player sees before choosing. It is worked out live from
     W.marciaBalance, the same function the `partire` effect uses to pick the
     ending, so the forecast and the result cannot disagree. */
  result: function (s, api) {
    const W = api?.W || (globalThis as any).Fiume?.World;
    if (!W || !W.marciaBalance) return null;
    const bal = W.marciaBalance(s);
    const n = (x: number) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return {
      title: { zh: '出发前的力量对比', it: 'Il rapporto di forze alla vigilia' },
      body: { zh: '支持：关系 ≥ 80 的股，按关系折算人数；加上军官团按关系拉走的陆军；' +
          '再加上扣掉总分歧度之后的军团。反对：关系 < 80 的股，按关系折算人数；' +
          '加上军官团拉不走的陆军。',
              it: 'Sostegno: le forze sopra 80, per il loro rapporto; più la parte dell\'esercito ' +
          'che il corpo ufficiale porta con te; più la Legione al netto del dissenso. ' +
          'Contro: le forze sotto 80, per il loro rapporto; più la parte dell\'esercito ' +
          'che il corpo ufficiale non porta con te.' },
      rows: [
        { label: { zh: '随你南下的派系', it: 'Forze con te' },
          value: bal.allies.length + ' · ' + n(bal.forceSupport), tone: 'good' },
        { label: { zh: '支持你的军官团', it: 'Corpo ufficiale con te' },
          value: n(bal.officerRel * 100) + ' / 100 · ' + n(bal.officerSupport),
          tone: bal.officerRel >= 0.6 ? 'good' : 'bad' },
        { label: { zh: '军团', it: 'Legione' },
          value: n(bal.milizia) + ' × (1 − ' + n(bal.dissent * 100) + '%) ≈ ' + n(bal.legion),
          tone: 'good' },
        { label: { zh: '敌对的派系（< 80）', it: 'Forze contro (< 80)' },
          value: bal.enemies.length + ' · ' + n(bal.forceOppose), tone: 'bad' },
        { label: { zh: '反对你的军官团份额', it: 'Quota ostile del corpo ufficiale' },
          value: n((1 - bal.officerRel) * 100) + ' / 100 · ' + n(bal.officerOppose),
          tone: 'bad' },
        { label: { zh: '总分歧度', it: 'Dissenso complessivo' },
          value: n(bal.dissent * 100) + '%' },
        { label: { zh: '合计', it: 'Totale' },
          value: n(bal.support) + ' : ' + n(bal.oppose), tone: bal.win ? 'good' : 'bad' }
      ],
      note: bal.win
        ? { zh: '按现在的力量对比，纵队到得了罗马。', it: 'Con questo rapporto di forze, la colonna arriva a Roma.' }
        : { zh: '按现在的力量对比，纵队到不了罗马。', it: 'Con questo rapporto di forze, la colonna non arriva a Roma.' }
    };
  },
  options: [
    {
      id: 'partire', text: { zh: '出发。', it: 'Partire.' },
      subtitle: { zh: '支持大于反对，你进罗马；否则，你停在雨里。', it: 'Se il sostegno supera l\'ostilità, entri a Roma; altrimenti ti fermi nella pioggia.' },
      preview: [{ zh: '按力量对比决定结局', label: 'esito calcolato' }, { zh: '进入终局', label: 'epilogo' }],
      effect: function (s) {
        /* forceEnding, not forceEndingCheck. checkEnd only settles a game on its
           own hard-end conditions (MAX_END, the Rome treaty, the coup, the exile
           counters); a march is none of those, so forceEndingCheck is a no-op
           here. Declaring the ending directly is what the dispatcher's
           forceEnding path is for.
           The outcome is computed here, not by the ending's `check`: the player
           has already left the Palazzo, and the tally shown in `result` is the
           one that settles it. `march_on_rome` is deliberately NOT set: that flag
           belonged to the removed 1922 ev_marcia. */
        const world = (globalThis as any).Fiume?.World;
        const bal = world.marciaBalance(s);
        const win = !!bal.win;
        return {
          flags: win
            ? { marcia_1920: true, marcia_1920_win: true }
            : { marcia_1920: true, marcia_1920_fail: true },
          order: { violence: win ? 18 : 26, fervour: 20, coup: 40 },
          forceEnding: win ? 'ending_marcia_1920_win' : 'ending_marcia_1920'
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
