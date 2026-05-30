export function initSleepTracker() {
    setupSleepForm();
    loadSleepData();
    displaySleepChart();
}

export async function logSleep(sleepData) {
    const { duration, quality, bedtime, wakeTime, notes } = sleepData;
    
    if (isOnlineMode()) {
        // Supabase insert
        const { data, error } = await supabaseClient
            .from('sleep_logs')
            .insert([{
                user_id: getCurrentUserId(),
                log_date: getSelectedDate(),
                sleep_duration_hours: duration,
                sleep_quality: quality,
                bedtime: bedtime,
                wake_time: wakeTime,
                notes: notes
            }]);
    } else {
        // localStorage fallback
        saveSleepToLocal(sleepData);
    }
    
    updateSleepDisplay();
    analyzeCorrelations();
}

// Correlation with nutrition/energy
function analyzeCorrelations() {
    const sleepData = getSleepHistory(7); // last 7 days
    const nutritionData = getNutritionHistory(7);
    
    // Calculate correlations
    const avgSleep = sleepData.reduce((a, b) => a + b.duration, 0) / sleepData.length;
    const avgCalories = nutritionData.reduce((a, b) => a + b.calories, 0) / nutritionData.length;
    
    displayCorrelationInsights(avgSleep, avgCalories);
}