const TargetTask = require("../models/TargetTask");
const TargetRoutine = require("../models/TargetRoutine");
const TargetExam = require("../models/TargetExam");
const TargetTopic = require("../models/TargetTopic");
const TargetNote = require("../models/TargetNote");
const TargetJournal = require("../models/TargetJournal");
const TargetAchievement = require("../models/TargetAchievement");

function getTodayString(tzOffsetMinutes = 0) {
    const now = new Date(Date.now() - tzOffsetMinutes * 60000);
    return now.toISOString().split("T")[0];
}

const DEFAULT_ACHIEVEMENTS = [
    {
        code: "first_task_done",
        title: "First Step Forward",
        description: "Complete your first planned target task.",
        category: "tasks",
        icon: "CheckCircle2",
        target: 1,
    },
    {
        code: "first_day_completed",
        title: "Day One Mastered",
        description: "Complete all scheduled tasks for a single day.",
        category: "discipline",
        icon: "SunMedium",
        target: 1,
    },
    {
        code: "streak_3",
        title: "3-Day Consistency Streak",
        description: "Complete tasks across 3 consecutive days.",
        category: "streak",
        icon: "Flame",
        target: 3,
    },
    {
        code: "streak_7",
        title: "7-Day Study Champion",
        description: "Maintain a flawless 7-day task completion streak.",
        category: "streak",
        icon: "Zap",
        target: 7,
    },
    {
        code: "streak_30",
        title: "30-Day Discipline Titan",
        description: "Reach an extraordinary 30-day consistency streak.",
        category: "streak",
        icon: "Crown",
        target: 30,
    },
    {
        code: "first_topic_completed",
        title: "Syllabus Conqueror",
        description: "Complete your first exam syllabus topic.",
        category: "exams",
        icon: "BookOpenCheck",
        target: 1,
    },
    {
        code: "master_10",
        title: "10 Topics Mastered",
        description: "Achieve 'Mastered' status on 10 syllabus topics.",
        category: "exams",
        icon: "Award",
        target: 10,
    },
    {
        code: "hours_50",
        title: "50 Focus Hours",
        description: "Log 50 cumulative hours of dedicated study time.",
        category: "discipline",
        icon: "Clock",
        target: 50,
    },
    {
        code: "revision_champ",
        title: "Spaced Repetition Pro",
        description: "Complete 10 scheduled spaced-repetition revisions.",
        category: "revision",
        icon: "RotateCw",
        target: 10,
    },
    {
        code: "weekly_achiever",
        title: "Weekly Goal Achiever",
        description: "Maintain an 80%+ task completion rate over a 7-day window.",
        category: "tasks",
        icon: "Trophy",
        target: 80,
    },
];

/**
 * Ensure user has all achievement records initialized.
 */
async function ensureAchievements(userId) {
    const existing = await TargetAchievement.find({ userId }).select("code");
    const existingCodes = new Set(existing.map((a) => a.code));

    const toInsert = [];
    for (const def of DEFAULT_ACHIEVEMENTS) {
        if (!existingCodes.has(def.code)) {
            toInsert.push({
                userId,
                ...def,
                progress: 0,
                isUnlocked: false,
                unlockedAt: null,
            });
        }
    }
    if (toInsert.length > 0) {
        await TargetAchievement.insertMany(toInsert);
    }
}

/**
 * Calculate user's daily task completion streak
 */
async function calculateStreak(userId, todayStr) {
    const completedTasks = await TargetTask.find({
        userId,
        status: "completed",
    })
        .select("date")
        .sort({ date: -1 });

    const uniqueDates = Array.from(new Set(completedTasks.map((t) => t.date))).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date(todayStr);

    // If today has no completed task yet, allow streak to count starting from yesterday
    const hasToday = uniqueDates.includes(todayStr);
    if (!hasToday) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yestStr = checkDate.toISOString().split("T")[0];
        if (!uniqueDates.includes(yestStr)) {
            return 0;
        }
    }

    const dateSet = new Set(uniqueDates);
    while (true) {
        const dStr = checkDate.toISOString().split("T")[0];
        if (dateSet.has(dStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Calculate user's Goal Reality Score (0-100)
 */
async function calculateGoalRealityScore(userId) {
    const last14Days = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
        const d = new Date(now.getTime() - i * 86400000);
        last14Days.push(d.toISOString().split("T")[0]);
    }

    const tasks = await TargetTask.find({
        userId,
        date: { $in: last14Days },
    });

    if (tasks.length === 0) {
        return {
            score: 75,
            level: "Optimal Baseline",
            plannedHours: 0,
            actualHours: 0,
            completionRate: 0,
            rescheduledRate: 0,
            confidence: "Moderate",
            dataPoints: 0,
            feedback: "Add daily tasks and execute your schedule to build your personalized Goal Reality Score.",
        };
    }

    let totalPlannedMins = 0;
    let totalActualMins = 0;
    let completedCount = 0;
    let rescheduledCount = 0;

    for (const t of tasks) {
        totalPlannedMins += t.expectedDuration || 60;
        totalActualMins += t.actualDuration || (t.status === "completed" ? t.expectedDuration || 60 : 0);
        if (t.status === "completed") completedCount++;
        if (t.status === "rescheduled" || t.rescheduledToDate) rescheduledCount++;
    }

    const completionRate = Math.round((completedCount / tasks.length) * 100);
    const plannedHours = Math.round((totalPlannedMins / 60) * 10) / 10;
    const actualHours = Math.round((totalActualMins / 60) * 10) / 10;
    const rescheduledRate = Math.round((rescheduledCount / tasks.length) * 100);

    // Score calculation
    // Ideal ratio: actualHours / plannedHours between 0.8 and 1.15
    const ratio = plannedHours > 0 ? actualHours / plannedHours : 1;
    let ratioPenalty = 0;
    if (ratio < 0.6) ratioPenalty = (0.6 - ratio) * 40;
    else if (ratio > 1.3) ratioPenalty = (ratio - 1.3) * 30;

    const reschedulePenalty = Math.min(25, rescheduledRate * 0.4);
    let calculatedScore = Math.round(completionRate * 0.6 + (40 - ratioPenalty - reschedulePenalty));
    calculatedScore = Math.max(15, Math.min(98, calculatedScore));

    let level = "Highly Realistic";
    let feedback = "Your planning and execution are remarkably aligned. Keep maintaining this steady discipline.";
    if (calculatedScore < 50) {
        level = "Overloaded / Optimistic";
        feedback = `You plan an average of ${plannedHours}h but complete ${actualHours}h. Consider trimming 1–2 tasks each day for higher consistency.`;
    } else if (calculatedScore < 75) {
        level = "Moderate Alignment";
        feedback = "Good planning habits. Watch out for rescheduling tasks to avoid cumulative workload backlog.";
    }

    return {
        score: calculatedScore,
        level,
        plannedHours,
        actualHours,
        completionRate,
        rescheduledRate,
        confidence: tasks.length >= 10 ? "High" : "Building",
        dataPoints: tasks.length,
        feedback,
    };
}

/**
 * Check and unlock achievements
 */
async function evaluateAchievements(userId) {
    await ensureAchievements(userId);

    const [allTasks, allTopics] = await Promise.all([
        TargetTask.find({ userId }),
        TargetTopic.find({ userId }),
    ]);

    const completedTasks = allTasks.filter((t) => t.status === "completed");
    const completedTopics = allTopics.filter((t) => t.status === "completed" || t.status === "mastered");
    const masteredTopics = allTopics.filter((t) => t.status === "mastered");

    let totalMins = 0;
    for (const t of completedTasks) {
        totalMins += t.actualDuration || t.expectedDuration || 60;
    }
    for (const top of allTopics) {
        totalMins += (top.actualHours || 0) * 60;
    }
    const totalHours = Math.round(totalMins / 60);

    const todayStr = getTodayString();
    const streak = await calculateStreak(userId, todayStr);

    const updates = {
        first_task_done: { progress: completedTasks.length, target: 1 },
        first_day_completed: { progress: completedTasks.length > 0 ? 1 : 0, target: 1 },
        streak_3: { progress: streak, target: 3 },
        streak_7: { progress: streak, target: 7 },
        streak_30: { progress: streak, target: 30 },
        first_topic_completed: { progress: completedTopics.length, target: 1 },
        master_10: { progress: masteredTopics.length, target: 10 },
        hours_50: { progress: totalHours, target: 50 },
    };

    for (const [code, data] of Object.entries(updates)) {
        const isUnlocked = data.progress >= data.target;
        await TargetAchievement.updateOne(
            { userId, code },
            {
                $set: {
                    progress: Math.min(data.target, data.progress),
                    ...(isUnlocked ? { isUnlocked: true, unlockedAt: new Date() } : {}),
                },
            }
        );
    }
}

/**
 * Get full Target Dashboard overview
 */
async function getDashboardOverview(userId, tzOffsetMinutes = 0) {
    const todayStr = getTodayString(tzOffsetMinutes);

    await ensureAchievements(userId);

    const [
        todayTasks,
        routines,
        upcomingExams,
        allTopics,
        achievements,
        streak,
        realityScore,
    ] = await Promise.all([
        TargetTask.find({ userId, date: todayStr }).sort({ startTime: 1, createdAt: 1 }),
        TargetRoutine.find({ userId, isActive: true }).sort({ order: 1, startTime: 1 }),
        TargetExam.find({ userId, examDate: { $gte: new Date(Date.now() - 86400000) } })
            .sort({ examDate: 1 })
            .limit(3),
        TargetTopic.find({ userId }),
        TargetAchievement.find({ userId }),
        calculateStreak(userId, todayStr),
        calculateGoalRealityScore(userId),
    ]);

    // Tasks metrics
    const totalTasks = todayTasks.length;
    const completedTasks = todayTasks.filter((t) => t.status === "completed").length;
    const pendingTasks = todayTasks.filter((t) => t.status !== "completed" && t.status !== "skipped").length;
    const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let studyMinsToday = 0;
    for (const t of todayTasks) {
        if (t.status === "completed") {
            studyMinsToday += t.actualDuration || t.expectedDuration || 60;
        }
    }
    const studyHoursToday = Math.round((studyMinsToday / 60) * 10) / 10;

    // Weekly completion rate (last 7 days)
    const last7Days = [];
    const baseDate = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate.getTime() - i * 86400000);
        last7Days.push(d.toISOString().split("T")[0]);
    }
    const weeklyTasks = await TargetTask.find({ userId, date: { $in: last7Days } });
    const weeklyCompleted = weeklyTasks.filter((t) => t.status === "completed").length;
    const weeklyCompletionRate = weeklyTasks.length > 0 ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0;

    // Total goals completed all-time
    const totalGoalsCompleted = await TargetTask.countDocuments({ userId, status: "completed" });

    // Upcoming exam countdown
    const nextExam = upcomingExams[0] || null;
    let daysUntilExam = null;
    if (nextExam) {
        const diffMs = new Date(nextExam.examDate) - new Date();
        daysUntilExam = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Routines today adherence
    let routineCompletedCount = 0;
    const routineItems = routines.map((r) => {
        const isDone = r.completions.some((c) => c.date === todayStr && c.completed);
        if (isDone) routineCompletedCount++;
        return {
            _id: r._id,
            title: r.title,
            startTime: r.startTime,
            endTime: r.endTime,
            category: r.category,
            completedToday: isDone,
        };
    });
    const routineAdherencePct = routines.length > 0 ? Math.round((routineCompletedCount / routines.length) * 100) : 0;

    // Check for goal recovery opportunities (missed tasks in the last 2 days)
    const yest = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const missedYesterdayTasks = await TargetTask.find({
        userId,
        date: yest,
        status: { $in: ["not_started", "in_progress"] },
    }).limit(3);

    return {
        todayStr,
        metrics: {
            completionPct,
            completedTasks,
            pendingTasks,
            studyHoursToday,
            currentStreak: streak,
            weeklyCompletionRate,
            upcomingExamDays: daysUntilExam,
            nextExamName: nextExam ? nextExam.name : null,
            totalGoalsCompleted,
            routineAdherencePct,
        },
        todayTasks,
        routines: routineItems,
        nextExam,
        upcomingExams,
        realityScore,
        missedTasks: missedYesterdayTasks,
        achievements: {
            unlockedCount: achievements.filter((a) => a.isUnlocked).length,
            totalCount: achievements.length,
            recent: achievements.filter((a) => a.isUnlocked).slice(0, 3),
        },
        syllabusStats: {
            totalTopics: allTopics.length,
            completedTopics: allTopics.filter((t) => t.status === "completed" || t.status === "mastered").length,
            masteredTopics: allTopics.filter((t) => t.status === "mastered").length,
        },
    };
}

/**
 * Task Management
 */
async function getTasks(userId, dateStr) {
    const query = { userId };
    if (dateStr) {
        query.date = dateStr;
    }
    return await TargetTask.find(query).sort({ startTime: 1, createdAt: 1 });
}

async function createTask(userId, payload) {
    const task = new TargetTask({
        userId,
        ...payload,
    });
    await task.save();
    return task;
}

async function updateTask(userId, taskId, payload) {
    if (payload.status === "completed" && !payload.completedAt) {
        payload.completedAt = new Date();
    }
    const updated = await TargetTask.findOneAndUpdate(
        { _id: taskId, userId },
        { $set: payload },
        { new: true }
    );
    if (payload.status === "completed") {
        evaluateAchievements(userId).catch(() => {});
    }
    return updated;
}

async function deleteTask(userId, taskId) {
    return await TargetTask.findOneAndDelete({ _id: taskId, userId });
}

async function rescheduleTask(userId, taskId, targetDate) {
    const original = await TargetTask.findOne({ _id: taskId, userId });
    if (!original) return null;

    original.status = "rescheduled";
    original.rescheduledToDate = targetDate;
    await original.save();

    // Create a new task instance for targetDate
    const newTask = new TargetTask({
        userId,
        date: targetDate,
        title: original.title,
        description: original.description,
        startTime: original.startTime,
        endTime: original.endTime,
        priority: original.priority,
        category: original.category,
        expectedDuration: original.expectedDuration,
        subtasks: original.subtasks.map((s) => ({ ...s, completed: false })),
        notes: `Rescheduled from ${original.date}`,
        status: "not_started",
        examId: original.examId,
        topicId: original.topicId,
    });
    await newTask.save();
    return { original, newTask };
}

/**
 * Routine Management
 */
async function getRoutines(userId, dateStr) {
    const routines = await TargetRoutine.find({ userId }).sort({ order: 1, startTime: 1 });
    return routines.map((r) => {
        const isDone = dateStr ? r.completions.some((c) => c.date === dateStr && c.completed) : false;
        return {
            ...r.toObject(),
            completedToday: isDone,
        };
    });
}

async function createRoutine(userId, payload) {
    const routine = new TargetRoutine({
        userId,
        ...payload,
    });
    return await routine.save();
}

async function updateRoutine(userId, routineId, payload) {
    return await TargetRoutine.findOneAndUpdate(
        { _id: routineId, userId },
        { $set: payload },
        { new: true }
    );
}

async function deleteRoutine(userId, routineId) {
    return await TargetRoutine.findOneAndDelete({ _id: routineId, userId });
}

async function toggleRoutineCompletion(userId, routineId, dateStr, completed) {
    const routine = await TargetRoutine.findOne({ _id: routineId, userId });
    if (!routine) return null;

    const existingIdx = routine.completions.findIndex((c) => c.date === dateStr);
    if (existingIdx >= 0) {
        routine.completions[existingIdx].completed = completed;
        routine.completions[existingIdx].completedAt = completed ? new Date() : null;
    } else {
        routine.completions.push({
            date: dateStr,
            completed,
            completedAt: completed ? new Date() : null,
        });
    }
    await routine.save();
    return routine;
}

/**
 * Exam & Syllabus Management
 */
async function getExams(userId) {
    const exams = await TargetExam.find({ userId }).sort({ examDate: 1 });
    const topics = await TargetTopic.find({ userId });

    return exams.map((exam) => {
        const examTopics = topics.filter((t) => String(t.examId) === String(exam._id));
        const totalTopics = examTopics.length;
        const completedTopics = examTopics.filter((t) => t.status === "completed" || t.status === "mastered").length;
        const masteredTopics = examTopics.filter((t) => t.status === "mastered").length;
        const completionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        const diffMs = new Date(exam.examDate) - new Date();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        return {
            ...exam.toObject(),
            stats: {
                totalTopics,
                completedTopics,
                masteredTopics,
                completionPct,
                daysRemaining,
            },
        };
    });
}

async function createExam(userId, payload) {
    const exam = new TargetExam({
        userId,
        ...payload,
        name: payload.name || payload.title,
        title: payload.title || payload.name,
    });
    return await exam.save();
}

async function updateExam(userId, examId, payload) {
    if (payload.title && !payload.name) payload.name = payload.title;
    if (payload.name && !payload.title) payload.title = payload.name;
    return await TargetExam.findOneAndUpdate(
        { _id: examId, userId },
        { $set: payload },
        { new: true }
    );
}

async function deleteExam(userId, examId) {
    await TargetTopic.deleteMany({ userId, examId });
    return await TargetExam.findOneAndDelete({ _id: examId, userId });
}

async function getTopics(userId, examId) {
    const query = { userId };
    if (examId) query.examId = examId;
    return await TargetTopic.find(query).sort({ priorityRank: 1, createdAt: 1 });
}

async function createTopic(userId, payload) {
    const topicData = {
        userId,
        ...payload,
        name: payload.name || payload.title,
        title: payload.title || payload.name,
        subjectId: payload.subjectId || payload.subjectName,
        subjectName: payload.subjectName || payload.subjectId,
    };
    if (typeof topicData.confidenceRating === "string") {
        const ratingMap = { forgot: 1, difficult: 2, moderate: 3, easy: 4, mastered: 5 };
        topicData.confidenceRating = ratingMap[topicData.confidenceRating.toLowerCase()] || 3;
    }
    if (topicData.priorityRank === undefined || topicData.priorityRank === null) {
        const p = String(topicData.priority || "").toLowerCase();
        if (p === "1" || p === "priority_1" || p === "must_know" || p === "critical" || p === "high") {
            topicData.priorityRank = 1;
        } else if (p === "2" || p === "priority_2" || p === "medium") {
            topicData.priorityRank = 2;
        } else {
            topicData.priorityRank = 3;
        }
    }
    const topic = new TargetTopic(topicData);
    await topic.save();
    return topic;
}

async function updateTopic(userId, topicId, payload) {
    if (payload.priority && payload.priorityRank === undefined) {
        const p = String(payload.priority || "").toLowerCase();
        if (p === "1" || p === "priority_1" || p === "must_know" || p === "critical" || p === "high") {
            payload.priorityRank = 1;
        } else if (p === "2" || p === "priority_2" || p === "medium") {
            payload.priorityRank = 2;
        } else {
            payload.priorityRank = 3;
        }
    }

    if (payload.status === "completed" && !payload.completedAt) {
        payload.completedAt = new Date();
        // Default initial revision 1 day later if none set
        if (!payload.nextRevisionDate) {
            const nextDay = new Date(Date.now() + 86400000).toISOString().split("T")[0];
            payload.nextRevisionDate = nextDay;
        }
    }
    if (payload.status === "mastered" && !payload.masteredAt) {
        payload.masteredAt = new Date();
    }

    const updated = await TargetTopic.findOneAndUpdate(
        { _id: topicId, userId },
        { $set: payload },
        { new: true }
    );

    if (payload.status === "completed" || payload.status === "mastered") {
        evaluateAchievements(userId).catch(() => {});
    }
    return updated;
}

async function deleteTopic(userId, topicId) {
    return await TargetTopic.findOneAndDelete({ _id: topicId, userId });
}

/**
 * Smart Revision System
 */
async function getRevisions(userId, todayStr = getTodayString()) {
    const allTopics = await TargetTopic.find({
        userId,
        status: { $in: ["completed", "needs_revision", "mastered"] },
    }).populate("examId", "name subjects");

    const overdue = [];
    const today = [];
    const upcoming = [];

    for (const topic of allTopics) {
        const nextRev = topic.nextRevisionDate;
        if (!nextRev) continue;

        const revItem = {
            _id: topic._id,
            name: topic.title || topic.name,
            title: topic.title || topic.name,
            examName: topic.examId?.title || topic.examId?.name || "General Exam",
            subjectId: topic.subjectId,
            subjectName: topic.subjectName || topic.subjectId || "General",
            status: topic.status,
            confidenceRating: topic.confidenceRating,
            revisionCount: topic.revisionCount,
            lastRevisedAt: topic.lastRevisedAt,
            nextRevisionDate: topic.nextRevisionDate,
        };

        if (nextRev < todayStr) {
            overdue.push(revItem);
        } else if (nextRev === todayStr) {
            today.push(revItem);
        } else {
            upcoming.push(revItem);
        }
    }

    const sortedUpcoming = upcoming.sort((a, b) => a.nextRevisionDate.localeCompare(b.nextRevisionDate));
    const all = [...overdue, ...today, ...sortedUpcoming];

    return {
        overdue,
        today,
        upcoming: sortedUpcoming,
        all,
        counts: {
            overdue: overdue.length,
            today: today.length,
            upcoming: sortedUpcoming.length,
            all: all.length,
        },
    };
}

async function logRevision(userId, topicId, rating) {
    const topic = await TargetTopic.findOne({ _id: topicId, userId });
    if (!topic) return null;

    // Spaced repetition intervals based on retention rating
    let intervalDays = 1;
    let newConfidence = topic.confidenceRating || 3;

    switch (rating) {
        case "forgot":
            intervalDays = 1;
            newConfidence = Math.max(1, newConfidence - 1);
            topic.status = "needs_revision";
            break;
        case "difficult":
            intervalDays = 2;
            newConfidence = Math.max(2, newConfidence);
            break;
        case "moderate":
            intervalDays = 4;
            newConfidence = Math.min(4, newConfidence + 1);
            break;
        case "easy":
            intervalDays = 7;
            newConfidence = Math.min(5, newConfidence + 1);
            break;
        case "mastered":
            intervalDays = 14;
            newConfidence = 5;
            topic.status = "mastered";
            topic.masteredAt = new Date();
            break;
        default:
            intervalDays = 3;
    }

    const nextDate = new Date(Date.now() + intervalDays * 86400000).toISOString().split("T")[0];

    topic.revisions.push({
        date: new Date(),
        rating,
        intervalDays,
    });
    topic.revisionCount = (topic.revisionCount || 0) + 1;
    topic.lastRevisedAt = new Date();
    topic.nextRevisionDate = nextDate;
    topic.confidenceRating = newConfidence;

    await topic.save();
    evaluateAchievements(userId).catch(() => {});
    return topic;
}

/**
 * Notes & Journal
 */
async function getNotes(userId, { folder, tag, search }) {
    const query = { userId };
    if (folder && folder !== "all") query.folder = folder;
    if (tag) query.tags = tag;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
        ];
    }
    return await TargetNote.find(query).sort({ isPinned: -1, updatedAt: -1 });
}

async function createNote(userId, payload) {
    const words = (payload.content || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    const note = new TargetNote({
        userId,
        ...payload,
        wordCount: words,
    });
    return await note.save();
}

async function updateNote(userId, noteId, payload) {
    if (payload.content !== undefined) {
        payload.wordCount = (payload.content || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    }
    return await TargetNote.findOneAndUpdate(
        { _id: noteId, userId },
        { $set: payload },
        { new: true }
    );
}

async function deleteNote(userId, noteId) {
    return await TargetNote.findOneAndDelete({ _id: noteId, userId });
}

/**
 * Daily Journal
 */
async function getJournal(userId, dateStr) {
    const [journal, tasks, topics, routines] = await Promise.all([
        TargetJournal.findOne({ userId, date: dateStr }),
        TargetTask.find({ userId, date: dateStr }),
        TargetTopic.find({ userId, completedAt: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).getTime() + 86400000) } }),
        TargetRoutine.find({ userId, "completions.date": dateStr, "completions.completed": true }),
    ]);

    const completedTasks = tasks.filter((t) => t.status === "completed");
    const skippedTasks = tasks.filter((t) => t.status === "skipped");
    const pendingTasks = tasks.filter((t) => t.status === "not_started" || t.status === "in_progress");

    let totalStudyMins = 0;
    completedTasks.forEach((t) => {
        totalStudyMins += t.actualDuration || t.expectedDuration || 60;
    });

    return {
        journal: journal || {
            date: dateStr,
            completedSummary: "",
            notCompletedSummary: "",
            learnedSummary: "",
            problemsFaced: "",
            improvementsForTomorrow: "",
            tomorrowPriority: "",
            moodRating: 4,
            notes: "",
        },
        dayActivity: {
            date: dateStr,
            tasksPlanned: tasks.length,
            tasksCompleted: completedTasks.length,
            tasksPending: pendingTasks.length,
            tasksSkipped: skippedTasks.length,
            topicsCovered: topics.length,
            studyTimeHours: Math.round((totalStudyMins / 60) * 10) / 10,
            routinesCompleted: routines.length,
        },
    };
}

async function saveJournal(userId, payload) {
    return await TargetJournal.findOneAndUpdate(
        { userId, date: payload.date },
        { $set: payload },
        { new: true, upsert: true }
    );
}

/**
 * Calendar Overview
 */
async function getCalendar(userId, monthPrefix) {
    // monthPrefix is "YYYY-MM"
    const regex = new RegExp(`^${monthPrefix}`);

    const [tasks, exams, topics] = await Promise.all([
        TargetTask.find({ userId, date: regex }),
        TargetExam.find({ userId }),
        TargetTopic.find({ userId, nextRevisionDate: regex }),
    ]);

    // Group tasks by date
    const dayMap = {};

    for (const t of tasks) {
        if (!dayMap[t.date]) {
            dayMap[t.date] = {
                date: t.date,
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                skippedTasks: 0,
                hasExam: false,
                hasRevision: false,
                studyHours: 0,
            };
        }
        dayMap[t.date].totalTasks++;
        if (t.status === "completed") {
            dayMap[t.date].completedTasks++;
            dayMap[t.date].studyHours += Math.round(((t.actualDuration || t.expectedDuration || 60) / 60) * 10) / 10;
        } else if (t.status === "skipped") {
            dayMap[t.date].skippedTasks++;
        } else {
            dayMap[t.date].pendingTasks++;
        }
    }

    // Mark exams
    for (const exam of exams) {
        const dStr = new Date(exam.examDate).toISOString().split("T")[0];
        if (dStr.startsWith(monthPrefix)) {
            if (!dayMap[dStr]) {
                dayMap[dStr] = {
                    date: dStr,
                    totalTasks: 0,
                    completedTasks: 0,
                    pendingTasks: 0,
                    skippedTasks: 0,
                    hasExam: true,
                    examName: exam.name,
                    hasRevision: false,
                    studyHours: 0,
                };
            } else {
                dayMap[dStr].hasExam = true;
                dayMap[dStr].examName = exam.name;
            }
        }
    }

    // Mark revisions
    for (const topic of topics) {
        const dStr = topic.nextRevisionDate;
        if (dayMap[dStr]) {
            dayMap[dStr].hasRevision = true;
        } else {
            dayMap[dStr] = {
                date: dStr,
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                skippedTasks: 0,
                hasExam: false,
                hasRevision: true,
                studyHours: 0,
            };
        }
    }

    return Object.values(dayMap);
}

/**
 * Goal Recovery Engine
 */
async function getRecoverySuggestions(userId) {
    const todayStr = getTodayString();
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];

    const uncompletedTasks = await TargetTask.find({
        userId,
        date: { $gte: threeDaysAgo, $lt: todayStr },
        status: { $in: ["not_started", "in_progress"] },
    }).sort({ priority: -1, date: -1 });

    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const tomorrowTasks = await TargetTask.find({ userId, date: tomorrowStr });
    const tomorrowPlannedMins = tomorrowTasks.reduce((acc, t) => acc + (t.expectedDuration || 60), 0);

    const suggestions = uncompletedTasks.map((task) => {
        const canFitTomorrow = tomorrowPlannedMins + (task.expectedDuration || 60) <= 360; // 6h cap
        return {
            taskId: task._id,
            title: task.title,
            originalDate: task.date,
            expectedDuration: task.expectedDuration,
            priority: task.priority,
            recommendedTargetDate: canFitTomorrow ? tomorrowStr : todayStr,
            action: canFitTomorrow ? "reschedule_tomorrow" : "reschedule_today",
            explanation: canFitTomorrow
                ? `You have capacity tomorrow (${Math.round((360 - tomorrowPlannedMins) / 60)}h available). Reschedule without overloading.`
                : `Tomorrow is already packed (${Math.round(tomorrowPlannedMins / 60)}h). Consider fitting a quick 30-minute review today or dropping lower-priority subtasks.`,
        };
    });

    return {
        totalUnfinished: uncompletedTasks.length,
        suggestions,
    };
}

/**
 * Analytics
 */
async function getProductivityAnalytics(userId, days = 7) {
    const now = new Date();
    const dateList = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        dateList.push(d.toISOString().split("T")[0]);
    }

    const [tasks, topics, routines] = await Promise.all([
        TargetTask.find({ userId, date: { $in: dateList } }),
        TargetTopic.find({ userId }),
        TargetRoutine.find({ userId }),
    ]);

    // Daily completion trend
    const dailyTrend = dateList.map((dStr) => {
        const dayTasks = tasks.filter((t) => t.date === dStr);
        const completed = dayTasks.filter((t) => t.status === "completed").length;
        const total = dayTasks.length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        let studyHours = 0;
        dayTasks.forEach((t) => {
            if (t.status === "completed") studyHours += (t.actualDuration || t.expectedDuration || 60) / 60;
        });

        return {
            date: dStr.substring(5), // "MM-DD"
            fullDate: dStr,
            plannedTasks: total,
            completedTasks: completed,
            completionRate: rate,
            studyHours: Math.round(studyHours * 10) / 10,
        };
    });

    // Category distribution
    const catMap = {};
    for (const t of tasks) {
        const cat = t.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + 1;
    }
    const categoryDistribution = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    // Routine adherence
    let routineChecksTotal = 0;
    let routineChecksCompleted = 0;
    for (const r of routines) {
        for (const c of r.completions) {
            if (dateList.includes(c.date)) {
                routineChecksTotal++;
                if (c.completed) routineChecksCompleted++;
            }
        }
    }
    const routineAdherence = routineChecksTotal > 0 ? Math.round((routineChecksCompleted / routineChecksTotal) * 100) : 100;

    return {
        dailyTrend,
        categoryDistribution,
        routineAdherence,
        totalTasksAnalyzed: tasks.length,
        totalTopics: topics.length,
        masteredTopics: topics.filter((t) => t.status === "mastered").length,
    };
}

async function applyRecoveryAction(userId, action, targetDate) {
    const todayStr = getTodayString();
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];

    const uncompletedTasks = await TargetTask.find({
        userId,
        date: { $gte: threeDaysAgo, $lt: todayStr },
        status: { $in: ["not_started", "in_progress", "pending"] },
    });

    if (action === "dismiss_all") {
        await TargetTask.updateMany(
            { _id: { $in: uncompletedTasks.map((t) => t._id) } },
            { $set: { status: "cancelled", notes: "Dismissed via Goal Recovery Engine" } }
        );
        return { dismissedCount: uncompletedTasks.length, rescheduledCount: 0 };
    }

    // Reschedule smart
    const nextDate = targetDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];
    let count = 0;
    for (const t of uncompletedTasks) {
        await rescheduleTask(userId, t._id, nextDate);
        count++;
    }

    return { rescheduledCount: count, targetDate: nextDate };
}

function calculateNextRevisionDate(baseDate, level = 1, rating = "moderate") {
    let intervalDays = 1;
    if (rating === "forgot") {
        intervalDays = 1;
    } else if (rating === "difficult") {
        intervalDays = Math.max(1, level * 1);
    } else if (rating === "moderate") {
        const intervals = [1, 3, 7, 14, 30];
        intervalDays = intervals[Math.min(level, intervals.length - 1)] || 7;
    } else if (rating === "easy") {
        const intervals = [1, 3, 7, 14, 30];
        intervalDays = intervals[Math.min(level, intervals.length - 1)] || 7;
    } else if (rating === "mastered") {
        intervalDays = 30;
    }
    const d = new Date(baseDate);
    d.setDate(d.getDate() + intervalDays);
    return d;
}

function computeRealityScoreFromData(tasks = [], days = 5) {
    if (!tasks || tasks.length === 0) {
        return {
            score: 75,
            grade: "Calibrating",
            description: "Optimal baseline. Complete daily goals to calibrate your personalized score.",
            factors: ["No historical task data yet"],
        };
    }

    const completed = tasks.filter((t) => t.status === "completed").length;
    const completionRate = Math.round((completed / tasks.length) * 100);

    let score = Math.round(completionRate * 0.8 + 20);
    score = Math.max(0, Math.min(100, score));

    let grade = "Good";
    if (score >= 90) grade = "Elite";
    else if (score >= 75) grade = "Great";
    else if (score >= 60) grade = "Good";
    else if (score >= 40) grade = "Needs Adjustment";
    else grade = "Over-Planning Alert";

    return {
        score,
        grade,
        description: `Planning execution alignment is ${score}%. ${completed}/${tasks.length} tasks completed.`,
        factors: [
            `Task completion rate: ${completionRate}%`,
            `Consistency window: ${days} days analyzed`,
        ],
    };
}

module.exports = {
    getDashboardOverview,
    getDashboardMetrics: getDashboardOverview,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    rescheduleTask,
    getRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    toggleRoutineCompletion,
    getExams,
    createExam,
    updateExam,
    deleteExam,
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    getRevisions,
    getDueRevisions: getRevisions,
    logRevision,
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    getJournal,
    getDailyJournal: getJournal,
    saveJournal,
    saveDailyJournal: saveJournal,
    getCalendar,
    getCalendarMonth: getCalendar,
    getRecoverySuggestions,
    getGoalRecoveryPlan: getRecoverySuggestions,
    applyRecoveryAction,
    calculateGoalRealityScore,
    getGoalRealityScore: calculateGoalRealityScore,
    computeRealityScoreFromData,
    calculateNextRevisionDate,
    getProductivityAnalytics,
    evaluateAchievements,
};
