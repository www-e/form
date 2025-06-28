
import { supabase } from '../supabase-client.js';
import { SCHEDULES, RESTRICTED_GROUPS } from '../config.js';


export async function checkExistingRegistration(phone, grade, section) {
    if (!phone || !grade) return false;

    let query = supabase.from('registrations_2025_2026')
        .select('id', { count: 'exact' })
        .eq('student_phone', phone)
        .eq('grade', grade);

    if (grade === 'third' && section) {
        query = query.eq('section', section);
    }

    const { error, count } = await query;
    if (error) {
        console.error("Error checking registration:", error);
        return false; 
    }
    return count > 0;
}

export async function submitRegistration(formData) {
    const registrationData = {
        student_name: formData.get('student_name'),
        student_phone: formData.get('student_phone'),
        parent_phone: formData.get('parent_phone'),
        grade: formData.get('grade'),
        section: formData.get('section') || null,
        days_group: formData.get('days_group'),
        time_slot: formData.get('time_slot')
    };

    const { error } = await supabase.from('registrations_2025_2026').insert([registrationData]);

    if (error) {
        if (error.code === '23505') {
            return { success: false, errorCode: 'DUPLICATE_STUDENT' };
        }
        throw error;
    }

    return { success: true };
}


function isRestricted(grade, section, group, time) {
    if (!RESTRICTED_GROUPS[grade]?.[section]?.[group]) return false;
    return RESTRICTED_GROUPS[grade][section][group].includes(time);
}

function getAvailabilityStatus(grade, section, group, time) {
    if (isRestricted(grade, section, group, time)) {
        return { status: 'full', text: 'مكتملة' };
    }
    const rand = Math.random();
    if (rand < 0.2) return { status: 'full', text: 'مكتملة' };
    if (rand < 0.5) return { status: 'limited', text: 'عدد محدود' };
    return { status: 'available', text: 'متاحة' };
}

export function getAvailableGroups(grade, section = null) {
    if (!grade) return [];
    if (grade === 'third') {
        return section ? Object.keys(SCHEDULES.third[section] || {}) : [];
    }
    return Object.keys(SCHEDULES[grade] || {});
}

export function getAvailableTimes(grade, group, section = null) {
    let times = grade === 'third' ? SCHEDULES.third[section]?.[group] : SCHEDULES[grade]?.[group];
    if (!times) return [];
    return times.map(time => ({
        time,
        availability: getAvailabilityStatus(grade, section, group, time)
    }));
}