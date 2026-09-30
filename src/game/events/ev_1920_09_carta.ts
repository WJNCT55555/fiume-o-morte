import type { GameEvent } from '../content/types';


export const ev192009Carta: GameEvent = {
    id: 'ev_1920_09_carta', date: { y: 1920, m: 9, d: 8 },
    title: { zh: '1920 年 9 月 8 日：阳台上的宪章', it: '8 settembre 1920: la Carta dal balcone' },
    body: { zh: '一年前的今天，你带着两千五百人从 Ronchi 走进这座城。今天，你站在同一个阳台上，' +
        '向广场上的人宣读《卡尔纳罗宪章》。\n\n' +
        '德·安布里斯把它写成了这样：国家由两个议会治理——**最优者议会**与**临时者议会**；' +
        '七个**执政官**由议会选出；必要时可以选出**指挥官**，任期六个月；音乐是共和国的基本制度；劳动不是商品。\n\n' +
        '问题在于：这份文件从未被实施过。军团兵的意志仍然是城里唯一的法律。\n\n' +
        '而在罗马和贝尔格莱德的别墅里，另一份文件正在被起草。',
      it: 'Un anno fa sei entrato in questa città con duemilacinquecento uomini da Ronchi. Oggi, dallo stesso balcone, leggi la Carta del Carnaro.\n\n' +
        'De Ambris l\'ha scritta così: due consigli, il **Consiglio degli Ottimi** e il **Consiglio dei Provvisori**; sette **Rettori** eletti dai consigli; un **Comandante** in caso di pericolo; la musica come istituzione fondamentale della Repubblica; il lavoro che non è merce.\n\n' +
        'Il problema è che quel documento non è mai stato applicato. La volontà dei legionari resta l\'unica legge della città.\n\n' +
        'E in una villa fra Roma e Belgrado, un altro documento è in corso di stesura.' },
    options: [
      {
        id: 'a', text: { zh: '当场宣布宪章立即生效，召集阿伦戈', it: 'Dichiarare la Carta in vigore e convocare l\'Arengo' },
        preview: [{ zh: '宪章 +1', label: 'Carta +1' }, { zh: '合法性 +8', label: 'legittimità +8' }, { zh: '工团派异议 −', label: 'Falange −' }, { zh: '法西斯派异议 +', label: 'Fascio +' }],
        effect: function () { return { laws: { statuto: 1 }, order: { authority: 6, fervour: 4 }, support: [['operai', 'LEG', 3], ['portuali', 'LEG', 2]], factions: { fascisti: { dis: 12 } }, journals: ['carta'] }; }
      },
      {
        id: 'b', text: { zh: '宣读，但明确保留军团兵的最终领袖权威', it: 'Leggerla, ma riservando l\'autorità suprema ai legionari' },
        preview: [{ zh: '合法性 +3', label: 'legittimità +3' }, { zh: '军心 +', label: 'Milizia +' }, { zh: '工团派异议 +', label: 'Falange +' }],
        effect: function () { return { laws: { statuto: 0 }, order: { authority: 4, fervour: 6, milizia: 140 }, factions: { sindacalisti: { dis: 14 } }, journals: ['carta'] }; }
      },
      {
        id: 'c', text: { zh: '只读诗。让他们自己去找宪法条文。', it: 'Leggere solo la poesia. Che cerchino da soli gli articoli.' },
        preview: [{ zh: '民众热忱 ++', label: 'fervore ++' }, { zh: '合法性 −3', label: 'legittimità −3' }],
        effect: function () { return { order: { fervour: 12, violence: 4, milizia: 220 }, factions: { sindacalisti: { dis: 10 } } }; }
      }
    ]
  };
