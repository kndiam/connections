document.addEventListener('DOMContentLoaded', function() {
    const gameBoard = document.getElementById('game-board');
    const groupsContainer = document.getElementById('groups-container');
    const submitBtn = document.getElementById('submit-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const deselectBtn = document.getElementById('deselect-btn');
    const livesContainer = document.getElementById('lives-container');
    
    let selectedWords = new Set();
    let lives = 1;
    let correctGroups = 0;
    let remainingDifficulties = ['difficulty1', 'difficulty2', 'difficulty3', 'difficulty4'];

    function initGame() {
        updateLivesDisplay();
        setupWordSelection();
    }

    function setupWordSelection() {
        document.querySelectorAll('.word').forEach(word => {
            word.addEventListener('click', function() {
                if (this.classList.contains('selected')) {
                    this.classList.remove('selected');
                    selectedWords.delete(this.dataset.word);
                } else {
                    if (selectedWords.size < 4) {
                        this.classList.add('selected');
                        selectedWords.add(this.dataset.word);
                    }
                }
                
                submitBtn.disabled = selectedWords.size !== 4;
            });
        });
    }

    shuffleBtn.addEventListener('click', function() {
        const words = Array.from(gameBoard.children);
        words.forEach(word => {
            word.classList.remove('selected');
            gameBoard.removeChild(word);
        });
        selectedWords.clear();
        submitBtn.disabled = true;
        
        for (let i = words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [words[i], words[j]] = [words[j], words[i]];
        }
        
        words.forEach(word => gameBoard.appendChild(word));
    });

    deselectBtn.addEventListener('click', function() {
        document.querySelectorAll('.word.selected').forEach(word => {
            word.classList.remove('selected');
        });
        selectedWords.clear();
        submitBtn.disabled = true;
    });

    submitBtn.addEventListener('click', async function() {
        const selectedWordElements = Array.from(document.querySelectorAll('.word.selected'));
        const selectedWordsArray = Array.from(selectedWords);
        
        if (selectedWordsArray.length !== 4) return;
        
        submitBtn.disabled = true; // Prevent multiple submissions
        const sortedElements = [...selectedWordElements].sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return (aRect.top - bRect.top) || (aRect.left - bRect.left);
        });
        await animateWordsSequentially(sortedElements);
        
        try {
            const response = await fetch('/check_answers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    words: selectedWordsArray,
                    group_info: groupInfo
                })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            await processSubmission(data, selectedWordElements, selectedWordsArray);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            submitBtn.disabled = false;
        }
});

    function animateCorrectGuess(selectedWordElements, groupDiv) {
    return new Promise((resolve) => {
        const groupRect = groupDiv.getBoundingClientRect();
        const groupCenter = {
            x: groupRect.left + groupRect.width / 2,
            y: groupRect.top + groupRect.height / 2
        };

        let animationsCompleted = 0;
        
        selectedWordElements.forEach((wordEl) => {
            wordEl.classList.add('animating');
            const wordRect = wordEl.getBoundingClientRect();
            const moveX = groupCenter.x - (wordRect.left + wordRect.width / 2);
            const moveY = groupCenter.y - (wordRect.top + wordRect.height / 2);
            
            wordEl.style.transform = `translate(${moveX}px, ${moveY}px) scale(0.5)`;
            wordEl.style.opacity = '0';
            
            wordEl.addEventListener('transitionend', () => {
                if (wordEl.parentNode) {
                    wordEl.parentNode.removeChild(wordEl);
                }
                animationsCompleted++;
                if (animationsCompleted === selectedWordElements.length) {
                    resolve();
                }
            }, { once: true });
        });
    });
}

    async function animateWordsSequentially(wordElements) {
        for (let i = 0; i < wordElements.length; i++) {
            wordElements[i].classList.add('bouncing');
            await new Promise(resolve => {
            wordElements[i].addEventListener('animationend', () => {
                wordElements[i].classList.remove('bouncing');
                resolve();
            }, { once: true });
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
}

    function revealAnswer(groupWords, category, color, difficulty) {
        return new Promise((resolve) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group';
            groupDiv.style.backgroundColor = color;
            
            const groupTitle = document.createElement('div');
            groupTitle.className = 'group-title';
            groupTitle.textContent = `${category} (${difficulty.replace('difficulty', 'Level ')})`;
            groupDiv.appendChild(groupTitle);
            
            const groupWordsContainer = document.createElement('div');
            groupWordsContainer.className = 'group-words';
            groupDiv.appendChild(groupWordsContainer);
            
            groupsContainer.appendChild(groupDiv);
            
            const allWordElements = Array.from(document.querySelectorAll('.word'));
            
            const wordsToAnimate = [];
            groupWords.forEach(word => {
                const wordEl = allWordElements.find(el => el.dataset.word.toLowerCase() === word.toLowerCase());
                if (wordEl) {
                    wordsToAnimate.push(wordEl);
                    wordEl.classList.add('fading');
                }
            });
            
            setTimeout(() => {
                wordsToAnimate.forEach(wordEl => {
                    if (wordEl.parentNode) {
                        wordEl.parentNode.removeChild(wordEl);
                    }
                });
                
                groupWords.forEach(word => {
                    const wordSpan = document.createElement('span');
                    wordSpan.textContent = word;
                    groupWordsContainer.appendChild(wordSpan);
                });
                
                groupDiv.classList.add('revealed');
                resolve();
            }, 500);
        });
    }

    async function processSubmission(data, selectedWordElements, selectedWordsArray) {
    if (data.correct) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        groupDiv.style.backgroundColor = data.color;
        
        const groupTitle = document.createElement('div');
        groupTitle.className = 'group-title';
        groupTitle.textContent = `${data.category} (${data.difficulty.replace('difficulty', 'Level ')})`;
        groupDiv.appendChild(groupTitle);
        
        const groupWords = document.createElement('div');
        groupWords.className = 'group-words';
        groupDiv.appendChild(groupWords);
        
        groupsContainer.appendChild(groupDiv);
        
        try {
            await animateCorrectGuess(selectedWordElements, groupDiv);
            
            selectedWordsArray.forEach(word => {
                const wordSpan = document.createElement('span');
                wordSpan.textContent = word;
                groupWords.appendChild(wordSpan);
            });
            
            groupDiv.classList.add('revealed');
            
            remainingDifficulties = remainingDifficulties.filter(d => d !== data.difficulty);
            correctGroups++;
            
            if (correctGroups === 4) {
                submitBtn.disabled = true;
            }
        } catch (error) {
            console.error('Animation error:', error);
        }
    } else {
        lives--;
        updateLivesDisplay();
        
        if (lives <= 0) {
            submitBtn.disabled = true;
            await revealRemainingGroups();
        } 
    }
    
    deselectBtn.click();
}
    

async function revealRemainingGroups() {
    for (const difficulty of remainingDifficulties) {
        const groupKey = Object.keys(groupInfo).find(key => 
            groupInfo[key].difficulty === difficulty);
        if (groupKey) {
            const info = groupInfo[groupKey];
            const words = groupKey.split(' ');
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group';
            groupDiv.style.backgroundColor = info.color;
            groupDiv.style.opacity = '0.7';
            
            const groupTitle = document.createElement('div');
            groupTitle.className = 'group-title';
            groupTitle.textContent = `${info.category} (${difficulty.replace('difficulty', 'Level ')})`;
            groupDiv.appendChild(groupTitle);
            
            const groupWordsContainer = document.createElement('div');
            groupWordsContainer.className = 'group-words';
            groupDiv.appendChild(groupWordsContainer);
            
            groupsContainer.appendChild(groupDiv);
            
            const allWordElements = Array.from(document.querySelectorAll('.word'));
            const fadePromises = [];
            
            words.forEach(word => {
                const wordEl = allWordElements.find(el => 
                    el.dataset.word.toLowerCase() === word.toLowerCase());
                if (wordEl) {
                    const promise = new Promise(resolve => {
                        wordEl.classList.add('fading');
                        wordEl.addEventListener('animationend', () => {
                            if (wordEl.parentNode) {
                                wordEl.parentNode.removeChild(wordEl);
                            }
                            resolve();
                        }, { once: true });
                    });
                    fadePromises.push(promise);
                }
            });
            
            await Promise.all(fadePromises);
            
            words.forEach(word => {
                const wordSpan = document.createElement('span');
                wordSpan.textContent = word;
                groupWordsContainer.appendChild(wordSpan);
            });
            
            groupDiv.classList.add('revealed');
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}

    function updateLivesDisplay() {
        livesContainer.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const lifeDot = document.createElement('span');
            lifeDot.className = 'life-dot ' + (i < lives ? 'active' : 'inactive');
            livesContainer.appendChild(lifeDot);
        }
    }

    initGame();
});