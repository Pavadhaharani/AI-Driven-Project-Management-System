package com.projectms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "milestones")
public class Milestone {

    @Id
    private String id;

    @DBRef
    private Project project;

    private MilestonePhase phase;
    private String title;
    private String description;
    private int orderIndex = 1;
    private MilestoneStatus status = MilestoneStatus.PENDING;
    private LocalDate dueDate;
    private LocalDate completedDate;
    private int progressPercent = 0;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Milestone() {}

    public String getId() { return id; }
    public Project getProject() { return project; }
    public MilestonePhase getPhase() { return phase; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getOrderIndex() { return orderIndex; }
    public MilestoneStatus getStatus() { return status; }
    public LocalDate getDueDate() { return dueDate; }
    public LocalDate getCompletedDate() { return completedDate; }
    public int getProgressPercent() { return progressPercent; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(String id) { this.id = id; }
    public void setProject(Project project) { this.project = project; }
    public void setPhase(MilestonePhase phase) { this.phase = phase; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
    public void setStatus(MilestoneStatus status) { this.status = status; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
    public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Milestone m = new Milestone();
        public Builder project(Project v) { m.project = v; return this; }
        public Builder phase(MilestonePhase v) { m.phase = v; return this; }
        public Builder title(String v) { m.title = v; return this; }
        public Builder description(String v) { m.description = v; return this; }
        public Builder orderIndex(int v) { m.orderIndex = v; return this; }
        public Builder status(MilestoneStatus v) { m.status = v; return this; }
        public Builder dueDate(LocalDate v) { m.dueDate = v; return this; }
        public Builder progressPercent(int v) { m.progressPercent = v; return this; }
        public Milestone build() {
            if (m.createdAt == null) m.createdAt = LocalDateTime.now();
            return m;
        }
    }

    public enum MilestonePhase {
        DOCUMENTS_AND_INFORMATION_COLLECTION, DESIGN_THE_APPLICATION,
        DEVELOPMENT, TESTING, REVIEW, PUBLISH
    }

    public enum MilestoneStatus { PENDING, IN_PROGRESS, COMPLETED, BLOCKED }
}