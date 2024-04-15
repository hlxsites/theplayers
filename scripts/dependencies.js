/**
 * Loads Admiral script
 */
async function loadAdmiral() {
  try {
    const response = await fetch(
      'https://orchestrator-config-uat.pgatour.com/revops/admirial',
    );
    const content = await response.text();
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = content;
    script.id = 'admiral';
    document.head.appendChild(script);
  } catch (error) {
    throw new Error('Error loading Admiral script: ', error);
  }
}

loadAdmiral();
