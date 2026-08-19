/* Tinkercad Skills Check — App logic
   Draws 20 random questions from QUESTION_BANK (questions.js) each attempt,
   shuffles multiple-choice option order, tracks score, shows pass/fail only. */

const TEST_LENGTH = 20;
const PASS_PCT = 0.8; // 80% = 16/20

let testQuestions = [];
let currentIndex = 0;
let score = 0;
let selectedValue = null; // holds the chosen answer for the current question before "Next" is pressed

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTest() {
  const picked = shuffle(QUESTION_BANK).slice(0, TEST_LENGTH);
  testQuestions = picked.map(q => {
    if (q.type === "mc") {
      const optionObjs = q.options.map((text, i) => ({ text, correct: i === q.answer }));
      const shuffled = shuffle(optionObjs);
      return {
        ...q,
        options: shuffled.map(o => o.text),
        answer: shuffled.findIndex(o => o.correct)
      };
    }
    return { ...q };
  });
}

function startTest() {
  buildTest();
  currentIndex = 0;
  score = 0;
  document.getElementById("intro").style.display = "none";
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";
  renderQuestion();
}

function renderQuestion() {
  selectedValue = null;
  const q = testQuestions[currentIndex];

  document.getElementById("progress-label").textContent =
    `Question ${currentIndex + 1} of ${TEST_LENGTH}`;
  document.getElementById("score-label").textContent = `Score so far: ${score}`;
  document.getElementById("progress-fill").style.width =
    `${(currentIndex / TEST_LENGTH) * 100}%`;

  document.getElementById("q-type-tag").textContent =
    q.type === "tf" ? "True / False" : "Multiple Choice";
  document.getElementById("q-text").textContent = q.text;

  const imgEl = document.getElementById("q-img");
  if (q.img) {
    imgEl.src = `images/${q.img}`;
    imgEl.style.display = "block";
  } else {
    imgEl.style.display = "none";
    imgEl.removeAttribute("src");
  }

  const tfRow = document.getElementById("tf-options");
  const mcRow = document.getElementById("mc-options");
  const nextBtn = document.getElementById("next-btn");
  nextBtn.disabled = true;

  if (q.type === "tf") {
    tfRow.style.display = "flex";
    mcRow.style.display = "none";
    [...tfRow.children].forEach(btn => {
      btn.classList.remove("selected");
      btn.onclick = () => selectAnswer(btn.dataset.val === "true", tfRow);
    });
  } else {
    tfRow.style.display = "none";
    mcRow.style.display = "flex";
    mcRow.innerHTML = "";
    q.options.forEach((optText, i) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = optText;
      btn.onclick = () => selectAnswer(i, mcRow);
      mcRow.appendChild(btn);
    });
  }
}

function selectAnswer(value, container) {
  selectedValue = value;
  [...container.children].forEach(btn => btn.classList.remove("selected"));
  const btns = [...container.children];
  if (typeof value === "boolean") {
    btns.find(b => b.dataset.val === String(value)).classList.add("selected");
  } else {
    btns[value].classList.add("selected");
  }
  document.getElementById("next-btn").disabled = false;
}

function nextQuestion() {
  const q = testQuestions[currentIndex];
  if (selectedValue === q.answer) score++;

  currentIndex++;
  if (currentIndex >= TEST_LENGTH) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults() {
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("results-screen").style.display = "block";

  const pct = Math.round((score / TEST_LENGTH) * 100);
  document.getElementById("final-score").textContent = `${score}/${TEST_LENGTH}`;
  document.getElementById("final-pct").textContent = `${pct}%`;

  const badge = document.getElementById("pass-badge");
  const passed = score / TEST_LENGTH >= PASS_PCT;
  badge.textContent = passed ? "Pass ✓" : "Not Yet — Try Again";
  badge.classList.toggle("pass", passed);
  badge.classList.toggle("fail", !passed);
}

document.getElementById("start-btn").addEventListener("click", startTest);
document.getElementById("next-btn").addEventListener("click", nextQuestion);
document.getElementById("retake-btn").addEventListener("click", () => {
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("intro").style.display = "block";
});
