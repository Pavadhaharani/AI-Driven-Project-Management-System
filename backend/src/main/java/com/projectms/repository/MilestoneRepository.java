package com.projectms.repository;

import com.projectms.entity.Milestone;
import com.projectms.entity.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MilestoneRepository extends MongoRepository<Milestone, String> {
    List<Milestone> findByProjectOrderByOrderIndex(Project project);
    List<Milestone> findByProjectAndStatus(Project project, Milestone.MilestoneStatus status);
    long countByProjectAndStatus(Project project, Milestone.MilestoneStatus status);
}