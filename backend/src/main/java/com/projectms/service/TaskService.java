package com.projectms.service;

import com.projectms.entity.*;
import com.projectms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class TaskService {

    @Autowired private TaskRepository taskRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private MilestoneRepository milestoneRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TaskUpdateRepository taskUpdateRepository;

    public List<Task> getTasksByProject(String projectId) {
        return taskRepository.findByProject(projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found")));
    }

    public List<Task> getTasksByMilestone(String milestoneId) {
        return taskRepository.findByMilestone(milestoneRepository.findById(milestoneId).orElseThrow(() -> new RuntimeException("Milestone not found")));
    }

    public List<Task> getTasksByUser(User user) { return taskRepository.findByAssignedTo(user); }

    public Task getTaskById(String id) {
        return taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found: " + id));
    }

    public Task createTask(Map<String, Object> req, User creator) {
        Project project = projectRepository.findById((String) req.get("projectId")).orElseThrow(() -> new RuntimeException("Project not found"));
        Milestone milestone = req.get("milestoneId") != null ? milestoneRepository.findById((String) req.get("milestoneId")).orElseThrow(() -> new RuntimeException("Milestone not found")) : null;
        User assignedTo = req.get("assignedToId") != null ? userRepository.findById((String) req.get("assignedToId")).orElseThrow(() -> new RuntimeException("Assigned user not found")) : null;
        Task task = Task.builder().project(project).milestone(milestone).title((String) req.get("title"))
                .description((String) req.get("description")).assignedTo(assignedTo).createdBy(creator)
                .status(Task.TaskStatus.TODO).priority(req.get("priority") != null ? (Integer) req.get("priority") : 2)
                .dueDate(req.get("dueDate") != null ? LocalDate.parse((String) req.get("dueDate")) : null)
                .estimatedHours(req.get("estimatedHours") != null ? (Integer) req.get("estimatedHours") : 0).build();
        return taskRepository.save(task);
    }

    public Task updateTask(String id, Map<String, Object> req, User actor) {
        Task task = getTaskById(id);
        if (req.containsKey("title")) task.setTitle((String) req.get("title"));
        if (req.containsKey("description")) task.setDescription((String) req.get("description"));
        if (req.containsKey("status")) {
            Task.TaskStatus status = Task.TaskStatus.valueOf((String) req.get("status"));
            task.setStatus(status);
            if (status == Task.TaskStatus.COMPLETED) task.setCompletedDate(LocalDate.now());
        }
        if (req.containsKey("priority")) task.setPriority((Integer) req.get("priority"));
        if (req.containsKey("dueDate") && req.get("dueDate") != null) task.setDueDate(LocalDate.parse((String) req.get("dueDate")));
        if (req.containsKey("estimatedHours")) task.setEstimatedHours((Integer) req.get("estimatedHours"));
        if (req.containsKey("actualHours")) task.setActualHours((Integer) req.get("actualHours"));
        if (req.containsKey("assignedToId") && req.get("assignedToId") != null)
            task.setAssignedTo(userRepository.findById((String) req.get("assignedToId")).orElseThrow(() -> new RuntimeException("User not found")));
        if (req.containsKey("milestoneId") && req.get("milestoneId") != null)
            task.setMilestone(milestoneRepository.findById((String) req.get("milestoneId")).orElseThrow(() -> new RuntimeException("Milestone not found")));
        return taskRepository.save(task);
    }

    public void deleteTask(String id) { taskRepository.deleteById(id); }

    public TaskUpdate addUpdate(String taskId, String content, int progress, String type, User user) {
        Task task = getTaskById(taskId);
        if (progress == 100) task.setStatus(Task.TaskStatus.COMPLETED);
        else if (progress > 0 && task.getStatus() == Task.TaskStatus.TODO) task.setStatus(Task.TaskStatus.IN_PROGRESS);
        taskRepository.save(task);
        return taskUpdateRepository.save(TaskUpdate.builder().task(task).user(user).content(content).progressPercent(progress).type(TaskUpdate.UpdateType.valueOf(type)).build());
    }

    public List<TaskUpdate> getTaskUpdates(String taskId) {
        return taskUpdateRepository.findByTaskOrderByCreatedAtDesc(getTaskById(taskId));
    }

    public Map<String, Object> getEmployeeStats(User user) {
        long total = taskRepository.findByAssignedTo(user).size();
        long completed = taskRepository.countByAssignedToAndStatus(user, Task.TaskStatus.COMPLETED);
        long inProgress = taskRepository.countByAssignedToAndStatus(user, Task.TaskStatus.IN_PROGRESS);
        long blocked = taskRepository.countByAssignedToAndStatus(user, Task.TaskStatus.BLOCKED);
        return Map.of("totalTasks", total, "completedTasks", completed, "inProgress", inProgress, "blocked", blocked);
    }
}