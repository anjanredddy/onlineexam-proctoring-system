document.addEventListener('DOMContentLoaded', () => {
    const questions = [
        { question: "What is 2 + 2?", options: ["2", "3", "4", "5"], answer: "4" },
        { question: "What is the capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], answer: "Paris" },
        { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
        { question: "What is the largest mammal in the world?", options: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"], answer: "Blue Whale" },
        { question: "If the day after tomorrow is Wednesday, what day is it today?", options: ["Monday", "Tuesday", "Wednesday", "Thursday"], answer: "Monday" }
    ];

    let currentQuestion = 0;
    let score = 0;
    let timeLeft = 1800;

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('exam-section').classList.remove('hidden');
        startExam();
    });

    function startExam() {
        loadQuestion();
        startTimer();
    }

    function loadQuestion() {
        const container = document.getElementById('question-container');
        const q = questions[currentQuestion];
        container.innerHTML = `
            <p>${currentQuestion + 1}. ${q.question}</p>
            ${q.options.map((option) => `
                <label>
                    <input type="radio" name="answer" value="${option}">
                    ${option}
                </label>
            `).join('')}
        `;
    }

    function startTimer() {
        const timerElement = document.getElementById('timer');
        const interval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            if (timeLeft <= 0) {
                clearInterval(interval);
                submitAndStopProctoring();
            }
        }, 1000);
    }

    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentQuestion > 0) {
            checkAnswer();
            currentQuestion--;
            loadQuestion();
        }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentQuestion < questions.length - 1) {
            checkAnswer();
            currentQuestion++;
            loadQuestion();
        }
    });

    document.getElementById('submit-btn').addEventListener('click', submitAndStopProctoring);

    function submitAndStopProctoring() {
        checkAnswer();
        fetch('/submit_exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => response.json())
        .then(data => {
            // Store avg_cheat_percentage from response
            const avgCheatPercentage = data.avg_cheat_percentage;
            return fetch('/stop_proctoring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            }).then(() => avgCheatPercentage); // Pass avgCheatPercentage forward
        })
        .then(avgCheatPercentage => {
            showResults(avgCheatPercentage);
        })
        .catch(error => console.error('Error during submission:', error));
    }

    function checkAnswer() {
        const selected = document.querySelector('input[name="answer"]:checked');
        if (selected && selected.value === questions[currentQuestion].answer) {
            score++;
        }
    }

    function showResults(avgCheatPercentage) {
        document.getElementById('exam-section').classList.add('hidden');
        document.getElementById('result-section').classList.remove('hidden');
        const resultDetails = document.getElementById('result-details');
        resultDetails.innerHTML = `
            <p>Total Questions: ${questions.length}</p>
            <p>Correct Answers: ${score}</p>
            <p>Score: ${(score / questions.length * 100).toFixed(2)}%</p>
            <p>Average Cheating Probability: ${avgCheatPercentage}%</p>
        `;
    }

    document.getElementById('logout-btn').addEventListener('click', () => {
        location.reload();
    });
});