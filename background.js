// Background service worker to automatically capture access tokens

// Keep track of the last saved token to avoid duplicate processing
let lastSavedToken = null;

// Listen for requests to SRA SmartOSC API
chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    // Look for Authorization header in the request
    if (details.requestHeaders) {
      for (let header of details.requestHeaders) {
        if (header.name.toLowerCase() === 'authorization' && header.value) {
          // Extract the token (remove "Bearer " prefix if present)
          let token = header.value.trim();

          if (token.toLowerCase().startsWith('bearer ')) {
            token = token.substring(7).trim();
          }

          // Only save and fetch if token is new or different
          if (token !== lastSavedToken) {
            lastSavedToken = token;

            // Save the token to storage
            chrome.storage.local.set({
              'smo_token': token,
              'token_captured_at': new Date().toISOString()
            }, function () {
              console.log('Token automatically captured from request');
            });

            // Fetch user ID when token changes
            fetchAndSaveUserId(token);
          }

          break;
        }
      }
    }
  },
  {
    urls: [
      "https://sra.smartosc.com/*",
      "https://sra-api.smartosc.com/*"
    ]
  },
  ["requestHeaders"]
);

// Function to fetch and save user ID
async function fetchAndSaveUserId(token) {
  try {
    const response = await fetch('https://sra-api.smartosc.com/api/users/current-user', {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const userData = await response.json();
      await chrome.storage.local.set({
        'smo_userId': userData.id,
        'smo_userName': userData.name,
        'smo_userEmail': userData.email
      });
      console.log('User ID automatically fetched:', userData.id);
    }
  } catch (error) {
    console.error('Failed to fetch user ID:', error);
  }
}

console.log('SMO Worklog Tool background service worker loaded');
