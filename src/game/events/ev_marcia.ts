import type { GameEvent } from '../content/types';

export const evMarcia: GameEvent = {
    id: 'ev_marcia', chain: true,
    title: { zh: '从阜姆向罗马', it: 'Da Fiume a Roma' },
    body: { zh: '这是一个在 1919 年被提出过、在 1920 年被拒绝过、在 1922 年已经太晚了的计划。\n\n' +
        '军团兵、阿迪蒂、一部分倒戈的军官、以及沿途可能加入的老兵。你们有枪、有口号、有一面旗。你们没有后勤、没有铁路时刻表、也没有罗马。',
      it: 'Un progetto proposto nel 1919, rifiutato nel 1920, e nel 1922 ormai troppo tardi.\n\n' +
        'Legionari, arditi, una parte di ufficiali passati dalla vostra parte, e i reduci che forse si uniranno lungo la strada. Avete fucili, slogan, una bandiera. Non avete vettovagliamento, né orari ferroviari, né Roma.' },
    options: [
      {
        id: 'a', text: { zh: '出发。', it: 'Partire.' },
        preview: [{ zh: '进入终局', label: 'epilogo' }],
        effect: function () { return { flags: { march_on_rome: true, coup_done: true }, order: { violence: 30, fervour: 20 }, forceEndingCheck: true }; }
      },
      {
        id: 'b', text: { zh: '取消。留在阜姆，守住这座城市。', it: 'Annullare. Restare a difendere la città.' },
        preview: [{ zh: '取消进军', label: 'annullato' }, { zh: '合法性 +', label: 'legittimità +' }, { zh: '热忱 −', label: 'fervore −' }],
        effect: function () { return { order: { fervour: -10, squadre: -4, authority: 4 }, flags: { refused_march: true } }; }
      }
    ]
  };
