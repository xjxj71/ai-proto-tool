export interface ElementLink {
  elementId: string;
  targetPageId: string;
  label: string;
}

export function addElementLink(
  links: ElementLink[],
  elementId: string,
  targetPageId: string,
  label: string,
): ElementLink[] {
  const filtered = links.filter((l) => l.elementId !== elementId);
  return [...filtered, { elementId, targetPageId, label }];
}

export function removeElementLink(links: ElementLink[], elementId: string): ElementLink[] {
  return links.filter((l) => l.elementId !== elementId);
}

export function updateElementLink(
  links: ElementLink[],
  elementId: string,
  targetPageId: string,
  label: string,
): ElementLink[] {
  return links.map((l) => (l.elementId === elementId ? { ...l, targetPageId, label } : l));
}

export function getLinksForPage(links: ElementLink[]): ElementLink[] {
  return links;
}

export function getLinksForElement(
  links: ElementLink[],
  elementId: string,
): ElementLink | undefined {
  return links.find((l) => l.elementId === elementId);
}
