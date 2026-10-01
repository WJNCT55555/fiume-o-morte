import type { GameEvent } from '../content/types';

/* 23 November 1919. Nitti's cabinet, hemmed in by the Allies and unwilling to
   send the army into Fiume, offers a way out that is neither annexation nor
   abandonment: a provisional settlement. The city is asked to become a free
   state under the League, with an Italian garrison and an amnesty.

   What the Comandante answers here is what the National Council votes on in
   December — the division is worked out from that answer, not written in. */
export const ev191911Modus: GameEvent = {
    id: 'ev_1919_11_modus', date: { y: 1919, m: 11, d: 23 },
    title: { zh: '11 月 23 日：《临时协定》', it: '23 novembre: il Modus Vivendi' },
    body: { zh: '罗马派来的密使在夜里进城，带来一份没有标题的文件。尼蒂政府不敢派兵，' +
        '也不敢承认既成事实，于是想出了第三条路。\n\n' +
        '条款是：阜姆成为一个自由邦，由国联保证其中立；意大利留下一支象征性的驻军；' +
        '所有人获得赦免；边界问题留待日后解决。作为交换，你必须停止一切兼并宣传，' +
        '并接受国联的监督。\n\n' +
        '这不是投降，也不是胜利。这是一份让你活下去、但活得不像英雄的文件。',
      it: 'Un emissario di Roma entra in città di notte con un documento senza titolo. Il governo Nitti non osa mandare l\'esercito né riconoscere il fatto compiuto, e inventa una terza via.\n\n' +
        'Fiume diventa Stato libero sotto la garanzia della Società delle Nazioni; l\'Italia lascia un presidio simbolico; amnistia generale; la questione dei confini rinviata. In cambio: fine della propaganda annessionista e controllo di Ginevra.\n\n' +
        'Non è una resa né una vittoria. È un documento che ti lascia vivere, ma non da eroe.' },
    options: [
      {
        id: 'accogliere',
        text: { zh: '接受框架，把它拿去给国民委员会表决。', it: 'Accogliere il quadro e portarlo al Consiglio Nazionale.' },
        preview: ['意大利 +', '英法美 +', '民众热忱 −', '阿迪蒂异议 ++'],
        effect: function () {
          return {
            flags: { modus_accepted: true },
            diplo: { italy: 10, uk: 6, france: 6, league: 8 },
            economy: { recognition: 8 },
            order: { fervour: -8, violence: -6 },
            factions: { arditi: { dis: 16 }, futuristi: { dis: 10 }, fascisti: { dis: 8 }, sindacalisti: { dis: -8 } },
            journals: ['garanzia'],
            queueEvents: ['ev_1919_12_modus_vote']
          };
        }
      },
      {
        id: 'respingere',
        text: { zh: '拒绝。在阳台上把这份文件念给全城听，然后撕掉。', it: 'Rifiutare. Leggerlo dal balcone e strapparlo.' },
        subtitle: { zh: '有些文件一旦接受，这座城市就不再是它自己。', it: 'Certi documenti, una volta accettati, cambiano la città.' },
        preview: ['民众热忱 ++', '摄政领袖权威 +', '意大利 −−', '英法美 −−'],
        effect: function () {
          return {
            flags: { modus_blocked: true },
            order: { fervour: 12, authority: 6, violence: 6 },
            diplo: { italy: -14, uk: -8, france: -8, league: -10 },
            economy: { recognition: -8 },
            factions: { arditi: { dis: -12 }, futuristi: { dis: -8 }, fascisti: { dis: -6 }, sindacalisti: { dis: 6 } },
            queueEvents: ['ev_1919_12_modus_vote']
          };
        }
      },
      {
        id: 'temporeggiare',
        text: { zh: '不答复。让他们等，让罗马自己去猜。', it: 'Non rispondere. Lasciare che Roma indovini.' },
        preview: ['意大利 −', '国联 −', '领袖权威 +'],
        effect: function () {
          return {
            flags: { modus_delayed: true },
            order: { authority: 4 },
            diplo: { italy: -4, league: -4 },
            factions: { arditi: { dis: 4 } },
            queueEvents: ['ev_1919_12_modus_vote']
          };
        }
      }
    ]
  };
