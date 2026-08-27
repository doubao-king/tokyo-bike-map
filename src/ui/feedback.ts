import type { Language } from '../i18n';
import { messages } from '../i18n';
import type { FeedbackCategory, FeedbackSubmission } from '../feedback';
import type { CyclingMap } from '../map/createMap';

function localDateString(date = new Date()): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function createFeedbackMapUrl(value: string): string {
  const url = new URL(value);
  url.searchParams.delete('feedback');
  url.hash = '';
  return url.href;
}

export function initializeFeedbackDialog(cyclingMap: CyclingMap, language: Language): void {
  const copy = messages[language];
  const dialog = document.getElementById('feedbackDialog') as HTMLDialogElement | null;
  const openButton = document.getElementById('reportButton') as HTMLButtonElement | null;
  const closeButton = document.getElementById('feedbackClose') as HTMLButtonElement | null;
  const cancelButton = document.getElementById('feedbackCancel') as HTMLButtonElement | null;
  const doneButton = document.getElementById('feedbackDone') as HTMLButtonElement | null;
  const form = document.getElementById('feedbackForm') as HTMLFormElement | null;
  const category = document.getElementById('feedbackCategory') as HTMLSelectElement | null;
  const observedOn = document.getElementById('feedbackDate') as HTMLInputElement | null;
  const details = document.getElementById('feedbackDetails') as HTMLTextAreaElement | null;
  const confirmation = document.getElementById('feedbackConfirmation') as HTMLInputElement | null;
  const website = document.getElementById('feedbackWebsite') as HTMLInputElement | null;
  const submitButton = document.getElementById('feedbackSubmit') as HTMLButtonElement | null;
  const status = document.getElementById('feedbackStatus');
  const detailsCount = document.getElementById('feedbackDetailsCount');
  const success = document.getElementById('feedbackSuccess');

  if (
    !dialog ||
    !openButton ||
    !form ||
    !category ||
    !observedOn ||
    !details ||
    !confirmation ||
    !website ||
    !submitButton ||
    !status ||
    !detailsCount ||
    !success
  ) {
    return;
  }

  observedOn.max = localDateString();

  const updateCount = (): void => {
    detailsCount.textContent = `${details.value.length} / 1500`;
    details.setCustomValidity(
      details.value.trim().length > 0 && details.value.trim().length < 10
        ? copy.feedbackDetailsTooShort
        : ''
    );
  };

  const closeDialog = (): void => dialog.close();
  const openDialog = (): void => {
    form.reset();
    form.hidden = false;
    success.hidden = true;
    status.textContent = '';
    submitButton.disabled = false;
    submitButton.textContent = copy.feedbackSubmit;
    updateCount();
    dialog.showModal();
    category.focus();
  };

  openButton.addEventListener('click', openDialog);
  closeButton?.addEventListener('click', closeDialog);
  cancelButton?.addEventListener('click', closeDialog);
  doneButton?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  details.addEventListener('input', updateCount);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateCount();
    if (!form.reportValidity()) return;

    const payload: FeedbackSubmission = {
      category: category.value as FeedbackCategory,
      details: details.value.trim(),
      language,
      mapUrl: createFeedbackMapUrl(cyclingMap.getShareUrl()),
      observedOn: observedOn.value || undefined,
      personalInfoConfirmed: confirmation.checked,
      website: website.value
    };

    submitButton.disabled = true;
    submitButton.textContent = copy.feedbackSending;
    form.setAttribute('aria-busy', 'true');
    status.textContent = '';

    try {
      const response = await fetch('/api/feedback', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });
      if (!response.ok) {
        status.textContent = response.status === 429 ? copy.feedbackRateLimited : copy.feedbackError;
        return;
      }

      form.hidden = true;
      success.hidden = false;
      doneButton?.focus();
    } catch {
      status.textContent = copy.feedbackError;
    } finally {
      form.removeAttribute('aria-busy');
      submitButton.disabled = false;
      submitButton.textContent = copy.feedbackSubmit;
    }
  });

  if (new URLSearchParams(window.location.search).get('feedback') === '1') {
    openDialog();
  }
}
