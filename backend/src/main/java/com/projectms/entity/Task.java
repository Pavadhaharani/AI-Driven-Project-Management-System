package com.projectms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "tasks")
public class Task {

    @Id
    private String id;

    @DBRef
    private Project project;

    @DBRef
    private Milestone milestone;

    private String title;
    private String description;

    @DBRef
    private User assignedTo;

    @DBRef
    private User createdBy;

    private TaskStatus status = TaskStatus.TODO;
    private int priority = 2;
    private LocalDate dueDate;
    private LocalDate completedDate;
    private int estimatedHours = 0;
    private int actualHours = 0;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Task() {}

    public String getId() { return id; }
    public Project getProject() { return project; }
    public Milestone getMilestone() { return milestone; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public User getAssignedTo() { return assignedTo; }
    public User getCreatedBy() { return createdBy; }
    public TaskStatus getStatus() { return status; }
    public int getPriority() { return priority; }
    public LocalDate getDueDate() { return dueDate; }
    public LocalDate getCompletedDate() { return completedDate; }
    public int getEstimatedHours() { return estimatedHours; }
    public int getActualHours() { return actualHours; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(String id) { this.id = id; }
    public void setProject(Project project) { this.project = project; }
    public void setMilestone(Milestone milestone) { this.milestone = milestone; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public void setStatus(TaskStatus status) { this.status = status; }
    public void setPriority(int priority) { this.priority = priority; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
    public void setEstimatedHours(int estimatedHours) { this.estimatedHours = estimatedHours; }
    public void setActualHours(int actualHours) { this.actualHours = actualHours; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Task t = new Task();
        public Builder project(Project v) { t.project = v; return this; }
        public Builder milestone(Milestone v) { t.milestone = v; return this; }
        public Builder title(String v) { t.title = v; return this; }
        public Builder description(String v) { t.description = v; return this; }
        public Builder assignedTo(User v) { t.assignedTo = v; return this; }
        public Builder createdBy(User v) { t.createdBy = v; return this; }
        public Builder status(TaskStatus v) { t.status = v; return this; }
        public Builder priority(int v) { t.priority = v; return this; }
        public Builder dueDate(LocalDate v) { t.dueDate = v; return this; }
        public Builder estimatedHours(int v) { t.estimatedHours = v; return this; }
        public Task build() {
            if (t.createdAt == null) t.createdAt = LocalDateTime.now();
            return t;
        }
    }

    public enum TaskStatus { TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, BLOCKED }
}