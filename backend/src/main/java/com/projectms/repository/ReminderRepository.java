package com.projectms.repository;

import com.projectms.entity.Reminder;
import com.projectms.entity.Task;
import com.projectms.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository for Reminder documents.
 *
 * IMPORTANT: Spring Data MongoDB @DBRef queries (e.g., findByRecipient(User))
 * can be unreliable across driver/Spring versions because @DBRef stores a
 * document reference, not the embedded document. Filtering by the recipient's
 * raw ID field ("recipient.$id") is more portable and avoids silent mismatches.
 *
 * All queries here use recipientId (String) to match against the MongoDB
 * stored DBRef "$id" field, which is always the String ObjectId value.
 *
 * File path: backend/src/main/java/com/projectms/repository/ReminderRepository.java
 */
@Repository
public interface ReminderRepository extends MongoRepository<Reminder, String> {

    // ── Queries using recipientId for reliable @DBRef matching ────────────────

    /** All reminders for a specific user (matched by user ID string) */
    @Query("{ 'recipient.$id': { $oid: ?0 } }")
    List<Reminder> findByRecipientId(String recipientId);

    /** All unread/read reminders for a user, filtered by read status */
    @Query("{ 'recipient.$id': { $oid: ?0 }, 'read': ?1 }")
    List<Reminder> findByRecipientIdAndRead(String recipientId, boolean read);

    /** Count of unread reminders for a user (for the notification badge) */
    @Query(value = "{ 'recipient.$id': { $oid: ?0 }, 'read': ?1 }", count = true)
    long countByRecipientIdAndRead(String recipientId, boolean read);

    /**
     * Duplicate-guard: returns true if a reminder for this task + recipient + type
     * already exists. Uses task ID and recipient ID as raw strings to avoid
     * @DBRef comparison issues.
     */
    @Query(value = "{ 'task.$id': { $oid: ?0 }, 'recipient.$id': { $oid: ?1 }, 'type': ?2 }",
           exists = true)
    boolean existsByTaskIdAndRecipientIdAndType(String taskId,
                                                String recipientId,
                                                Reminder.ReminderType type);

    // ── Legacy @DBRef-based queries (kept for backward compatibility) ─────────

    /** @deprecated Prefer findByRecipientId(String) */
    List<Reminder> findByRecipient(User recipient);

    /** @deprecated Prefer findByRecipientIdAndRead(String, boolean) */
    List<Reminder> findByRecipientAndRead(User recipient, boolean read);

    /** @deprecated Prefer countByRecipientIdAndRead(String, boolean) */
    long countByRecipientAndRead(User recipient, boolean read);

    /** @deprecated Prefer existsByTaskIdAndRecipientIdAndType(String, String, ReminderType) */
    boolean existsByTaskAndRecipientAndType(Task task, User recipient, Reminder.ReminderType type);

    /** Delete all reminders for a task (when task is deleted) */
    void deleteByTask(Task task);
}