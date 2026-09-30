import type { Card } from '../content/types';

/* Disarming the fascists was the single most consequential decision the
     Regency could take, and the one it never took. */
export const gvDisarco: Card = {
    id: 'gv_disarco', deck: 'governo', ministry: 'difesa',
    name: { zh: '解除法西斯小队武装', it: 'Disarmo delle squadre fasciste' },
    subtitle: { zh: '城里的枪不止你一把。', it: 'I fucili in citta non sono soltanto i tuoi.' },
    cooldown: 6,
        text: { zh: '霍斯特-文图里是你的国防执政官。他的人正在街上设卡。',
            it: 'Host-Venturi è il tuo Rettore alla Difesa. I suoi uomini stanno mettendo posti di blocco.' },
    cost: { ap: 1 },
    require: function (s) { return s.cabinet.difesa === s.playerForce; },
    requireText: { zh: '未掌握国防执政官席位', it: 'Ministero della Difesa non controllato' },
    options: [
      { id: 'disarmo', text: { zh: '全城搜缴，不留例外', it: 'Perquisizioni in tutta la città, senza eccezioni' },
        preview: ['法西斯暴力 −−−', '事态 −−', '法西斯异议 +++'],
        effect: { flags: { fascio_disarmed: true },
                  order: { squadre: -18, violence: -6, coup: -12, authority: 4 },
                  support: [['operai', 'LEG', 3], ['portuali', 'LEG', 3], ['borghesia', 'LEG', 2]],
                  factions: { fascisti: { inf: -5, dis: 22 }, sindacalisti: { dis: -10 }, arditi: { dis: -8 } } } },
      { id: 'registro', text: { zh: '只登记枪支，不搜缴', it: 'Solo un registro delle armi, nessuna confisca' },
        preview: ['公共秩序 +1', '合法性 +', '法西斯暴力 −', '意大利 +'],
        effect: { laws: { ordine: 1 },
                  order: { squadre: -6, violence: -3, authority: 2 },
                  diplo: { italy: 4, league: 3 },
                  factions: { fascisti: { dis: 8 }, sindacalisti: { dis: -6 } } } },
      { id: 'accordi', text: { zh: '做个交易：交出小队，换内阁席位', it: 'Un patto: consegnano le squadre, entrano in gabinetto' },
        preview: ['法西斯暴力 −−', '法西斯派 +', '内政席位易手'],
        effect: { cabinet: { interno: 'ANI' }, laws: { ordine: 1 },
                  order: { squadre: -12, coup: -8, violence: -4 },
                  factions: { fascisti: { inf: 4, dis: -16 }, sindacalisti: { dis: 16 }, arditi: { dis: 10 } } } }
    ]
  };
