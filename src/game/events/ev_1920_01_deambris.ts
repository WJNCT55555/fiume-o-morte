import type { GameEvent } from '../content/types';

/* De Ambris arrives in Fiume. He came in early 1920 and became the Regency's
   chief of cabinet and the man who actually drafted the Carnaro Charter — the
   document promulgated from the balcony in September 1920 is his prose, not
   D'Annunzio's.

   One option on purpose: this is an arrival, not a decision. What it opens is
   the advisor (see the `require` on src/game/advisors/deambris.ts): before he
   is in the Palazzo there is no point offering him a seat in it. */
export const ev192001Deambris: GameEvent = {
    id: 'ev_1920_01_deambris', date: { y: 1920, m: 1 },
    condition: function (s) { return s.playerForce === 'LEG' && !s.flags.deambris_arrived; },
    title: { zh: '1920 年 1 月：德·安布里斯抵达阜姆', it: 'Gennaio 1920: De Ambris arriva a Fiume' },
    body: { zh: '从的里雅斯特开来的船上下来一个人，行李里没有军装，只有一叠手写的条文。' +
        '阿尔切斯特·德·安布里斯——革命工团主义者，一九〇七年被社会党开除的那批人之一，' +
        '帕尔马的罢工、议会里的演说、流亡与监狱，他一样都不缺。\n\n' +
        '他进省督府的时候没有敬礼，也没有喊那句口号。他把那叠纸放在你桌上，' +
        '第一页写着八个字：**劳动不是商品**。\n\n' +
        '「你在阳台上讲的那些话，」他说，「我已经替你写成法条了。' +
        '现在的问题是，你敢不敢让它生效——因为一旦生效，它就不再是你的诗，而是别人的权利。」\n\n' +
        '他要一个位置，不是要一个头衔。',
      it: 'Dal piroscafo di Trieste scende un uomo che non ha divise nel bagaglio: ha un fascio di ' +
        'articoli scritti a mano. Alceste De Ambris — sindacalista rivoluzionario, di quelli espulsi ' +
        'dal Partito socialista nel 1907; scioperi a Parma, discorsi in Parlamento, esilio e carcere, ' +
        'non gli manca nulla.\n\n' +
        'Entrando al Palazzo non fa il saluto e non grida lo slogan. Posa i fogli sulla tua scrivania: ' +
        'sulla prima pagina ci sono tre parole, **il lavoro non è merce**.\n\n' +
        '"Le cose che dici dal balcone," dice, "te le ho già scritte in articoli di legge. ' +
        'La questione adesso è se hai il coraggio di farle entrare in vigore: perché da quel momento ' +
        'non saranno più la tua poesia, ma il diritto di qualcun altro."\n\n' +
        'Vuole un posto, non un titolo.' },
    options: [
      {
        id: 'assumere', text: { zh: '给他席位，让他把那份文件写完。', it: 'Dargli un seggio e lasciargli finire il documento.' },
        subtitle: { zh: '《宪章》不是被朗诵的，是被执行的——而执行需要有人肯做那个不受欢迎的部分。', it: 'La Carta non si recita: si applica. E applicarla richiede qualcuno disposto a fare la parte impopolare.' },
        preview: [{ zh: '顾问「德·安布里斯」可任命', label: 'consigliere disponibile' }, { zh: '工团派异议 −', label: 'Falange −' }, { zh: '法西斯派异议 +', label: 'Fascio +' }],
        effect: {
          /* Stage 1: De Ambris joins and opens the advisor. The chained programme
             event starts the journal immediately; promulgation follows in September. */
          flags: { deambris_arrived: true, charter_drafted: true },
          next: 'ev_carta_programma',
          order: { fervour: 5, authority: 4 },
          support: [['operai', 'LEG', 2], ['portuali', 'LEG', 2]],
          factions: { sindacalisti: { inf: 2, dis: -14 }, fascisti: { dis: 8 }, arditi: { dis: 6 } }
        }
      }
    ]
  };
