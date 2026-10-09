import { useLayoutEffect, useRef } from 'react';
import { useGame } from '../game/GameContext';
import { currentSuperEvent, type SuperEvent } from '../game/superEvents';
import { game } from '../game/runtime';
import { assetUrl } from '../lib/assetUrl';

/** A single acknowledgement, above and separate from the ordinary event sheet. */
export function SuperEventLayer() {
  const { state, actions } = useGame();
  const event = currentSuperEvent(state);
  return event ? <SuperEventDialog event={event} acknowledge={actions.acknowledgeSuperEvent} /> : null;
}

export function SuperEventDialog({ event, acknowledge }: { event: SuperEvent; acknowledge: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    button.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      queueMicrotask(() => {
        if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
        else document.querySelector<HTMLElement>('.inline-event button.opt:not([disabled])')?.focus({ preventScroll: true });
      });
    };
  }, [event.id]);
  const text = (value: { zh: string; it: string }): string => game.Core.L(value);
  return <div className="super-event-overlay" onKeyDown={key => {
    // There is only one control; keep keyboard focus on it. Escape and backdrop
    // clicks do not add hidden ways to resolve this moment.
    if (key.key === 'Tab') { key.preventDefault(); button.current?.focus(); }
  }}>
    <section className={`super-event super-event--${event.tone}`} role="dialog" aria-modal="true" lang={game.I18N.lang}
      aria-labelledby="super-event-title" aria-describedby="super-event-description" data-super-event={event.id}>
      <div className="super-event__image">
        <img src={assetUrl(event.image)} alt="" />
        <span className="super-event__caption">{text(event.imageCaption)}</span>
      </div>
      <img className="super-event__frame" src={assetUrl('img/UI/super_event_frame.png')} alt="" />
      <h1 id="super-event-title" className="super-event__title">{text(event.title)}</h1>
      <button ref={button} className="super-event__button" onClick={acknowledge}>
        {text(event.option)}
      </button>
      <blockquote id="super-event-description" className="super-event__description">
        {text(event.description).split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <footer className="super-event__attribution">{text(event.attribution)}</footer>
      </blockquote>
    </section>
  </div>;
}
