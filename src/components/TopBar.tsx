import { type ReactNode } from 'react';
import { legacyToReact } from '../lib/legacyReact';

export function TopBar({ nodes, refresh }: { nodes: Element[]; refresh: () => void }): ReactNode {
  return nodes.map((node, index) => legacyToReact(node, refresh, `top-${index}`));
}
