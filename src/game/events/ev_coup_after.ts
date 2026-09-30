import type { GameEvent } from '../content/types';

export const evCoupAfter: GameEvent = {
    id: 'ev_coup_after', chain: true,
    title: { zh: '一个不流血的失位', it: 'Una perdita senza sangue' },
    body: { zh: '他们进了省督府。没有开枪。君塔在阳台上宣布"阜姆回归意大利"，台下有人欢呼，有人只是看着。\n\n' +
        '你搬到了佩奇内的住所。城市的账本、警察和报纸现在归他们。你剩下的东西是：一个名字、一份宪法、和几千个还记得 1919 年 9 月的人。\n\n' +
        '1924 年，罗马条约把这座城市正式交给意大利。',
      it: 'Entrano al Palazzo. Nessuno spara. Giunta annuncia dal balcone che "Fiume torna all\'Italia"; qualcuno applaude, qualcuno guarda e basta.\n\n' +
        'Ti trasferisci nella residenza di Pećine. I conti, la polizia e i giornali della città sono loro. Ti restano un nome, una costituzione e qualche migliaio di persone che ricordano il settembre 1919.\n\n' +
        'Nel 1924 il Trattato di Roma consegna formalmente la città all\'Italia.' },
    options: [
      {
        id: 'a', text: { zh: '把这变成一个流亡的议会。', it: 'Trasformarlo in un\'assemblea in esilio.' },
        effect: function () { return { order: { coup: 100 }, flags: { coup_done: true, exile: true }, diplo: { league: 8, italy: -10 }, phase: 'exile', journals: ['esilio'] }; }
      },
      {
        id: 'b', text: { zh: '留在城里。写诗，等下一次机会。', it: 'Restare in città. Scrivere, e aspettare.' },
        effect: function () { return { order: { coup: 100, violence: 6 }, flags: { coup_done: true, stay: true }, phase: 'occupied', journals: ['resistenza'] }; }
      }
    ]
  };
