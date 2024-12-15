
let currentQuestions = [];
let currentQuestionIndex = 0;
let answers = {};
let timer;
let timeLeft;
let questionValidated = false;
let totalTimeSpent = 0;
let questionStartTime = 0;
let maxTimePerQuestion = 0;

function loadQuestions() {
    const especialidad = document.getElementById('especialidad').value;
    const tiempoMaximo = document.getElementById('tiempo').value;
    
    if (tiempoMaximo && !isNaN(tiempoMaximo) && parseInt(tiempoMaximo) > 0) {
        maxTimePerQuestion = parseInt(tiempoMaximo);
    } else {
        maxTimePerQuestion = 0; // Sin límite
    }

    // Los datos ya están en window.data
    const data = window.data;

    if (especialidad === 'aleatorio') {
        currentQuestions = getAllQuestions(data);
    } else {
        currentQuestions = getQuestionsFromSpecialty(data, especialidad);
    }
    
    if (currentQuestions.length === 0) {
        showNoQuestionsMessage(especialidad);
        return;
    }
    
    shuffleArray(currentQuestions);
    currentQuestionIndex = 0;
    answers = {};
    totalTimeSpent = 0;
    showQuestion();
}

function showNoQuestionsMessage(especialidad) {
    const message = especialidad === 'aleatorio' 
        ? 'No hay preguntas disponibles en este momento.'
        : `No hay preguntas disponibles para la especialidad: ${especialidad}`;
        
    document.getElementById('question-container').innerHTML = `
        <div class="no-questions-message">
            <h2>😕 ${message}</h2>
            <p>Por favor, selecciona otra especialidad o inténtalo más tarde.</p>
            <button onclick="window.location.reload()">Volver al inicio</button>
        </div>
    `;
}

function getAllQuestions(data) {
    let allQuestions = [];
    for (let specialty in data.preguntas) {
        for (let key in data.preguntas[specialty]) {
            const year = key.split('_')[1];
            if (data.respuestas[year] && data.respuestas[year][key] !== null) {
                allQuestions.push({
                    id: key,
                    ...data.preguntas[specialty][key],
                    correctAnswer: data.respuestas[year][key]
                });
            }
        }
    }
    return allQuestions;
}

function getQuestionsFromSpecialty(data, specialty) {
    let questions = [];
    if (!data.preguntas[specialty]) return questions;
    
    for (let key in data.preguntas[specialty]) {
        const year = key.split('_')[1];
        if (data.respuestas[year] && data.respuestas[year][key] !== null) {
            questions.push({
                id: key,
                ...data.preguntas[specialty][key],
                correctAnswer: data.respuestas[year][key]
            });
        }
    }
    return questions;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startTimer() {
    clearInterval(timer);
    if (maxTimePerQuestion > 0) {
        timeLeft = maxTimePerQuestion;
    } else {
        timeLeft = null; // Sin límite
    }
    updateTimerDisplay();
    questionStartTime = Date.now();

    if (timeLeft !== null) {
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timer);
                validateAndNext();
            }
        }, 1000);
    }
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (maxTimePerQuestion > 0) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 30) {
            timerElement.style.color = '#ef4444';
        } else {
            timerElement.style.color = '#2563eb';
        }
    } else {
        timerElement.textContent = 'Sin límite';
        timerElement.style.color = '#2563eb';
    }
}

function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        showResults();
        return;
    }
    
    questionValidated = false;
    const question = currentQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    
    let html = `
        <div class="question-card">
            <div class="progress-bar">
                <div class="progress" style="width: ${progress}%"></div>
            </div>
            <div class="question-code">${question.id}</div>
            <div class="timer-container">
                <i class="fas fa-hourglass-half"></i>
                <div id="timer" class="timer">${maxTimePerQuestion > 0 ? (maxTimePerQuestion/60).toFixed(0)+":00" : "Sin límite"}</div>
            </div>
            <h3>${question.pregunta}</h3>
            <div class="answers">
    `;
    
    for (let i = 1; i <= 4; i++) {
        const selectedClass = answers[question.id] === i ? 'selected' : '';
        html += `
            <div class="answer-option ${selectedClass}" onclick="selectAnswer(this, ${i})">
                ${i}. ${question.respuestas[i]}
            </div>
        `;
    }
    
    html += `
            <div id="feedback" class="feedback"></div>
            <div class="navigation-buttons">
                <button onclick="previousQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-left"></i> Anterior
                </button>
                <button onclick="validateAndNext()">
                    Siguiente <i class="fas fa-arrow-right"></i>
                </button>
                <button onclick="confirmEndTest()">
                    <i class="fas fa-flag-checkered"></i> Terminar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('question-container').innerHTML = html;
    startTimer();
}

function confirmEndTest() {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount === 0) {
        alert('Debes responder al menos una pregunta antes de terminar.');
        return;
    }
    
    const confirmed = confirm('¿Estás seguro de que quieres terminar el test? Aún quedan preguntas por responder.');
    if (confirmed) {
        showResults();
    }
}

function selectAnswer(element, answer) {
    if (questionValidated) return;
    
    const question = currentQuestions[currentQuestionIndex];
    answers[question.id] = answer;
    
    document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
}

function validateAndNext() {
    if (!answers[currentQuestions[currentQuestionIndex].id]) {
        alert('Por favor, selecciona una respuesta antes de continuar.');
        return;
    }

    const questionEndTime = Date.now();
    const timeSpent = (questionEndTime - questionStartTime) / 1000; // segundos
    totalTimeSpent += timeSpent;

    const question = currentQuestions[currentQuestionIndex];
    const userAnswer = answers[question.id];
    const correctAnswer = question.correctAnswer;
    const feedback = document.getElementById('feedback');

    document.querySelectorAll('.answer-option').forEach(opt => {
        const answerNum = parseInt(opt.textContent);
        if (answerNum === correctAnswer) {
            opt.classList.add('correct');
        } else if (answerNum === userAnswer) {
            opt.classList.add('incorrect');
        }
    });

    if (userAnswer === correctAnswer) {
        feedback.innerHTML = '<i class="fas fa-star"></i> ¡Eres un crack! Sigue así 🎉';
        feedback.className = 'feedback success show';
    } else {
        feedback.innerHTML = '<i class="fas fa-book"></i> Apuntado para repasar. ¡La próxima será mejor! 📝';
        feedback.className = 'feedback error show';
    }

    questionValidated = true;
    setTimeout(() => {
        currentQuestionIndex++;
        showQuestion();
    }, 2000);
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

function showResults() {
    clearInterval(timer);
    const answeredQuestions = Object.keys(answers).length;
    
    if (answeredQuestions === 0) {
        alert('Debes responder al menos una pregunta antes de ver los resultados.');
        return;
    }

    let correct = 0;
    let incorrect = 0;
    let failedQuestions = [];

    Object.keys(answers).forEach(questionId => {
        const question = currentQuestions.find(q => q.id === questionId);
        if (answers[questionId] === question.correctAnswer) {
            correct++;
        } else {
            incorrect++;
            failedQuestions.push({
                id: questionId,
                pregunta: question.pregunta,
                respuestaUsuario: answers[questionId],
                respuestaCorrecta: question.correctAnswer,
                explicacion: question.respuestas[question.correctAnswer]
            });
        }
    });
    
    const totalQuestions = currentQuestions.length;
    const percentage = Math.round((correct / answeredQuestions) * 100);

    let motivationalMessage = '';
    let emoji = '';

    if (percentage >= 90) {
        motivationalMessage = '¡Excelente! Estás más que preparado/a';
        emoji = '🏆';
    } else if (percentage >= 70) {
        motivationalMessage = '¡Muy bien! Vas por buen camino';
        emoji = '🌟';
    } else if (percentage >= 50) {
        motivationalMessage = 'Vas progresando, ¡sigue así!';
        emoji = '💪';
    } else {
        motivationalMessage = 'Cada error es una oportunidad para aprender';
        emoji = '📚';
    }

    // Nota MIR: Aciertos * 3 - Fallos
    const notaMIR = correct * 3 - incorrect;

    // Tiempo medio por pregunta
    const averageTime = totalTimeSpent / answeredQuestions; // en segundos
    const avgMinutes = Math.floor(averageTime / 60);
    const avgSeconds = Math.floor(averageTime % 60);

    let html = `
        <div class="results">
            <h2>${emoji} Resultados de tu test</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${answeredQuestions}</h3>
                    <p>Preguntas respondidas</p>
                </div>
                <div class="stat-card">
                    <h3>${correct}</h3>
                    <p>Aciertos</p>
                </div>
                <div class="stat-card">
                    <h3>${incorrect}</h3>
                    <p>Fallos</p>
                </div>
                <div class="stat-card">
                    <h3>${percentage}%</h3>
                    <p>Porcentaje de acierto</p>
                </div>
                <div class="stat-card">
                    <h3>${notaMIR}</h3>
                    <p>Nota MIR (3 x Aciertos - Fallos)</p>
                </div>
                <div class="stat-card">
                    <h3>${avgMinutes} min ${avgSeconds} s</h3>
                    <p>Tiempo medio/pregunta</p>
                </div>
            </div>
            
            <div class="motivation-message">
                <h3>${motivationalMessage}</h3>
            </div>
    `;
    
    if (failedQuestions.length > 0) {
        html += `
            <div class="failed-questions">
                <h3>📝 Preguntas para repasar:</h3>
        `;
        
        failedQuestions.forEach(q => {
            html += `
                <div class="failed-question">
                    <h4>${q.id}</h4>
                    <p><strong>Pregunta:</strong> ${q.pregunta}</p>
                    <p><strong>Tu respuesta:</strong> ${q.respuestaUsuario}</p>
                    <p><strong>Respuesta correcta:</strong> ${q.respuestaCorrecta}</p>
                    <p><strong>Explicación:</strong> ${q.explicacion}</p>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    html += `
            <div class="navigation-buttons">
                <button onclick="window.location.reload()">
                    <i class="fas fa-redo"></i> Nuevo test
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('question-container').innerHTML = html;
}
