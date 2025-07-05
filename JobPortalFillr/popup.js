// Profile management logic for popup

document.addEventListener('DOMContentLoaded', () => {
  const profileSelect = document.getElementById('profile-select');
  const addProfileBtn = document.getElementById('add-profile');
  const statusDiv = document.getElementById('status');
  const saveFormBtn = document.getElementById('save-form');
  const autofillFormBtn = document.getElementById('autofill-form');

  // Load profiles from storage
  function loadProfiles(selectedProfile) {
    chrome.storage.local.get(['profiles', 'selectedProfile'], (result) => {
      const profiles = result.profiles || [];
      profileSelect.innerHTML = '';
      profiles.forEach((profile) => {
        const option = document.createElement('option');
        option.value = profile;
        option.textContent = profile;
        profileSelect.appendChild(option);
      });
      if (selectedProfile && profiles.includes(selectedProfile)) {
        profileSelect.value = selectedProfile;
      } else if (result.selectedProfile && profiles.includes(result.selectedProfile)) {
        profileSelect.value = result.selectedProfile;
      }
    });
  }

  // Save selected profile
  profileSelect.addEventListener('change', () => {
    chrome.storage.local.set({ selectedProfile: profileSelect.value });
  });

  // Add new profile
  addProfileBtn.addEventListener('click', () => {
    const profileName = prompt('Enter new profile/folder name:');
    if (!profileName) return;
    chrome.storage.local.get(['profiles'], (result) => {
      let profiles = result.profiles || [];
      if (profiles.includes(profileName)) {
        statusDiv.textContent = 'Profile already exists!';
        setTimeout(() => statusDiv.textContent = '', 2000);
        return;
      }
      profiles.push(profileName);
      chrome.storage.local.set({ profiles, selectedProfile: profileName }, () => {
        loadProfiles(profileName);
        statusDiv.textContent = 'Profile added!';
        setTimeout(() => statusDiv.textContent = '', 2000);
      });
    });
  });

  // Save form data from content script
  saveFormBtn.addEventListener('click', () => {
    const selectedProfile = profileSelect.value;
    if (!selectedProfile) {
      statusDiv.textContent = 'Please select a profile first!';
      setTimeout(() => statusDiv.textContent = '', 2000);
      return;
    }
    // Ask content script to extract form data
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'extractFormData' }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Could not access form on this page.';
          setTimeout(() => statusDiv.textContent = '', 2000);
          return;
        }
        if (!response || !response.formData) {
          statusDiv.textContent = 'No form data found.';
          setTimeout(() => statusDiv.textContent = '', 2000);
          return;
        }
        // Save form data under profile and page URL
        const pageKey = `profile_${selectedProfile}`;
        chrome.storage.local.get([pageKey], (result) => {
          const profileData = result[pageKey] || {};
          profileData[tabs[0].url] = response.formData;
          chrome.storage.local.set({ [pageKey]: profileData }, () => {
            statusDiv.textContent = 'Form data saved!';
            setTimeout(() => statusDiv.textContent = '', 2000);
          });
        });
      });
    });
  });

  autofillFormBtn.addEventListener('click', () => {
    const selectedProfile = profileSelect.value;
    if (!selectedProfile) {
      statusDiv.textContent = 'Please select a profile first!';
      setTimeout(() => statusDiv.textContent = '', 2000);
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const pageKey = `profile_${selectedProfile}`;
      chrome.storage.local.get([pageKey], (result) => {
        const profileData = result[pageKey] || {};
        const formData = profileData[tabs[0].url];
        if (!formData) {
          statusDiv.textContent = 'No saved data for this page.';
          setTimeout(() => statusDiv.textContent = '', 2000);
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { action: 'autofillForm', formData }, (response) => {
          if (chrome.runtime.lastError) {
            statusDiv.textContent = 'Could not autofill form on this page.';
            setTimeout(() => statusDiv.textContent = '', 2000);
            return;
          }
          statusDiv.textContent = response && response.success ? 'Form autofilled!' : 'Autofill failed.';
          setTimeout(() => statusDiv.textContent = '', 2000);
        });
      });
    });
  });

  loadProfiles();
}); 