// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadCurrentMenu();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 메뉴 추가 버튼 이벤트
    document.querySelectorAll('.add-menu-item').forEach(button => {
        button.addEventListener('click', function() {
            const menuItems = this.previousElementSibling;
            addMenuItem(menuItems);
        });
    });

    // 폼 제출 이벤트
    document.getElementById('menuForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveMenu();
    });

    // 미리보기 버튼 이벤트
    document.getElementById('previewBtn').addEventListener('click', function() {
        showPreview();
    });

    // 로그아웃 버튼 이벤트
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('로그아웃 하시겠습니까?')) {
            window.location.href = 'index.html';
        }
    });
}

// 메뉴 항목 추가
function addMenuItem(container) {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.innerHTML = `
        <input type="text" placeholder="메뉴명" required>
        <input type="number" placeholder="칼로리" required>
        <input type="text" placeholder="알레르기 정보 (쉼표로 구분)" required>
        <button type="button" class="btn btn-danger remove-menu-item">삭제</button>
    `;

    // 삭제 버튼 이벤트
    menuItem.querySelector('.remove-menu-item').addEventListener('click', function() {
        menuItem.remove();
    });

    container.appendChild(menuItem);
}

// 현재 메뉴 로드
async function loadCurrentMenu() {
    try {
        const response = await fetch('data.txt');
        const data = await response.text();
        parseAndFillMenu(data);
    } catch (error) {
        console.error('메뉴 데이터를 불러오는데 실패했습니다:', error);
    }
}

// 메뉴 데이터 파싱 및 폼에 채우기
function parseAndFillMenu(data) {
    const lines = data.split('\n');
    let currentDay = '';
    let currentMenuItems = [];
    
    lines.forEach(line => {
        if (line.includes('주간 식단')) {
            document.getElementById('weekRange').value = line.replace('주간 식단 (', '').replace(')', '');
        } else if (line.includes('요일')) {
            if (currentDay && currentMenuItems.length > 0) {
                fillDayMenu(currentDay, currentMenuItems);
            }
            currentDay = line;
            currentMenuItems = [];
        } else if (line.trim() !== '' && !line.includes('칼로리') && !line.includes('알레르기')) {
            currentMenuItems.push(line);
        }
    });

    // 마지막 요일 처리
    if (currentDay && currentMenuItems.length > 0) {
        fillDayMenu(currentDay, currentMenuItems);
    }
}

// 요일별 메뉴 채우기
function fillDayMenu(day, menuItems) {
    const dayIndex = getDayIndex(day);
    if (dayIndex === -1) return;

    const dayMenu = document.querySelectorAll('.day-menu')[dayIndex];
    const menuItemsContainer = dayMenu.querySelector('.menu-items');
    menuItemsContainer.innerHTML = ''; // 기존 항목 초기화

    menuItems.forEach(menu => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <input type="text" value="${menu}" required>
            <input type="number" placeholder="칼로리" required>
            <input type="text" placeholder="알레르기 정보 (쉼표로 구분)" required>
            <button type="button" class="btn btn-danger remove-menu-item">삭제</button>
        `;

        // 삭제 버튼 이벤트
        menuItem.querySelector('.remove-menu-item').addEventListener('click', function() {
            menuItem.remove();
        });

        menuItemsContainer.appendChild(menuItem);
    });
}

// 요일 인덱스 가져오기
function getDayIndex(day) {
    const days = ['월요일', '화요일', '수요일', '목요일', '금요일'];
    return days.indexOf(day);
}

// 메뉴 저장
async function saveMenu() {
    const weekRange = document.getElementById('weekRange').value;
    let menuData = `주간 식단 (${weekRange})\n\n`;
    
    const days = ['월요일', '화요일', '수요일', '목요일', '금요일'];
    days.forEach((day, index) => {
        const dayMenu = document.querySelectorAll('.day-menu')[index];
        const menuItems = dayMenu.querySelectorAll('.menu-item');
        
        menuData += `${day}\n`;
        menuItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            menuData += `${inputs[0].value}\n`;
        });
        menuData += `칼로리: ${calculateTotalCalories(menuItems)}kcal\n`;
        menuData += `알레르기: ${getAllergies(menuItems)}\n\n`;
    });

    try {
        // 실제 구현에서는 서버로 데이터를 전송
        console.log('저장될 메뉴 데이터:', menuData);
        alert('메뉴가 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('메뉴 저장에 실패했습니다:', error);
        alert('메뉴 저장에 실패했습니다.');
    }
}

// 총 칼로리 계산
function calculateTotalCalories(menuItems) {
    let total = 0;
    menuItems.forEach(item => {
        const calorieInput = item.querySelector('input[type="number"]');
        if (calorieInput.value) {
            total += parseInt(calorieInput.value);
        }
    });
    return total;
}

// 알레르기 정보 수집
function getAllergies(menuItems) {
    const allergies = new Set();
    menuItems.forEach(item => {
        const allergyInput = item.querySelector('input[type="text"]:last-child');
        if (allergyInput.value) {
            allergyInput.value.split(',').forEach(allergy => {
                allergies.add(allergy.trim());
            });
        }
    });
    return Array.from(allergies).join(',');
}

// 미리보기 표시
function showPreview() {
    const previewSection = document.querySelector('.preview-section');
    const previewTableBody = document.getElementById('previewTableBody');
    previewTableBody.innerHTML = '';

    const tr = document.createElement('tr');
    document.querySelectorAll('.day-menu').forEach(dayMenu => {
        const td = document.createElement('td');
        const menuItems = dayMenu.querySelectorAll('.menu-item');
        let menuText = '';
        
        menuItems.forEach(item => {
            const menuName = item.querySelector('input[type="text"]').value;
            menuText += `${menuName}<br>`;
        });

        td.innerHTML = menuText;
        tr.appendChild(td);
    });

    previewTableBody.appendChild(tr);
    previewSection.style.display = 'block';
}
