const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const micButton = document.getElementById('micButton');
const charCount = document.getElementById('charCount');
const fileButton = document.getElementById('fileButton');
const fileInput = document.getElementById('fileInput');
let controller = null;
let recognition = null;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'ru-RU';

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    charCount.textContent = transcript.length;
    micButton.classList.remove('active');
  };

  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    micButton.classList.remove('active');
  };

  recognition.onend = function() {
    micButton.classList.remove('active');
  };
}

micButton.addEventListener('click', () => {
  if (!recognition) {
    alert('Ваш браузер не поддерживает голосовой ввод');
    return;
  }

  if (micButton.classList.contains('active')) {
    recognition.stop();
    micButton.classList.remove('active');
  } else {
    recognition.start();
    micButton.classList.add('active');
  }
});

fileButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    if (file.size > 100000) {
      alert('Файл слишком большой. Максимальный размер: 100KB');
      return;
    }
  
    try {
      const text = await file.text(); 
      if (text.length > 3000) {
        alert('Текст слишком длинный. Максимальная длина: 3000 символов');
        return;
      }
  
      const filePreviewArea = document.getElementById('filePreviewArea');
      const filePreview = filePreviewArea.querySelector('.file-preview');
      filePreview.innerHTML = `
        <div>
          <button class="file-preview-close" onclick="clearFilePreview()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="file-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
            <span>${file.name}</span>
          </div>
        </div>
      `;
      filePreviewArea.style.display = 'block';
  
      fileInput.dataset.fileContent = text;
  
    } catch (error) {
      alert('Ошибка при чтении файла');
      console.error('File reading error:', error);
    }
  });

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: 'hljs language-'
});

const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);
renderer.code = function(code, language) {
  const html = originalCodeRenderer(code, language);
  return html.replace('<pre><code', '<pre><button class="code-copy-button" onclick="copyCodeBlock(this)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><code');
};
marked.setOptions({ renderer });

function copyCodeBlock(button) {
  const pre = button.parentElement;
  const code = pre.querySelector('code');
  navigator.clipboard.writeText(code.textContent);
  
  const originalText = button.innerHTML;
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  setTimeout(() => {
    button.innerHTML = originalText;
  }, 2000);
}

userInput.addEventListener('input', function() {
  charCount.textContent = this.value.length;
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener('click', sendMessage);

async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;
  
    if (controller) {
      controller.abort();
    }
    controller = new AbortController();
  
    const fileContent = fileInput.dataset.fileContent || '';
  
    const message = fileContent ? `${fileContent}\n\n${userMessage}` : userMessage;
  
    let displayMessage = userMessage;
    if (fileContent) {
      displayMessage += `\n\n📎 Файл Прикреплён`;
    }
  
    addMessage(displayMessage, 'user');
  
    userInput.value = '';
    userInput.style.height = '60px';
    charCount.textContent = '0';
  
    clearFilePreview();
    fileInput.dataset.fileContent = ''; 
  
    showTypingIndicator();
  
    try {
      const response = await eel.search_with_duckduckgo(message)();
      removeTypingIndicator();
      addMessage(response, 'bot');
    } catch (error) {
      if (error.name === 'AbortError') {
        removeTypingIndicator();
        addMessage('Генерация ответа остановлена.', 'bot');
      } else {
        removeTypingIndicator();
        addMessage('Извините, произошла ошибка. Попробуйте снова позже.', 'bot');
      }
    } finally {
      controller = null;
    }
  }  

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'message-actions';
  
  const copyButton = document.createElement('button');
  copyButton.className = 'action-button';
  copyButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>`;
  copyButton.onclick = () => navigator.clipboard.writeText(text);
  actionsDiv.appendChild(copyButton);
  
  messageDiv.appendChild(actionsDiv);
  
  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = marked.parse(text);
  messageDiv.appendChild(contentDiv);
  
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  messageDiv.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.id = 'typingIndicator';
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    indicator.appendChild(dot);
  }
  
  chatContainer.appendChild(indicator);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

function clearFilePreview() {
  const filePreviewArea = document.getElementById('filePreviewArea');
  filePreviewArea.style.display = 'none';
  const filePreview = filePreviewArea.querySelector('.file-preview');
  filePreview.innerHTML = `
    <div>
      <button class="file-preview-close" onclick="clearFilePreview()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;
}