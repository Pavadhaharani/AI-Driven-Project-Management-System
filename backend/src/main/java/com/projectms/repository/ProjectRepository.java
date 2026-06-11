package com.projectms.repository;

import com.projectms.entity.Project;
import com.projectms.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {
    List<Project> findByDepartment(User.Department department);
    List<Project> findByManager(User manager);
    List<Project> findByCreatedBy(User createdBy);
    List<Project> findByStatus(Project.ProjectStatus status);
    long countByDepartment(User.Department dept);
}