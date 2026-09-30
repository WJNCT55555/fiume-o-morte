import type { GameEvent } from '../content/types';


export const ev192401Rome: GameEvent = {
    id: 'ev_1924_01_rome', date: { y: 1924, m: 1 },
    condition: function (s) { return !s.flags.treaty_rome; },
    title: { zh: '1924 年 1 月 27 日：《罗马条约》', it: '27 gennaio 1924: il Trattato di Roma' },
    body: { zh: '意大利与南斯拉夫签署条约：阜姆归意大利，苏沙克、波尔托巴罗斯与埃内奥河的整个河床和三角洲归南斯拉夫。条约在 2 月 22 日批准生效。3 月 16 日，维托里奥·埃马努埃莱三世将进城宣布合并。\n\n' +
        '五年前你带人走进这座城市，说它属于意大利。现在意大利来取它了——用一份和它无关的文件。',
      it: 'Italia e Jugoslavia firmano: Fiume all\'Italia, Sussak, Porto Baross e l\'intero alveo e delta dell\'Eneo alla Jugoslavia. Ratifica il 22 febbraio. Il 16 marzo Vittorio Emanuele III entra in città per proclamare l\'annessione.\n\n' +
        'Cinque anni fa sei entrato in questa città con i tuoi uomini dicendo che apparteneva all\'Italia. Ora l\'Italia viene a prenderla — con un documento che non la riguarda.' },
    options: [
      {
        id: 'a', text: { zh: '拒绝承认。把流亡政府维持下去。', it: 'Non riconoscere. Mantenere il governo in esilio.' },
        effect: function () { return { flags: { treaty_rome: true }, forceEndingCheck: true, journals: ['esilio'] }; }
      },
      {
        id: 'b', text: { zh: '把文件交给外国报界，然后沉默。', it: 'Darlo alla stampa estera, poi tacere.' },
        effect: function () { return { flags: { treaty_rome: true }, diplo: { league: 6, uk: 4 }, forceEndingCheck: true }; }
      }
    ]
  };
