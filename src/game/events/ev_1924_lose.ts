import type { GameEvent } from '../content/types';

/* The 1924 coup succeeded. The parent option already set `coup_done` and cleared
   `exile`/`stay` is not set, so `ending_fascio` (`coup_done && !exile && !stay`) is
   live from the moment this node is entered — and `checkEnd` settles on it. This
   node exists so the player sees it happen rather than being cut off mid-turn. */
export const ev1924Lose: GameEvent = {
  id: 'ev_1924_lose', chain: true,
  title: { zh: '黑衫军进了省督府', it: 'Le camicie nere entrano al Palazzo' },
  body: { zh: '他们从码头一侧进来，没有走正门——正门对着广场，广场上有记者。\n\n' +
      '军团兵在楼梯上打完了子弹，然后被解除了武装。你从阳台上看见黑衫军的旗帜升起来，' +
      '下面站着的人里有一些是 1919 年跟你一起从 Ronchi 走过来的。\n\n' +
      '三个月后，罗马通知你：条约照旧执行，只是执行的人换了一批。',
    it: 'Entrano dal lato del porto, non dal portone principale — il portone dà sulla piazza, e sulla piazza ci sono i giornalisti.\n\n' +
      'I legionari finiscono le munizioni sulle scale, poi vengono disarmati. Dal balcone vedi salire il gagliardetto, ' +
      'e tra quelli che stanno sotto ce ne sono alcuni che nel 1919 erano partiti da Ronchi con te.\n\n' +
      'Tre mesi dopo Roma ti comunica che il trattato sarà eseguito lo stesso: cambia solo chi lo esegue.' },
  options: [
    {
      id: 'constatare', text: { zh: '承认：城市已经是他们的了。', it: 'Prendere atto: la città è loro.' },
      subtitle: { zh: '结算为「法西斯城邦」。', it: 'Chiude con «La città fascista».' },
      preview: [{ zh: '结局：法西斯城邦', label: 'finale: la città fascista' }],
      effect: function () { return { flags: { coup_done: true, fascist_takeover: true }, forceEnding: 'ending_fascio' }; }
    }
  ]
};
