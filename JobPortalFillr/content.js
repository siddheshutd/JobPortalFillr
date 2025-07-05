// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractFormData') {
    const formData = {};
    console.log('extractFormData');

    // Find all forms on the page
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) {
      sendResponse({ formData: null });
      return;
    }
    // For now, use the first form (can be improved later)
    const form = forms[0];
    const elements = form.elements;
    for (let el of elements) {
      const key = el.name && el.name.trim() ? el.name : (el.id && el.id.trim() ? el.id : null);
      if (!key || el.type === 'password' || el.disabled) continue;
      if (el.type === 'checkbox') {
        formData[key] = el.checked;
      } else if (el.type === 'radio') {
        if (el.checked) formData[key] = el.value;
      } else if (el.tagName === 'SELECT') {
        if (el.multiple) {
          formData[key] = Array.from(el.selectedOptions).map(opt => opt.value);
        } else {
          formData[key] = el.value;
        }
      } else {
        formData[key] = el.value;
      }
    }
    sendResponse({ formData });
  }
  if (request.action === 'autofillForm') {
    const formData = request.formData || {};
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) {
      sendResponse({ success: false });
      return;
    }
    const form = forms[0];
    const elements = form.elements;
    for (let el of elements) {
      const key = el.name && el.name.trim() ? el.name : (el.id && el.id.trim() ? el.id : null);
      if (!key || el.disabled) continue;
      const value = formData[key];
      if (value === undefined) continue;
      if (el.type === 'checkbox') {
        el.checked = !!value;
      } else if (el.type === 'radio') {
        if (el.value === value) el.checked = true;
      } else if (el.tagName === 'SELECT') {
        if (el.multiple && Array.isArray(value)) {
          for (let option of el.options) {
            option.selected = value.includes(option.value);
          }
        } else {
          el.value = value;
        }
      } else {
        el.value = value;
      }
    }
    sendResponse({ success: true });
  }
  // Required for async sendResponse
  return true;
}); 