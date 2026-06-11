package com.projectms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    private String password;

    @Indexed(unique = true)
    private String email;

    private String fullName;
    private Role role;
    private Department department;
    private String designation;
    private String phone;
    private String profileImage;
    private boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {}

    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public Role getRole() { return role; }
    public Department getDepartment() { return department; }
    public String getDesignation() { return designation; }
    public String getPhone() { return phone; }
    public String getProfileImage() { return profileImage; }
    public boolean isActive() { return active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(String id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setEmail(String email) { this.email = email; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setRole(Role role) { this.role = role; }
    public void setDepartment(Department department) { this.department = department; }
    public void setDesignation(String designation) { this.designation = designation; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    public void setActive(boolean active) { this.active = active; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final User user = new User();
        public Builder id(String id) { user.id = id; return this; }
        public Builder username(String username) { user.username = username; return this; }
        public Builder password(String password) { user.password = password; return this; }
        public Builder email(String email) { user.email = email; return this; }
        public Builder fullName(String fullName) { user.fullName = fullName; return this; }
        public Builder role(Role role) { user.role = role; return this; }
        public Builder department(Department department) { user.department = department; return this; }
        public Builder designation(String designation) { user.designation = designation; return this; }
        public Builder phone(String phone) { user.phone = phone; return this; }
        public Builder active(boolean active) { user.active = active; return this; }
        public User build() {
            if (user.createdAt == null) user.createdAt = LocalDateTime.now();
            return user;
        }
    }

    public enum Role { ADMIN, PROJECT_MANAGER, EMPLOYEE }
    public enum Department { HR, PROJECT_DEVELOPMENT, ADMINISTRATION, CYBERSECURITY }
}