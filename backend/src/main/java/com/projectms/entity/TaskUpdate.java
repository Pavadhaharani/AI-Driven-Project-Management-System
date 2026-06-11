package com.projectms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import java.time.LocalDateTime;

@Document(collection = "task_updates")
public class TaskUpdate {

    @Id
    private String id;

    @DBRef
    private Task task;

    @DBRef
    private User user;

    private String content;
    private int progressPercent = 0;
    private UpdateType type;
    private LocalDateTime createdAt;

    public TaskUpdate() {}

    public String getId() { return id; }
    public Task getTask() { return task; }
    public User getUser() { return user; }
    public String getContent() { return content; }
    public int getProgressPercent() { return progressPercent; }
    public UpdateType getType() { return type; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(String id) { this.id = id; }
    public void setTask(Task task) { this.task = task; }
    public void setUser(User user) { this.user = user; }
    public void setContent(String content) { this.content = content; }
    public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }
    public void setType(UpdateType type) { this.type = type; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final TaskUpdate u = new TaskUpdate();
        public Builder task(Task v) { u.task = v; return this; }
        public Builder user(User v) { u.user = v; return this; }
        public Builder content(String v) { u.content = v; return this; }
        public Builder progressPercent(int v) { u.progressPercent = v; return this; }
        public Builder type(UpdateType v) { u.type = v; return this; }
        public TaskUpdate build() {
            if (u.createdAt == null) u.createdAt = LocalDateTime.now();
            return u;
        }
    }

    public enum UpdateType { PROGRESS_UPDATE, BLOCKER, FEEDBACK, COMPLETION }
}