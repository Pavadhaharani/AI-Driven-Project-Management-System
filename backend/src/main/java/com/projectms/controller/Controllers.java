package com.projectms.controller;

import com.projectms.entity.*;
import com.projectms.ml.AiInsightEngine;
import com.projectms.repository.UserRepository;
import com.projectms.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

// ============================================================
// AUTH CONTROLLER
// ============================================================
@RestController
@RequestMapping("/api/auth")
class AuthController {

    @Autowired private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        try {
            Map<String, Object> result = authService.login(req.get("username"), req.get("password"));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails,
                                @Autowired UserRepository userRepo) {
        User user = userRepo.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Not found"));
        return ResponseEntity.ok(userToMap(user));
    }

    static Map<String, Object> userToMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("email", u.getEmail());
        m.put("fullName", u.getFullName());
        m.put("role", u.getRole());
        m.put("department", u.getDepartment());
        m.put("designation", u.getDesignation());
        m.put("phone", u.getPhone());
        m.put("active", u.isActive());
        m.put("createdAt", u.getCreatedAt());
        return m;
    }
}

// ============================================================
// USER / ADMIN CONTROLLER
// ============================================================
@RestController
@RequestMapping("/api/admin")
class AdminController {

    @Autowired private UserService userService;
    @Autowired private ProjectService projectService;
    @Autowired private UserRepository userRepository;

    private User currentUser(UserDetails ud) {
        return userRepository.findByUsername(ud.getUsername()).orElseThrow();
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(@AuthenticationPrincipal UserDetails ud) {
        User admin = currentUser(ud);
        List<User> users = userService.getUsersByDepartment(admin.getDepartment());
        return ResponseEntity.ok(users.stream().map(AuthController::userToMap).toList());
    }

    @GetMapping("/users/all")
    public ResponseEntity<?> allUsers() {
        return ResponseEntity.ok(userService.getAllUsers().stream().map(AuthController::userToMap).toList());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        return ResponseEntity.ok(AuthController.userToMap(userService.getUserById(id)));
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> req,
                                        @AuthenticationPrincipal UserDetails ud) {
        try {
            User admin = currentUser(ud);
            User created = userService.createUser(req, admin);
            return ResponseEntity.ok(AuthController.userToMap(created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, Object> req,
                                        @AuthenticationPrincipal UserDetails ud) {
        try {
            User admin = currentUser(ud);
            User updated = userService.updateUser(id, req, admin);
            return ResponseEntity.ok(AuthController.userToMap(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id,
                                        @AuthenticationPrincipal UserDetails ud) {
        try {
            User admin = currentUser(ud);
            userService.deleteUser(id, admin);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> deptStats(@AuthenticationPrincipal UserDetails ud) {
        User admin = currentUser(ud);
        Map<String, Object> stats = userService.getDepartmentStats(admin.getDepartment());
        long projects = projectService.getProjectsByDepartment(admin.getDepartment()).size();
        stats = new HashMap<>(stats);
        stats.put("projects", projects);
        stats.put("department", admin.getDepartment());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/managers")
    public ResponseEntity<?> listManagers(@AuthenticationPrincipal UserDetails ud) {
        User admin = currentUser(ud);
        return ResponseEntity.ok(userService.getManagersByDepartment(admin.getDepartment())
                .stream().map(AuthController::userToMap).toList());
    }

    @GetMapping("/employees")
    public ResponseEntity<?> listEmployees(@AuthenticationPrincipal UserDetails ud) {
        User admin = currentUser(ud);
        return ResponseEntity.ok(userService.getEmployeesByDepartment(admin.getDepartment())
                .stream().map(AuthController::userToMap).toList());
    }
}

// ============================================================
// PROJECT CONTROLLER
// ============================================================
@RestController
@RequestMapping("/api/projects")
class ProjectController {

    @Autowired private ProjectService projectService;
    @Autowired private UserRepository userRepository;

    private User currentUser(UserDetails ud) {
        return userRepository.findByUsername(ud.getUsername()).orElseThrow();
    }

    @GetMapping
    public ResponseEntity<?> listProjects(@AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        List<Project> projects = switch (user.getRole()) {
            case ADMIN -> projectService.getProjectsByDepartment(user.getDepartment());
            case PROJECT_MANAGER -> projectService.getProjectsByManager(user);
            case EMPLOYEE -> projectService.getProjectsByEmployee(user);
        };
        return ResponseEntity.ok(projects.stream().map(this::projectToMap).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable String id) {
        return ResponseEntity.ok(projectToMap(projectService.getProjectById(id)));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<?> projectStats(@PathVariable String id) {
        return ResponseEntity.ok(projectService.getProjectStats(id));
    }

    @GetMapping("/{id}/team")
    public ResponseEntity<?> getTeam(@PathVariable String id) {
        List<ProjectTeam> team = projectService.getTeamMembers(id);
        return ResponseEntity.ok(team.stream().map(pt -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", pt.getId());
            m.put("user", AuthController.userToMap(pt.getUser()));
            m.put("role", pt.getRole());
            m.put("joinedAt", pt.getJoinedAt());
            return m;
        }).toList());
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Map<String, Object> req,
                                           @AuthenticationPrincipal UserDetails ud) {
        try {
            User admin = currentUser(ud);
            Project p = projectService.createProject(req, admin);
            return ResponseEntity.ok(projectToMap(p));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable String id, @RequestBody Map<String, Object> req,
                                           @AuthenticationPrincipal UserDetails ud) {
        try {
            Project p = projectService.updateProject(id, req, currentUser(ud));
            return ResponseEntity.ok(projectToMap(p));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable String id, @AuthenticationPrincipal UserDetails ud) {
        try {
            projectService.deleteProject(id, currentUser(ud));
            return ResponseEntity.ok(Map.of("message", "Project deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/team")
    public ResponseEntity<?> addMember(@PathVariable String id, @RequestBody Map<String, Object> req) {
        try {
            String userId = (String) req.get("userId");
            String role = (String) req.getOrDefault("role", "Team Member");
            projectService.addTeamMember(id, userId, role);
            return ResponseEntity.ok(Map.of("message", "Member added"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/team/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable String id, @PathVariable String userId) {
        try {
            projectService.removeTeamMember(id, userId);
            return ResponseEntity.ok(Map.of("message", "Member removed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    Map<String, Object> projectToMap(Project p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("name", p.getName());
        m.put("description", p.getDescription());
        m.put("department", p.getDepartment());
        m.put("status", p.getStatus());
        m.put("priority", p.getPriority());
        m.put("startDate", p.getStartDate());
        m.put("endDate", p.getEndDate());
        m.put("createdAt", p.getCreatedAt());
        if (p.getManager() != null) m.put("manager", AuthController.userToMap(p.getManager()));
        if (p.getCreatedBy() != null) m.put("createdBy", AuthController.userToMap(p.getCreatedBy()));
        return m;
    }
}

// ============================================================
// MILESTONE CONTROLLER
// ============================================================
@RestController
@RequestMapping("/api/milestones")
class MilestoneController {

    @Autowired private MilestoneService milestoneService;
    @Autowired private UserRepository userRepository;

    private User currentUser(UserDetails ud) {
        return userRepository.findByUsername(ud.getUsername()).orElseThrow();
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> listByProject(@PathVariable String projectId) {
        return ResponseEntity.ok(milestoneService.getMilestonesByProject(projectId)
                .stream().map(this::msToMap).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable String id) {
        return ResponseEntity.ok(msToMap(milestoneService.getMilestoneById(id)));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req,
                                    @AuthenticationPrincipal UserDetails ud) {
        try {
            Milestone m = milestoneService.createMilestone(req, currentUser(ud));
            return ResponseEntity.ok(msToMap(m));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Map<String, Object> req) {
        try {
            return ResponseEntity.ok(msToMap(milestoneService.updateMilestone(id, req)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        milestoneService.deleteMilestone(id);
        return ResponseEntity.ok(Map.of("message", "Milestone deleted"));
    }

    Map<String, Object> msToMap(Milestone m) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id", m.getId());
        r.put("projectId", m.getProject().getId());
        r.put("projectName", m.getProject().getName());
        r.put("phase", m.getPhase());
        r.put("title", m.getTitle());
        r.put("description", m.getDescription());
        r.put("orderIndex", m.getOrderIndex());
        r.put("status", m.getStatus());
        r.put("dueDate", m.getDueDate());
        r.put("completedDate", m.getCompletedDate());
        r.put("progressPercent", m.getProgressPercent());
        r.put("createdAt", m.getCreatedAt());
        return r;
    }
}

// ============================================================
// TASK CONTROLLER
// ============================================================
@RestController
@RequestMapping("/api/tasks")
class TaskController {

    @Autowired private TaskService taskService;
    @Autowired private UserRepository userRepository;

    private User currentUser(UserDetails ud) {
        return userRepository.findByUsername(ud.getUsername()).orElseThrow();
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> byProject(@PathVariable String projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId).stream().map(this::taskToMap).toList());
    }

    @GetMapping("/milestone/{milestoneId}")
    public ResponseEntity<?> byMilestone(@PathVariable String milestoneId) {
        return ResponseEntity.ok(taskService.getTasksByMilestone(milestoneId).stream().map(this::taskToMap).toList());
    }

    @GetMapping("/my")
    public ResponseEntity<?> myTasks(@AuthenticationPrincipal UserDetails ud) {
        User user = currentUser(ud);
        return ResponseEntity.ok(taskService.getTasksByUser(user).stream().map(this::taskToMap).toList());
    }

    @GetMapping("/my/stats")
    public ResponseEntity<?> myStats(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(taskService.getEmployeeStats(currentUser(ud)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable String id) {
        return ResponseEntity.ok(taskToMap(taskService.getTaskById(id)));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req,
                                    @AuthenticationPrincipal UserDetails ud) {
        try {
            Task t = taskService.createTask(req, currentUser(ud));
            return ResponseEntity.ok(taskToMap(t));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Map<String, Object> req,
                                    @AuthenticationPrincipal UserDetails ud) {
        try {
            Task t = taskService.updateTask(id, req, currentUser(ud));
            return ResponseEntity.ok(taskToMap(t));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(Map.of("message", "Task deleted"));
    }

    @PostMapping("/{id}/updates")
    public ResponseEntity<?> addUpdate(@PathVariable String id, @RequestBody Map<String, Object> req,
                                       @AuthenticationPrincipal UserDetails ud) {
        try {
            String content = (String) req.get("content");
            int progress = req.get("progressPercent") != null ? (Integer) req.get("progressPercent") : 0;
            String type = req.get("type") != null ? (String) req.get("type") : "PROGRESS_UPDATE";
            TaskUpdate update = taskService.addUpdate(id, content, progress, type, currentUser(ud));
            return ResponseEntity.ok(updateToMap(update));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/updates")
    public ResponseEntity<?> getUpdates(@PathVariable String id) {
        return ResponseEntity.ok(taskService.getTaskUpdates(id).stream().map(this::updateToMap).toList());
    }

    Map<String, Object> taskToMap(Task t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("projectId", t.getProject().getId());
        m.put("projectName", t.getProject().getName());
        m.put("title", t.getTitle());
        m.put("description", t.getDescription());
        m.put("status", t.getStatus());
        m.put("priority", t.getPriority());
        m.put("dueDate", t.getDueDate());
        m.put("completedDate", t.getCompletedDate());
        m.put("estimatedHours", t.getEstimatedHours());
        m.put("actualHours", t.getActualHours());
        m.put("createdAt", t.getCreatedAt());
        if (t.getMilestone() != null) {
            m.put("milestoneId", t.getMilestone().getId());
            m.put("milestoneName", t.getMilestone().getTitle());
        }
        if (t.getAssignedTo() != null) m.put("assignedTo", AuthController.userToMap(t.getAssignedTo()));
        if (t.getCreatedBy() != null) m.put("createdBy", AuthController.userToMap(t.getCreatedBy()));
        return m;
    }

    Map<String, Object> updateToMap(TaskUpdate u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("taskId", u.getTask().getId());
        m.put("content", u.getContent());
        m.put("progressPercent", u.getProgressPercent());
        m.put("type", u.getType());
        m.put("createdAt", u.getCreatedAt());
        m.put("user", AuthController.userToMap(u.getUser()));
        return m;
    }
}

// ============================================================
// AI INSIGHT CONTROLLER
// ============================================================
@RestController
@RequestMapping("/api/ai-insight")
class AiInsightController {

    @Autowired private AiInsightEngine aiEngine;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
            String text = aiEngine.extractText(file);
            if (text == null || text.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not extract text from document"));
            }
            Map<String, Object> result = aiEngine.analyze(text, file.getOriginalFilename());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }
}