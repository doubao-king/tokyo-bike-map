import type { Language } from '../i18n';
import { messages } from '../i18n';
import {
  feedbackOpenEvent,
  type FeedbackCategory,
  type FeedbackOpenRequest,
  type FeedbackSubmission
} from '../feedback';
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
  const target = document.getElementById('feedbackTarget');
  const success = document.getElementById('feedbackSuccess');

  if (
    !dialog ||
    !form ||
    !category ||
    !observedOn ||
    !details ||
    !confirmation ||
    !website ||
    !submitButton ||
    !status ||
    !detailsCount ||
    !target ||
    !success
  ) {
    return;
  }

  observedOn.max = localDateString();
  let currentRequest: FeedbackOpenRequest | undefined;

  const updateCount = (): void => {
    detailsCount.textContent = `${details.value.length} / 1500`;
    details.setCustomValidity(
      details.value.trim().length > 0 && details.value.trim().length < 10
        ? copy.feedbackDetailsTooShort
        : ''
    );
  };

  const defaultRequest = (): FeedbackOpenRequest => ({
    mapUrl: createFeedbackMapUrl(cyclingMap.getShareUrl()),
    subjectType: 'map_location',
    suggestedCategory: 'missing_information'
  });

  const targetText = (request: FeedbackOpenRequest): string => {
    if (request.subjectType === 'segment') {
      return copy.feedbackSubjectSegment.replace('{name}', request.subjectName ?? '');
    }
    if (request.subjectType === 'parking') {
      return copy.feedbackSubjectParking.replace('{name}', request.subjectName ?? '');
    }

    const url = new URL(request.mapUrl);
    return copy.feedbackSubjectLocation
      .replace('{lat}', url.searchParams.get('lat') ?? '')
      .replace('{lng}', url.searchParams.get('lng') ?? '');
  };

  const closeDialog = (): void => dialog.close();
  const openDialog = (request: FeedbackOpenRequest): void => {
    currentRequest = { ...request, mapUrl: createFeedbackMapUrl(request.mapUrl) };
    form.reset();
    form.hidden = false;
    success.hidden = true;
    status.textContent = '';
    submitButton.disabled = false;
    submitButton.textContent = copy.feedbackSubmit;
    category.value = currentRequest.suggestedCategory ?? '';
    target.textContent = targetText(currentRequest);
    updateCount();
    dialog.showModal();
    category.focus();
  };

  document.addEventListener(feedbackOpenEvent, (event) => {
    openDialog((event as CustomEvent<FeedbackOpenRequest>).detail);
  });
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
    const request = currentRequest ?? defaultRequest();

    const payload: FeedbackSubmission = {
      category: category.value as FeedbackCategory,
      details: details.value.trim(),
      language,
      mapUrl: request.mapUrl,
      observedOn: observedOn.value || undefined,
      personalInfoConfirmed: confirmation.checked,
      subjectId: request.subjectId,
      subjectName: request.subjectName,
      subjectType: request.subjectType,
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
    openDialog(defaultRequest());
  }
}
