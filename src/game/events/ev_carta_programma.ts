import type { GameEvent } from '../content/types';

/* Opens immediately after De Ambris joins. The journal tracks implementation
   of ordinary laws; no separate Carta law level exists. */
export const evCartaProgramma: GameEvent = {
  id: 'ev_carta_programma', chain: true,
  title: { zh: '德·安布里斯的立法纲领', it: 'Il programma legislativo di De Ambris' },
  body: {
    zh: '德·安布里斯把草案摊成七页。选举、公民身份、语言、市政警察、新闻、学校与劳动保障，各自都需要可执行的法律。\n\n' +
      '实施目标：选举法 3 级，官方语言 1 级，公民身份 2 级，公共秩序 2 级，新闻 2 级，教育语言 1 级，劳动保障 3 级。八小时制另由劳动时间法推进。\n\n' +
      '他没有给《卡尔纳罗宪章》写一个可以反复升级的数字。宪章是一份承诺；只有这些条款落实，并让阿伦戈真正开会，承诺才算兑现。港口、关税和财政还有自己的立法道路，不必假装全是宪章的一部分。',
    it: 'De Ambris apre il progetto su sette pagine: voto, cittadinanza, lingua, polizia municipale, stampa, scuola e tutele del lavoro. Ognuna richiede una legge applicabile.\n\n' +
      'Obiettivi: legge elettorale al livello 3; lingua 1; cittadinanza 2; ordine pubblico 2; stampa 2; scuola 1; tutele del lavoro 3. La giornata di otto ore segue la legge sull’orario.\n\n' +
      'La Carta non è un numero da aumentare. È una promessa, mantenuta solo quando queste norme sono in vigore e l\'Arengo si riunisce. Porto, dogane e fisco seguono la propria via legislativa.'
  },
  options: [{
    id: 'programma',
    text: { zh: '把七项条款列入立法日程。', it: 'Mettere i sette articoli all\'ordine del giorno.' },
    subtitle: { zh: '目标等级将显示在宪章日志与法律页面，颁布之后仍需逐条落实。', it: 'I livelli richiesti appaiono nel diario e nella pagina delle leggi; dopo la promulgazione bisognerà attuarli.' },
    preview: [{ zh: '开启《卡尔纳罗宪章》日志', label: 'diario della Carta' }, { zh: '七项法律列入实施目标', label: 'sette leggi da attuare' }],
    effect: { flags: { charter_program: true }, journals: ['carta'] }
  }]
};
