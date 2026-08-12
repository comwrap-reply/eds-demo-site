import { getMetadata } from '../../scripts/aem.js';

const FORM_DEFINITIONS = {
  quote: [
    ['firstName', 'First Name', 'text', true],
    ['lastName', 'Last Name', 'text', true],
    ['Company', 'Business Name', 'text', true],
    ['Business_Type__c', 'Business Type', 'select', true, ['Restaurant', 'Hotel', 'Healthcare', 'Manufacturing', 'Other']],
    ['Email', 'Email', 'email', true],
    ['Phone', 'Phone', 'tel', true],
    ['Phone_Type__c', 'Phone Type', 'select', true, ['Mobile', 'Office', 'Home']],
    ['Street', 'Business Address', 'text', true],
    ['City', 'City', 'text', true],
    ['State', 'State', 'text', true, [], 'FL'],
    ['PostalCode', 'Zip Code', 'text', true],
    ['Utility__c', 'Utility Provider', 'select', true, ['Florida Public Utilities', 'Peoples Gas', 'TECO Peoples Gas', 'Other']],
    ['Current_Marketer__c', 'Current Marketer', 'text', false],
    ['Promo_Code__c', 'Promo Code', 'text', false],
    ['How_did_you_hear_about_us__c', 'How did you hear about us?', 'select', false, ['Search engine', 'Referral', 'Advertisement', 'Other']],
    ['Reason_for_Contact__c', 'Reason for Contact', 'textarea', false],
    ['quote upload', 'Supporting document', 'file', false],
  ],
  paperless: [
    ['First Name', 'First Name', 'text', true],
    ['Last Name', 'Last Name', 'text', true],
    ['Email Address', 'Email Address', 'email', true],
    ['Phone Number', 'Phone Number', 'tel', true],
    ['Company', 'Company', 'text', true],
    ['Billing Group Number', 'Billing Group Number', 'number', true],
  ],
  'market-reports': [
    ['firstName', 'First Name', 'text', true],
    ['lastName', 'Last Name', 'text', true],
    ['Email', 'Email', 'email', true],
    ['Phone', 'Phone', 'tel', true],
    ['Phone_Type__c', 'Phone Type', 'select', true, ['Mobile', 'Office', 'Home']],
    ['Company', 'Business Name', 'text', true],
    ['Business_Type__c', 'Business Type', 'select', true, ['Restaurant', 'Hotel', 'Healthcare', 'Manufacturing', 'Other']],
  ],
};

const HIDDEN_FIELDS = {
  quote: {
    Sales_Channel__c: 'Web Lead',
    LeadSource: 'Website',
    Source_Detail__c: 'Website Contact Form',
  },
  'market-reports': {
    Sales_Channel__c: 'Web Lead',
    LeadSource: 'Website',
    Source_Detail__c: 'Newsletter',
    State: 'FL',
    Status: 'Open',
    Newsletter_Flag__c: 'true',
  },
};

function toId(name) {
  return `form-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function createField([name, label, type, required, options = [], value = '']) {
  const field = document.createElement('p');
  field.className = 'form-field';
  const id = toId(name);
  const labelElement = document.createElement('label');
  labelElement.htmlFor = id;
  labelElement.textContent = `${label}${required ? '*' : ''}`;
  let control;

  if (type === 'select') {
    control = document.createElement('select');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select an option';
    placeholder.disabled = true;
    placeholder.selected = true;
    control.append(placeholder);
    options.forEach((option) => {
      const item = document.createElement('option');
      item.value = option;
      item.textContent = option;
      control.append(item);
    });
  } else if (type === 'textarea') {
    control = document.createElement('textarea');
    control.rows = 4;
  } else {
    control = document.createElement('input');
    control.type = type;
    if (type === 'file') control.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
  }

  control.id = id;
  control.name = name;
  control.required = required;
  if (value) control.value = value;
  field.append(labelElement, control);
  return field;
}

function createPaperlessOptions() {
  const group = document.createElement('fieldset');
  group.className = 'form-fieldset';
  const legend = document.createElement('legend');
  legend.textContent = 'Additional accounts';
  group.append(legend);
  const choices = [
    ['Do not enroll additional accounts', 'none'],
    ['Enroll all linked accounts', 'all'],
    ['Enroll specific billing groups', 'specific'],
  ];
  choices.forEach(([label, value], index) => {
    const item = document.createElement('label');
    const control = document.createElement('input');
    control.type = 'radio';
    control.name = 'additionalAccounts';
    control.value = value;
    control.checked = index === 0;
    item.append(control, ` ${label}`);
    group.append(item);
  });

  const additional = document.createElement('div');
  additional.className = 'form-conditional';
  additional.hidden = true;
  additional.append(
    createField(['Billing Group 1', 'Billing Group 1', 'text', false]),
    createField(['Billing Group 2', 'Billing Group 2', 'text', false]),
    createField(['Billing Group 3', 'Billing Group 3', 'text', false]),
  );
  group.addEventListener('change', () => {
    additional.hidden = group.querySelector('input:checked')?.value !== 'specific';
  });
  return [group, additional];
}

function createConsent() {
  const label = document.createElement('label');
  label.className = 'form-consent';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = 'Terms & Conditions';
  input.value = 'I Agree';
  input.required = true;
  label.append(input, ' I agree to the Terms & Conditions.');
  return label;
}

function showStatus(status, message, error = false) {
  status.hidden = false;
  status.classList.toggle('form-status-error', error);
  status.textContent = message;
}

function getEndpoint(type) {
  const configuredOrigin = getMetadata('form-api')?.replace(/\/$/, '');
  return `${configuredOrigin || window.location.origin}/bin/fng/forms/${type}`;
}

async function submitForm(event, type, status) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  status.hidden = true;
  try {
    const response = await fetch(getEndpoint(type), {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || 'We could not submit the form. Please try again.');
    form.hidden = true;
    showStatus(status, payload.message || 'Thank you. Your submission has been received.');
  } catch (error) {
    showStatus(status, error.message, true);
  } finally {
    submit.disabled = false;
  }
}

/**
 * Decorates a fixed, CRM-compatible form template.
 * @param {Element} block The form block element
 */
export default function decorate(block) {
  const type = ['quote', 'paperless', 'market-reports'].find((value) => block.classList.contains(value));
  if (!type) return;

  const [row] = block.children;
  const [contentCell, submitCell] = row ? [...row.children] : [];
  const form = document.createElement('form');
  form.noValidate = false;
  form.encType = 'multipart/form-data';
  if (contentCell) form.append(...contentCell.childNodes);
  FORM_DEFINITIONS[type].forEach((definition) => form.append(createField(definition)));
  if (type === 'paperless') form.append(...createPaperlessOptions(), createConsent());
  Object.entries(HIDDEN_FIELDS[type] || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  });

  const honeypot = document.createElement('input');
  honeypot.type = 'text';
  honeypot.name = 'website';
  honeypot.tabIndex = -1;
  honeypot.autocomplete = 'off';
  honeypot.className = 'form-honeypot';
  form.append(honeypot);

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = submitCell?.textContent.trim() || 'Submit';
  form.append(submit);
  const status = document.createElement('p');
  status.className = 'form-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  form.addEventListener('submit', (event) => submitForm(event, type, status));
  block.replaceChildren(form, status);
}
