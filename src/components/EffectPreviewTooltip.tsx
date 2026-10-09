import { useEffect } from 'react';
import { legacyUI } from '../legacy/ui/runtime';

/** One pointer-led preview for both inline events and card decisions. The
 * source .opt__p remains in each option for touch layouts and live effect text. */
export function EffectPreviewTooltip() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const float = document.createElement('div');
    float.className = 'effect-float';
    float.setAttribute('role', 'tooltip');
    float.style.display = 'none';
    document.body.appendChild(float);

    let active: HTMLElement | null = null;

    function hide() {
      active = null;
      float.style.display = 'none';
    }

    function fill(option: HTMLElement) {
      const source = option.querySelector<HTMLElement>('.opt__p');
      if (!source) return false;
      float.replaceChildren();
      const heading = document.createElement('div');
      heading.className = 'effect-float__heading';
      heading.textContent = legacyUI.UI.T('ui.preview') + ' · EFFETTI';
      float.appendChild(heading);
      source.querySelectorAll<HTMLElement>('.opt__pv').forEach(item => {
        const line = document.createElement('div');
        line.className = 'effect-float__line' +
          (item.classList.contains('up') ? ' up' : item.classList.contains('dn') ? ' dn' : '');
        line.textContent = item.textContent;
        float.appendChild(line);
      });
      return float.children.length > 1;
    }

    function move(event: PointerEvent) {
      if (!finePointer.matches) { hide(); return; }
      const underPointer = document.elementFromPoint(event.clientX, event.clientY);
      const option = underPointer?.closest<HTMLElement>('button.opt');
      if (!option || !option.querySelector('.opt__p')) { hide(); return; }
      if (option !== active) {
        if (!fill(option)) { hide(); return; }
        active = option;
      }

      const rect = option.getBoundingClientRect();
      const width = Math.min(330, rect.width, window.innerWidth - 16);
      const minLeft = Math.max(8, rect.left);
      const maxLeft = Math.max(minLeft, Math.min(window.innerWidth - width - 8, rect.right - width));
      const left = Math.min(maxLeft, Math.max(minLeft, event.clientX - 24));
      float.style.width = width + 'px';
      float.style.left = left + 'px';
      float.style.maxHeight = '';
      float.style.display = 'flex';

      let top = rect.bottom + 4;
      const fullHeight = float.scrollHeight;
      if (top + fullHeight > window.innerHeight - 8 && window.innerHeight - top < 80) {
        top = Math.max(8, rect.top - fullHeight - 4);
      }
      float.style.top = top + 'px';
      float.style.maxHeight = Math.max(64, window.innerHeight - top - 8) + 'px';
    }

    document.addEventListener('pointermove', move, true);
    document.addEventListener('scroll', hide, true);
    document.addEventListener('pointerdown', hide, true);
    window.addEventListener('blur', hide);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('scroll', hide, true);
      document.removeEventListener('pointerdown', hide, true);
      window.removeEventListener('blur', hide);
      window.removeEventListener('resize', hide);
      float.remove();
    };
  }, []);
  return null;
}
