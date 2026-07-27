import { EditorElement } from '../types';

/** Deep clone an element tree, generating new IDs */
export function cloneElement(el: EditorElement, newId?: string): EditorElement {
  return {
    ...el,
    id: newId ?? crypto.randomUUID(),
    children: el.children.map(c => cloneElement(c)),
  };
}

/** Find an element by ID in a nested tree */
export function findElement(elements: EditorElement[], id: string): EditorElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    const found = findElement(el.children, id);
    if (found) return found;
  }
  return null;
}

/** Find parent of an element */
export function findParent(elements: EditorElement[], id: string): EditorElement | null {
  for (const el of elements) {
    if (el.children.some(c => c.id === id)) return el;
    const found = findParent(el.children, id);
    if (found) return found;
  }
  return null;
}

/** Remove element by ID, returns new tree */
export function removeElement(elements: EditorElement[], id: string): EditorElement[] {
  return elements
    .filter(el => el.id !== id)
    .map(el => ({ ...el, children: removeElement(el.children, id) }));
}

/** Update an element in the tree immutably */
export function updateElement(
  elements: EditorElement[],
  id: string,
  updates: Partial<EditorElement>
): EditorElement[] {
  return elements.map(el => {
    if (el.id === id) return { ...el, ...updates };
    return { ...el, children: updateElement(el.children, id, updates) };
  });
}

/** Insert element at a specific position */
export function insertElement(
  elements: EditorElement[],
  element: EditorElement,
  parentId?: string,
  index?: number
): EditorElement[] {
  if (!parentId) {
    const i = index ?? elements.length;
    return [...elements.slice(0, i), element, ...elements.slice(i)];
  }
  return elements.map(el => {
    if (el.id === parentId) {
      const i = index ?? el.children.length;
      return {
        ...el,
        children: [...el.children.slice(0, i), element, ...el.children.slice(i)],
      };
    }
    return { ...el, children: insertElement(el.children, element, parentId, index) };
  });
}

/** Move element to a new position */
export function moveElement(
  elements: EditorElement[],
  elementId: string,
  newParentId?: string,
  newIndex?: number
): EditorElement[] {
  const el = findElement(elements, elementId);
  if (!el) return elements;
  const withoutEl = removeElement(elements, elementId);
  return insertElement(withoutEl, el, newParentId, newIndex);
}

/** Get flat list of all element IDs */
export function flattenIds(elements: EditorElement[]): string[] {
  const ids: string[] = [];
  for (const el of elements) {
    ids.push(el.id);
    ids.push(...flattenIds(el.children));
  }
  return ids;
}

/** Get element path (breadcrumb) */
export function getElementPath(elements: EditorElement[], id: string): EditorElement[] {
  for (const el of elements) {
    if (el.id === id) return [el];
    const childPath = getElementPath(el.children, id);
    if (childPath.length > 0) return [el, ...childPath];
  }
  return [];
}
