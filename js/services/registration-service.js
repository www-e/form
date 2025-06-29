// js/services/registration-service.js
import { supabase } from '../supabase-client.js';

let allSchedules = []; // Cache for fetched schedules

export async function loadSchedulesFromDB() {
    try {
        const { data, error } = await supabase.from('schedules').select('*').eq('is_active', true);
        if (error) throw error;
        allSchedules = data;
        return allSchedules;
    } catch (error) {
        console.error("Failed to load schedules:", error.message);
        return [];
    }
}

export function getAvailableGroups(grade, section = null) {
    if (!grade) return [];
    
    return allSchedules
        .filter(s => s.grade === grade && (grade === 'first' || s.section === section))
        .map(s => ({ value: s.group_name, text: s.group_name })); // Use group_name for both value and text
}

export function getAvailableTimes(grade, groupName, section = null) {
    const schedule = allSchedules.find(s => 
        s.grade === grade && 
        s.group_name === groupName &&
        (grade === 'first' || s.section === section)
    );

    if (!schedule || !schedule.time_slots) return [];
    
    return schedule.time_slots.map(time => ({
        time,
        availability: { status: 'available', text: 'متاح' } 
    }));
}

async function checkExistingRegistration(phone, grade, section) {
    let query = supabase.from('registrations_2025_2026')
        .select('id', { count: 'exact' })
        .eq('student_phone', phone)
        .eq('grade', grade);

    if (grade === 'third' && section) {
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
        days_group: formData.get('days_group'), // This will now be the user-friendly name
        time_slot: formData.get('time_slot')
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