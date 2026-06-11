package com.projectms.repository;

import com.projectms.entity.ProjectTeam;
import com.projectms.entity.Project;
import com.projectms.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTeamRepository extends MongoRepository<ProjectTeam, String> {
    List<ProjectTeam> findByProject(Project project);
    List<ProjectTeam> findByUser(User user);
    Optional<ProjectTeam> findByProjectAndUser(Project project, User user);
    boolean existsByProjectAndUser(Project project, User user);
    void deleteByProjectAndUser(Project project, User user);
}