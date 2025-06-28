// A simple Supabase client setup.
const SUPABASE_URL = 'https://ocnqgfdsozhxowrvieqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbnFnZmRzb3poeG93cnZpZXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjYyOTUsImV4cCI6MjA2NjcwMjI5NX0.rNxaY22-rDx3s-Lso5i_8ZKce-asRHZAN-w__BmJOBI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Data Mappings for Display ---
const GRADE_NAMES = { 'first': 'الصف الأول', 'second': 'الصف الثاني', 'third': 'الصف الثالث' };
const GRADE_COLORS = { 'first': 'bg-blue-50', 'second': 'bg-green-50', 'third': 'bg-orange-50' };
const SECTION_NAMES = { 'general': 'علمي رياضة', 'statistics': 'إحصاء (أدبي)', 'science': 'علمي', 'arts': 'أدبي' };
const GROUP_NAMES = { 'sat_tue': 'سبت و ثلاثاء', 'sun_wed': 'أحد و أربعاء', 'mon_thu': 'اثنين و خميس', 'sat_tue_thu': 'سبت، ثلاثاء، خميس', 'sun_wed_fri': 'أحد، أربعاء، جمعة' };

// --- Global State ---
let currentFilter = { grade: 'all', searchQuery: '' };

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data, error } = await supabase.from('registrations_2025_2026').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        window.allStudents = data;
        updateDashboard();
        setupEventListeners();
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('students-table-body').innerHTML = `<tr><td colspan="9" class="p-8 text-center text-red-500">فشل في تحميل البيانات. تأكد من صلاحيات الوصول (RLS).</td></tr>`;
    }
});

// --- Core Functions ---
function updateDashboard() {
    updateStatistics(window.allStudents);
    let filteredStudents = window.allStudents;
    if (currentFilter.grade !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.grade === currentFilter.grade);
    }
    const query = currentFilter.searchQuery.trim().toLowerCase();
    if (query) {
        filteredStudents = filteredStudents.filter(s =>
            s.student_name.toLowerCase().includes(query) || s.student_phone.includes(query) || s.parent_phone.includes(query)
        );
    }
    renderTable(filteredStudents);
}

function updateStatistics(allStudents) {
    document.getElementById('total-students').textContent = allStudents.length;
    document.getElementById('grade1-count').textContent = allStudents.filter(s => s.grade === 'first').length;
    document.getElementById('grade2-count').textContent = allStudents.filter(s => s.grade === 'second').length;
    document.getElementById('grade3-count').textContent = allStudents.filter(s => s.grade === 'third').length;
}

function renderTable(students) {
    const tableBody = document.getElementById('students-table-body');
    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-gray-400">لا يوجد طلاب يطابقون هذا البحث.</td></tr>`;
        return;
    }
    tableBody.innerHTML = students.map((student, index) => {
        const rowColor = GRADE_COLORS[student.grade] || 'bg-white';
        
        // **FIX 4: Format both date and time**
        const formattedDate = new Date(student.created_at).toLocaleString('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
        
        // **FIX 1: Format time_slot**
        const formattedTimeSlot = student.time_slot ? convertTo12HourFormat(student.time_slot) : '—';

        // **FIX 2 & 3: Add new columns, numbering, and phone alignment**
        return `
        <tr class="hover:bg-gray-100 border-b border-gray-200 text-sm ${rowColor}">
            <td class="p-3 text-center text-gray-600">${index + 1}</td>
            <td class="p-3 font-semibold text-gray-900">${student.student_name}</td>
            <td class="p-3 text-gray-700">${GRADE_NAMES[student.grade] || student.grade}</td>
            <td class="p-3 text-gray-700">${SECTION_NAMES[student.section] || '—'}</td>
            <td class="p-3 text-gray-700">${GROUP_NAMES[student.days_group] || student.days_group}</td>
            <td class="p-3 text-gray-700">${formattedTimeSlot}</td>
            <td class="p-3 text-gray-700 text-left" dir="ltr">${student.student_phone}</td>
            <td class="p-3 text-gray-700 text-left" dir="ltr">${student.parent_phone}</td>
            <td class="p-3 text-xs text-gray-500">${formattedDate}</td>
        </tr>
    `}).join('');
}

function setupEventListeners() {
    const filterCards = document.querySelectorAll('.filter-card');
    filterCards.forEach(card => {
        card.addEventListener('click', () => {
            filterCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentFilter.grade = card.dataset.grade;
            updateDashboard();
        });
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', e => {
        currentFilter.searchQuery = e.target.value;
        updateDashboard();
    });
}

// --- Helper Functions ---
function convertTo12HourFormat(time24) {
    if (!time24) return '—';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'م' : 'ص';
    const hour12 = h % 12 || 12; // Converts `0` to `12`
    return `${hour12}:${minutes} ${period}`;
}