package com.projectms.service;

import com.projectms.entity.*;
import com.projectms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ReminderService handles:
 * 1. Scheduled scan (every day at 8 AM) to detect tasks whose deadline is
 *    nearing but have no recent progress update.
 * 2. Role-based reminder delivery:
 *    a) EMPLOYEE_REMINDER → sent ONLY to the assigned employee
 *    b) MANAGER_ALERT     → sent ONLY to the project's manager(s)
 *    c) ADMIN role        → receives NO reminders (admin is operational)
 * 3. CRUD helpers used by the REST controller.
 *
 * MANAGER COVERAGE:
 *   A MANAGER_ALERT is sent to ALL users who qualify as managers for a task:
 *     - The project's designated manager (project.manager)
 *     - Every PROJECT_MANAGER in the project's team
 *     - The project creator as last resort
 *   This ensures a manager sees deadline alerts for ALL tasks across ALL
 *   their projects, including tasks assigned to other team members.
 *
 * ADMIN EXCLUSION:
 *   Users with role ADMIN are explicitly skipped — reminders are
 *   operational tools for execution teams, not for administrators.
 *
 * File path: backend/src/main/java/com/projectms/service/ReminderService.java
 */
@Service
public class ReminderService {

    // ── How many days before the due date we start sending reminders ──────────
    private static final int REMINDER_WINDOW_DAYS = 2;

    @Autowired private TaskRepository        taskRepository;
    @Autowired private TaskUpdateRepository  taskUpdateRepository;
    @Autowired private ReminderRepository    reminderRepository;
    @Autowired private ProjectTeamRepository projectTeamRepository;
    @Autowired private UserRepository        userRepository;

    // =========================================================================
    // SCHEDULED JOB  – runs every day at 08:00
    // =========================================================================

    /**
     * Scans all active (non-completed, non-blocked) tasks that:
     *   • have a due date within the next REMINDER_WINDOW_DAYS days OR are overdue
     *   • have NOT received any COMPLETION-type update
     *   • are NOT already marked as COMPLETED in status
     *
     * For each such task it creates:
     *   - An EMPLOYEE_REMINDER for the assigned employee (role=EMPLOYEE only)
     *   - A MANAGER_ALERT     for EACH manager associated with the project
     *     (project.manager + all PROJECT_MANAGER team members)
     *
     * ADMIN users are never targeted by reminders.
     */
    @Scheduled(cron = "0 0 8 * * *")   // every day at 08:00 server time
    public void scanAndCreateReminders() {
        LocalDate today = LocalDate.now();

        List<Task> activeTasks = taskRepository.findAll().stream()
                .filter(t -> t.getStatus() != Task.TaskStatus.COMPLETED
                          && t.getStatus() != Task.TaskStatus.BLOCKED)
                .filter(t -> t.getDueDate() != null)
                .collect(Collectors.toList());

        for (Task task : activeTasks) {
            long daysUntilDue = ChronoUnit.DAYS.between(today, task.getDueDate());

            // Only act on tasks due within the window OR already overdue
            if (daysUntilDue > REMINDER_WINDOW_DAYS) continue;

            // Skip tasks that already have a completion update
            if (hasCompletionUpdate(task)) continue;

            // ── Build human-readable timing phrase ───────────────────────────
            String dueTiming;
            if (daysUntilDue < 0) {
                dueTiming = Math.abs(daysUntilDue) + " day(s) overdue";
            } else if (daysUntilDue == 0) {
                dueTiming = "due TODAY";
            } else {
                dueTiming = "due in " + daysUntilDue + " day(s)";
            }

            // ── 1. Remind the assigned employee (EMPLOYEE role only) ─────────
            if (task.getAssignedTo() != null
                    && task.getAssignedTo().getRole() == User.Role.EMPLOYEE) {
                createIfAbsent(task, task.getAssignedTo(),
                        Reminder.ReminderType.EMPLOYEE_REMINDER,
                        "⏰ Reminder: Your task \"" + task.getTitle() + "\" is " + dueTiming
                                + " with no completion update. Please post a progress or completion update.",
                        (int) daysUntilDue);
            }

            // ── 2. Alert EVERY manager associated with this project ──────────
            //    This guarantees managers see all their team's deadline tasks,
            //    not just tasks they personally created or were directly assigned to.
            String assigneeName = task.getAssignedTo() != null
                    ? task.getAssignedTo().getFullName() : "Unassigned";

            Set<String> notifiedManagerIds = new HashSet<>();
            for (User manager : resolveAllManagers(task)) {
                // Deduplicate within this task run (same manager found via multiple paths)
                if (!notifiedManagerIds.add(manager.getId())) continue;
                createIfAbsent(task, manager,
                        Reminder.ReminderType.MANAGER_ALERT,
                        "🚨 Alert: Task \"" + task.getTitle() + "\" (assigned to " + assigneeName
                                + ") is " + dueTiming + " and has no completion update.",
                        (int) daysUntilDue);
            }
        }
    }

    // =========================================================================
    // PUBLIC API METHODS
    // =========================================================================

    /**
     * All reminders for the given user, sorted newest-first.
     * ADMIN users always receive an empty list (no reminders for admins).
     */
    public List<Reminder> getRemindersForUser(User user) {
        // Admin role — explicitly excluded from reminders
        if (user.getRole() == User.Role.ADMIN) {
            return Collections.emptyList();
        }
        return reminderRepository.findByRecipientId(user.getId())
                .stream()
                .sorted(Comparator.comparing(Reminder::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Only unread reminders for badge count.
     * ADMIN users always return 0.
     */
    public long getUnreadCount(User user) {
        if (user.getRole() == User.Role.ADMIN) {
            return 0L;
        }
        return reminderRepository.countByRecipientIdAndRead(user.getId(), false);
    }

    /** Mark a single reminder as read */
    public Reminder markRead(String reminderId, User user) {
        Reminder r = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));
        if (!r.getRecipient().getId().equals(user.getId()))
            throw new RuntimeException("Forbidden");
        r.setRead(true);
        return reminderRepository.save(r);
    }

    /** Mark ALL reminders for a user as read */
    public void markAllRead(User user) {
        List<Reminder> unread = reminderRepository.findByRecipientIdAndRead(user.getId(), false);
        unread.forEach(r -> r.setRead(true));
        reminderRepository.saveAll(unread);
    }

    /** Delete a reminder (owner only) */
    public void deleteReminder(String reminderId, User user) {
        Reminder r = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));
        if (!r.getRecipient().getId().equals(user.getId()))
            throw new RuntimeException("Forbidden");
        reminderRepository.deleteById(reminderId);
    }

    /**
     * Manually trigger the reminder scan (useful for testing via API).
     * Returns the number of new reminders created.
     */
    public int triggerManualScan() {
        long before = reminderRepository.count();
        scanAndCreateReminders();
        long after = reminderRepository.count();
        return (int) (after - before);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * True if the task has been explicitly completed:
     * - Task status is COMPLETED, OR
     * - A COMPLETION-type TaskUpdate exists for this task.
     */
    private boolean hasCompletionUpdate(Task task) {
        if (task.getStatus() == Task.TaskStatus.COMPLETED) return true;
        return taskUpdateRepository.findByTaskOrderByCreatedAtDesc(task)
                .stream()
                .anyMatch(u -> u.getType() == TaskUpdate.UpdateType.COMPLETION);
    }

    /**
     * Create a reminder only if one with the same task + recipientId + type
     * doesn't already exist. Uses recipientId (String) instead of a DBRef
     * object comparison to avoid MongoDB @DBRef equality matching issues.
     */
    private void createIfAbsent(Task task, User recipient,
                                Reminder.ReminderType type,
                                String message, int daysUntilDue) {
        if (reminderRepository.existsByTaskIdAndRecipientIdAndType(
                task.getId(), recipient.getId(), type)) {
            return;
        }
        Reminder reminder = Reminder.builder()
                .task(task)
                .recipient(recipient)
                .type(type)
                .message(message)
                .daysUntilDue(daysUntilDue)
                .build();
        reminderRepository.save(reminder);
    }

    /**
     * Resolve ALL managers associated with a task's project.
     *
     * Priority order (deduplication applied so each user appears once):
     *   1. The project's designated manager field (project.manager)
     *   2. Every PROJECT_MANAGER-role member in the project team
     *   3. The project creator (last resort)
     *
     * ADMIN users are never included in the manager list.
     *
     * This broad resolution ensures that when a manager is assigned to a project
     * and an employee on that project has a deadline approaching, the manager
     * WILL receive the MANAGER_ALERT regardless of which specific path resolves them.
     */
    private List<User> resolveAllManagers(Task task) {
        if (task.getProject() == null) return Collections.emptyList();

        LinkedHashMap<String, User> managers = new LinkedHashMap<>();

        // 1. Designated project manager
        User projectManager = task.getProject().getManager();
        if (projectManager != null && projectManager.getRole() != User.Role.ADMIN) {
            managers.put(projectManager.getId(), projectManager);
        }

        // 2. All PROJECT_MANAGER-role members in the project team
        projectTeamRepository.findByProject(task.getProject())
                .stream()
                .map(ProjectTeam::getUser)
                .filter(u -> u.getRole() == User.Role.PROJECT_MANAGER)
                .forEach(u -> managers.put(u.getId(), u));

        // 3. Project creator as last resort (only if no manager found yet)
        if (managers.isEmpty()) {
            User creator = task.getProject().getCreatedBy();
            if (creator != null && creator.getRole() != User.Role.ADMIN) {
                managers.put(creator.getId(), creator);
            }
        }

        return new ArrayList<>(managers.values());
    }
}