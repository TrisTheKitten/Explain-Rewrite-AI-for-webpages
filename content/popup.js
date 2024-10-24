const popupContainer = document.createElement('div');
popupContainer.innerHTML = `
  <div id="gpt4Popup" class="gpt4-popup hidden">
    <div class="gpt4-content">
      <button id="gpt4CloseButton" class="gpt4-close-button">&times;</button>
      <p id="gpt4Message"></p>
      <button id="gpt4CopyButton" class="gpt4-copy-button">Copy</button>
    </div>
  </div>
`;
document.body.appendChild(popupContainer);

const popup = document.getElementById('gpt4Popup');
const messageElement = document.getElementById('gpt4Message');
const closeButton = document.getElementById('gpt4CloseButton');
const copyButton = document.getElementById('gpt4CopyButton');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_MESSAGE") {
    showPopup(message.message, message.isError);
  }
});

function showPopup(message, isError = false) {
  messageElement.textContent = message;
  messageElement.style.color = isError ? 'red' : '#333';
  popup.classList.remove('hidden');
  popup.classList.add('show');

  closeButton.addEventListener('click', hidePopup);
  copyButton.addEventListener('click', copyToClipboard);

  popup.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.addEventListener('click', handleClickOutside);
}

function hidePopup() {
  popup.classList.remove('show');
  popup.classList.add('hidden');
  closeButton.removeEventListener('click', hidePopup);
  copyButton.removeEventListener('click', copyToClipboard);
  document.removeEventListener('click', handleClickOutside);
}

function handleClickOutside(event) {
  if (!popup.contains(event.target)) {
    hidePopup();
  }
}

function copyToClipboard() {
  const text = messageElement.textContent;
  navigator.clipboard.writeText(text).then(() => {
    copyButton.textContent = 'Copied!';
    copyButton.disabled = true;
    setTimeout(() => {
      copyButton.textContent = 'Copy';
      copyButton.disabled = false;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}