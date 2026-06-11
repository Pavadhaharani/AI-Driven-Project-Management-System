package com.projectms.repository;

import com.projectms.entity.TaskUpdate;
import com.projectms.entity.Task;
import com.projectms.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskUpdateRepository extends MongoRepository<TaskUpdate, String> {
    List<TaskUpdate> findByTaskOrderByCreatedAtDesc(Task task);
    List<TaskUpdate> findByUserOrderByCreatedAtDesc(User user);
    List<TaskUpdate> findByTaskAndUser(Task task, User user);
}