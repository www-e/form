
export const SUPABASE_URL = 'https://ocnqgfdsozhxowrvieqb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbnFnZmRzb3poeG93cnZpZXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjYyOTUsImV4cCI6MjA2NjcwMjI5NX0.rNxaY22-rDx3s-Lso5i_8ZKce-asRHZAN-w__BmJOBI';

export const RESTRICTED_GROUPS = {
    'third': {
        'general': { 'sun_wed_fri': ['13:00'] },
        'statistics': { 'mon_thu': ['12:00'] }
    }
};

export const SCHEDULES = {
    first: { 'sat_tue': ['15:15', '16:30'], 'sun_wed': ['14:00'], 'mon_thu': ['14:00'] },
    second: { 'sat_tue': ['14:00'], 'sun_wed': ['15:15'], 'mon_thu': ['15:15'] },
    third: {
        statistics: { 'sun_wed': ['16:30'], 'mon_thu': ['12:00'] },
        general: { 'sat_tue_thu': ['12:00'], 'sun_wed_fri': ['13:00'] }
    }
};

export const GRADE_NAMES = {
    'first': 'الصف الأول الثانوي',
    'second': 'الصف الثاني الثانوي',
    'third': 'الصف الثالث الثانوي'
};

export const SECTION_NAMES = {
    'general': 'علمي رياضة',
    'statistics': 'إحصاء (أدبي)',
    'science': 'علمي',
    'arts': 'أدبي'
};

export const GROUP_NAMES = {
    'sat_tue': 'السبت والثلاثاء',
    'sun_wed': 'الأحد والأربعاء',
    'mon_thu': 'الاثنين والخميس',
    'sat_tue_thu': 'السبت والثلاثاء والخميس',
    'sun_wed_fri': 'الأحد والأربعاء والجمعة'
};