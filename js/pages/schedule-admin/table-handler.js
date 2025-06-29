// js/pages/schedule-admin/table-handler.js
import { translateGrade, translateSection, convertTo12HourArabic } from './ui-helpers.js';

// FIX: Removed 'allSchedules' from the creation function's arguments.
export function createTableHandler(elements, onEdit, onDelete) {
    let currentGradeFilter = 'all';

    // FIX: The `render` function now accepts the data array as its primary argument.
    function render(allSchedules = []) {
        let dataToRender = [...allSchedules];
        if (currentGradeFilter !== 'all') {
            dataToRender = dataToRender.filter(s => s.grade === currentGradeFilter);
        }
        if (elements.groupFilterSelect.value !== 'all') {
            dataToRender = dataToRender.filter(s => s.group_name === elements.groupFilterSelect.value);
        }

        elements.tableBody.innerHTML = '';
        elements.mobileCardView.innerHTML = '';
        if (dataToRender.length === 0) {
            const emptyHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد بيانات تطابق الفلتر.</td></tr>';
            elements.tableBody.innerHTML = emptyHTML;
            elements.mobileCardView.innerHTML = `<div class="text-center p-4 text-muted">لا توجد بيانات.</div>`;
            return;
        }

        const gradeColors = { first: 'grade-first', second: 'grade-second', third: 'grade-third' };
        dataToRender.forEach((s, index) => {
            if (!s.is_active) return;
            const colorClass = gradeColors[s.grade] || '';
            const actionButtonsHTML = `<button class="btn-action edit" data-group="${s.group_name}" data-grade="${s.grade}" data-section="${s.section || ''}" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn-action delete" data-id="${s.id}" title="حذف"><i class="fas fa-trash-alt"></i></button>`;
            
            const desktopRowHTML = `<tr class="${colorClass}"><td class="text-center">${index + 1}</td><td><span class="badge ${colorClass}">${translateGrade(s.grade)}</span></td><td>${s.section ? translateSection(s.section) : '---'}</td><td>${s.group_name}</td><td><span class="time-tag">${convertTo12HourArabic(s.time_slot)}</span></td><td>${new Date(s.created_at).toLocaleDateString('ar-EG')}</td><td><div class="action-buttons">${actionButtonsHTML}</div></td></tr>`;
            elements.tableBody.insertAdjacentHTML('beforeend', desktopRowHTML);

            const mobileCardHTML = `<div class="mobile-card ${colorClass}"><div class="card-header"><span class="group-name">${s.group_name}</span><span class="badge ${colorClass}">${translateGrade(s.grade)}</span></div><div class="card-body-grid"><div class="card-row"><span class="card-label">الشعبة:</span><span class="card-value">${s.section ? translateSection(s.section) : '---'}</span></div><div class="card-row"><span class="card-label">الموعد:</span><span class="card-value time-tag">${convertTo12HourArabic(s.time_slot)}</span></div></div><div class="card-footer action-buttons">${actionButtonsHTML}</div></div>`;
            elements.mobileCardView.insertAdjacentHTML('beforeend', mobileCardHTML);
        });
    }

    // FIX: The populate function also needs the up-to-date data.
    function populateGroupFilter(allSchedules = []) {
        const relevantSchedules = (currentGradeFilter === 'all') ? allSchedules : allSchedules.filter(s => s.grade === currentGradeFilter);
        const uniqueGroups = [...new Map(relevantSchedules.map(s => [s.group_name, s])).values()];
        elements.groupFilterSelect.innerHTML = '<option value="all">كل المجموعات</option>';
        uniqueGroups.forEach(s => elements.groupFilterSelect.innerHTML += `<option value="${s.group_name}">${s.group_name}</option>`);
    }

    // No changes needed below this line, they correctly call the internal render/populate functions.
    function handleGradeFilterClick(e, allSchedules) {
        if (e.target.tagName !== 'BUTTON') return;
        elements.gradeFiltersContainer.querySelector('.active')?.classList.remove('active');
        e.target.classList.add('active');
        currentGradeFilter = e.target.dataset.grade;
        populateGroupFilter(allSchedules);
        render(allSchedules);
    }
    
    // Attach delegated listeners
    elements.schedulesTableContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit');
        const deleteBtn = e.target.closest('.delete');
        if (editBtn) onEdit(editBtn.dataset);
        if (deleteBtn) onDelete(deleteBtn.dataset.id);
    });

    return { render, populateGroupFilter, handleGradeFilterClick };
}