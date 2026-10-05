import type { GameEvent } from '../content/types';

/* The Regency outlasted the ultimatum. The squads came up the streets and did not
   take the Palazzo; the treaty was signed in Rome but never executed in Fiume.
   This is the arm that has to survive all the way to December 1924 for the
   Regency's own victory (`ending_fiume_o_morte`) to land. */
export const ev1924Win: GameEvent = {
  id: 'ev_1924_win', chain: true,
  title: { zh: '最后通牒没有生效', it: 'L\'ultimatum non ha avuto effetto' },
  body: { zh: '黑衫军在广场上站了三天，然后散了。他们等的那支部队没有来——因为条约签在罗马，' +
      '而执行条约需要在阜姆有人愿意动手，这一次没有。\n\n' +
      '3 月 16 日，维托里奥·埃马努埃莱三世没有进城。罗马把条约搁在抽屉里，换了一个说法：' +
      '"一个有待解决的遗留问题"。\n\n' +
      '你赢的不是一场战斗，是一段时间。这座城市还在你手里，而它现在需要一个能撑到最后的理由。',
    it: 'Le camicie nere restano in piazza tre giorni, poi si sciolgono. Il reparto che aspettavano non arriva: ' +
      'il trattato è firmato a Roma, ma per eseguirlo serve qualcuno a Fiume disposto a farlo — e questa volta non c\'è.\n\n' +
      'Il 16 marzo Vittorio Emanuele III non entra in città. Roma mette il trattato in un cassetto e cambia formula: ' +
      '«una questione residua da risolvere».\n\n' +
      'Non hai vinto una battaglia, hai guadagnato del tempo. La città è ancora tua, e adesso le serve una ragione per resistere fino in fondo.' },
  options: [
    {
      id: 'durare', text: { zh: '把这座城市经营成一个能撑下去的地方。', it: 'Governare questa città perché possa durare.' },
      subtitle: { zh: '港口、宪章、国际登记——通往「阜姆或死亡！」。', it: 'Porto, Carta, registrazione a Ginevra: la strada verso «Fiume o morte!».' },
      preview: [{ zh: '开启国际保证路径', label: 'diario della garanzia' }, { zh: '权威 +', label: 'autorità +' }],
      effect: function () { return { order: { authority: 6, subversion: -20 }, diplo: { uk: 6, france: 5, usa: 4, league: 8 }, journals: ['garanzia'] }; }
    },
    {
      id: 'armare', text: { zh: '趁现在把军团扩到再也没人能碰这座城市。', it: 'Approfittarne per portare la Legione a un numero che nessuno possa più toccare.' },
      subtitle: { zh: '兵力与热忱上升，代价是与罗马彻底翻脸。', it: 'Più uomini e più fervore, al prezzo di una rottura definitiva con Roma.' },
      preview: [{ zh: '军团兵力 ++', label: 'milizia ++' }, { zh: '意大利关系 −−', label: 'Italia −−' }],
      effect: function () { return { order: { milizia: 1200, fervour: 10, violence: 6 }, diplo: { italy: -16, league: -2 }, flags: { rearmed_1924: true } }; }
    }
  ]
};
