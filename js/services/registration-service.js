// js/services/registration-service.js
import { supabase } from '../supabase-client.js';

let allSchedules = []; // Cache for fetched schedules

export async function loadSchedulesFromDB() {
    try {
        // This is correct. It fetches all individual, active time slots from the database.
        const { data, error } = await supabase.from('schedules').select('*').eq('is_active', true);
        if (error) throw error;
        allSchedules = data;
        return allSchedules;
    } catch (error) {
        console.error("Failed to load schedules:", error.message);
        return [];
    }
}

// --- FIX START: This function now correctly finds unique group names ---
export function getAvailableGroups(grade, section = null) {
    if (!grade) return [];

    // First, filter the schedules to only those relevant for the selected grade and section.
    const relevantSchedules = allSchedules.filter(s => {
        if (s.grade !== grade) return false;
        // For first grade, section must be null. For others, it must match.
        return grade === 'first' ? s.section === null : s.section === section;
    });

    // From the relevant schedules, create a unique list of group names.
    // Using a Set is the most efficient way to prevent duplicate group names in the dropdown.
    const uniqueGroupNames = [...new Set(relevantSchedules.map(s => s.group_name))];

    // Map the unique names to the format needed for the dropdown.
    return uniqueGroupNames.map(name => ({ value: name, text: name }));
}
// --- FIX END ---


// --- FIX START: This function now correctly finds ALL time slots for a specific group ---
export function getAvailableTimes(grade, groupName, section = null) {
    if (!grade || !groupName) return [];

    // Filter all schedules to find every row that matches the selected grade, group name, and section.
    // This will correctly return an array of all matching time slots.
    const matchingTimeSlots = allSchedules.filter(s => {
        if (s.grade !== grade || s.group_name !== groupName) return false;
        return grade === 'first' ? s.section === null : s.section === section;
    });

    // Map the results to the format expected by the UI.
    // Each object in 'matchingTimeSlots' is a row from your DB with a single 'time_slot'.
    return matchingTimeSlots.map(schedule => ({
        time: schedule.time_slot,
        // In the future, you can add logic here to check group capacity.
        availability: { status: 'available', text: 'متاح' }
    }));
}
// --- FIX END ---


async function checkExistingRegistration(phone, grade, section) {
    let query = supabase.from('registrations_2025_2026')
        .select('id', { count: 'exact' })
        .eq('student_phone', phone)
        .eq('grade', grade);

    // This section logic is correct for checking duplicates.
    if (grade === 'third' && section) {
        query = query.eq('section', section);
    } else if (grade !== 'first' && grade !== 'third') {
        // Added this for second grade to be explicit
        query = query.eq('section', section);
    }

    const { error, count } = await query;
    if (error) throw error;
    return count > 0;
}

export async function submitRegistration(formData) {
    const registrationData = {
        student_name: formData.get('student_name'),
        student_phone: formData.get('student_phone'),
        parent_phone: formData.get('parent_phone'),
        grade: formData.get('grade'),
        section: formData.get('section') || null,
        days_group: formData.get('days_group'), // This is the group name
        time_slot: formData.get('time_slot')   // This is the specific time
    };
    
    const exists = await checkExistingRegistration(registrationData.student_phone, registrationData.grade, registrationData.section);
    if (exists) {
        return { success: false, error: 'الطالب مسجل بالفعل.', errorCode: 'DUPLICATE_STUDENT' };
    }

    const { error } = await supabase.from('registrations_2025_2026').insert([registrationData]);

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'الطالب مسجل بالفعل.', errorCode: 'DUPLICATE_STUDENT' };
        }
        throw error;
    }

    return { success: true };
}