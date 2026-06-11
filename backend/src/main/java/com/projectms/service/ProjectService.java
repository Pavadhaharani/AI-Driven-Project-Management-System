package com.projectms.service;

import com.projectms.entity.*;
import com.projectms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.*;

@Service
public class ProjectService {

    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectTeamRepository projectTeamRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TaskRepository taskRepository;

    public List<Project> getAllProjects() { return projectRepository.findAll(); }
    public List<Project> getProjectsByDepartment(User.Department dept) { return projectRepository.findByDepartment(dept); }
    public List<Project> getProjectsByManager(User manager) { return projectRepository.findByManager(manager); }

    public List<Project> getProjectsByEmployee(User user) {
        List<ProjectTeam> teams = projectTeamRepository.findByUser(user);
        List<Project> projects = new ArrayList<>();
        for (ProjectTeam pt : teams) projects.add(pt.getProject());
        return projects;
    }

    public Project getProjectById(String id) {
        return projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found: " + id));
    }

    public Project createProject(Map<String, Object> req, User admin) {
        User manager = null;
        if (req.get("managerId") != null) {
            manager = userRepository.findById((String) req.get("managerId")).orElseThrow(() -> new RuntimeException("Manager not found"));
            if (manager.getRole() != User.Role.PROJECT_MANAGER) throw new RuntimeException("Assigned user is not a Project Manager");
        }
        User.Department dept = req.get("department") != null ? User.Department.valueOf((String) req.get("department")) : admin.getDepartment();
        Project project = Project.builder().name((String) req.get("name")).description((String) req.get("description"))
                .department(dept).createdBy(admin).manager(manager).status(Project.ProjectStatus.PLANNING)
                .startDate(req.get("startDate") != null ? LocalDate.parse((String) req.get("startDate")) : null)
                .endDate(req.get("endDate") != null ? LocalDate.parse((String) req.get("endDate")) : null)
                .priority(req.get("priority") != null ? (Integer) req.get("priority") : 2).build();
        return projectRepository.save(project);
    }

    public Project updateProject(String id, Map<String, Object> req, User actor) {
        Project project = getProjectById(id);
        if (actor.getRole() == User.Role.ADMIN && !project.getDepartment().equals(actor.getDepartment()))
            throw new RuntimeException("Access denied");
        if (req.containsKey("name")) project.setName((String) req.get("name"));
        if (req.containsKey("description")) project.setDescription((String) req.get("description"));
        if (req.containsKey("status")) project.setStatus(Project.ProjectStatus.valueOf((String) req.get("status")));
        if (req.containsKey("priority")) project.setPriority((Integer) req.get("priority"));
        if (req.containsKey("startDate") && req.get("startDate") != null) project.setStartDate(LocalDate.parse((String) req.get("startDate")));
        if (req.containsKey("endDate") && req.get("endDate") != null) project.setEndDate(LocalDate.parse((String) req.get("endDate")));
        if (req.containsKey("managerId") && req.get("managerId") != null) {
            User mgr = userRepository.findById((String) req.get("managerId")).orElseThrow(() -> new RuntimeException("Manager not found"));
            project.setManager(mgr);
        }
        return projectRepository.save(project);
    }

    public void deleteProject(String id, User admin) {
        Project project = getProjectById(id);
        if (!project.getDepartment().equals(admin.getDepartment())) throw new RuntimeException("Access denied");
        projectRepository.deleteById(id);
    }

    public ProjectTeam addTeamMember(String projectId, String userId, String role) {
        Project project = getProjectById(projectId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (projectTeamRepository.existsByProjectAndUser(project, user)) throw new RuntimeException("User already in team");
        return projectTeamRepository.save(ProjectTeam.builder().project(project).user(user).role(role).build());
    }

    public void removeTeamMember(String projectId, String userId) {
        Project project = getProjectById(projectId);
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        projectTeamRepository.deleteByProjectAndUser(project, user);
    }

    public List<ProjectTeam> getTeamMembers(String projectId) {
        return projectTeamRepository.findByProject(getProjectById(projectId));
    }

    public Map<String, Object> getProjectStats(String projectId) {
        Project project = getProjectById(projectId);
        long total = taskRepository.countByProject(project);
        long completed = taskRepository.countByProjectAndStatus(project, Task.TaskStatus.COMPLETED);
        long inProgress = taskRepository.countByProjectAndStatus(project, Task.TaskStatus.IN_PROGRESS);
        long blocked = taskRepository.countByProjectAndStatus(project, Task.TaskStatus.BLOCKED);
        int progress = total > 0 ? (int) ((completed * 100) / total) : 0;
        return Map.of("totalTasks", total, "completedTasks", completed, "inProgress", inProgress, "blocked", blocked, "progressPercent", progress);
    }
}