// Template cache to avoid reloading templates
const templateCache = {};

// Helper function to load and render templates
async function loadTemplate(templateName, replacements = {}) {
  // Check cache first
  if (templateCache[templateName]) {
    return replacePlaceholders(templateCache[templateName], replacements);
  }

  try {
    const response = await fetch(chrome.runtime.getURL(`templates/${templateName}.html`));
    if (!response.ok) {
      throw new Error(`Failed to load template: ${templateName}`);
    }
    const html = await response.text();
    templateCache[templateName] = html;
    return replacePlaceholders(html, replacements);
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

// Helper function to replace placeholders in templates
function replacePlaceholders(html, replacements) {
  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

