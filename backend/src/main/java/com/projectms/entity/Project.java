package com.projectms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "projects")
public class Project {

    @Id
    private String id;

    private String name;
    private String description;
    private User.Department department;

    @DBRef
    private User createdBy;

    @DBRef
    private User manager;

    private ProjectStatus status = ProjectStatus.PLANNING;
    private LocalDate startDate;
    private LocalDate endDate;
    private int priority = 2;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Project() {}

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public User.Department getDepartment() { return department; }
    public User getCreatedBy() { return createdBy; }
    public User getManager() { return manager; }
    public ProjectStatus getStatus() { return status; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public int getPriority() { return priority; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setDepartment(User.Department department) { this.department = department; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public void setManager(User manager) { this.manager = manager; }
    public void setStatus(ProjectStatus status) { this.status = status; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setPriority(int priority) { this.priority = priority; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Project p = new Project();
        public Builder name(String v) { p.name = v; return this; }
        public Builder description(String v) { p.description = v; return this; }
        public Builder department(User.Department v) { p.department = v; return this; }
        public Builder createdBy(User v) { p.createdBy = v; return this; }
        public Builder manager(User v) { p.manager = v; return this; }
        public Builder status(ProjectStatus v) { p.status = v; return this; }
        public Builder startDate(LocalDate v) { p.startDate = v; return this; }
        public Builder endDate(LocalDate v) { p.endDate = v; return this; }
        public Builder priority(int v) { p.priority = v; return this; }
        public Project build() {
            if (p.createdAt == null) p.createdAt = LocalDateTime.now();
            return p;
        }
    }

    public enum ProjectStatus { PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED }
}