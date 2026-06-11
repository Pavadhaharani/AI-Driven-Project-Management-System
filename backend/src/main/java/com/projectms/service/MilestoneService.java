package com.projectms.service;

import com.projectms.entity.*;
import com.projectms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class MilestoneService {

    @Autowired private MilestoneRepository milestoneRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TaskRepository taskRepository;

    public List<Milestone> getMilestonesByProject(String projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));
        return milestoneRepository.findByProjectOrderByOrderIndex(project);
    }

    public Milestone getMilestoneById(String id) {
        return milestoneRepository.findById(id).orElseThrow(() -> new RuntimeException("Milestone not found: " + id));
    }

    public Milestone createMilestone(Map<String, Object> req, User manager) {
        String projectId = (String) req.get("projectId");
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));
        if (manager.getRole() == User.Role.PROJECT_MANAGER && !project.getManager().getId().equals(manager.getId()))
            throw new RuntimeException("You are not the manager of this project");
        Milestone milestone = Milestone.builder().project(project)
                .phase(Milestone.MilestonePhase.valueOf((String) req.get("phase")))
                .title((String) req.get("title")).description((String) req.get("description"))
                .orderIndex(req.get("orderIndex") != null ? (Integer) req.get("orderIndex") : 1)
                .status(Milestone.MilestoneStatus.PENDING)
                .dueDate(req.get("dueDate") != null ? LocalDate.parse((String) req.get("dueDate")) : null)
                .progressPercent(0).build();
        return milestoneRepository.save(milestone);
    }

    public Milestone updateMilestone(String id, Map<String, Object> req) {
        Milestone milestone = getMilestoneById(id);
        if (req.containsKey("title")) milestone.setTitle((String) req.get("title"));
        if (req.containsKey("description")) milestone.setDescription((String) req.get("description"));
        if (req.containsKey("status")) {
            Milestone.MilestoneStatus status = Milestone.MilestoneStatus.valueOf((String) req.get("status"));
            milestone.setStatus(status);
            if (status == Milestone.MilestoneStatus.COMPLETED) milestone.setCompletedDate(LocalDate.now());
        }
        if (req.containsKey("dueDate") && req.get("dueDate") != null) milestone.setDueDate(LocalDate.parse((String) req.get("dueDate")));
        if (req.containsKey("progressPercent")) milestone.setProgressPercent((Integer) req.get("progressPercent"));
        return milestoneRepository.save(milestone);
    }

    public void deleteMilestone(String id) { milestoneRepository.deleteById(id); }

    public void recalculateProgress(String milestoneId) {
        Milestone milestone = getMilestoneById(milestoneId);
        long total = taskRepository.findByMilestone(milestone).size();
        long completed = taskRepository.countByProjectAndStatus(milestone.getProject(), Task.TaskStatus.COMPLETED);
        if (total > 0) { milestone.setProgressPercent((int) ((completed * 100) / total)); milestoneRepository.save(milestone); }
    }
}