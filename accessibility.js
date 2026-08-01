const LINKED_CARD_SELECTOR = '#content .card[role="link"]';
const CONTROL_NAME_SELECTORS = [
  '#search-bar-entry',
  '#search-bar-entry-mobile',
  'button[aria-label^="Select language"]',
];

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

function repairVisibleControlNames() {
  for (const selector of CONTROL_NAME_SELECTORS) {
    for (const control of document.querySelectorAll(selector)) {
      const visibleLabel = (control.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!visibleLabel || control.getAttribute('aria-label') === visibleLabel) {
        continue;
      }

      control.setAttribute('aria-label', visibleLabel);
    }
  }
}

function repairAccessibilitySemantics() {
  repairLinkedCardSemantics();
  repairVisibleControlNames();
}

let accessibilityUpdateScheduled = false;

function scheduleAccessibilityUpdate() {
  if (accessibilityUpdateScheduled) {
    return;
  }

  accessibilityUpdateScheduled = true;
  window.requestAnimationFrame(() => {
    accessibilityUpdateScheduled = false;
    repairAccessibilitySemantics();
  });
}

function initializeAccessibilityRepairs() {
  repairAccessibilitySemantics();

  new MutationObserver(scheduleAccessibilityUpdate).observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === 'complete') {
  window.setTimeout(initializeAccessibilityRepairs, 0);
} else {
  window.addEventListener('load', initializeAccessibilityRepairs, {
    once: true,
  });
}
