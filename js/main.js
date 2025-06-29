// js/main.js
import { GRADE_NAMES, SECTION_NAMES } from './config.js';
import { getAvailableGroups, getAvailableTimes, submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal } from './ui/modals.js';

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const gradeSelect = form.querySelector('#grade');
    const sectionGroup = form.querySelector('#sectionGroup');
    const sectionSelect = form.querySelector('#section');
    const groupSelect = form.querySelector('#group');
    const timeSelect = form.querySelector('#time');
    const submitBtn = form.querySelector('.submit-btn');

    const modals = {
        success: new SuccessModal(),
        thirdGrade: new ThirdGradeModal(),
        restricted: new RestrictedGroupsModal(),
        duplicate: new DuplicateRegistrationModal()
    };
    
    initDropdowns();

    // Load dynamic schedule data from the database when the page starts
    await loadSchedulesFromDB();
    console.log("Schedules loaded from database.");

    gradeSelect.addEventListener('change', () => {
        const grade = gradeSelect.value;
        const isComplexGrade = ['second', 'third'].includes(grade);
        
        sectionGroup.style.display = isComplexGrade ? 'block' : 'none';
        sectionSelect.required = isComplexGrade;

        if (isComplexGrade) {
            const sections = grade === 'third'
                ? [{ value: 'general', text: SECTION_NAMES.general }, { value: 'statistics', text: SECTION_NAMES.statistics }]
                : [{ value: 'science', text: SECTION_NAMES.science }, { value: 'arts', text: SECTION_NAMES.arts }];
            updateSelectOptions(sectionSelect, sections, 'اختر الشعبة');
            if (grade === 'third') modals.thirdGrade.show();
        } else {
             sectionSelect.value = '';
        }
        updateGroupOptions();
    });

    sectionSelect.addEventListener('change', updateGroupOptions);
    groupSelect.addEventListener('change', updateTimeOptions);

    function updateGroupOptions() {
        const grade = gradeSelect.value;
        const section = sectionSelect.value;
        const groups = getAvailableGroups(grade, section);
        updateSelectOptions(groupSelect, groups, 'اختر المجموعة');
        groupSelect.disabled = !groups.length;
        updateTimeOptions();
    }

    function updateTimeOptions() {
        const grade = gradeSelect.value;
        const groupName = groupSelect.value;
        const section = sectionSelect.value;
        const times = getAvailableTimes(grade, groupName, section);
        updateSelectOptions(timeSelect, times, 'اختر الموعد', true);
        timeSelect.disabled = !times.length;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        
        try {
            const formData = new FormData(form);
            const result = await submitRegistration(formData);

            if (result.success) {
                modals.success.show({
                    studentName: formData.get('student_name'),
                    gradeName: GRADE_NAMES[formData.get('grade')],
                    groupName: formData.get('days_group'),
                    timeName: timeSelect.options[timeSelect.selectedIndex].textContent
                });
                form.reset();
                updateGroupOptions();
            } else {
                if (result.errorCode === 'DUPLICATE_STUDENT') {
                    modals.duplicate.show(formData.get('student_phone'));
                } else {
                    modals.restricted.show();
                }
            }
        } catch (error) {
            console.error('Submission failed:', error);
            alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane ms-2"></i> تسجيل';
        }
    });
});