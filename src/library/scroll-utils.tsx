/**
 * Scroll element so its center aligns with the top of the viewport (with small border)
 */
export function scrollElementCenter(
    element: HTMLElement,
    {offsetTop = 100, behavior = 'smooth'}: {offsetTop?: number; behavior?: ScrollBehavior} = {},
): void {
    const rect = element.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;
    const targetPosition = offsetTop; // Position from top of window
    const delta = elementCenter - targetPosition;
    window.scrollBy({top: delta, behavior});
}

/**
 * Scroll element so its top aligns with the top of the viewport (with small border)
 */
export function scrollElementTop(
    element: HTMLElement,
    {offsetTop = 100, behavior = 'smooth'}: {offsetTop?: number; behavior?: ScrollBehavior} = {},
): void {
    const rect = element.getBoundingClientRect();
    const targetPosition = offsetTop; // Position from top of window
    const delta = rect.top - targetPosition;
    window.scrollBy({top: delta, behavior});
}
