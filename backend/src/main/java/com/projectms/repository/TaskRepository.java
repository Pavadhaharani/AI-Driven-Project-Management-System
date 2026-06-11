package com.projectms.repository;

import com.projectms.entity.Task;
import com.projectms.entity.Project;
import com.projectms.entity.Milestone;
import com.projectms.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByProject(Project project);
    List<Task> findByMilestone(Milestone milestone);
    List<Task> findByAssignedTo(User user);
    List<Task> findByProjectAndAssignedTo(Project project, User user);
    List<Task> findByProjectAndStatus(Project project, Task.TaskStatus status);
    long countByProjectAndStatus(Project project, Task.TaskStatus status);
    long countByAssignedToAndStatus(User user, Task.TaskStatus status);
    long countByProject(Project project);
}