import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../game/GameContext';
import { game } from '../game/runtime';

const { Core, Engine, World: W, Meta } = game;
const L = (zh: string, it: string): string => Core.L({ zh, it });
const name = (entry: any): string => Core.L(entry);

interface FieldSpec {
  group: string; path: string; zh: string; it: string;
  min: number; max: number; step: number; unit: string; integer: boolean;
}
const groups = [
  ['resources', '资源与危机', 'Risorse e crisi'], ['economy', '经济', 'Economia'],
  ['relations', '外交关系', 'Relazioni'], ['politics', '派系与民意', 'Correnti e consenso'],
  ['laws', '法律', 'Leggi'], ['cards', '卡牌', 'Carte'], ['story', '剧情', 'Narrazione'],
];
const read = (state: any, path: string): number => path.split('.').reduce((obj, key) => obj[key], state);

/** Keep an unfinished number local. Only a committed value enters the engine. */
function NumericField({ spec, value, edit, label }: {
  spec: FieldSpec; value: number; edit: (path: string, value: number) => void; label?: string;
}) {
  const [draft, setDraft] = useState(String(Core.round1(value)));
  useEffect(() => setDraft(String(Core.round1(value))), [value]);
  const commit = () => {
    if (draft === String(Core.round1(value))) return;
    const parsed = draft.trim() === '' ? NaN : Number(draft);
    if (!Number.isFinite(parsed)) { setDraft(String(Core.round1(value))); return; }
    const clamped = Core.clamp(parsed, spec.min, spec.max);
    const bounded = spec.integer ? Math.round(clamped) : clamped;
    edit(spec.path, bounded);
    setDraft(String(Core.round1(bounded)));
  };
  const title = label || name(spec);
  return <div className="sandbox-field" data-field={spec.path}>
    <label htmlFor={'sandbox-' + spec.path}>{title}<small>{spec.unit}</small></label>
    <div className="sandbox-stepper">
      <button type="button" disabled={value <= spec.min} aria-label={L('减少：', 'Riduci: ') + title}
        onClick={() => edit(spec.path, value - spec.step)}>−</button>
      <input id={'sandbox-' + spec.path} type="number" inputMode="decimal" min={spec.min} max={spec.max}
        step="any" value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }} />
      <button type="button" disabled={value >= spec.max} aria-label={L('增加：', 'Aumenta: ') + title}
        onClick={() => edit(spec.path, value + spec.step)}>＋</button>
    </div>
  </div>;
}

export function SandboxMenu() {
  const { state, actions } = useGame();
  const [group, setGroup] = useState('resources');
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState(W.CLASSES[0].id);
  const [deck, setDeck] = useState('all');
  const [storyTab, setStoryTab] = useState('events');
  const [endingId, setEndingId] = useState<string | null>(null);
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      else document.querySelector<HTMLElement>('.sandbox-trigger')?.focus({ preventScroll: true });
    };
  }, []);
  if (state?.difficulty !== 'sandbox' || state.ending) return null;
  const fields: FieldSpec[] = Engine.sandboxFields(state);
  const matches = (entry: any, id = '') => (name(entry) + ' ' + id).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const field = (spec: FieldSpec, label?: string) => <NumericField key={spec.path} spec={spec}
    value={read(state, spec.path)} edit={actions.sandboxEdit} label={label} />;
  const note = (zh: string, it: string) => <p className="sandbox-note">{L(zh, it)}</p>;
  const heading = groups.find(entry => entry[0] === group)!;
  let content: ReactNode;

  if (['resources', 'economy', 'relations'].includes(group)) {
    const list = fields.filter(spec => spec.group === group && matches(spec, spec.path));
    content = <>
      {group === 'resources' && <>
        <div className="sandbox-quick">
          <button className="btn btn--sm" onClick={() => actions.sandboxEdit('funds', state.funds + 1000)}>{L('金库 +1 000 K£', 'Cassa +1.000 K£')}</button>
          <button className="btn btn--sm" onClick={() => actions.sandboxEdit('ap', state.ap + 10)}>{L('行动点 +10', 'PA +10')}</button>
          <button className="btn btn--sm" onClick={actions.sandboxClearCooldowns}>{L('清除卡牌与顾问冷却', 'Azzera ricariche di carte e consiglieri')}</button>
        </div>
        {note('修改即时生效，不消耗行动点、不推进时间。行动点在下个半月恢复为模式默认值；缩减手牌槽位时保留已有手牌。',
          'Le modifiche sono immediate: nessun costo in PA e nessun avanzamento del tempo. I PA tornano al valore normale al mezzo mese seguente; ridurre gli spazi non elimina carte già in mano.')}
      </>}
      {group === 'economy' && note('这里只修改实际经济数据。收支预测、港口吞吐目标与军团民意会按现行规则重新计算。',
        'Si modificano i dati economici effettivi. Le previsioni di bilancio, l’obiettivo del traffico e il consenso della Legione seguono le regole in vigore.')}
      {group === 'relations' && note('国家关系范围 0—100；意大利政治力量范围 −40—100。意共成立后才会出现在列表中。',
        'Rapporti fra Stati: 0–100; forze italiane: −40–100. Il partito comunista compare solo dopo la fondazione.')}
      <div className="sandbox-fields">{list.map(spec => field(spec))}</div>
      {!list.length && <p className="sandbox-empty">{L('没有匹配的数据。', 'Nessun dato corrispondente.')}</p>}
    </>;
  } else if (group === 'politics') {
    const support = fields.filter(spec => spec.path.startsWith('classes.' + classId + '.') && matches(spec, spec.path));
    content = <>
      <div className="sandbox-derived"><span>{L('军团民意', 'Consenso della Legione')}</span><strong>{state.legitimacy.toFixed(1)}</strong></div>
      {note('军团民意由阶层支持派生。修改某党的阶层支持或某派系的影响力时，其余份额按比例配平，总和保持 100；从独占状态调低时，释放份额平均分配。',
        'Il consenso deriva dal sostegno sociale. Modificando una quota, le altre vengono bilanciate proporzionalmente per mantenere il totale a 100; uscendo dal monopolio, la quota liberata viene ripartita in parti uguali.')}
      <h3 className="sandbox-subtitle">{L('运动内部派系', 'Correnti del movimento')}</h3>
      <div className="sandbox-factions">{W.FACTIONS.filter((f: any) => matches(f, f.id)).map((f: any) => <section key={f.id} className="sandbox-faction">
        <h4>{name(f)}</h4>
        {fields.filter(spec => spec.path.startsWith('factions.' + f.id + '.')).map(spec => field(spec,
          spec.path.endsWith('.inf') ? L('影响力', 'Influenza') : L('异议', 'Dissenso')))}
      </section>)}</div>
      <div className="sandbox-class-heading"><h3 className="sandbox-subtitle">{L('阶层支持', 'Sostegno sociale')}</h3>
        <select aria-label={L('选择阶层', 'Scegli una classe')} value={classId} onChange={event => setClassId(event.target.value)}>
          {W.CLASSES.map((c: any) => <option key={c.id} value={c.id}>{name(c)}</option>)}
        </select>
      </div>
      <div className="sandbox-fields">{support.map(spec => field(spec, spec.path.endsWith('.turnout') ? L('投票率', 'Affluenza') :
        name(W.PARTY_BY_ID[spec.path.split('.').at(-1)!])))}</div>
    </>;
  } else if (group === 'laws') {
    content = <>
      {note('直接设定法律等级；各级名称与正式法律目录一致。宪章仍由事件链和日志推进，不作为单项法律。',
        'Imposta direttamente il livello delle leggi. La Carta resta affidata alla catena narrativa e al diario: non è una singola legge.')}
      <div className="sandbox-laws">{W.LAWS.filter((law: any) => matches(law, law.id)).map((law: any) => <label key={law.id}>
        <span>{name(law)}<small>{state.laws[law.id]} / {law.max}</small></span>
        <select aria-label={name(law)} value={state.laws[law.id]} data-law={law.id}
          onChange={event => actions.sandboxEdit('laws.' + law.id, Number(event.target.value))}>
          {law.levels.map((zh: string, level: number) => <option key={level} value={level}>
            {level} · {L(zh, law.levelsIt?.[level] || zh)}
          </option>)}
        </select>
      </label>)}</div>
    </>;
  } else if (group === 'cards') {
    const cards = Engine.ALL_CARDS.filter((card: any) => (deck === 'all' || card.deck === deck) && matches(card.name, card.id));
    content = <>
      {note('可无视抽牌条件加入手牌。出牌费用、选项条件与部委权限仍按正式规则计算；需要时可清除冷却并补充资源。',
        'Aggiunge carte ignorando i requisiti di pesca. Costi, condizioni delle opzioni e controllo dei ministeri restano quelli normali; puoi azzerare le ricariche e aggiungere risorse.')}
      <div className="sandbox-list-head"><span>{L('手牌', 'Mano')} {state.hand.length} / {state.handLimit}</span>
        <select value={deck} aria-label={L('筛选牌库', 'Filtra mazzo')} onChange={event => setDeck(event.target.value)}>
          {[['all', '全部牌库', 'Tutti i mazzi'], ['azione', '行动', 'Azione'], ['governo', '政府', 'Governo'], ['partito', '党派', 'Partito']].map(x =>
            <option key={x[0]} value={x[0]}>{L(x[1], x[2])}</option>)}
        </select>
      </div>
      <div className="sandbox-catalog">{cards.map((card: any) => <div className="sandbox-catalog__row" key={card.id}>
        <div><strong>{name(card.name)}</strong><small>{card.id}</small></div>
        <button className="btn btn--sm" disabled={state.hand.includes(card.id) || state.hand.length >= state.handLimit}
          onClick={() => actions.sandboxAddCard(card.id)}>{state.hand.includes(card.id) ? L('已在手中', 'Già in mano') : L('加入手牌', 'Aggiungi')}</button>
      </div>)}</div>
    </>;
  } else {
    const ending = Meta.ENDINGS.find((entry: any) => entry.id === endingId);
    content = <>
      <div className="sandbox-story-tabs">
        {[['events', '手动触发事件', 'Avvia eventi'], ['endings', '结局预览', 'Anteprima dei finali']].map(x =>
          <button key={x[0]} className="btn btn--sm" aria-pressed={storyTab === x[0]}
            onClick={() => { setStoryTab(x[0]); setEndingId(null); setQuery(''); }}>{L(x[1], x[2])}</button>)}
      </div>
      {storyTab === 'events' ? <>
        {note('绕过日期与触发条件，仍需正常选择事件选项。仅开放独立事件与事件链起点；有待决事件或卡牌时先加入队列。',
          'Ignora date e condizioni d’avvio; le scelte si risolvono normalmente. Sono disponibili solo eventi autonomi e inizi di catena. Se c’è una decisione pendente, l’evento viene accodato.')}
        {!!state.eventQueue.length && <p className="sandbox-queue">{L('待处理队列：', 'In coda: ')}
          {state.eventQueue.map((id: string) => name(Engine.EVENT_BY_ID[id]?.title || id)).join(' · ')}</p>}
        <div className="sandbox-catalog">{Engine.sandboxEvents().filter((event: any) => matches(event.title, event.id)).map((event: any) => {
          const active = state.currentEvent === event.id, queued = state.eventQueue.includes(event.id);
          return <div className="sandbox-catalog__row" key={event.id}>
            <div><strong>{name(event.title)}</strong><small>{event.id}</small></div>
            <button className="btn btn--sm" disabled={active || queued} onClick={() => actions.sandboxEvent(event.id)}>
              {active ? L('当前事件', 'In corso') : queued ? L('已排队', 'In coda') : state.currentEvent || state.pendingCard ? L('加入队列', 'Accoda') : L('触发', 'Avvia')}
            </button>
          </div>;
        })}</div>
      </> : <>
        {note('只预览结局文本，不改变游戏状态、成就或存档。关闭预览后可继续对局。',
          'Mostra soltanto il testo: non modifica partita, obiettivi o salvataggi. Chiudi l’anteprima per continuare.')}
        {ending ? <article className="sandbox-ending" data-ending={ending.id}>
          <small>{ending.tag}</small><h3>{name(ending)}</h3><div>{name(ending.body)}</div>
          <button className="btn btn--sm" onClick={() => setEndingId(null)}>{L('返回结局目录', 'Torna all’elenco')}</button>
        </article> : <div className="sandbox-catalog">{Meta.ENDINGS.filter((entry: any) => matches(entry, entry.id)).map((entry: any) =>
          <div className="sandbox-catalog__row" key={entry.id}><div><strong>{name(entry)}</strong><small>{entry.id}</small></div>
            <button className="btn btn--sm" onClick={() => setEndingId(entry.id)}>{L('预览', 'Anteprima')}</button></div>)}</div>}
      </>}
    </>;
  }
  return <div className="scrim show sandbox-scrim" onMouseDown={event => { if (event.target === event.currentTarget) actions.closeSandbox(); }}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); actions.closeSandbox(); }
      if (event.key !== 'Tab') return;
      const targets = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled])') || []);
      const first = targets[0], last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <section ref={dialog} className="modal modal--sandbox" role="dialog" aria-modal="true" aria-labelledby="sandbox-title">
      <header className="sandbox-header"><div><small>OFFICINA DEL COMANDANTE</small><h2 id="sandbox-title">{L('沙盒工具', 'Strumenti Sandbox')}</h2></div>
        <button ref={closeButton} type="button" className="btn btn--sm" aria-label={L('关闭沙盒工具', 'Chiudi gli strumenti Sandbox')}
          onClick={actions.closeSandbox}>×</button>
      </header>
      <div className="sandbox-layout"><nav aria-label={L('沙盒分类', 'Categorie Sandbox')} className="sandbox-nav">
        {groups.map((entry, index) => <button key={entry[0]} type="button" aria-current={group === entry[0] ? 'page' : undefined}
          data-sandbox-tab={entry[0]} onClick={() => { setGroup(entry[0]); setQuery(''); setEndingId(null); }}>
          <small>{Core.roman(index + 1)}</small><span>{L(entry[1], entry[2])}</span>
        </button>)}
      </nav><main className="sandbox-main">
        <div className="sandbox-toolbar"><h3>{L(heading[1], heading[2])}</h3>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            aria-label={L('搜索当前分类', 'Cerca nella categoria')} placeholder={L('搜索名称或编号…', 'Cerca nome o ID…')} />
        </div>
        <div className="sandbox-content" key={group}>{content}</div>
      </main></div>
      <footer className="sandbox-footer"><span>{L('仅沙盒可用 · 本模式不授予成就 · 修改自动保存', 'Solo Sandbox · Nessun obiettivo · Modifiche salvate automaticamente')}</span>
        <button className="btn btn--sm btn--primary" onClick={actions.closeSandbox}>{L('返回对局', 'Torna alla partita')}</button></footer>
    </section>
  </div>;
}
