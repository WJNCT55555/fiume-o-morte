import { createElement, type ReactNode } from 'react';

type LegacyElement = Element & { __fiumeListeners?: Record<string, (event: any) => void> };

const eventNames: Record<string, string> = {
  click: 'onClick', keydown: 'onKeyDown', keyup: 'onKeyUp', input: 'onInput',
  change: 'onChange', focus: 'onFocus', blur: 'onBlur',
  // mouseover/mouseout bubble, so React handles them directly; mouseenter and
  // mouseleave are synthesised from them and kept for simpler callers.
  mouseenter: 'onMouseEnter', mouseleave: 'onMouseLeave',
  mouseover: 'onMouseOver', mouseout: 'onMouseOut',
};

function reactStyle(element: HTMLElement | SVGElement): Record<string, string> | undefined {
  if (!element.hasAttribute('style')) return undefined;
  const style: Record<string, string> = {};
  for (const name of Array.from(element.style)) {
    const key = name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    style[key] = element.style.getPropertyValue(name);
  }
  return style;
}

/** Convert a detached legacy view description to elements owned by React. */
export function legacyToReact(node: Node | null, refresh: () => void, key = '0'): ReactNode {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return Array.from(node.childNodes).map((child, index) => legacyToReact(child, refresh, `${key}.${index}`));
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const element = node as LegacyElement;
  const tag = element.localName;
  const props: Record<string, any> = { key };
  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name;
    if (name === 'class') props.className = attribute.value;
    else if (name === 'for') props.htmlFor = attribute.value;
    else if (name === 'tabindex') props.tabIndex = Number(attribute.value);
    else if (name === 'style' || name.startsWith('on')) continue;
    else if (name === 'value' && (tag === 'input' || tag === 'textarea')) props.defaultValue = attribute.value;
    else if (name === 'disabled' || name === 'checked' || name === 'readonly') {
      props[name === 'readonly' ? 'readOnly' : name] = true;
    } else props[name] = attribute.value;
  }
  const style = reactStyle(element as HTMLElement | SVGElement);
  if (style) props.style = style;
  for (const [name, listener] of Object.entries(element.__fiumeListeners || {})) {
    const reactName = eventNames[name];
    if (reactName) props[reactName] = (event: any) => { listener(event); refresh(); };
  }
  if (tag === 'img' && !props.onError) props.onError = (event: any) => { event.currentTarget.style.display = 'none'; };
  if (tag === 'input' || tag === 'img' || tag === 'br' || tag === 'hr') return createElement(tag, props);
  const children = Array.from(element.childNodes).map((child, index) => legacyToReact(child, refresh, `${key}.${index}`));
  return createElement(tag, props, ...children);
}
