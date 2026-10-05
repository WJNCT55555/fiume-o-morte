import type { GameEvent } from '../content/types';

/* Neither side could finish it in 1924 either — the same drawn-out state as the
   1920 siege stalemate, reached from the other crisis. `ending_civil_strife` reads
   `bloody_stalemate`, which the parent option sets, so this node only has to
   narrate it. */
export const ev1924Stalemate: GameEvent = {
  id: 'ev_1924_stalemate', chain: true,
  title: { zh: '一九二四年的那条线', it: 'La linea del 1924' },
  body: { zh: '条约签了，但没有执行。黑衫军占了广场和火车站；军团守住了老城、省督府和港口入口。' +
      '两边都没有能力把对方清掉。\n\n' +
      '罗马不承认这座城市属于意大利，也不承认它属于自己。贝尔格莱德什么也没说。' +
      '日内瓦把它登记成"一个未决问题"。\n\n' +
      '这条线从 1922 年就在那里了。现在它穿过整座城市，而两边都还没有走完。',
    it: 'Il trattato è firmato, ma non eseguito. Le camicie nere tengono la piazza e la stazione; ' +
      'la Legione tiene la città vecchia, il Palazzo e gli accessi al porto. Nessuno dei due è in grado di eliminare l\'altro.\n\n' +
      'Roma non riconosce la città come italiana, né come propria. Belgrado non dice nulla. ' +
      'Ginevra la registra come «questione aperta».\n\n' +
      'Questa linea esiste dal 1922. Adesso attraversa tutta la città, e nessuna delle due parti ha finito.' },
  options: [
    {
      id: 'constatare', text: { zh: '承认：这就是结局了。', it: 'Prendere atto: è qui che finisce.' },
      subtitle: { zh: '结算为「内战僵局」。', it: 'Chiude con «Lo stallo sanguinoso».' },
      preview: [{ zh: '结局：内战僵局', label: 'finale: lo stallo sanguinoso' }],
      effect: function () { return { flags: { bloody_stalemate: true }, forceEnding: 'ending_civil_strife' }; }
    }
  ]
};
