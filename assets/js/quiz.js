const question = [
    {
        question: "What is the largest energy-consuming appliance in most homes?",
        answers: [
            { text:"Dishwasher", correct: false},
            { text:"Refrigerator", correct: true},
            { text:"Washing Machine", correct: false},
            { text:"Water Heater", correct: false},
        ]
    }
    {
        question: "Which of the following light bulbs is most energy-efficient?",
        answers: [
            { text:"Incandescent", correct: false},
            { text:"Halogen", correct: false},
            { text:"Compact Fluorescent (CFL)", correct: false},
            { text:"Light Emitting Diode (LED)", correct: true},
        ]
    }
    {
        question: "What is the primary source of energy for most U.S. homes?",
        answers: [
            { text:"Solar", correct: false},
            { text:"Natural Gas", correct: false},
            { text:"Electricity", correct: true},
            { text:"Oil", correct: false},
        ]
    }
    {
        question: "What can help reduce energy consumption in the winter?",
        answers: [
            { text:"Opening windows", correct: false},
            { text:"Using a programmable thermostat", correct: true},
            { text:"Keeping doors open", correct: false},
            { text:"Increasing indoor humidity", correct: false},
        ]
    }
    {
        question: "How often should you change your HVAC filter to maintain efficiency?",
        answers: [
            { text:"Once a year", correct: false},
            { text:"Every 3 months", correct: true},
            { text:"Once a month", correct: false},
            { text:"Every 6 months", correct: false},
        ]
    }
    {
        question: "Which of these actions can save energy when using a dishwasher?",
        answers: [
            { text:"Running it half-full", correct: false},
            { text:"Using the heated dry option", correct: false},
            { text:"Scraping dishes instead of rinsing", correct: true},
            { text:"Running it at night", correct: false},
        ]
    }
    {
        question: "What is phantom load?",
        answers: [
            { text:"Energy used by unplugged devices", correct: false},
            { text:"Energy consumed by devices in standby mode", correct: true},
            { text:"Energy from solar panels", correct: false},
            { text:"Energy wasted by heating systems", correct: false},
        ]
    }
    {
        question: "Energy wasted by heating systems",
        answers: [
            { text:"A review of energy bills", correct: false},
            { text:"An inspection to identify energy-saving opportunities", correct: true},
            { text:"A checklist of appliances", correct: false},
            { text:"A comparison of utility rates", correct: false},
        ]
    }
    {
        question: "Which of the following is a benefit of using energy-efficient appliances?",
        answers: [
            { text:"Higher initial cost", correct: false},
            { text:"Increased energy bills", correct: false},
            { text:"Lower environmental impact", correct: true},
            { text:"More maintenance required", correct: false},
        ]
    }
    {
        question: "What does the Energy Star label indicate?",
        answers: [
            { text:"Higher price", correct: false},
            { text:"Better performance", correct: false},
            { text:"Energy efficiency", correct: true},
            { text: "Longer warranty", correct: false},
        ]
    }
]

const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-questions");
const nextButton = document.getElementById("next-button");

let currentQuestionIndex = 0;
let score = 0;

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    nextButton.innerHTML = "Next";
    showQuestion();
}

function showQuestion() {
    resetState();
    let currentQuestion = questions[currentQuestionIndex];
    let questionNo = currentQuestionIndex + 1;
    questionElement.innerHTML = questionNo + ". " + currentQuestion.
    question;

    currentQuestion.answers.forEach(answer => {
        const button = document.createElement ("button");
        button.innerHTML = answer.text;
        button.classList.add("quiz-button");
        answerButtons.appendChild(button);
        if (answer.correct) {
            button.dataset.correct = answer.correct;
        }
        button.addEventListener("click", selectAnswer);
    });
}

function resetState() {
    nextButton.style.display = "none";
    while(answerButtons.firstChild){
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

function selectAnswer(e) {
    const selectedBtn = e.target;
    const isCorrect = selectedBtn.dataset.correct === "true";
    if(isCorrect) {
        selectedBtn.classList.add("correct");
        score ++;
    } else{
        selectedBtn.classList.add("incorrect");
    }
    Array.from(answerButtons.children).forEach(button => {
        if(button.dataset.correct === "true") {
            button.classList.add ("correct");
        }
        button.disabled = true;
    });
    nextButton.style.display = "block";
}
function showScore(){
resetState();
questionElement.innerHTML = `You score ${score} out of ${questions.length}!`;
nextButton.innerHTML = "Play Again";
nextButton.style.display = "block";
}

function handleNextButton() {
    currentQuestionIndex ++;
    if(currentQuestionIndex < questions.length){
        showQuestion();
    } else{
        showScore();
    }
}
nextButton.document.addEventListener("click", ()) => {
    if(currentQuestionIndex < questions.length) {
        handleNextButton();
    } else{
        startQuiz();
    }
}
startQuiz();


