import { loadDestination, searchDestinations } from '../data/destinationSearch';
import type { CyclingMap } from '../map/createMap';
import { messages, type Language } from '../i18n';
import type { DestinationSuggestion } from '../types';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function initializeDestinationSearch(
  cyclingMap: CyclingMap,
  language: Language
): void {
  const formElement = document.getElementById('destinationSearchForm') as HTMLFormElement | null;
  const inputElement = document.getElementById('destinationSearchInput') as HTMLInputElement | null;
  const clearElement = document.getElementById('destinationSearchClear') as HTMLButtonElement | null;
  const submitElement = document.getElementById('destinationSearchSubmit') as HTMLButtonElement | null;
  const resultsElement = document.getElementById('destinationSearchResults');
  const statusElement = document.getElementById('destinationSearchStatus');
  const containerElement = document.getElementById('destinationSearch');
  if (!formElement || !inputElement || !clearElement || !submitElement || !resultsElement || !statusElement || !containerElement) {
    return;
  }
  const form = formElement;
  const input = inputElement;
  const clearButton = clearElement;
  const submitButton = submitElement;
  const results = resultsElement;
  const status = statusElement;
  const container = containerElement;

  const copy = messages[language];
  let suggestions: DestinationSuggestion[] = [];
  let searchController: AbortController | undefined;
  let lookupController: AbortController | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let hasDestination = false;

  function setStatus(message?: string, isError = false): void {
    status.textContent = message ?? '';
    status.hidden = !message;
    status.classList.toggle('is-error', isError);
  }

  function closeResults(): void {
    suggestions = [];
    results.replaceChildren();
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  }

  function renderResults(nextSuggestions: DestinationSuggestion[]): void {
    suggestions = nextSuggestions;
    results.replaceChildren();

    nextSuggestions.forEach((suggestion, index) => {
      const button = document.createElement('button');
      const name = document.createElement('strong');
      const context = document.createElement('small');
      button.type = 'button';
      button.className = 'destination-search-result';
      button.dataset.destinationIndex = String(index);
      button.setAttribute('role', 'option');
      name.textContent = suggestion.name;
      context.textContent = suggestion.context;
      button.append(name, context);
      results.append(button);
    });

    results.hidden = nextSuggestions.length === 0;
    input.setAttribute('aria-expanded', String(nextSuggestions.length > 0));
  }

  async function runSearch(): Promise<DestinationSuggestion[]> {
    const query = input.value.trim();
    if (query.length < 2) {
      closeResults();
      setStatus();
      return [];
    }

    searchController?.abort();
    searchController = new AbortController();
    setStatus(copy.destinationSearchLoading);

    try {
      const nextSuggestions = await searchDestinations(
        query,
        language,
        searchController.signal
      );
      if (query !== input.value.trim()) return [];
      renderResults(nextSuggestions);
      setStatus(nextSuggestions.length === 0 ? copy.destinationSearchNoResults : undefined);
      return nextSuggestions;
    } catch (error) {
      if (isAbortError(error)) return [];
      console.error(error);
      closeResults();
      setStatus(copy.destinationSearchError, true);
      return [];
    }
  }

  async function selectSuggestion(suggestion: DestinationSuggestion): Promise<void> {
    searchController?.abort();
    lookupController?.abort();
    lookupController = new AbortController();
    closeResults();
    submitButton.disabled = true;
    input.setAttribute('aria-busy', 'true');
    setStatus(copy.destinationSearchLoading);

    try {
      const destination = await loadDestination(
        suggestion,
        language,
        lookupController.signal
      );
      const parkingToggle = document.querySelector<HTMLInputElement>('[data-map-layer="parking"]');
      if (parkingToggle) parkingToggle.checked = true;
      cyclingMap.setOverlayVisibility('parking', true);
      cyclingMap.setDestination(destination);
      input.value = destination.name;
      hasDestination = true;
      clearButton.hidden = false;
      setStatus();
    } catch (error) {
      if (!isAbortError(error)) {
        console.error(error);
        setStatus(copy.destinationSearchError, true);
      }
    } finally {
      submitButton.disabled = false;
      input.removeAttribute('aria-busy');
    }
  }

  input.addEventListener('input', () => {
    if (hasDestination) {
      const typedValue = input.value;
      cyclingMap.clearDestination();
      input.value = typedValue;
      hasDestination = false;
      clearButton.hidden = true;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    searchController?.abort();
    closeResults();
    setStatus();
    clearButton.hidden = input.value.length === 0;
    if (input.value.trim().length >= 2) {
      debounceTimer = setTimeout(() => void runSearch(), 320);
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && !results.hidden) {
      event.preventDefault();
      results.querySelector<HTMLButtonElement>('button')?.focus();
    } else if (event.key === 'Escape') {
      closeResults();
      setStatus();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (debounceTimer) clearTimeout(debounceTimer);
    const nextSuggestions = suggestions.length > 0 ? suggestions : await runSearch();
    if (nextSuggestions[0]) await selectSuggestion(nextSuggestions[0]);
  });

  results.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-destination-index]');
    if (!button) return;
    const suggestion = suggestions[Number(button.dataset.destinationIndex)];
    if (suggestion) void selectSuggestion(suggestion);
  });

  results.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLButtonElement)) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      (target.nextElementSibling as HTMLButtonElement | null)?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const previous = target.previousElementSibling as HTMLButtonElement | null;
      if (previous) previous.focus();
      else input.focus();
    } else if (event.key === 'Escape') {
      closeResults();
      input.focus();
    }
  });

  clearButton.addEventListener('click', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    searchController?.abort();
    lookupController?.abort();
    if (hasDestination) cyclingMap.clearDestination();
    hasDestination = false;
    input.value = '';
    clearButton.hidden = true;
    closeResults();
    setStatus();
    input.focus();
  });

  document.addEventListener('tokyo-bike-map:destination-cleared', () => {
    hasDestination = false;
    input.value = '';
    clearButton.hidden = true;
    closeResults();
    setStatus();
  });

  document.addEventListener('click', (event) => {
    if (!container.contains(event.target as Node)) closeResults();
  });
}
