// js/services/schedule-service.js
import { supabase } from '../supabase-client.js';

export async function fetchSchedules() {
    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function deleteScheduleById(id) {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
}

export async function saveSchedule(records, isEditing, oldGroupData) {
    // If editing, first delete all old entries for that group to avoid conflicts.
    if (isEditing && oldGroupData) {
        const { grade, section, group } = oldGroupData;
        const { error: deleteError } = await supabase.from('schedules').delete().match({ 
            group_name: group, 
            grade: grade, 
            section: (section || null) 
        });
        if (deleteError) throw deleteError;
    }
    
    // Insert the new or updated set of records.
    const { error: insertError } = await supabase.from('schedules').insert(records);
    if (insertError) throw insertError;
}