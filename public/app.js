const questionProgress = document.querySelector("#question-progress");
const answeredCount = document.querySelector("#answered-count");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const categoryList = document.querySelector("#category-list");
const questionContent = document.querySelector("#question-content");
const navigation = document.querySelector("#navigation");
const previousButton = document.querySelector("#previous-button");
const submitButton = document.querySelector("#submit-button");
const nextButton = document.querySelector("#next-button");

const optionLabels = ["A", "B", "C", "D"];
let questions = [];
let currentQuestionIndex = 0;
const selectedAnswers = new Map();
const submittedAnswers = new Map();

async function loadQuestions() {
  try {
    const response = await fetch("/api/questions");
    if (!response.ok) {
      throw new Error(`The question bank request failed (${response.status}).`);
    }

    const questionBank = await response.json();
    if (!Array.isArray(questionBank) || questionBank.length !== 200) {
      throw new Error("The question bank must contain exactly 200 questions.");
    }
    if (!questionBank.every(isValidQuestion)) {
      throw new Error("The question bank contains an invalid question.");
    }

    questions = questionBank;
    renderCategories();
    navigation.hidden = false;
    renderQuestion();
  } catch (error) {
    console.error("Unable to load the exam question bank:", error);
    questionProgress.textContent = "Exam unavailable";
    progressTrack.hidden = true;
    categoryList.replaceChildren();
    questionContent.innerHTML = "";

    const message = document.createElement("p");
    message.className = "error-state";
    message.textContent = "We couldn't load the questions. Please refresh the page and try again.";
    questionContent.append(message);
  }
}

function isValidQuestion(question) {
  return (
    question !== null &&
    typeof question === "object" &&
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((option) => typeof option === "string") &&
    Number.isInteger(question.answerIndex) &&
    question.answerIndex >= 0 &&
    question.answerIndex < 4 &&
    typeof question.explanation === "string" &&
    typeof question.category === "string"
  );
}

function renderCategories() {
  const categoryCounts = new Map();
  questions.forEach(({ category }) => {
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  const categories = [...categoryCounts.entries()].sort(
    ([firstCategory, firstCount], [secondCategory, secondCount]) =>
      secondCount - firstCount || firstCategory.localeCompare(secondCategory)
  );

  const categoryRows = categories.map(([categoryName, count]) => {
    const percentage = (count / questions.length) * 100;
    const row = document.createElement("div");
    row.className = "category-row";
    row.dataset.category = categoryName;

    const categoryCopy = document.createElement("div");
    categoryCopy.className = "category-copy";

    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = categoryName;

    const weightage = document.createElement("span");
    weightage.className = "category-weightage";
    weightage.textContent = `${percentage.toFixed(1)}%`;

    const track = document.createElement("span");
    track.className = "category-weight-track";
    track.setAttribute("aria-hidden", "true");

    const fill = document.createElement("span");
    fill.className = "category-weight-fill";
    fill.style.width = `${percentage}%`;
    track.append(fill);

    categoryCopy.append(name, weightage);
    row.append(categoryCopy, track);
    return row;
  });

  categoryList.replaceChildren(...categoryRows);
}

function renderQuestion() {
  const question = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers.get(currentQuestionIndex);
  const isSubmitted = submittedAnswers.has(currentQuestionIndex);
  const questionSection = document.createElement("section");
  questionSection.className = "question-section";
  questionSection.setAttribute("aria-labelledby", "question-title");

  const category = document.createElement("p");
  category.className = "question-category";
  category.textContent = question.category;

  const title = document.createElement("h2");
  title.className = "question-title";
  title.id = "question-title";
  title.textContent = question.question;

  const optionList = document.createElement("ol");
  optionList.className = "options-list";

  question.options.forEach((option, optionIndex) => {
    const listItem = document.createElement("li");
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.setAttribute("aria-pressed", String(selectedAnswer === optionIndex));

    if (isSubmitted) {
      button.disabled = true;
      if (optionIndex === question.answerIndex) {
        button.classList.add("is-correct");
      } else if (optionIndex === submittedAnswers.get(currentQuestionIndex)) {
        button.classList.add("is-incorrect");
      }
    } else {
      if (selectedAnswer === optionIndex) {
        button.classList.add("is-selected");
      }
      button.addEventListener("click", () => selectAnswer(optionIndex));
    }

    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = optionLabels[optionIndex];

    const optionText = document.createElement("span");
    optionText.className = "option-text";
    optionText.textContent = option;

    button.append(letter, optionText);
    listItem.append(button);
    optionList.append(listItem);
  });

  questionSection.append(category, title, optionList);
  if (isSubmitted) {
    questionSection.append(
      createFeedback(question, submittedAnswers.get(currentQuestionIndex))
    );
  }

  questionContent.replaceChildren(questionSection);
  updateProgress();
  updateNavigation();
  updateActiveCategory();
}

function selectAnswer(selectedIndex) {
  if (submittedAnswers.has(currentQuestionIndex)) {
    return;
  }

  selectedAnswers.set(currentQuestionIndex, selectedIndex);
  renderQuestion();
}

function submitAnswer() {
  if (submittedAnswers.has(currentQuestionIndex)) {
    return;
  }

  const selectedAnswer = selectedAnswers.get(currentQuestionIndex);
  if (selectedAnswer === undefined) {
    return;
  }

  submittedAnswers.set(currentQuestionIndex, selectedAnswer);
  renderQuestion();
}

function createFeedback(question, selectedAnswer) {
  const isCorrect = selectedAnswer === question.answerIndex;
  const feedback = document.createElement("div");
  feedback.className = `answer-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`;
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");

  const heading = document.createElement("p");
  heading.className = "feedback-title";
  heading.textContent = isCorrect ? "Correct!" : `Not quite. The correct answer is ${optionLabels[question.answerIndex]}.`;

  const explanation = document.createElement("p");
  explanation.className = "feedback-detail";
  explanation.textContent = `${question.options[question.answerIndex]} — ${question.explanation}`;

  feedback.append(heading, explanation);
  return feedback;
}

function updateProgress() {
  const total = questions.length;
  const answered = submittedAnswers.size;
  const progress = ((currentQuestionIndex + 1) / total) * 100;

  questionProgress.textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
  answeredCount.textContent = `${answered} answered`;
  progressFill.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuemax", String(total));
  progressTrack.setAttribute("aria-valuenow", String(currentQuestionIndex + 1));
  progressTrack.setAttribute(
    "aria-valuetext",
    `Question ${currentQuestionIndex + 1} of ${total}`
  );
}

function updateNavigation() {
  previousButton.disabled = currentQuestionIndex === 0;
  nextButton.disabled = currentQuestionIndex === questions.length - 1;
  const isSubmitted = submittedAnswers.has(currentQuestionIndex);
  submitButton.disabled = isSubmitted || !selectedAnswers.has(currentQuestionIndex);
  submitButton.textContent = isSubmitted ? "Submitted" : "Submit answer";
}

function updateActiveCategory() {
  const currentCategory = questions[currentQuestionIndex].category;
  categoryList.querySelectorAll(".category-row").forEach((row) => {
    const isCurrent = row.dataset.category === currentCategory;
    row.classList.toggle("is-current", isCurrent);
    if (isCurrent) {
      row.setAttribute("aria-current", "true");
    } else {
      row.removeAttribute("aria-current");
    }
  });
}

previousButton.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex -= 1;
    renderQuestion();
  }
});

nextButton.addEventListener("click", () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion();
  }
});

submitButton.addEventListener("click", submitAnswer);

loadQuestions();
