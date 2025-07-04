// js/admin.js

const SUPABASE_URL = 'https://ocnqgfdsozhxowrvieqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbnFnZmRzb3poeG93cnZpZXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjYyOTUsImV4cCI6MjA2NjcwMjI5NX0.rNxaY22-rDx3s-Lso5i_8ZKce-asRHZAN-w__BmJOBI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Data Mappings & Colors ---
const GRADE_NAMES = { 'first': 'الصف الأول', 'second': 'الصف الثاني', 'third': 'الصف الثالث' };
const GRADE_COLORS = { 'first': 'bg-blue-50', 'second': 'bg-green-50', 'third': 'bg-orange-50' };
const SECTION_NAMES = { 'general': 'علمي رياضة', 'statistics': 'إحصاء (أدبي)', 'science': 'علمي', 'arts': 'أدبي' };
const GROUP_NAMES = { 'sat_tue': 'سبت و ثلاثاء', 'sun_wed': 'أحد و أربعاء', 'mon_thu': 'اثنين و خميس', 'sat_tue_thu': 'سبت، ثلاثاء، خميس', 'sun_wed_fri': 'أحد، أربعاء، جمعة' };

// --- Global State ---
let allStudents = [];
let currentFilter = {
    grade: 'all',
    group: 'all', // Will store the combined group key, e.g., "sat_tue|15:15:00"
    searchQuery: ''
};

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data, error } = await supabase.from('registrations_2025_2026').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allStudents = data;
        initializeDashboard();
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('students-table-body').innerHTML = `<tr><td colspan="9" class="p-8 text-center text-red-500">فشل في تحميل البيانات. تأكد من صلاحيات الوصول (RLS).</td></tr>`;
    }
});

// --- Initialization ---
function initializeDashboard() {
    renderFilterCards();
    applyFilters();
    setupEventListeners();
}

// --- Main Filtering & Rendering Logic ---
function applyFilters() {
    let filteredStudents = [...allStudents]; // Always start with a fresh copy

    if (currentFilter.grade !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.grade === currentFilter.grade);
    }
    
    if (currentFilter.group !== 'all') {
        // **THE FIX IS HERE:** We now split by the safe '|' character.
        const [days, time] = currentFilter.group.split('|'); 
        filteredStudents = filteredStudents.filter(s => s.days_group === days && s.time_slot === time);
    }

    const query = currentFilter.searchQuery.trim().toLowerCase();
    if (query) {
        filteredStudents = filteredStudents.filter(s =>
            s.student_name.toLowerCase().includes(query) || s.student_phone.includes(query) || s.parent_phone.includes(query)
        );
    }

    renderTable(filteredStudents);
    updateGroupStudentCount();
}

// --- UI Rendering ---
function renderFilterCards() {
    const container = document.getElementById('stats-section').querySelector('.grid');
    const counts = {
        all: allStudents.length,
        first: allStudents.filter(s => s.grade === 'first').length,
        second: allStudents.filter(s => s.grade === 'second').length,
        third: allStudents.filter(s => s.grade === 'third').length,
    };
    
    const cardsData = [
        { grade: 'all', label: 'إجمالي الطلاب', count: counts.all, icon: 'fa-users', color: 'violet' },
        { grade: 'first', label: 'الصف الأول', count: counts.first, icon: 'fa-child', color: 'blue' },
        { grade: 'second', label: 'الصف الثاني', count: counts.second, icon: 'fa-user-graduate', color: 'green' },
        { grade: 'third', label: 'الصف الثالث', count: counts.third, icon: 'fa-crown', color: 'orange' }
    ];
    
    container.innerHTML = cardsData.map(card => `
        <div data-grade="${card.grade}" class="filter-card group bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-${card.color}-400">
            <div class="text-center sm:text-right">
                <p class="text-gray-500 text-xs sm:text-sm font-medium">${card.label}</p>
                <p class="text-2xl sm:text-3xl font-bold">${card.count}</p>
            </div>
            <div class="bg-${card.color}-100 text-${card.color}-600 rounded-full p-3 mt-2 sm:mt-0 transition-transform group-hover:scale-110"><i class="fas ${card.icon} fa-fw"></i></div>
        </div>
    `).join('');
    
    container.querySelector('[data-grade="all"]').classList.add('active');
}

function updateGroupFilterDropdown() {
    const groupFilterSection = document.getElementById('secondary-filter-section');
    const groupSelect = document.getElementById('group-filter');

    if (currentFilter.grade === 'all') {
        groupFilterSection.classList.add('hidden');
        return;
    }

    const studentsInGrade = allStudents.filter(s => s.grade === currentFilter.grade);
    const uniqueGroups = [...new Map(studentsInGrade.map(s => [`${s.days_group}|${s.time_slot}`, s])).values()];
    
    groupSelect.innerHTML = '<option value="all">كل المجموعات</option>';
    uniqueGroups.forEach(student => {
        const option = document.createElement('option');
        // **THE FIX IS HERE:** Using '|' as the separator for the value.
        const groupKey = `${student.days_group}|${student.time_slot}`;
        option.value = groupKey;
        option.textContent = `${GROUP_NAMES[student.days_group]} - ${convertTo12HourFormat(student.time_slot)}`;
        groupSelect.appendChild(option);
    });
    
    currentFilter.group = 'all';
    groupSelect.value = 'all';
    groupFilterSection.classList.remove('hidden');
}

function updateGroupStudentCount() {
    const countElement = document.getElementById('group-student-count');
    if (currentFilter.grade === 'all' || currentFilter.group === 'all') {
        countElement.textContent = '—';
        return;
    }
    
    // **THE FIX IS HERE:** Also splitting by '|' to correctly count.
    const [days, time] = currentFilter.group.split('|');
    const count = allStudents.filter(s => 
        s.grade === currentFilter.grade && s.days_group === days && s.time_slot === time
    ).length;
    countElement.textContent = count;
}

function renderTable(students) {
    const tableBody = document.getElementById('students-table-body');
    if (!students.length) {
        tableBody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-gray-400">لا يوجد طلاب يطابقون هذا البحث.</td></tr>`;
        return;
    }
    tableBody.innerHTML = students.map((student, index) => {
        const rowColor = GRADE_COLORS[student.grade] || 'bg-white';
        return `
        <tr class="hover:bg-gray-100 border-b border-gray-200 text-sm ${rowColor}">
            <td class="p-3 text-center text-slate-600">${index + 1}</td>
            <td class="p-3 font-semibold text-slate-800">${student.student_name}</td>
            <td class="p-3 text-slate-700">${GRADE_NAMES[student.grade] || ''}</td>
            <td class="p-3 text-slate-700">${SECTION_NAMES[student.section] || '—'}</td>
            <td class="p-3 text-slate-700">${GROUP_NAMES[student.days_group] || ''}</td>
            <td class="p-3 text-slate-700">${convertTo12HourFormat(student.time_slot)}</td>
            <td class="p-3 text-slate-700 text-left font-mono" dir="ltr">${student.student_phone}</td>
            <td class="p-3 text-slate-700 text-left font-mono" dir="ltr">${student.parent_phone}</td>
            <td class="p-3 text-xs text-slate-500 whitespace-nowrap">${formatFullDate(student.created_at)}</td>
        </tr>
    `}).join('');
}

function setupEventListeners() {
    document.getElementById('stats-section').addEventListener('click', e => {
        const card = e.target.closest('.filter-card');
        if (!card) return;
        
        document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        currentFilter.grade = card.dataset.grade;
        updateGroupFilterDropdown();
        applyFilters();
    });

    document.getElementById('group-filter').addEventListener('change', e => {
        currentFilter.group = e.target.value;
        applyFilters();
    });

    document.getElementById('search-input').addEventListener('input', e => {
        currentFilter.searchQuery = e.target.value;
        applyFilters();
    });
}

// Helper Functions
const convertTo12HourFormat = time24 => time24 ? new Date(`1970-01-01T${time24}Z`).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }) : '—';
const formatFullDate = dateStr => new Date(dateStr).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });