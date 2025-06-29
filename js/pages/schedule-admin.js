// js/pages/schedule-admin.js
import { supabase } from '../supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const form = document.getElementById('scheduleForm');
    const formTitle = document.getElementById('formTitle');
    const scheduleIdInput = document.getElementById('scheduleId');
    const gradeSelect = document.getElementById('grade');
    const sectionContainer = document.getElementById('sectionContainer');
    const sectionSelect = document.getElementById('section');
    const groupNameSelect = document.getElementById('group_name_select');
    const groupNameCustomInput = document.getElementById('group_name_custom');
    const timeSlotsInput = document.getElementById('time_slots');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const tableBody = document.getElementById('schedulesTableBody');
    const loader = document.getElementById('loader');
    const tableContainer = document.getElementById('schedulesTableContainer');

    let isEditing = false;
    
    // --- Initialize Tagify Time Picker ---
    const timeSuggestions = [
        "09:00", "09:15", "09:30", "09:45",
        "10:00", "10:15", "10:30", "10:45",
        "11:00", "11:15", "11:30", "11:45",
        "12:00", "12:15", "12:30", "12:45",
        "13:00", "13:15", "13:30", "13:45",
        "14:00", "14:15", "14:30", "14:45",
        "15:00", "15:15", "15:30", "15:45",
        "16:00", "16:15", "16:30", "16:45",
        "17:00", "17:15", "17:30", "17:45",
        "18:00", "18:15", "18:30", "18:45"
    ];

    const tagify = new Tagify(timeSlotsInput, {
        whitelist: timeSuggestions,
        dropdown: {
            maxItems: 10,
            enabled: 0, 
            closeOnSelect: false 
        },
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // Enforce HH:MM format
        enforceWhitelist: false, // Allow custom times
        originalInputValueFormat: valuesArr => valuesArr.map(item => item.value).join(',') // Store as comma-separated string
    });
    
    // --- Initial Load ---
    loadSchedules();

    // --- Event Listeners ---
    gradeSelect.addEventListener('change', handleGradeChange);
    groupNameSelect.addEventListener('change', handleGroupNameChange);
    form.addEventListener('submit', handleSave);
    cancelBtn.addEventListener('click', resetForm);

    // --- Functions ---
    function handleGradeChange() {
        const grade = gradeSelect.value;
        const isComplex = ['second', 'third'].includes(grade);
        sectionContainer.style.display = isComplex ? 'block' : 'none';
        sectionSelect.required = isComplex;
        if (isComplex) populateSections(grade);
    }

    function populateSections(grade) {
        sectionSelect.innerHTML = '<option value="" disabled selected>اختر الشعبة...</option>';
        const sections = grade === 'second'
            ? [{ v: 'science', t: 'علمي' }, { v: 'arts', t: 'أدبي' }]
            : [{ v: 'general', t: 'علمي رياضة' }, { v: 'statistics', t: 'إحصاء (أدبي)' }];
        sections.forEach(sec => sectionSelect.innerHTML += `<option value="${sec.v}">${sec.t}</option>`);
    }

    function handleGroupNameChange() {
        if (groupNameSelect.value === 'custom') {
            groupNameCustomInput.style.display = 'block';
            groupNameCustomInput.required = true;
        } else {
            groupNameCustomInput.style.display = 'none';
            groupNameCustomInput.required = false;
        }
    }

    async function loadSchedules() {
        showLoader(true);
        try {
            const { data, error } = await supabase.from('schedules').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            renderTable(data);
        } catch (error) {
            alert('خطأ في تحميل المواعيد: ' + error.message);
        } finally {
            showLoader(false);
        }
    }

    function renderTable(schedules) {
        tableBody.innerHTML = '';
        if (schedules.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد مجموعات حالياً.</td></tr>';
            return;
        }
        schedules.forEach(s => {
            const isInactive = !s.is_active;
            const row = document.createElement('tr');
            if (isInactive) {
                row.classList.add('table-secondary', 'text-muted');
                row.style.textDecoration = 'line-through';
            }
            row.innerHTML = `
                <td>${translateGrade(s.grade)}</td>
                <td>${s.section ? translateSection(s.section) : '---'}</td>
                <td>${s.group_name}</td>
                <td><div class="time-slot-tags">${s.time_slots.map(t => `<span class="time-tag">${t}</span>`).join('')}</div></td>
                <td>
                    <button class="action-btn edit-btn" data-id="${s.id}" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${s.id}" data-active="${s.is_active}" title="${isInactive ? 'إعادة تفعيل' : 'تعطيل'}">
                        <i class="fas ${isInactive ? 'fa-undo' : 'fa-trash-alt'}"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        tableBody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => handleEdit(btn.dataset.id, schedules)));
        tableBody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => handleDelete(btn.dataset.id, btn.dataset.active === 'true')));
    }

    function handleEdit(id, schedules) {
        isEditing = true;
        const s = schedules.find(sc => sc.id === id);
        if (!s) return;

        formTitle.textContent = 'تعديل المجموعة';
        scheduleIdInput.value = s.id;
        gradeSelect.value = s.grade;
        gradeSelect.dispatchEvent(new Event('change'));
        if (s.section) sectionSelect.value = s.section;
        
        const standardGroup = Array.from(groupNameSelect.options).find(opt => opt.value === s.group_name);
        if (standardGroup) {
            groupNameSelect.value = s.group_name;
            groupNameCustomInput.style.display = 'none';
        } else {
            groupNameSelect.value = 'custom';
            groupNameCustomInput.style.display = 'block';
            groupNameCustomInput.value = s.group_name;
        }

        tagify.removeAllTags();
        tagify.addTags(s.time_slots);

        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
        cancelBtn.style.display = 'inline-block';
        window.scrollTo({ top: formCard.offsetTop - 20, behavior: 'smooth' });
    }

    async function handleDelete(id, isActive) {
        const actionText = isActive ? 'تعطيل' : 'إعادة تفعيل';
        const confirmMsg = `هل أنت متأكد من ${actionText} هذه المجموعة؟\n(${actionText} المجموعة سيخفيها من فورم التسجيل للطلاب الجدد).`;
        if (!confirm(confirmMsg)) return;

        try {
            const { error } = await supabase.from('schedules').update({ is_active: !isActive }).eq('id', id);
            if (error) throw error;
            alert(`تم ${actionText} المجموعة بنجاح!`);
            loadSchedules();
        } catch (error) {
            alert('خطأ: ' + error.message);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        const groupName = groupNameSelect.value === 'custom' ? groupNameCustomInput.value.trim() : groupNameSelect.value;
        const timeSlots = tagify.value.map(tag => tag.value);

        const scheduleData = {
            grade: gradeSelect.value,
            section: ['second', 'third'].includes(gradeSelect.value) ? sectionSelect.value : null,
            group_name: groupName,
            time_slots: timeSlots,
        };
        
        if (!scheduleData.grade || !scheduleData.group_name || scheduleData.time_slots.length === 0) {
            alert('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }

        try {
            if (isEditing) {
                const { error } = await supabase.from('schedules').update(scheduleData).eq('id', scheduleIdInput.value);
                if (error) throw error;
                alert('تم التعديل بنجاح!');
            } else {
                const { error } = await supabase.from('schedules').insert([scheduleData]);
                if (error) throw error;
                alert('تمت الإضافة بنجاح!');
            }
            resetForm();
            loadSchedules();
        } catch (error) {
            if (error.code === '23505') {
                 alert('خطأ: هذه المجموعة موجودة بالفعل لنفس الصف والشعبة. لا يمكن تكرار اسم المجموعة.');
            } else {
                alert('حدث خطأ: ' + error.message);
            }
        }
    }

    function resetForm() {
        isEditing = false;
        form.reset();
        scheduleIdInput.value = '';
        tagify.removeAllTags();
        formTitle.textContent = 'إضافة مجموعة جديدة';
        saveBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة المجموعة';
        cancelBtn.style.display = 'none';
        sectionContainer.style.display = 'none';
        groupNameCustomInput.style.display = 'none';
    }
    
    function showLoader(show) {
        loader.style.display = show ? 'block' : 'none';
        tableContainer.style.display = show ? 'none' : 'block';
    }

    function translateGrade(g) { return { first: 'الأول', second: 'الثاني', third: 'الثالث' }[g] || g; }
    function translateSection(s) { return { general: 'علمي رياضة', statistics: 'إحصاء', science: 'علمي', arts: 'أدبي' }[s] || s; }
});