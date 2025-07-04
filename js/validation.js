

const rules = {
    studentName: {
        validate: value => /^[\u0600-\u06FF\s]{3,}$/.test(value),
        message: 'يجب أن يكون الاسم 3 أحرف عربية على الأقل.'
    },
    studentPhone: {
        validate: value => /^01[0125]\d{8}$/.test(value),
        message: 'رقم الهاتف يجب أن يكون 11 رقماً ويبدأ بـ 010, 011, 012, أو 015.'
    },
    parentPhone: {
        validate: value => /^01[0125]\d{8}$/.test(value),
        message: 'رقم ولي الأمر يجب أن يكون 11 رقماً ويبدأ بـ 010, 011, 012, أو 015.'
    },
    grade: {
        validate: value => value !== '',
        message: 'يرجى اختيار الصف الدراسي.'
    },
    section: {
        validate: (value, form) => {
            const grade = form.querySelector('#grade').value;
            return !['second', 'third'].includes(grade) || value !== '';
        },
        message: 'يرجى اختيار الشعبة.'
    },
    group: {
        validate: value => value !== '',
        message: 'يرجى اختيار المجموعة.'
    },
    time: {
        validate: value => value !== '',
        message: 'يرجى اختيار الموعد.'
    },
};

const getFieldElement = (form, fieldName) => form.querySelector(`#${fieldName}`);

const showError = (field, message) => {
    field.classList.add('invalid');
    const messageDiv = field.parentElement.querySelector('.validation-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
    }
};

const clearError = (field) => {
    field.classList.remove('invalid');
    const messageDiv = field.parentElement.querySelector('.validation-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
};

export const validateField = (fieldName, form) => {
    const field = getFieldElement(form, fieldName);
    const rule = rules[fieldName];
    if (!rule) return true;

    if (rule.validate(field.value, form)) {
        clearError(field);
        return true;
    } else {
        showError(field, rule.message);
        return false;
    }
};

export const validateForm = (form) => {
    let isFormValid = true;
    for (const fieldName in rules) {
        if (!validateField(fieldName, form)) {
            isFormValid = false;
        }
    }
    return isFormValid;
};

export const initRealtimeValidation = (form, onPhoneBlur) => {

    const studentName = getFieldElement(form, 'studentName');
    studentName.addEventListener('input', () => {
        studentName.value = studentName.value.replace(/[^ \u0600-\u06FF]/g, '');
        validateField('studentName', form);
    });


    ['studentPhone', 'parentPhone'].forEach(fieldName => {
        const phoneField = getFieldElement(form, fieldName);
        phoneField.addEventListener('input', () => {
            phoneField.value = phoneField.value.replace(/\D/g, '').slice(0, 11);
            validateField(fieldName, form);
        });

        if (fieldName === 'studentPhone') {
            phoneField.addEventListener('blur', onPhoneBlur);
        }
    });


    ['grade', 'section', 'group', 'time'].forEach(fieldName => {
        const selectField = getFieldElement(form, fieldName);
        selectField.addEventListener('change', () => validateField(fieldName, form));
    });
};