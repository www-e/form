
import { GROUP_NAMES } from '../config.js';

let activeDropdown = null;

function closeAllDropdowns() {
    if (activeDropdown) {
        activeDropdown.classList.remove('active');
        activeDropdown.querySelector('.dropdown-options')?.classList.remove('show');
        activeDropdown.querySelector('.selected-option')?.setAttribute('aria-expanded', 'false');
        activeDropdown = null;
    }
}

function createDropdown(selectElement) {
    const container = selectElement.parentElement;
    container.querySelector('.custom-dropdown-container')?.remove();

    const customDropdown = document.createElement('div');
    customDropdown.className = 'custom-dropdown-container';

    const selectedOptionDisplay = document.createElement('div');
    selectedOptionDisplay.className = 'selected-option';
    selectedOptionDisplay.textContent = selectElement.options[0].textContent;
    selectedOptionDisplay.tabIndex = 0;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'dropdown-options';

    const updateOptions = () => {
        optionsContainer.innerHTML = '';
        Array.from(selectElement.options).forEach(option => {
            if (!option.value) return;

            const dropdownOption = document.createElement('div');
            dropdownOption.className = 'dropdown-option';
            dropdownOption.dataset.value = option.value;
            
            const timeText = document.createElement('span');
            timeText.className = 'time-text';
            timeText.textContent = option.textContent;
            dropdownOption.appendChild(timeText);

            if (option.dataset.status) {
                const tag = document.createElement('span');
                tag.className = `new-badge tag-${option.dataset.status}`;
                tag.textContent = option.dataset.text || '';
                dropdownOption.appendChild(tag);
            }

            dropdownOption.addEventListener('click', e => {
                e.stopPropagation();
                selectedOptionDisplay.textContent = option.textContent;
                selectElement.value = option.value;
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                closeAllDropdowns();
            });
            optionsContainer.appendChild(dropdownOption);
        });
    };

    selectedOptionDisplay.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = customDropdown.classList.contains('active');
        closeAllDropdowns();
        if (!isOpen) {
            customDropdown.classList.add('active');
            optionsContainer.classList.add('show');
            activeDropdown = customDropdown;
        }
    });

    selectElement.addEventListener('update', updateOptions);
    customDropdown.append(selectedOptionDisplay, optionsContainer);
    selectElement.style.display = 'none';
    container.appendChild(customDropdown);
    updateOptions();
}

export function initDropdowns() {
    document.querySelectorAll('.registration-form select').forEach(createDropdown);
    document.addEventListener('click', closeAllDropdowns);
    document.addEventListener('keydown', e => e.key === 'Escape' && closeAllDropdowns());
}

export function updateSelectOptions(select, options, placeholder, isTimeSelect = false) {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach(opt => {
        const option = document.createElement('option');
        if (isTimeSelect) {
            option.value = opt.time;
            option.textContent = convertToArabicTime(opt.time);
            option.dataset.status = opt.availability.status;
            option.dataset.text = opt.availability.text;
        } else {
            option.value = opt.value;
            option.textContent = opt.text;
        }
        select.appendChild(option);
    });
    select.dispatchEvent(new Event('update'));

    const customSelected = select.parentElement.querySelector('.selected-option');
    if (customSelected) {
        customSelected.textContent = placeholder;
    }
}

function convertToArabicTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'م' : 'ص';
    const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const convert = num => num.toString().replace(/[0-9]/g, w => arabicNumbers[+w]);
    return `${convert(hour12)}:${convert(minutes)} ${period}`;
}