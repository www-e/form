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

        // --- FIX START ---
        // Build the delete query explicitly to handle NULL sections correctly.
        // The `dataset.section` for a first-grade group is an empty string ("").
        // We need to ensure this translates to an `IS NULL` check in the database.
        let deleteQuery = supabase
            .from('schedules')
            .delete()
            .eq('group_name', group)
            .eq('grade', grade);

        // If the section is empty/falsy (for first grade), use .is() for a strict NULL check.
        // Otherwise (for second/third grade), use .eq() with the section value.
        deleteQuery = section ? deleteQuery.eq('section', section) : deleteQuery.is('section', null);

        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;
    }
    
    // Insert the new or updated set of records.
    const { error: insertError } = await supabase.from('schedules').insert(records);
    if (insertError) throw insertError;
}