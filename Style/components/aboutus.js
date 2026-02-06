// --- Poll System ---
const pollButtons = document.querySelectorAll(".poll-btn");
const pollResult = document.getElementById("poll-result");

pollButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    pollResult.textContent =
      btn.dataset.answer === "yes"
        ? "🔥 عالی! شما بخشی از انقلاب NFT هستید."
        : "🚀 مشکلی نیست! بازار را کاوش کنید و سفر خود را شروع کنید!";
  });
});

const surveyForm = document.getElementById("surveyForm");
const surveyMessage = document.getElementById("surveyMessage");

const firstNameInput = document.getElementById("firstName");
const emailInput = document.getElementById("email");

surveyForm.addEventListener("submit", e => {
  e.preventDefault();

  if (window.validateForm && !window.validateForm(surveyForm)) return;

  const fname = firstNameInput.value.trim();
  const email = emailInput.value.trim();

  surveyMessage.textContent = `✅ ممنون ${fname}! بروزرسانی‌ها را در ${email} دریافت خواهید کرد.`;
  surveyForm.reset();
});
