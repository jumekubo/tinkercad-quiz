/* Tinkercad Skills Check — App logic
   Draws 20 random questions from QUESTION_BANK (questions.js) each attempt,
   shuffles multiple-choice option order, tracks score, shows pass/fail only. */

const TEST_LENGTH = 20;
const PASS_PCT = 0.8; // 80% = 16/20
const TEACHER_EMAIL = "jumekubo@wnsk8.com";

// Salt used to build the verification code. This is NOT real cryptographic
// security (anyone can view this source file) — it's a lightweight check to
// catch casual tampering, not a defense against a determined forger. The
// email + optional Google Sheet log are the real record.
const CODE_SALT = "WNS-TCQ-2026";

let testQuestions = [];
let currentIndex = 0;
let score = 0;
let selectedValue = null; // holds the chosen answer for the current question before "Next" is pressed
let studentName = "";

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

function simpleHash(str) {
  // djb2 — fast, deterministic, non-cryptographic. Good enough to catch a
  // casually edited score, not meant to resist a determined forger.
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function makeCode(name, scoreVal, dateStr) {
  const key = `${name.trim().toLowerCase()}|${scoreVal}/${TEST_LENGTH}|${dateStr}|${CODE_SALT}`;
  const h = simpleHash(key).toString(36).toUpperCase().padStart(8, "0").slice(0, 8);
  return `${h.slice(0, 4)}-${h.slice(4, 8)}`;
}

function startTest() {
  studentName = document.getElementById("student-name").value.trim();
  if (!studentName) return;
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
  if (q.img && IMAGES[q.img]) {
    imgEl.src = IMAGES[q.img];
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

  const dateStr = todayStr();
  const code = makeCode(studentName, score, dateStr);
  document.getElementById("cert-name").textContent = studentName;
  document.getElementById("cert-meta").textContent =
    `Tinkercad Skills Check — ${dateStr} — ${passed ? "PASS" : "NOT YET"}`;
  document.getElementById("cert-code").textContent = code;

  const emailBtn = document.getElementById("email-btn");
  emailBtn.disabled = false;
  const hasWebhook = typeof RESULTS_WEBHOOK_URL === "string" && RESULTS_WEBHOOK_URL;
  const payload = {
    name: studentName,
    score: score,
    total: TEST_LENGTH,
    pass: passed,
    date: dateStr,
    code: code
  };
  const mailtoFallback = () => {
    const subject = `Tinkercad Skills Check Result — ${studentName}`;
    const body =
      `Name: ${studentName}\n` +
      `Score: ${score}/${TEST_LENGTH} (${pct}%)\n` +
      `Result: ${passed ? "PASS" : "NOT YET"}\n` +
      `Date: ${dateStr}\n` +
      `Verification code: ${code}`;
    window.location.href =
      `mailto:${TEACHER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (hasWebhook) {
    // Auto-send mode: the webhook (Apps Script) both logs this attempt to a
    // Sheet and emails the teacher directly — no editable draft involved.
    emailBtn.textContent = "Send Results to My Teacher";
    emailBtn.onclick = () => {
      emailBtn.disabled = true;
      emailBtn.textContent = "Sending…";
      fetch(RESULTS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      })
        .then(() => {
          emailBtn.textContent = "✓ Sent to your teacher";
        })
        .catch(() => {
          emailBtn.disabled = false;
          emailBtn.textContent = "Send failed — tap to try again";
        });
    };
  } else {
    // Fallback mode: no webhook configured yet, so fall back to a mailto:
    // draft. This is editable by the student before they hit send.
    emailBtn.textContent = "Email My Results (opens draft)";
    emailBtn.onclick = mailtoFallback;
  }

  document.getElementById("print-btn").onclick = () => window.print();
}

document.getElementById("student-name").addEventListener("input", (e) => {
  document.getElementById("start-btn").disabled = e.target.value.trim().length === 0;
});
document.getElementById("start-btn").addEventListener("click", startTest);
document.getElementById("next-btn").addEventListener("click", nextQuestion);
document.getElementById("retake-btn").addEventListener("click", () => {
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("intro").style.display = "block";
  document.getElementById("student-name").value = "";
  document.getElementById("start-btn").disabled = true;
});

document.getElementById("verify-link").addEventListener("click", () => {
  const panel = document.getElementById("verify-panel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
});
document.getElementById("verify-btn").addEventListener("click", () => {
  const name = document.getElementById("verify-name").value.trim();
  const scoreVal = document.getElementById("verify-score").value.trim();
  const dateStr = document.getElementById("verify-date").value.trim();
  const enteredCode = document.getElementById("verify-code").value.trim().toUpperCase();
  const expected = makeCode(name, scoreVal, dateStr);
  const result = document.getElementById("verify-result");
  result.classList.remove("match", "nomatch");
  if (name && scoreVal && dateStr && enteredCode && expected === enteredCode) {
    result.textContent = "✓ Code matches — this looks like a genuine result.";
    result.classList.add("match");
  } else {
    result.textContent = "✗ No match. Double-check the name, score, and date exactly as shown on the certificate.";
    result.classList.add("nomatch");
  }
});
