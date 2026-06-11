package com.projectms.dto;

import com.projectms.entity.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// ============ AUTH ============
class AuthRequest {
    public String username;
    public String password;
}

class AuthResponse {
    public String token;
    public String role;
    public String department;
    public Long userId;
    public String fullName;
    public String username;
}

// ============ USER ============
class UserDTO {
    public Long id;
    public String username;
    public String email;
    public String fullName;
    public String role;
    public String department;
    public String designation;
    public String phone;
    public boolean active;
    public LocalDateTime createdAt;
}

class CreateUserRequest {
    public String username;
    public String email;
    public String password;
    public String fullName;
    public String role;
    public String department;
    public String designation;
    public String phone;
}

class UpdateUserRequest {
    public String email;
    public String fullName;
    public String designation;
    public String phone;
    public Boolean active;
    public String password;
}

// ============ PROJECT ============
class ProjectDTO {
    public Long id;
    public String name;
    public String description;
    public String department;
    public UserDTO manager;
    public UserDTO createdBy;
    public String status;
    public LocalDate startDate;
    public LocalDate endDate;
    public int priority;
    public LocalDateTime createdAt;
    public long totalTasks;
    public long completedTasks;
    public int progressPercent;
    public List<UserDTO> teamMembers;
}

class CreateProjectRequest {
    public String name;
    public String description;
    public String department;
    public Long managerId;
    public LocalDate startDate;
    public LocalDate endDate;
    public int priority;
}

class UpdateProjectRequest {
    public String name;
    public String description;
    public String status;
    public Long managerId;
    public LocalDate startDate;
    public LocalDate endDate;
    public int priority;
}

// ============ MILESTONE ============
class MilestoneDTO {
    public Long id;
    public Long projectId;
    public String phase;
    public String title;
    public String description;
    public int orderIndex;
    public String status;
    public LocalDate dueDate;
    public LocalDate completedDate;
    public int progressPercent;
    public LocalDateTime createdAt;
    public long totalTasks;
    public long completedTasks;
}

class CreateMilestoneRequest {
    public Long projectId;
    public String phase;
    public String title;
    public String description;
    public int orderIndex;
    public LocalDate dueDate;
}

class UpdateMilestoneRequest {
    public String title;
    public String description;
    public String status;
    public LocalDate dueDate;
    public int progressPercent;
}

// ============ TASK ============
class TaskDTO {
    public Long id;
    public Long projectId;
    public String projectName;
    public Long milestoneId;
    public String milestoneName;
    public String title;
    public String description;
    public UserDTO assignedTo;
    public UserDTO createdBy;
    public String status;
    public int priority;
    public LocalDate dueDate;
    public LocalDate completedDate;
    public int estimatedHours;
    public int actualHours;
    public LocalDateTime createdAt;
    public List<TaskUpdateDTO> updates;
}

class CreateTaskRequest {
    public Long projectId;
    public Long milestoneId;
    public String title;
    public String description;
    public Long assignedToId;
    public int priority;
    public LocalDate dueDate;
    public int estimatedHours;
}

class UpdateTaskRequest {
    public String title;
    public String description;
    public String status;
    public Long assignedToId;
    public Long milestoneId;
    public int priority;
    public LocalDate dueDate;
    public int estimatedHours;
    public int actualHours;
}

// ============ TASK UPDATE ============
class TaskUpdateDTO {
    public Long id;
    public Long taskId;
    public UserDTO user;
    public String content;
    public int progressPercent;
    public String type;
    public LocalDateTime createdAt;
}

class CreateTaskUpdateRequest {
    public Long taskId;
    public String content;
    public int progressPercent;
    public String type;
}

// ============ AI INSIGHT ============
class AiInsightResponse {
    public String analysis;
    public List<RiskItem> risks;
    public List<RecommendationItem> recommendations;
    public List<RoadmapItem> roadmap;
    public double confidenceScore;
    public String documentName;
    public int wordCount;
    public String complexityLevel;
}

class RiskItem {
    public String category;
    public String description;
    public String severity; // HIGH, MEDIUM, LOW
    public double score;
}

class RecommendationItem {
    public String category;
    public String action;
    public String priority;
    public String rationale;
}

class RoadmapItem {
    public String phase;
    public String milestone;
    public String estimatedDuration;
    public String status;
    public List<String> keyActivities;
}

// ============ DASHBOARD ============
class AdminDashboardDTO {
    public long totalEmployees;
    public long totalProjects;
    public long activeProjects;
    public long completedProjects;
    public long totalManagers;
    public String department;
    public List<ProjectDTO> recentProjects;
    public List<UserDTO> recentEmployees;
}

class ManagerDashboardDTO {
    public long totalProjects;
    public long activeTasks;
    public long completedTasks;
    public long pendingTasks;
    public List<ProjectDTO> projects;
}

class EmployeeDashboardDTO {
    public long totalTasks;
    public long completedTasks;
    public long inProgressTasks;
    public long overdueTasks;
    public List<TaskDTO> myTasks;
    public List<ProjectDTO> myProjects;
}
