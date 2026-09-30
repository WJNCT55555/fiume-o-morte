import { legacyToReact } from '../lib/legacyReact';

export function EventBoard({ node, refresh }: { node: Element; refresh: () => void }) {
  return <>{legacyToReact(node, refresh, 'agenda')}</>;
}
