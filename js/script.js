const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const questionSpan = document.getElementById('question');
const answerSpan = document.getElementById('answer');
const status = document.getElementById('status');

if (!startBtn) console.error('Start button not found');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  status.textContent = 'Error: Speech Recognition not supported. Use Chrome.';
  startBtn.disabled = true;
  return;
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

recognition.onstart = () => console.log('Speech recognition started');
recognition.onresult = async (event) => {
  console.log('Speech detected');
  const question = event.results[event.results.length - 1][0].transcript;
  questionSpan.textContent = question;
  status.textContent = 'Fetching answer from AI...';
  try {
    const answer = await getAnswer(question);
    answerSpan.textContent = answer;
    status.textContent = 'Listening...';
    speakAnswer(answer);
  } catch (error) {
    answerSpan.textContent = 'Error fetching answer. Try again.';
    status.textContent = 'Listening...';
    console.error('API Error:', error);
  }
};
recognition.onerror = (event) => {
  console.log('Speech error:', event.error);
  status.textContent = `Error: ${event.error}`;
  if (event.error === 'no-speech') {
    status.textContent = 'No speech detected. Speak louder or check mic.';
  } else if (event.error === 'audio-capture') {
    status.textContent = 'Microphone issue. Check permissions.';
  }
};
recognition.onend = () => {
  console.log('Speech recognition stopped');
  status.textContent = 'Stopped listening';
  startBtn.disabled = false;
  stopBtn.disabled = true;
};

startBtn.addEventListener('click', () => {
  console.log('Start button clicked');
  try {
    recognition.start();
    status.textContent = 'Listening...';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (error) {
    console.error('Start error:', error);
    status.textContent = 'Error starting recognition';
  }
});

stopBtn.addEventListener('click', () => {
  console.log('Stop button clicked');
  recognition.stop();
});

const HF_API_TOKEN = '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';
const HF_API_URL = 'https://api-inference.huggingface.co/models/gpt2';

async function getAnswer(question) {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: question,
      parameters: { max_length: 50, temperature: 0.7 }
    })
  });
  if (!response.ok) {
    throw new Error('API request failed');
  }
  const data = await response.json();
  return data[0]?.generated_text || 'Sorry, I couldn’t generate an answer.';
}

function speakAnswer(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.volume = 1;
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}