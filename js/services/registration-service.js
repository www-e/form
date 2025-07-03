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

export function getAvailableGroups(grade) {
    if (!grade) return [];
    // The logic is now simpler: just filter schedules by the selected grade.
    const relevantSchedules = allSchedules.filter(s => s.grade === grade);
    const uniqueGroupNames = [...new Set(relevantSchedules.map(s => s.group_name))];
    return uniqueGroupNames.map(name => ({ value: name, text: name }));
}

export function getAvailableTimes(grade, groupName) {
    if (!grade || !groupName) return [];
    // Filter is simpler, no longer needs to check for section.
    const matchingTimeSlots = allSchedules.filter(s => s.grade === grade && s.group_name === groupName);
    return matchingTimeSlots.map(schedule => ({
        time: schedule.time_slot,
        availability: { status: 'available', text: 'متاح' }
    }));
}

async function checkExistingRegistration(phone, grade) {
    // The query is now simplified and works for all grades the same way.
    const { error, count } = await supabase.from('registrations_2025_2026')
        .select('id', { count: 'exact' })
        .eq('student_phone', phone)
        .eq('grade', grade);
        
    if (error) throw error;
    return count > 0;
}

export async function submitRegistration(formData) {
    const registrationData = {
        student_name: formData.get('student_name'),
        student_phone: formData.get('student_phone'),
        parent_phone: formData.get('parent_phone'),
        grade: formData.get('grade'),
        // 'section' is no longer part of the data being sent.
        days_group: formData.get('days_group'),
        time_slot: formData.get('time_slot')
    };
    
    // Check for duplicates without the section logic.
    const exists = await checkExistingRegistration(registrationData.student_phone, registrationData.grade);
    if (exists) {
        return { success: false, error: 'الطالب مسجل بالفعل.', errorCode: 'DUPLICATE_STUDENT' };
    }

    const { error } = await supabase.from('registrations_2025_2026').insert([registrationData]);

    if (error) {
        if (error.code === '23505') { // Handles the new simplified unique index
            return { success: false, error: 'الطالب مسجل بالفعل.', errorCode: 'DUPLICATE_STUDENT' };
        }
        throw error;
    }

    return { success: true };
}