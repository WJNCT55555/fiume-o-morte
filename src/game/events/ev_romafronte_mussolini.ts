import type { GameEvent } from '../content/types';

/* Mussolini, June 1920. He is already moving right — the fasci were wiped out in
   the November 1919 elections and he has concluded that the revolution is not
   coming from the left. He wants the Legion's rifles inside his own movement,
   not beside it.

   The price is written into the mechanics: every point of his regard raises the
   fascist faction's influence inside the Legion. He is the only one of the four
   who can take the movement over from within, and the card says so.

   Conditional rather than chained: it waits for the journal, so the player sets
   the order and the pace of the four approaches. */
export const evRomafronteMussolini: GameEvent = {
  id: 'ev_romafronte_mussolini',
  /* once: the conversation happens once. Without this the window would let the
     same approach be farmed every month it is open, which would make the 80
     threshold a matter of patience rather than of choosing a coalition. */
  once: true,
  condition: function (s) {
    /* Opened in July 1920: the fasci are reorganising after the November 1919
       defeat and Mussolini is the first door that is genuinely ajar. */
    const world = (globalThis as any).Fiume?.World;
    return !!(s.journals.marcia_1920 && s.journals.marcia_1920.active
      && world && world.forzaWindowOpen(s, 'fascisti'));
  },
  title: { zh: '米兰：墨索里尼', it: 'Milano: Mussolini' },
  body: { zh: '他在《意大利人民报》的办公室里见你，桌上摊着一张全国地图，上面用红笔圈了二十几个城市。\n\n' +
      '「去年十一月我们什么也没拿到，」他说，「米兰四千人。四千。工人在投票站外面笑我们。」\n\n' +
      '他把地图转向你：「你有一万人，有枪，有一个连国王都不敢碰的名字。' +
      '我有报纸、有城市、有组织。你把军团兵并进来，我们把意大利拿下来——不是你做我的客人，' +
      '是我们一起做这件事。」\n\n' +
      '他没有说的是：并进来之后，谁听谁的。',
    it: 'Ti riceve nella redazione del «Popolo d\'Italia», con una carta d\'Italia sul tavolo e una ventina ' +
      'di città cerchiate in rosso.\n\n' +
      '"A novembre non abbiamo preso niente," dice. "Quattromila voti a Milano. Quattromila. ' +
      'Gli operai ci ridevano dietro ai seggi."\n\n' +
      'Gira la carta verso di te: "Tu hai diecimila uomini, i fucili, e un nome che nemmeno il re tocca. ' +
      'Io ho i giornali, le città, l\'organizzazione. Porta dentro i legionari e prendiamoci l\'Italia: ' +
      'non sarai mio ospite, la faremo insieme."\n\n' +
      'Quello che non dice è chi comanderà, dopo.' },
  options: [
    {
      id: 'patto', text: { zh: '签。把军团兵并进他的组织，换报纸和城市。', it: 'Firmare. Unire i legionari alla sua organizzazione, in cambio di giornali e città.' },
      subtitle: { zh: '他会给你全国性的宣传机器。副作用是：他在你的运动内部同步坐大。', it: 'Ti dà una macchina propagandistica nazionale. Effetto collaterale: cresce dentro il tuo movimento.' },
      preview: [{ zh: '墨索里尼 ++', label: 'Mussolini ++' }, { zh: '马拉泰斯塔／葛兰西 −−', label: 'Malatesta / Gramsci −−' }, { zh: '法西斯派影响力 +', label: 'influenza fascista +' }],
      effect: function () {
        return {
          forze: { fascisti: 26 },
          order: { squadre: 12, coup: 8 },
          diplo: { italy: 6 },
          factions: { fascisti: { inf: 4, dis: -14 }, sindacalisti: { dis: 16 }, arditi: { dis: -6 } },
          support: [['artigiani', 'LEG', 2], ['regnicoli', 'LEG', 2]],
          flags: { fascist_embrace: true }
        };
      }
    },
    {
      id: 'alleanza', text: { zh: '结盟，但不并吞。两条名单，一个目标。', it: 'Allearsi senza fondersi. Due liste, un solo obiettivo.' },
      subtitle: { zh: '保留军团兵的独立。他会记恨这件事，但不会现在翻脸。', it: 'Mantieni l\'autonomia dei legionari. Non te lo perdonerà, ma non romperà adesso.' },
      preview: [{ zh: '墨索里尼 +', label: 'Mussolini +' }, { zh: '法西斯派影响力 +', label: 'influenza fascista +' }, { zh: '工团派异议 −', label: 'Falange −' }],
      effect: function () {
        return {
          forze: { fascisti: 15 },
          order: { squadre: 5, coup: 3 },
          factions: { fascisti: { inf: 2, dis: -6 }, sindacalisti: { dis: 4 } },
          flags: { fascist_alliance: true }
        };
      }
    },
    {
      id: 'rifiuto', text: { zh: '拒绝。他去年在选举里已经输过一次，他不会为你赢。', it: 'Rifiutare. Ha già perso una volta, e non vincerà per te.' },
      subtitle: { zh: '踢开最危险的那一个。他会成为你两年后最难缠的对手。', it: 'Togli di mezzo il più pericoloso. Diventerà il tuo avversario più duro.' },
      preview: [{ zh: '墨索里尼 −−−', label: 'Mussolini −−−' }, { zh: '工团派／阿迪蒂异议 −', label: 'Falange/Arditi −' }, { zh: '法西斯派影响力 −', label: 'influenza fascista −' }],
      effect: function () {
        return {
          forze: { fascisti: -26 },
          order: { squadre: -6 },
          factions: { fascisti: { inf: -3, dis: 22 }, sindacalisti: { dis: -10 }, arditi: { dis: -6 } },
          flags: { fascist_refused: true }
        };
      }
    }
  ]
};
