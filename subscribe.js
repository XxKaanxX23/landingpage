const endpoint = './api/subscribe';

function updateStatus(element, message, variant = 'info') {
  if (!element) return;
  element.textContent = message;
  element.dataset.state = variant;
}

function setSubmitting(button, isSubmitting, originalLabel) {
  if (!button) return;
  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? 'Sending...' : originalLabel;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name) {
  return Boolean(name) && name.length >= 2;
}

async function subscribeToVault(details) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(details),
  });

  const contentType = response.headers.get('content-type') || '';
  let payload = {};

  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => ({}));
  } else {
    payload.raw = await response.text().catch(() => '');
  }

  if (!response.ok) {
    const message =
      payload?.error ||
      (response.status === 404
        ? 'Subscription service unavailable. Please run the server and try again.'
        : 'Subscription failed.');
    throw new Error(message);
  }

  return payload;
}

function attachBeehiivForm(form) {
  const statusEl = form.querySelector('[data-form-status]');
  const firstNameInput = form.querySelector('input[name="firstName"]');
  const emailInput = form.querySelector('input[name="email"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton?.textContent ?? 'Submit';

  updateStatus(statusEl, '');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const firstName = firstNameInput?.value.trim() ?? '';
    const email = emailInput?.value.trim() ?? '';

    if (!isValidName(firstName)) {
      updateStatus(statusEl, 'Please enter your first name.', 'error');
      firstNameInput?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      updateStatus(statusEl, 'Please enter a valid email.', 'error');
      emailInput?.focus();
      return;
    }

    updateStatus(statusEl, 'Adding you to the vault...', 'info');
    setSubmitting(submitButton, true, submitLabel);

    try {
      await subscribeToVault({ email, firstName });
      updateStatus(statusEl, 'Success! Check your inbox for confirmation.', 'success');
      form.reset();
      window.location.href = './success.html';
    } catch (error) {
      console.error('Beehiiv subscription failed:', error);
      updateStatus(
        statusEl,
        error?.message || 'Something went wrong. Please try again in a moment or email support.',
        'error'
      );
    } finally {
      setSubmitting(submitButton, false, submitLabel);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-beehiiv-form="vault"]');
  if (!form) return;
  attachBeehiivForm(form);
});
