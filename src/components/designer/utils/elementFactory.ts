import { EditorElement, ElementType, ResponsiveStyles } from '../types';
import { COMPONENT_REGISTRY } from '../constants/componentRegistry';

export function createElement(type: ElementType, overrides?: Partial<EditorElement>): EditorElement {
  const def = COMPONENT_REGISTRY.find(c => c.type === type);
  const defaultStyles: ResponsiveStyles = def?.defaultStyles ?? {
    desktop: {},
  };

  return {
    id: crypto.randomUUID(),
    type,
    name: def?.label ?? type,
    props: { ...(def?.defaultProps ?? {}) },
    styles: JSON.parse(JSON.stringify(defaultStyles)),
    children: def?.defaultChildren ? def.defaultChildren.map(c => ({
      ...c,
      id: crypto.randomUUID(),
      children: c.children?.map(gc => ({ ...gc, id: crypto.randomUUID(), children: [] })) ?? [],
    })) : [],
    ...overrides,
  };
}
