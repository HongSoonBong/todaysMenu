// 현재 날짜 가져오기
const today = new Date();
let currentRating = 0;
let feedbacks = [];

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async function() {
    await loadMenuData();
    setupStarRating();
    updateTodayHighlight();
    setupMobileNavigation();
    loadFeedbacks();
    
    // 충전 버튼 이벤트 리스너 추가
    const chargeBtn = document.getElementById('chargeBtn');
    if (chargeBtn) {
        chargeBtn.addEventListener('click', chargePoints);
    }
});

// 메뉴 데이터 로드
async function loadMenuData() {
    try {
        const response = await fetch('data.txt');
        if (!response.ok) {
            throw new Error('메뉴 데이터를 불러올 수 없습니다.');
        }
        const data = await response.text();
        displayMenu(data);
    } catch (error) {
        console.error('메뉴 데이터 로드 실패:', error);
        const menuTable = document.getElementById('menuTableBody');
        const todayMenu = document.getElementById('todayMenuContent');
        
        if (menuTable) {
            menuTable.innerHTML = '<tr><td colspan="5">메뉴를 불러올 수 없습니다.</td></tr>';
        }
        if (todayMenu) {
            todayMenu.innerHTML = '메뉴를 불러올 수 없습니다.';
        }
    }
}

// 메뉴 표시
function displayMenu(data) {
    try {
        // 주간 제목 설정
        const weekTitleMobile = document.getElementById('weekTitleMobile');
        const weekTitlePC = document.getElementById('weekTitlePC');
        if (weekTitleMobile) weekTitleMobile.textContent = '이번 주 식단';
        if (weekTitlePC) weekTitlePC.textContent = '이번 주 식단';

        // 주간 메뉴 파싱
        const weekMenus = data.split('\n').map(line => line.trim()).filter(line => line);
        const weekCalories = weekMenus.map(menu => menu.match(/\((\d+)kcal\)/)?.[1] || '');
        const weekAllergies = weekMenus.map(menu => menu.match(/\[(.*?)\]/)?.[1] || '');

        // 메뉴 테이블 업데이트
        const menuTable = document.getElementById('menuTableBody');
        if (menuTable) {
            menuTable.innerHTML = weekMenus.map((menu, index) => {
                const day = ['월', '화', '수', '목', '금'][index];
                return `<tr>
                    <td>${day}</td>
                    <td>${menu}</td>
                    <td>${weekCalories[index] || '-'}</td>
                    <td>${weekAllergies[index] || '-'}</td>
                </tr>`;
            }).join('');
        }

        // 오늘의 메뉴 업데이트
        const todayMenu = document.getElementById('todayMenuContent');
        if (todayMenu) {
            const today = new Date().getDay() - 1; // 0: 월요일, 1: 화요일, ...
            if (today >= 0 && today < 5) {
                let menuContent = weekMenus[today];
                if (weekCalories[today]) {
                    menuContent += `<br><div class="calorie-info">칼로리: ${weekCalories[today]}</div>`;
                }
                if (weekAllergies[today]) {
                    const allergies = weekAllergies[today].split(',').map(a => a.trim());
                    menuContent += `<div class="allergy-info">${formatAllergies(allergies)}</div>`;
                }
                todayMenu.innerHTML = menuContent;
            } else {
                todayMenu.innerHTML = '주말에는 식단이 제공되지 않습니다.';
            }
        }

        // 모바일 네비게이션 초기화
        initMobileNavigation(weekMenus, weekCalories, weekAllergies);
    } catch (error) {
        console.error('메뉴 표시 실패:', error);
        const menuTable = document.getElementById('menuTableBody');
        const todayMenu = document.getElementById('todayMenuContent');
        
        if (menuTable) {
            menuTable.innerHTML = '<tr><td colspan="5">메뉴를 표시할 수 없습니다.</td></tr>';
        }
        if (todayMenu) {
            todayMenu.innerHTML = '메뉴를 표시할 수 없습니다.';
        }
    }
}

// 별점 시스템 설정
function setupStarRating() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            updateStars(this.dataset.rating, 'hover');
        });

        star.addEventListener('mouseout', function() {
            updateStars(currentRating, 'active');
        });

        star.addEventListener('click', function() {
            currentRating = parseInt(this.dataset.rating);
            updateStars(currentRating);
        });
    });
}

// 별점 업데이트
function updateStars(rating, className) {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('active', 'hover');
        if (star.dataset.rating <= rating) {
            star.classList.add(className);
        }
    });
}

// 오늘 날짜 하이라이트
function updateTodayHighlight() {
    const dayIndex = today.getDay() - 1; // 0: 일요일, 1: 월요일, ...
    if (dayIndex >= 0 && dayIndex < 5) {
        const cells = document.querySelectorAll('#weeklyMenu th');
        cells[dayIndex].style.backgroundColor = '#e3f2fd';
    }
}

// 피드백 제출
async function submitFeedback() {
    const feedbackText = document.getElementById('feedbackText').value.trim();
    
    if (currentRating === 0) {
        alert('평점을 선택해주세요.');
        return;
    }

    const feedback = {
        rating: currentRating,
        text: feedbackText,
        date: new Date().toISOString()
    };

    try {
        // 피드백을 파일에 저장
        await saveFeedbackToFile(feedback);
        
        // 피드백 목록에 추가
        feedbacks.push(feedback);
        updateFeedbackDisplay();
        
        // 입력 필드 초기화
        currentRating = 0;
        updateStars(0);
        document.getElementById('feedbackText').value = '';
        
        alert('피드백이 저장되었습니다.');
    } catch (error) {
        console.error('Error:', error);
        alert('피드백 저장 중 오류가 발생했습니다.');
    }
}

// 파일에 피드백 저장
async function saveFeedbackToFile(newFeedback) {
    try {
        // 기존 피드백 불러오기
        const feedbacks = await loadFeedbacksFromFile();
        feedbacks.push(newFeedback);
        
        // 파일에 저장
        const response = await fetch('comment.txt', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedbacks, null, 2)
        });
        
        if (!response.ok) {
            throw new Error('피드백 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error saving feedback:', error);
        throw error;
    }
}

// 파일에서 피드백 불러오기
async function loadFeedbacksFromFile() {
    try {
        const response = await fetch('comment.txt');
        if (!response.ok) {
            // 파일이 없거나 읽을 수 없는 경우 빈 배열 반환
            return [];
        }
        const contents = await response.text();
        return JSON.parse(contents);
    } catch (error) {
        console.error('Error loading feedbacks from file:', error);
        return [];
    }
}

// 피드백 표시 업데이트
function updateFeedbackDisplay() {
    // 평균 평점 계산
    const average = feedbacks.length > 0
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : 0;
    
    document.getElementById('averageRating').textContent = average;

    // 피드백 목록 표시
    const feedbackList = document.getElementById('feedbackList');
    feedbackList.innerHTML = feedbacks.map(feedback => `
        <div class="feedback-item">
            <div class="feedback-rating">
                ${'★'.repeat(feedback.rating)}${'☆'.repeat(5-feedback.rating)}
            </div>
            <div class="feedback-text">${feedback.text}</div>
            <div class="feedback-date">
                ${new Date(feedback.date).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

// 페이지 로드 시 저장된 피드백 불러오기
async function loadFeedbacks() {
    try {
        const loadedFeedbacks = await loadFeedbacksFromFile();
        feedbacks = loadedFeedbacks;
        updateFeedbackDisplay();
    } catch (error) {
        console.error('Error loading feedbacks:', error);
    }
}

// 포인트 충전
function chargePoints() {
    // 실제 구현에서는 결제 시스템으로 연결
    alert('결제 시스템으로 연결됩니다.');
}

// 모바일 네비게이션 설정
function setupMobileNavigation() {
    const prevBtn = document.getElementById('prevDayBtn');
    const nextBtn = document.getElementById('nextDayBtn');
    const currentDayEl = document.querySelector('.current-day');
    
    // 현재 선택된 요일 인덱스 (기본값: 오늘)
    let currentDayIndex = today.getDay() - 1; // 0: 월요일, 1: 화요일, ...
    if (currentDayIndex < 0 || currentDayIndex > 4) {
        currentDayIndex = 0; // 주말이면 월요일로 설정
    }
    
    // 초기 요일 표시
    updateCurrentDay(currentDayIndex);
    
    // 이전 요일 버튼 클릭 이벤트
    prevBtn.addEventListener('click', function() {
        currentDayIndex = (currentDayIndex - 1 + 5) % 5; // 0~4 범위 유지
        updateCurrentDay(currentDayIndex);
    });
    
    // 다음 요일 버튼 클릭 이벤트
    nextBtn.addEventListener('click', function() {
        currentDayIndex = (currentDayIndex + 1) % 5; // 0~4 범위 유지
        updateCurrentDay(currentDayIndex);
    });
    
    // 현재 요일 업데이트
    function updateCurrentDay(index) {
        const days = ['월요일', '화요일', '수요일', '목요일', '금요일'];
        currentDayEl.textContent = days[index];
        
        // 메뉴 표시
        const todayMenu = document.getElementById('todayMenuContent');
        const weekMenus = getWeekMenus();
        
        if (index >= 0 && index < weekMenus.length) {
            todayMenu.innerHTML = weekMenus[index];
        }
    }
}

// 주간 메뉴 데이터 가져오기
function getWeekMenus() {
    const menuTable = document.getElementById('menuTableBody');
    const cells = menuTable.querySelectorAll('td');
    const weekMenus = [];
    
    cells.forEach(cell => {
        weekMenus.push(cell.innerHTML);
    });
    
    return weekMenus;
}

// 모바일 네비게이션 초기화
function initMobileNavigation(weekMenus, weekCalories, weekAllergies) {
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileNav) return;

    // 기존 내용 초기화
    mobileNav.innerHTML = '';

    // 요일별 메뉴 버튼 생성
    const days = ['월요일', '화요일', '수요일', '목요일', '금요일'];
    days.forEach((day, index) => {
        const button = document.createElement('button');
        button.className = 'mobile-nav-button';
        button.textContent = day;
        
        // 클릭 이벤트 추가
        button.addEventListener('click', () => {
            const todayMenu = document.getElementById('todayMenuContent');
            if (todayMenu) {
                let menuContent = weekMenus[index];
                
                // 칼로리 정보 추가
                if (weekCalories[index]) {
                    menuContent += `<br><div class="calorie-info">칼로리: ${weekCalories[index]}</div>`;
                }
                
                // 알레르기 정보 추가
                if (weekAllergies[index]) {
                    const allergies = weekAllergies[index].split(',').map(a => a.trim());
                    menuContent += `<div class="allergy-info">${formatAllergies(allergies)}</div>`;
                }
                
                todayMenu.innerHTML = menuContent;
            }
        });
        
        mobileNav.appendChild(button);
    });
}

// 알레르기 정보 포맷팅
function formatAllergies(allergies) {
    return allergies.map(allergy => `<span class="allergy-tag">${allergy}</span>`).join(' ');
}
