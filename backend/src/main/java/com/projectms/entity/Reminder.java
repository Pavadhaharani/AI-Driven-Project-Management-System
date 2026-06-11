package com.projectms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import java.time.LocalDateTime;

@Document(collection = "reminders")
public class Reminder {

    @Id
    private String id;

    @DBRef
    private Task task;

    @DBRef
    private User recipient;          // Who receives this reminder

    private ReminderType type;       // EMPLOYEE_REMINDER or MANAGER_ALERT

    private String message;

    private boolean read = false;

    private LocalDateTime createdAt;

    private int daysUntilDue;        // negative = overdue

    public Reminder() {}

    // ─── Getters ─────────────────────────────────────────────────────────────

    public String getId()              { return id; }
    public Task getTask()              { return task; }
    public User getRecipient()         { return recipient; }
    public ReminderType getType()      { return type; }
    public String getMessage()         { return message; }
    public boolean isRead()            { return read; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
    public int getDaysUntilDue()       { return daysUntilDue; }

    // ─── Setters ─────────────────────────────────────────────────────────────

    public void setId(String id)                   { this.id = id; }
    public void setTask(Task task)                 { this.task = task; }
    public void setRecipient(User recipient)       { this.recipient = recipient; }
    public void setType(ReminderType type)         { this.type = type; }
    public void setMessage(String message)         { this.message = message; }
    public void setRead(boolean read)              { this.read = read; }
    public void setCreatedAt(LocalDateTime t)      { this.createdAt = t; }
    public void setDaysUntilDue(int daysUntilDue)  { this.daysUntilDue = daysUntilDue; }

    // ─── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Reminder r = new Reminder();

        public Builder task(Task v)           { r.task = v; return this; }
        public Builder recipient(User v)      { r.recipient = v; return this; }
        public Builder type(ReminderType v)   { r.type = v; return this; }
        public Builder message(String v)      { r.message = v; return this; }
        public Builder daysUntilDue(int v)    { r.daysUntilDue = v; return this; }

        public Reminder build() {
            if (r.createdAt == null) r.createdAt = LocalDateTime.now();
            return r;
        }
    }

    public enum ReminderType {
        EMPLOYEE_REMINDER,   // Sent to the assigned employee
        MANAGER_ALERT        // Sent to the project manager
    }
}