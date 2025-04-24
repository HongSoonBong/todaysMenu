// 현재 날짜 가져오기
const today = new Date();
let currentRating = 0;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    loadMenuData();
    setupStarRating();
    updateTodayHighlight();
    setupMobileNavigation();
});

// 메뉴 데이터 로드
async function loadMenuData() {
    try {
        const response = await fetch('data.txt');
        const data = await response.text();
        displayMenu(data);
    } catch (error) {
        console.error('메뉴 데이터를 불러오는데 실패했습니다:', error);
    }
}

// 메뉴 표시
function displayMenu(data) {
    const lines = data.split('\n');
    const menuTable = document.getElementById('menuTableBody');
    const todayMenu = document.getElementById('todayMenuContent');
    const weekTitleMobile = document.getElementById('weekTitleMobile');
    const weekTitlePC = document.getElementById('weekTitlePC');
    
    // 주간 제목 설정
    if (lines.length > 0) {
        weekTitleMobile.textContent = lines[0];
        weekTitlePC.textContent = lines[0];
    }
    
    // 주간 메뉴 파싱 (첫 번째 줄 제외)
    let weekMenus = [];
    let currentDayMenu = [];
    
    // 첫 번째 줄(주간 제목)을 제외하고 처리
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue;
        
        if (line.includes('요일')) {
            if (currentDayMenu.length > 0) {
                weekMenus.push(currentDayMenu.join('<br>'));
                currentDayMenu = [];
            }
            // 요일 정보는 제외하고 메뉴만 저장
        } else if (!line.includes('칼로리') && !line.includes('알레르기')) {
            currentDayMenu.push(line);
        }
    }
    
    // 마지막 요일의 메뉴 추가
    if (currentDayMenu.length > 0) {
        weekMenus.push(currentDayMenu.join('<br>'));
    }

    // 테이블에 메뉴 표시
    const tr = document.createElement('tr');
    weekMenus.forEach(menu => {
        const td = document.createElement('td');
        td.innerHTML = menu;
        tr.appendChild(td);
    });
    menuTable.innerHTML = ''; // 기존 내용 초기화
    menuTable.appendChild(tr);

    // 오늘의 메뉴 표시
    const todayDayIndex = today.getDay() - 1; // 0: 일요일, 1: 월요일, ...
    if (todayDayIndex >= 0 && todayDayIndex < 5) {
        todayMenu.innerHTML = weekMenus[todayDayIndex];
    }
    
    // 모바일 네비게이션 초기화
    initMobileNavigation(weekMenus);
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
            currentRating = this.dataset.rating;
            updateStars(currentRating, 'active');
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
function submitFeedback() {
    const feedbackText = document.getElementById('feedbackText').value;
    if (currentRating === 0) {
        alert('별점을 선택해주세요.');
        return;
    }
    
    // 피드백 저장 로직
    const feedback = {
        rating: currentRating,
        comment: feedbackText,
        date: new Date().toISOString()
    };
    
    console.log('피드백 제출:', feedback);
    alert('소중한 의견 감사합니다!');
    
    // 입력 필드 초기화
    document.getElementById('feedbackText').value = '';
    currentRating = 0;
    updateStars(0, 'active');
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
function initMobileNavigation(weekMenus) {
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
        
        if (index >= 0 && index < weekMenus.length) {
            todayMenu.innerHTML = weekMenus[index];
        }
    }
}
