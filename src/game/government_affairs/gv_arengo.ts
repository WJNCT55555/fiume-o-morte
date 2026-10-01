import type { Card } from '../content/types';

/* The Arengo was the Charter's emergency assembly of both councils — the
   Consiglio degli Ottimi and the Consiglio dei Provvisori sitting together.
   Calling it turned the Charter from a text into a procedure. */
export const gvArengo: Card = {
    id: 'gv_arengo', deck: 'governo', ministry: 'istruzione',
    name: { zh: '召开阿伦戈', it: 'Convocare l\'Arengo' },
    text: { zh: '宪章写着：必要时，两个议会合并为市民大会。' +
        '「必要时」是德·安布里斯留下的一个美丽而危险的词——' +
        '它没有说由谁判定必要，也没有说合并之后谁主持。\n\n' +
        '召开它，这份文件就从阳台上的一篇朗诵变成一套可以运行的程序：' +
        '最优者议会与临时者议会坐到同一间屋子里，而你的权威要在那间屋子里' +
        '重新被确认一次。给它咨询权则是另一种选择：所有程序照走，' +
        '结论仍在你的桌上。什么都不做，宪章就继续待在档案馆里，' +
        '干净、完整、从未被任何人使用过。',
        it: 'La Carta dice: in caso di necessità i due consigli si riuniscono in Arengo. ' +
        '«In caso di necessità» è la parola bella e pericolosa che De Ambris vi ha lasciato — ' +
        'non dice chi stabilisca la necessità, né chi presieda una volta riuniti.\n\n' +
        'Convocarlo trasforma il documento da declamazione da balcone in procedura eseguibile: ' +
        'il Consiglio degli Ottimi e quello dei Provvisori siedono nella stessa sala, ' +
        'e la tua autorità dovrà farsi riconfermare là dentro. Concedergli solo voto consultivo ' +
        'è l\'altra strada: tutta la procedura si svolge, la conclusione resta sulla tua scrivania. ' +
        'Non fare nulla, e la Carta resta in archivio: pulita, integra, ' +
        'e mai usata da nessuno.' },
    cost: { ap: 1 },
    cooldown: 6,
    require: function (s) { return s.cabinet.istruzione === s.playerForce && !!s.flags.charter_program &&
      (s.date.y > 1920 || (s.date.y === 1920 && s.date.m >= 9)); },
    requireText: { zh: '需要德·安布里斯的草案、1920 年 9 月及教育执政官席位', it: 'Servono il progetto di De Ambris, settembre 1920 e il ministero dell\'Istruzione' },
    options: [
      { id: 'convocare',
        text: { zh: '按宪章原文召开。', it: 'Convocarlo secondo il testo della Carta.' },
        subtitle: { zh: '把一部宪法从纸上搬到一间屋子里——这是它唯一能被证明存在的方式。', it: 'Portare una costituzione dalla carta a una sala: è l\'unico modo in cui si possa dimostrare che esiste.' },
        preview: ['颁布宪章并召开阿伦戈', '选举法 +1', '军团民意 ++', '事态累积 −−'],
        effect: { laws: { elettorale: 1 }, flags: { charter_promulgated: true, charter_debate_resolved: true },
                  support: [['artigiani', 'LEG', 3], ['contadini', 'LEG', 3], ['portuali', 'LEG', 3], ['operai', 'LEG', 2]],
                  order: { authority: 5, coup: -8, fervour: 4 } } },
      { id: 'consultiva',
        text: { zh: '只给它咨询权，决策留给执政官。', it: 'Solo consultiva: la decisione resta ai Rettori.' },
        subtitle: { zh: '听所有人的意见，然后由一个人签字——效率与合法性在这里第一次分家。', it: 'Ascoltare tutti e firmare da soli: qui efficienza e legittimità si separano per la prima volta.' },
        preview: ['摄政领袖权威 +', '军团民意 +', '工团派异议 +'],
        effect: { order: { authority: 8, coup: -5 },
                  support: [['impiegati', 'LEG', 3], ['borghesia', 'LEG', 3]],
                  factions: { sindacalisti: { dis: 14 } } } },
      { id: 'rinviare',
        text: { zh: '暂不召开。宪章可以等。', it: 'Rinviare. La Carta può attendere.' },
        subtitle: { zh: '一份从未被使用过的宪法不会出错，也不会救任何人。', it: 'Una costituzione mai applicata non sbaglia mai, e non salva nessuno.' },
        preview: ['民众热忱 −', '阿迪蒂异议 +', '工团派异议 ++'],
        effect: { order: { fervour: -6 },
                  factions: { sindacalisti: { dis: 18 }, arditi: { dis: 6 } } } }
    ]
};
