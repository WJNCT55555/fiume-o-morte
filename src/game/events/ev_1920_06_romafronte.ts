import type { GameEvent } from '../content/types';

/* The 1920 window: Giolitti's fifth cabinet, June 1920. The march that was
   proposed in 1919 and refused is proposed a second time — and this time the
   man in Rome is Giolitti, who has to be careful, and the army is one that has
   already failed to stop a column at Ronchi.

   Opening the journal is a real decision, not a formality: choosing B closes
   the line for the whole game, which is the historical outcome. */
export const ev192006Romafronte: GameEvent = {
  id: 'ev_1920_06_romafronte', date: { y: 1920, m: 6 },
  condition: function (s) {
    return s.playerForce === 'LEG' && !s.flags.marcia_1920 && !s.flags.marcia_1920_failed
      && !s.flags.carta_done && !s.flags.accept_rapallo;
  },
  title: { zh: '1920 年 6 月：第二次提议', it: 'Giugno 1920: la seconda proposta' },
  body: { zh: '焦利蒂第五次组阁。他在议会里说，阜姆是一个「需要解决的问题」，不是一场战争。\n\n' +
      '同一个月，有两个人分别来找你。一个是阿迪蒂的老兵，带着一份路线图：从阜姆沿铁路南下，' +
      '经蒙法尔科内、帕多瓦、博洛尼亚，六天到罗马。另一个是米兰来的记者，' +
      '他说这个计划三年前就该执行，现在再不动，就没有下一次了。\n\n' +
      '你手里有一支不被任何国家承认的军队、一座快要断粮的城，和一个全国都在看着的名字。\n\n' +
      '问题是，一支纵队要走到罗马，光有军团兵不够。你得在出发之前，把那些彼此仇恨的人拉到一起。',
    it: 'Giolitti forma il suo quinto governo. In Parlamento dice che Fiume è "un problema da risolvere", ' +
      'non una guerra.\n\n' +
      'Nello stesso mese vengono da te due uomini. Uno è un vecchio ardito con una carta ferroviaria: ' +
      'da Fiume giù lungo la linea, per Monfalcone, Padova, Bologna, sei giorni fino a Roma. ' +
      'L\'altro è un giornalista milanese, e dice che quel piano andava eseguito tre anni fa, ' +
      'e che se non si muove qualcosa adesso non ci sarà una prossima volta.\n\n' +
      'Hai un esercito che nessuno Stato riconosce, una città che sta per restare senza pane, ' +
      'e un nome che tutto il Paese guarda.\n\n' +
      'Il punto è che per arrivare a Roma con una colonna non bastano i legionari. ' +
      'Bisogna mettere insieme, prima di partire, gente che si odia.' },
  options: [
    /* Refusal is listed first on purpose. The opening option is not the neutral
       one: it switches on a journal that runs for the rest of the game, so the
       historical answer has to be what a player who is not choosing gets. The
       default line (always take the first option) must still reproduce 1920-12
       and 1921-04 — see tools/smoke.js items 4 and 5. */
    {
      id: 'restare', text: { zh: '不。留在阜姆，把这座城变成一个国家。', it: 'No. Restare a Fiume e fare di questa città uno Stato.' },
      subtitle: { zh: '史实上的选择。日志不会开启，这条线关闭。', it: 'La scelta storica. Il diario non si apre: questa via è chiusa.' },
      preview: [{ zh: '放弃 1920 进军线', label: 'via chiusa' }, { zh: '领袖权威 +／民众热忱 +', label: 'autorità + / fervore +' }],
      effect: function () {
        return {
          flags: { marcia_1920_refused: true },
          order: { authority: 6, fervour: 6, squadre: -4 },
          laws: { elettorale: 1 },
          factions: { arditi: { dis: 14 }, fascisti: { dis: 8 }, sindacalisti: { dis: -6 } }
        };
      }
    },
    {
      id: 'tessere', text: { zh: '开始串联。与意大利的政治力量逐一接触。', it: 'Tessere. Trattare con le forze politiche italiane, una per una.' },
      subtitle: { zh: '六派中至少争取三派；共产党成立前尚不能计入。', it: 'Conquistarne almeno tre su sei; il PCdI non conta prima della sua fondazione.' },
      preview: [{ zh: '开启日志「向罗马进军」', label: 'diario: La marcia su Roma' }, { zh: '六派中至少三派关系需达到 80', label: 'almeno tre forze a 80' }],
      effect: function () {
        /* The four approaches are NOT queued. A queued event resolves on the
           very next turn with no chance to advance the month in between, so
           queueing them would force all four conversations through in a single
           turn with no player pacing — and it would front-load the antagonism
           before any of it could be paid for. Each line is instead a
           conditional event with its own window (W.FORZA_WINDOW), so the player
           sets the order and the pace. */
        return {
          journals: ['marcia_1920'],
          order: { fervour: 8, authority: 4 }
        };
      }
    },
    {
      id: 'ufficiali', text: { zh: '串联之前，先去找那些穿军装的人。', it: 'Prima di tessere, andare da quelli in divisa.' },
      subtitle: { zh: '1919 年 9 月，掷弹兵请你去阜姆，正规军没能拦住你。可以再试一次。', it: 'Nel settembre 1919 i granatieri ti chiesero di guidarli, e l\'esercito non riuscì a fermarti. Si può riprovare.' },
      preview: [{ zh: '军官团 ++', label: 'corpo ufficiale ++' }, { zh: '金库 −／意大利 +', label: 'cassa − / Italia +' }, { zh: '工团派／阿蒂蒂异议 +', label: 'Falange/Arditi +' }, { zh: '若失败，整条线崩塌', label: 'se fallisce, tutto crolla' }],
      effect: function () {
        /* The only thing in the journal that raises the officer corps directly.
           The corps needs 60 from a standing start of 22, and the militia band
           in W.FORZA_MILIZIA_BANDS supplies the rest — but only once the Legion
           is genuinely large. Approaching the army first is what makes the gate
           reachable at all, and it is the option that costs the front. */
        return {
          journals: ['marcia_1920'],
          forze: { forzearmate: 22 },
          funds: -600,
          order: { fervour: 4, squadre: -6 },
          diplo: { italy: 8 },
          factions: { sindacalisti: { dis: 12 }, arditi: { dis: 8 }, fascisti: { dis: -6 } },
          support: [['artigiani', 'LEG', -2]],
          flags: { officer_contact: true }
        };
      }
    }
  ]
};
