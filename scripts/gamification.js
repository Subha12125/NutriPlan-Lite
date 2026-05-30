// Points system
const POINTS_CONFIG = {
    logMeal: 10,
    hitWaterGoal: 20,
    hitCalorieGoal: 30,
    weekStreak: 100
};

// Affirmations array
const AFFIRMATIONS = [
    "You're making great progress!",
    "Every healthy choice counts!",
    "You're stronger than you think!",
    // Add 20-30 more affirmations
];

// Points tracking
function awardPoints(action) {
    const points = POINTS_CONFIG[action] || 0;
    let totalPoints = getTotalPoints() + points;
    localStorage.setItem('totalPoints', totalPoints);
    checkForBadges(totalPoints);
    showPointsNotification(points);
}

// Badge system
function checkForBadges(totalPoints) {
    const badges = {
        'First Steps': totalPoints >= 100,
        'Getting Started': totalPoints >= 500,
        'Committed': totalPoints >= 1000,
        'Champion': totalPoints >= 5000
    };
    
    for (let [badge, earned] of Object.entries(badges)) {
        if (earned && !hasBadge(badge)) {
            awardBadge(badge);
        }
    }
}

// Daily affirmation
function getDailyAffirmation() {
    const today = new Date().toDateString();
    const index = hashCode(today) % AFFIRMATIONS.length;
    return AFFIRMATIONS[index];
}


