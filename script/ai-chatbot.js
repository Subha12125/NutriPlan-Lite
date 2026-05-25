(() => {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const chatError = document.getElementById('chat-error');

  if (!chatForm || !chatInput || !chatMessages) return;

  function appendMessage(text, role) {
    const div = document.createElement('div');
    div.className =
      role === 'user'
        ? 'text-[#00f0ff] text-sm'
        : 'text-white/70 text-sm leading-relaxed';

    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showError(msg) {
    if (!chatError) return;
    chatError.textContent = msg;
    chatError.classList.remove('hidden');
  }

  function clearError() {
    if (!chatError) return;
    chatError.textContent = '';
    chatError.classList.add('hidden');
  }

  function getBodyTypeFromPage() {
    const el = document.getElementById('bodytype-indicator');
    return el ? el.innerText.trim() : '';
  }

  function getGoalFromPage() {
    const el = document.getElementById('goal-indicator');
    return el ? el.innerText.trim() : '';
  }

  async function callBackendChat(prompt) {
    // This repo currently only exposes /api/food-db and /api/health.
    // So we implement a graceful fallback here.
    // When you add a real AI backend, replace this function to call it.

    // Example fallback: short templated response based on body type.
    const bodyType = getBodyTypeFromPage();
    const goal = getGoalFromPage();

    const lower = prompt.toLowerCase();
    const isFood = /(food|eat|diet|calorie|carb|protein|fat|sugar|fruit|vegetable|drink|coffee|milk|oil|rice|bread|chicken|salad)/i.test(
      lower
    );
    const isExercise = /(workout|exercise|gym|cardio|hiit|lift|weight|squat|run|running|yoga|pilates|training|stretch)/i.test(
      lower
    );

    // Keep it short.
    if (isExercise) {
      return `For ${bodyType || 'your body type'} (${goal || 'your goal'}): choose compound lifts + short cardio. Prioritize consistency and recovery. If you tell me your equipment (gym/home) + time per day, I’ll tailor a 7‑day routine.`;
    }

    if (isFood) {
      return `For ${bodyType || 'your body type'} (${goal || 'your goal'}): aim for protein at every meal + fiber (vegetables/whole foods). If you share the exact food + portion, I’ll say whether it’s “good”, “okay”, or “limit” for your goal.`;
    }

    return `For ${bodyType || 'your body type'}: tell me what you want to improve (fat loss / muscle / energy) and your question (food or exercise). I’ll reply with a quick, practical recommendation.`;
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const message = (chatInput.value || '').trim();
    if (!message) return;

    appendMessage(message, 'user');
    chatInput.value = '';

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'text-white/70 text-sm';
    typing.textContent = 'Thinking...';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const reply = await callBackendChat(message);
      typing.remove();
      appendMessage(reply, 'assistant');
    } catch (err) {
      typing.remove();
      showError('Failed to get response.');
      console.error(err);
    }
  });
})();

