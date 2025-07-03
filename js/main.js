// js/main.js
import { GRADE_NAMES } from './config.js';
import { getAvailableGroups, getAvailableTimes, submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal } from './ui/modals.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeUpdateModal();
    const form = document.getElementById('registrationForm');
    if (!form) return;

    // --- DOM Elements ---
    const gradeSelect = form.querySelector('#grade');
    // 'section' elements are no longer needed
    const groupSelect = form.querySelector('#group');
    const timeSelect = form.querySelector('#time');
    const submitBtn = form.querySelector('.submit-btn');

    // --- Modal Instances ---
    const modals = {
        success: new SuccessModal(),
        thirdGrade: new ThirdGradeModal(),
        restricted: new RestrictedGroupsModal(),
        duplicate: new DuplicateRegistrationModal()
    };
    
    // --- Initialize UI ---
    initDropdowns();
    await loadSchedulesFromDB();
    console.log("Schedules loaded and ready.");

    // --- Event Listeners & Logic ---
    gradeSelect.addEventListener('change', () => {
        if (gradeSelect.value === 'third') {
            modals.thirdGrade.show();
        }
        updateGroupOptions();
    });

    groupSelect.addEventListener('change', updateTimeOptions);

    function updateGroupOptions() {
        const grade = gradeSelect.value;
        // The call is now simpler, without 'section'
        const groups = getAvailableGroups(grade);
        updateSelectOptions(groupSelect, groups, 'اختر المجموعة');
        groupSelect.disabled = !groups.length;
        updateTimeOptions(); // Also update time options when groups change
    }

    function updateTimeOptions() {
        const grade = gradeSelect.value;
        const groupName = groupSelect.value;
        // The call is now simpler, without 'section'
        const times = getAvailableTimes(grade, groupName);
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

    // Initial population
    updateGroupOptions();
});