
import { GRADE_NAMES, SECTION_NAMES, GROUP_NAMES } from './config.js';
import { getAvailableGroups, getAvailableTimes, submitRegistration, checkExistingRegistration } from './services/registration-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal } from './ui/modals.js';
import { initRealtimeValidation, validateForm, validateField } from './validation.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const { grade, section, group, time, studentPhone } = form.elements;
    const sectionGroup = form.querySelector('#sectionGroup');
    const submitBtn = form.querySelector('.submit-btn');

    const modals = {
        success: new SuccessModal(),
        thirdGrade: new ThirdGradeModal(),
        restricted: new RestrictedGroupsModal(),
        duplicate: new DuplicateRegistrationModal()
    };
    
    initDropdowns();
    
    const handlePhoneBlur = async () => {
        if (validateField('studentPhone', form)) {
            const exists = await checkExistingRegistration(studentPhone.value, grade.value, section.value);
            if (exists) {
                modals.duplicate.show(studentPhone.value);
            }
        }
    };
    
    initRealtimeValidation(form, handlePhoneBlur);

    grade.addEventListener('change', () => {
        const isComplex = ['second', 'third'].includes(grade.value);
        sectionGroup.style.display = isComplex ? 'block' : 'none';
        section.value = '';
        
        if (isComplex) {
            const sections = grade.value === 'third'
                ? [{ v: 'general', t: SECTION_NAMES.general }, { v: 'statistics', t: SECTION_NAMES.statistics }]
                : [{ v: 'science', t: SECTION_NAMES.science }, { v: 'arts', t: SECTION_NAMES.arts }];
            updateSelectOptions(section, sections.map(s => ({ value: s.v, text: s.t })), 'اختر الشعبة');
            if (grade.value === 'third') modals.thirdGrade.show();
        }
        updateGroupOptions();
    });

    section.addEventListener('change', updateGroupOptions);
    group.addEventListener('change', updateTimeOptions);

    function updateGroupOptions() {
        const groups = getAvailableGroups(grade.value, section.value).map(g => ({ value: g, text: GROUP_NAMES[g] }));
        updateSelectOptions(group, groups, 'اختر المجموعة');
        group.disabled = !groups.length;
        updateTimeOptions();
    }

    function updateTimeOptions() {
        const times = getAvailableTimes(grade.value, group.value, section.value);
        updateSelectOptions(time, times, 'اختر الموعد', true);
        time.disabled = !times.length;
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!validateForm(form)) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        
        try {
            const formData = new FormData(form);
            const result = await submitRegistration(formData);

            if (result.success) {
                modals.success.show({
                    studentName: formData.get('student_name'),
                    gradeName: GRADE_NAMES[formData.get('grade')],
                    groupName: GROUP_NAMES[formData.get('days_group')],
                    timeName: time.options[time.selectedIndex].textContent
                });
                form.reset();
                [grade, section, group, time].forEach(el => el.dispatchEvent(new Event('change')));
            } else {
                result.errorCode === 'DUPLICATE_STUDENT' ? modals.duplicate.show(formData.get('student_phone')) : modals.restricted.show();
            }
        } catch (error) {
            alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane ms-2"></i> تسجيل';
        }
    });
});