(() => {
  // Cole aqui a URL do Google Apps Script (/exec) da planilha do Studio Familiare
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzwASULa71JKHg3qEq3cyykABUmRpCxSvmP9s2scvoUHoVGSjMgxfA6gbR-8_AGNHMZFQ/exec';

  // Cole aqui o link direto de avaliação no Google (ex: https://g.page/r/.../review)
  const GOOGLE_REVIEW_URL = 'https://g.page/r/CVtCyKS0OcvZEBM/review';

  const RATING_LABELS = {
    1: { text: '1 estrela · Muito insatisfeito', tone: 'is-low' },
    2: { text: '2 estrelas · Insatisfeito', tone: 'is-low' },
    3: { text: '3 estrelas · Pode melhorar', tone: 'is-low' },
    4: { text: '4 estrelas · Muito bom!', tone: 'is-high' },
    5: { text: '5 estrelas · Excelente!', tone: 'is-high' },
  };

  const state = {
    rating: 0,
    reasons: new Set(),
  };

  const screens = document.querySelectorAll('.app-screen');
  const starButtons = document.querySelectorAll('.star-btn');
  const ratingFeedbackPill = document.getElementById('ratingFeedbackPill');
  const btnContinueRating = document.getElementById('btnContinueRating');

  const reasonChips = document.querySelectorAll('.ios-chip');
  const feedbackDetails = document.getElementById('feedbackDetails');
  const feedbackRoutePill = document.getElementById('feedbackRoutePill');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const feedbackSubtitle = document.getElementById('feedbackSubtitle');
  const btnBackFromFeedback = document.getElementById('btnBackFromFeedback');
  const btnSubmitFeedback = document.getElementById('btnSubmitFeedback');

  const googleStarsBadge = document.getElementById('googleStarsBadge');
  const btnOpenGoogle = document.getElementById('btnOpenGoogle');

  if (GOOGLE_REVIEW_URL) {
    btnOpenGoogle.href = GOOGLE_REVIEW_URL;
  }

  function goToScreen(screenName) {
    screens.forEach((screen) => {
      screen.classList.toggle('is-active', screen.dataset.screen === screenName);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function sendPayload(payload) {
    if (!WEBHOOK_URL) return;
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
    } catch (_) {
      // Falha silenciosa para não travar a experiência do cliente
    }
  }

  function selectRating(value) {
    state.rating = value;

    starButtons.forEach((btn) => {
      const btnValue = Number(btn.dataset.value);
      btn.classList.toggle('is-selected', btnValue <= value);
    });

    const meta = RATING_LABELS[value];
    ratingFeedbackPill.textContent = meta.text;
    ratingFeedbackPill.className = `rating-feedback-pill ${meta.tone}`;
    btnContinueRating.disabled = false;
  }

  function proceedFromRating() {
    if (!state.rating) return;

    if (state.rating <= 4) {
      const isFourStars = state.rating === 4;
      btnBackFromFeedback.style.visibility = isFourStars ? 'hidden' : 'visible';
      btnBackFromFeedback.disabled = isFourStars;

      if (isFourStars) {
        feedbackRoutePill.className = 'route-pill route-pill-ok';
        feedbackRoutePill.textContent = '4 ★ · Muito obrigado!';
        feedbackTitle.textContent = 'Muito obrigado pela confiança!';
        feedbackSubtitle.textContent = 'Ficamos felizes que tenha gostado! O que podemos melhorar para ser 5 estrelas?';
      } else {
        feedbackRoutePill.className = 'route-pill route-pill-warn';
        feedbackRoutePill.textContent = 'Canal Privado · Atendimento';
        feedbackTitle.textContent = 'Sentimos muito por isso.';
        feedbackSubtitle.textContent = 'O que podemos melhorar? Sua mensagem vai direto para nossa equipe.';
      }

      goToScreen('feedback');
    } else {
      googleStarsBadge.textContent = '5 ★';
      goToScreen('google');
    }
  }

  starButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      selectRating(Number(btn.dataset.value));
    });
  });

  btnContinueRating.addEventListener('click', proceedFromRating);

  reasonChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const reason = chip.dataset.reason;
      if (state.reasons.has(reason)) {
        state.reasons.delete(reason);
        chip.classList.remove('is-active');
      } else {
        state.reasons.add(reason);
        chip.classList.add('is-active');
      }
    });
  });

  btnBackFromFeedback.addEventListener('click', () => goToScreen('rating'));

  btnSubmitFeedback.addEventListener('click', async () => {
    btnSubmitFeedback.disabled = true;
    btnSubmitFeedback.textContent = 'Enviando...';

    await sendPayload({
      rating: state.rating,
      route: 'private_feedback',
      reasons: Array.from(state.reasons),
      comment: feedbackDetails.value.trim(),
      timestamp: new Date().toISOString(),
    });

    btnSubmitFeedback.disabled = false;
    btnSubmitFeedback.textContent = 'Enviar feedback';
    goToScreen('feedback-sent');
  });

  btnOpenGoogle.addEventListener('click', () => {
    sendPayload({
      rating: state.rating,
      route: 'google_review',
      reasons: [],
      comment: '',
      timestamp: new Date().toISOString(),
    });
  });
})();

