const LINKED_CARD_SELECTOR = '#content .card[role="link"]';

function repairLinkedCardSemantics() {
  for (const card of document.querySelectorAll(LINKED_CARD_SELECTOR)) {
    const anchor = card.querySelector('a[href]');
    if (!anchor) {
      continue;
    }

    card.removeAttribute('role');
    card.removeAttribute('tabindex');
    card.removeAttribute('aria-labelledby');
    anchor.removeAttribute('aria-hidden');
    anchor.setAttribute('tabindex', '0');
  }
}

let accessibilityUpdateScheduled = false;

function scheduleAccessibilityUpdate() {
  if (accessibilityUpdateScheduled) {
    return;
  }

  accessibilityUpdateScheduled = true;
  window.requestAnimationFrame(() => {
    accessibilityUpdateScheduled = false;
    repairLinkedCardSemantics();
  });
}

repairLinkedCardSemantics();

new MutationObserver(scheduleAccessibilityUpdate).observe(document.body, {
  childList: true,
  subtree: true,
});
