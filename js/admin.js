// js/admin.js
import { initializeUpdateModal } from './components/update-modal.js';

// --- Page Loader Logic ---
const pageLoader = document.getElementById('page-loader');
document.querySelectorAll('.nav-link-item').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.hostname === window.location.hostname) {
            pageLoader?.classList.remove('hidden');
        }
    });
});

const SUPABASE_URL = 'https://ocnqgfdsozhxowrvieqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbnFnZmRzb3poeG93cnZpZXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjYyOTUsImV4cCI6MjA2NjcwMjI5NX0.rNxaY22-rDx3s-Lso5i_8ZKce-asRHZAN-w__BmJOBI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Data Mappings & Colors ---
const GRADE_NAMES = { 'first': 'الصف الأول', 'second': 'الصف الثاني', 'third': 'الصف الثالث' };
const GRADE_COLORS = { 'first': 'bg-blue-50', 'second': 'bg-green-50', 'third': 'bg-orange-50' };

// --- Global State ---
let allStudents = [];
let currentFilter = { grade: 'all', group: 'all', searchQuery: '' };
let studentDetailModal; // NEW: Variable to hold the modal instance

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    initializeUpdateModal();
    if(pageLoader) pageLoader.classList.add('hidden');
    // NEW: Initialize the Bootstrap modal instance once the DOM is ready
    studentDetailModal = new bootstrap.Modal(document.getElementById('studentDetailModal'));

    try {
        const { data, error } = await supabase.from('registrations_2025_2026').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allStudents = data;
        initializeDashboard();
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('students-table-body').innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500">فشل في تحميل البيانات. تأكد من صلاحيات الوصول (RLS).</td></tr>`;
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
    let filteredStudents = [...allStudents];
    if (currentFilter.grade !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.grade === currentFilter.grade);
    }
    if (currentFilter.group !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.days_group === currentFilter.group);
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
    const counts = { all: allStudents.length, first: allStudents.filter(s => s.grade === 'first').length, second: allStudents.filter(s => s.grade === 'second').length, third: allStudents.filter(s => s.grade === 'third').length, };
    const cardsData = [
        { grade: 'all', label: 'إجمالي الطلاب', count: counts.all, icon: 'fa-users', color: 'violet' },
        { grade: 'first', label: 'الصف الأول', count: counts.first, icon: 'fa-child', color: 'blue' },
        { grade: 'second', label: 'الصف الثاني', count: counts.second, icon: 'fa-user-graduate', color: 'green' },
        { grade: 'third', label: 'الصف الثالث', count: counts.third, icon: 'fa-crown', color: 'orange' }
    ];
    container.innerHTML = cardsData.map(card => `<div data-grade="${card.grade}" class="filter-card group bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-${card.color}-400"><div class="text-center sm:text-right"><p class="text-gray-500 text-xs sm:text-sm font-medium">${card.label}</p><p class="text-2xl sm:text-3xl font-bold">${card.count}</p></div><div class="bg-${card.color}-100 text-${card.color}-600 rounded-full p-3 mt-2 sm:mt-0 transition-transform group-hover:scale-110"><i class="fas ${card.icon} fa-fw"></i></div></div>`).join('');
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
    const uniqueGroups = [...new Set(studentsInGrade.map(s => s.days_group))];
    groupSelect.innerHTML = '<option value="all">كل المجموعات</option>';
    uniqueGroups.forEach(groupName => { groupSelect.innerHTML += `<option value="${groupName}">${groupName}</option>`; });
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
    const count = allStudents.filter(s => s.grade === currentFilter.grade && s.days_group === currentFilter.group).length;
    countElement.textContent = count;
}

function renderTable(students) {
    const tableBody = document.getElementById('students-table-body');
    if (!students.length) {
        tableBody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-400">لا يوجد طلاب يطابقون هذا البحث.</td></tr>`;
        return;
    }
    tableBody.innerHTML = students.map((student, index) => {
        const rowColor = GRADE_COLORS[student.grade] || 'bg-white';
        // NEW: 1. Added `data-id` to the <tr> for easy identification.
        // NEW: 2. Added `cursor-pointer` to make the row look clickable.
        // NEW: 3. Wrapped phone numbers in `<a>` tags for smart WhatsApp links.
        // NEW: 4. Added `onclick="event.stopPropagation();"` to the links to prevent the row click from firing when a link is clicked.
        return `
        <tr class="hover:bg-gray-100 border-b border-gray-200 text-sm cursor-pointer ${rowColor}" data-id="${student.id}">
            <td class="p-3 text-center text-slate-600">${index + 1}</td>
            <td class="p-3 font-semibold text-slate-800">${student.student_name}</td>
            <td class="p-3 text-slate-700">${GRADE_NAMES[student.grade] || ''}</td>
            <td class="p-3 text-slate-700">${student.days_group || '—'}</td>
            <td class="p-3 text-slate-700">${convertTo12HourFormat(student.time_slot)}</td>
            <td class="p-3 text-slate-700 text-left font-mono" dir="ltr">
                <a href="https://wa.me/20${student.student_phone.substring(1)}" target="_blank" class="hover:underline text-green-600 font-semibold" onclick="event.stopPropagation();">
                    <i class="fab fa-whatsapp"></i> ${student.student_phone}
                </a>
            </td>
            <td class="p-3 text-slate-700 text-left font-mono" dir="ltr">
                <a href="https://wa.me/20${student.parent_phone.substring(1)}" target="_blank" class="hover:underline text-green-600 font-semibold" onclick="event.stopPropagation();">
                    <i class="fab fa-whatsapp"></i> ${student.parent_phone}
                </a>
            </td>
            <td class="p-3 text-xs text-slate-500 whitespace-nowrap">${formatFullDate(student.created_at)}</td>
        </tr>
    `}).join('');
}

// NEW: This function builds the HTML for the modal body
function renderModalContent(student) {
    const modalHeader = document.querySelector('#studentDetailModal .modal-header');
    const modalBody = document.getElementById('modal-body-content');
    
    // Student's first initial for the avatar
    const studentInitial = student.student_name.charAt(0).toUpperCase();

    // --- 1. Build the Header ---
    modalHeader.innerHTML = `
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        <div class="modal-header-avatar">${studentInitial}</div>
        <h5 class="modal-header-name">${student.student_name}</h5>
        <p class="modal-header-grade">${GRADE_NAMES[student.grade] || 'غير محدد'}</p>
    `;

    // --- 2. Build the Body ---
    modalBody.innerHTML = `
        <div class="modal-section">
            <h6 class="modal-section-title">بيانات التسجيل</h6>
            <div class="details-grid">
                <div class="detail-pair">
                    <i class="fas fa-users detail-pair-icon"></i>
                    <div class="detail-pair-content">
                        <p class="detail-pair-label">المجموعة</p>
                        <p class="detail-pair-value">${student.days_group || '—'}</p>
                    </div>
                </div>
                <div class="detail-pair">
                    <i class="fas fa-clock detail-pair-icon"></i>
                    <div class="detail-pair-content">
                        <p class="detail-pair-label">الموعد</p>
                        <p class="detail-pair-value">${convertTo12HourFormat(student.time_slot) || '—'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h6 class="modal-section-title">بيانات التواصل</h6>
            <div class="details-grid">
                <div class="detail-pair">
                    <i class="fas fa-mobile-alt detail-pair-icon"></i>
                    <div class="detail-pair-content">
                        <p class="detail-pair-label">رقم الطالب</p>
                        <p class="detail-pair-value">
                            <a href="https://wa.me/20${student.student_phone.substring(1)}" target="_blank">
                                ${student.student_phone} <i class="fab fa-whatsapp"></i>
                            </a>
                        </p>
                    </div>
                </div>
                <div class="detail-pair">
                    <i class="fas fa-user-shield detail-pair-icon"></i>
                    <div class="detail-pair-content">
                        <p class="detail-pair-label">رقم ولي الأمر</p>
                        <p class="detail-pair-value">
                            <a href="https://wa.me/20${student.parent_phone.substring(1)}" target="_blank">
                                ${student.parent_phone} <i class="fab fa-whatsapp"></i>
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-section">
             <h6 class="modal-section-title">معلومات إضافية</h6>
             <div class="details-grid">
                <div class="detail-pair">
                    <i class="fas fa-calendar-check detail-pair-icon"></i>
                    <div class="detail-pair-content">
                        <p class="detail-pair-label">تاريخ التسجيل</p>
                        <p class="detail-pair-value">${formatFullDate(student.created_at)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// NEW: A helper function to avoid repeating HTML for each row in the modal
function createModalDetailRow(icon, label, value) {
    return `
        <div class="flex items-center p-3 rounded-lg" style="background-color: var(--gradient-bg-subtle);">
            <i class="fas ${icon} text-lg w-8 text-center" style="color: var(--primary);"></i>
            <span class="font-semibold text-gray-600">${label}:</span>
            <span class="mr-auto font-bold text-gray-800">${value}</span>
        </div>
    `;
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

    // NEW: Delegated event listener for the entire table body.
    // It listens for clicks, finds the closest parent row with a `data-id`,
    // finds the student data, and shows the modal.
    document.getElementById('students-table-body').addEventListener('click', e => {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;

        const studentId = row.dataset.id;
        const student = allStudents.find(s => s.id === studentId);
        if (student) {
            renderModalContent(student);
            studentDetailModal.show();
        }
    });
}

// Helper Functions
const convertTo12HourFormat = time24 => time24 ? new Date(`1970-01-01T${time24}Z`).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }) : '—';
const formatFullDate = dateStr => new Date(dateStr).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });