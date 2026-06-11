package com.projectms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import java.time.LocalDateTime;

@Document(collection = "project_teams")
@CompoundIndex(name = "project_user_unique", def = "{'project.$id': 1, 'user.$id': 1}", unique = true)
public class ProjectTeam {

    @Id
    private String id;

    @DBRef
    private Project project;

    @DBRef
    private User user;

    private String role;
    private LocalDateTime joinedAt;

    public ProjectTeam() {}

    public String getId() { return id; }
    public Project getProject() { return project; }
    public User getUser() { return user; }
    public String getRole() { return role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }

    public void setId(String id) { this.id = id; }
    public void setProject(Project project) { this.project = project; }
    public void setUser(User user) { this.user = user; }
    public void setRole(String role) { this.role = role; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final ProjectTeam pt = new ProjectTeam();
        public Builder project(Project v) { pt.project = v; return this; }
        public Builder user(User v) { pt.user = v; return this; }
        public Builder role(String v) { pt.role = v; return this; }
        public ProjectTeam build() {
            if (pt.joinedAt == null) pt.joinedAt = LocalDateTime.now();
            return pt;
        }
    }
}