/**
 * Shared Zero-Dependency Step-by-Step Demo Tour
 * Usage: initDemoTour({ storageKey, headerTargetSelector, steps })
 */
export function initDemoTour({ storageKey, headerTargetSelector, steps }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  let currentStep = 0;
  let isOpen = false;
  let highlightedEl = null;

  // Inject permanent "How to Use" button into the demo header bar
  const headerTarget =
    document.querySelector(headerTargetSelector) ||
    document.querySelector('.demo-actions, .hud-controls, header');

  let triggerBtn = headerTarget?.querySelector('.demo-tour-trigger-btn');
  if (headerTarget && !triggerBtn) {
    triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.className = 'demo-tour-trigger-btn';
    triggerBtn.innerHTML = '<span aria-hidden="true">?</span> How to Use';
    triggerBtn.addEventListener('click', () => openTour(0));
    headerTarget.appendChild(triggerBtn);
  }

  // Create floating walkthrough card
  const card = document.createElement('aside');
  card.className = 'demo-tour-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', 'Demo Walkthrough Tour');
  card.hidden = true;
  card.innerHTML = `
    <div class="demo-tour-top">
      <span class="demo-tour-step-count"></span>
      <div class="demo-tour-dots" aria-hidden="true"></div>
    </div>
    <h3 class="demo-tour-title"></h3>
    <p class="demo-tour-body"></p>
    <div class="demo-tour-actions">
      <button type="button" class="demo-tour-btn demo-tour-btn--ghost" data-tour-action="skip">Skip</button>
      <div class="demo-tour-nav-group">
        <button type="button" class="demo-tour-btn" data-tour-action="back">Back</button>
        <button type="button" class="demo-tour-btn demo-tour-btn--primary" data-tour-action="next">Next &rarr;</button>
      </div>
    </div>
  `;
  document.body.appendChild(card);

  const countEl = card.querySelector('.demo-tour-step-count');
  const dotsEl = card.querySelector('.demo-tour-dots');
  const titleEl = card.querySelector('.demo-tour-title');
  const bodyEl = card.querySelector('.demo-tour-body');
  const skipBtn = card.querySelector('[data-tour-action="skip"]');
  const backBtn = card.querySelector('[data-tour-action="back"]');
  const nextBtn = card.querySelector('[data-tour-action="next"]');

  function clearHighlight() {
    if (highlightedEl) {
      highlightedEl.classList.remove('demo-tour-highlight');
      highlightedEl = null;
    }
  }

  function renderStep() {
    const step = steps[currentStep];
    countEl.textContent = `Step ${currentStep + 1} of ${steps.length}`;
    titleEl.textContent = step.title;
    bodyEl.textContent = step.description;

    dotsEl.innerHTML = steps
      .map((_, idx) => `<span class="demo-tour-dot ${idx === currentStep ? 'active' : ''}"></span>`)
      .join('');

    backBtn.disabled = currentStep === 0;
    nextBtn.innerHTML = currentStep === steps.length - 1 ? 'Finish' : 'Next &rarr;';

    clearHighlight();
    if (step.highlightSelector) {
      const target = document.querySelector(step.highlightSelector);
      if (target) {
        highlightedEl = target;
        highlightedEl.classList.add('demo-tour-highlight');
      }
    }
  }

  function openTour(stepIndex = 0) {
    currentStep = Math.max(0, Math.min(steps.length - 1, stepIndex));
    isOpen = true;
    card.hidden = false;
    renderStep();
  }

  function closeTour(markSeen = true) {
    isOpen = false;
    card.hidden = true;
    clearHighlight();
    if (markSeen && storageKey) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // Ignore storage errors
      }
    }
  }

  skipBtn.addEventListener('click', () => closeTour(true));
  backBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep -= 1;
      renderStep();
    }
  });
  nextBtn.addEventListener('click', () => {
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      renderStep();
    } else {
      closeTour(true);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      closeTour(true);
    }
  });

  // Auto-open on first visit after 400ms
  let alreadySeen = false;
  if (storageKey) {
    try {
      alreadySeen = localStorage.getItem(storageKey) === 'true';
    } catch {
      alreadySeen = false;
    }
  }
  if (!alreadySeen) {
    setTimeout(() => {
      if (!isOpen) openTour(0);
    }, 400);
  }

  return { open: openTour, close: closeTour };
}
