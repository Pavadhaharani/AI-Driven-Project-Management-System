package com.projectms.controller;

import com.projectms.entity.Reminder;
import com.projectms.entity.User;
import com.projectms.repository.UserRepository;
import com.projectms.service.ReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for task reminder / notification endpoints.
 *
 * All routes require a valid JWT token.
 *
 * Role-based behaviour:
 *   ADMIN          → GET /api/reminders returns [] (empty list, no reminders for admins)
 *                    GET /api/reminders/unread returns { count: 0 }
 *   PROJECT_MANAGER → returns only MANAGER_ALERT reminders (tasks in their projects)
 *   EMPLOYEE        → returns only EMPLOYEE_REMINDER reminders (their assigned tasks)
 *
 * File path: backend/src/main/java/com/projectms/controller/ReminderController.java
 *
 * Available endpoints:
 *   GET    /api/reminders            – get all reminders for current user
 *   GET    /api/reminders/unread     – count of unread reminders (badge)
 *   PATCH  /api/reminders/{id}/read  – mark one reminder as read
 *   PATCH  /api/reminders/read-all   – mark all as read
 *   DELETE /api/reminders/{id}       – delete one reminder
 *   POST   /api/reminders/scan       – manually trigger the reminder scan (admin/dev use)
 */
@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    @Autowired private ReminderService  reminderService;
    @Autowired private UserRepository   userRepository;

    // ── Helper ───────────────────────────────────────────────────────────────

    private User currentUser(UserDetails ud) {
        return userRepository.findByUsername(ud.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /** Converts a Reminder to a plain map so the frontend gets flat JSON */
    private Map<String, Object> reminderToMap(Reminder r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           r.getId());
        m.put("message",      r.getMessage());
        m.put("type",         r.getType());
        m.put("read",         r.isRead());
        m.put("daysUntilDue", r.getDaysUntilDue());
        m.put("createdAt",    r.getCreatedAt());

        if (r.getTask() != null) {
            Map<String, Object> task = new LinkedHashMap<>();
            task.put("id",      r.getTask().getId());
            task.put("title",   r.getTask().getTitle());
            task.put("status",  r.getTask().getStatus());
            task.put("dueDate", r.getTask().getDueDate());
            task.put("priority", r.getTask().getPriority());

            if (r.getTask().getProject() != null) {
                task.put("projectId",   r.getTask().getProject().getId());
                task.put("projectName", r.getTask().getProject().getName());
            }
            if (r.getTask().getAssignedTo() != null) {
                task.put("assignedToName", r.getTask().getAssignedTo().getFullName());
            }
            m.put("task", task);
        }
        return m;
    }

    // ── Endpoints ─────────────────────────────────────────────────────────────

    /**
     * GET /api/reminders – all reminders for the current user.
     *
     * Role behaviour:
     *   ADMIN          → always returns empty list (admins have no reminders)
     *   PROJECT_MANAGER → returns MANAGER_ALERT reminders for their projects' tasks
     *   EMPLOYEE        → returns EMPLOYEE_REMINDER reminders for their assigned tasks
     */
    @GetMapping
    public ResponseEntity<?> getReminders(@AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);

        // Admin: no reminders — return empty list immediately
        if (user.getRole() == User.Role.ADMIN) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Map<String, Object>> list = reminderService.getRemindersForUser(user)
                .stream().map(this::reminderToMap).toList();
        return ResponseEntity.ok(list);
    }

    /**
     * GET /api/reminders/unread – unread count for the notification bell badge.
     * ADMIN always returns { count: 0 }.
     */
    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        long count = reminderService.getUnreadCount(user);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /** PATCH /api/reminders/{id}/read – mark a single reminder as read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id,
                                      @AuthenticationPrincipal UserDetails ud) {
        try {
            User user = currentUser(ud);
            Reminder updated = reminderService.markRead(id, user);
            return ResponseEntity.ok(reminderToMap(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** PATCH /api/reminders/read-all – mark all reminders as read for current user */
    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        reminderService.markAllRead(user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /** DELETE /api/reminders/{id} – delete one reminder */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReminder(@PathVariable String id,
                                            @AuthenticationPrincipal UserDetails ud) {
        try {
            User user = currentUser(ud);
            reminderService.deleteReminder(id, user);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/reminders/scan
     * Manually trigger the deadline scan (useful in dev/test).
     * Returns how many new reminders were created.
     */
    @PostMapping("/scan")
    public ResponseEntity<?> triggerScan(@AuthenticationPrincipal UserDetails ud) {
        try {
            int created = reminderService.triggerManualScan();
            return ResponseEntity.ok(Map.of("remindersCreated", created));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}