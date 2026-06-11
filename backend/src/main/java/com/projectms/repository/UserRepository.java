package com.projectms.repository;

import com.projectms.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findByDepartment(User.Department department);
    List<User> findByRole(User.Role role);
    List<User> findByDepartmentAndRole(User.Department department, User.Role role);
    boolean existsByDepartmentAndRole(User.Department department, User.Role role);
    List<User> findByActiveTrue();
}