import type { GameEvent } from '../content/types';


export const ev192011Rapallo: GameEvent = {
    id: 'ev_1920_11_rapallo', date: { y: 1920, m: 11, d: 12 },
    title: { zh: '1920 年 11 月 12 日：拉帕洛', it: '12 novembre 1920: Rapallo' },
    body: { zh: '乔利蒂和特伦比奇在拉帕洛附近的斯皮诺拉别墅签了字。意大利与塞尔维亚-克罗地亚-斯洛文尼亚王国"承认阜姆自由邦的完全自由与独立，并承诺永久尊重它"。\n\n' +
        '也就是说：你宣布的那个国家，被两个大国当作不存在——取而代之的是另一个国家，一个由条约制造、由别人划界的自由邦。\n\n' +
        '四天前你在宣言里说，这份条约"把阜姆变成了一块抵押品"。11 月 21 日，摄政宣布进入**战争状态**。',
      it: 'Giolitti e Trumbić hanno firmato a Villa Spinola, presso Rapallo. Italia e Regno dei Serbi, Croati e Sloveni "riconoscono la completa libertà e indipendenza dello Stato libero di Fiume e si impegnano a rispettarla in perpetuo".\n\n' +
        'Cioè: lo Stato che hai proclamato viene trattato come se non esistesse — al suo posto un altro Stato, creato da un trattato, con confini tracciati da altri.\n\n' +
        'Quattro giorni prima avevi dichiarato che il trattato "fa di Fiume una merce di scambio". Il 21 novembre la Reggenza proclama lo **stato di guerra**.' },
    options: [
      {
        id: 'guerra', text: { zh: '宣布战争状态，占领韦利亚与阿尔贝两岛', it: 'Proclamare lo stato di guerra e occupare Veglia e Arbe' },
        preview: [{ zh: '事态 ++', label: 'assedio ++' }, { zh: '民众热忱 ++', label: 'fervore ++' }, { zh: '国际声誉 −−', label: 'legittimità internazionale −−' }],
        effect: function () { return { order: { coup: 26, fervour: 12, authority: 4, squadre: 4 }, diplo: { italy: -14, uk: -6, france: -6, league: -8 }, support: [['artigiani', 'LEG', 3]], flags: { occupied_islands: true } }; }
      },
      {
        id: 'negoziare', text: { zh: '不做军事回应，把条约提交国际舆论', it: 'Nessuna risposta militare: portare il trattato davanti all\'opinione internazionale' },
        preview: [{ zh: '国联/英美法 +', label: 'SDN/UK/FR/US +' }, { zh: '事态 +', label: 'assedio +' }, { zh: '法西斯派异议 +', label: 'Fascio +' }],
        effect: function () { return { order: { coup: 12, fervour: -6 }, diplo: { league: 10, uk: 6, france: 5, usa: 5, italy: -6 }, economy: { recognition: 6 }, support: [['impiegati', 'LEG', 3], ['borghesia', 'LEG', 2]], factions: { fascisti: { dis: 12 }, futuristi: { dis: 6 }, sindacalisti: { dis: -6 } }, journals: ['garanzia'] }; }
      },
      {
        id: 'trattare', text: { zh: '派密使去罗马，试探承认摄政的可能', it: 'Mandare un emissario a Roma per saggiare un riconoscimento' },
        preview: [{ zh: '意大利 +', label: 'Italia +' }, { zh: '军队立场 +', label: 'presidio +' }, { zh: '工团派异议 ++', label: 'Falange ++' }],
        effect: function () { return { order: { coup: 6, garrison: 12 }, diplo: { italy: 12, league: -4 }, support: [['borghesia', 'LEG', 4], ], factions: { sindacalisti: { dis: 8 } }, flags: { rome_talks: true } }; }
      },
      {
        id: 'cedere', text: { zh: '接受条约。把摄政转化为自由邦的第一届政府。', it: 'Accettare il trattato. Trasformare la Reggenza nel primo governo dello Stato libero.' },
        preview: [{ zh: '选举法 +1', label: 'legge elettorale +1' }, { zh: '事态 −−', label: 'assedio −−' }, { zh: '阿迪蒂异议 +++', label: 'Arditi +++' }, { zh: '转向自由邦路线', label: 'via dello Stato libero' }],
        effect: function () { return { order: { coup: -34, garrison: 16, fervour: -14, violence: -8 }, laws: { elettorale: 1 }, diplo: { italy: 14, league: 8, uk: 5, france: 5 }, factions: { arditi: { dis: 20 }, sindacalisti: { dis: -30 } }, flags: { accept_rapallo: true } }; }
      }
    ]
  };
