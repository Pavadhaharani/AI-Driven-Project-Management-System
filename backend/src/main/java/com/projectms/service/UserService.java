package com.projectms.service;

import com.projectms.entity.User;
import com.projectms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() { return userRepository.findAll(); }
    public List<User> getUsersByDepartment(User.Department dept) { return userRepository.findByDepartment(dept); }
    public List<User> getUsersByRole(User.Role role) { return userRepository.findByRole(role); }

    public User getUserById(String id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public User createUser(Map<String, Object> req, User admin) {
        String username = (String) req.get("username");
        String email = (String) req.get("email");
        if (userRepository.existsByUsername(username)) throw new RuntimeException("Username already taken: " + username);
        if (userRepository.existsByEmail(email)) throw new RuntimeException("Email already in use: " + email);
        User.Role role = User.Role.valueOf((String) req.get("role"));
        User.Department dept = req.get("department") != null ? User.Department.valueOf((String) req.get("department")) : admin.getDepartment();
        if (role == User.Role.ADMIN && userRepository.existsByDepartmentAndRole(dept, User.Role.ADMIN))
            throw new RuntimeException("Department " + dept + " already has an admin");
        if (admin.getRole() == User.Role.ADMIN && !dept.equals(admin.getDepartment()))
            throw new RuntimeException("You can only create users in your department");
        User user = User.builder().username(username).email(email)
                .password(passwordEncoder.encode((String) req.get("password")))
                .fullName((String) req.get("fullName")).role(role).department(dept)
                .designation((String) req.get("designation")).phone((String) req.get("phone")).active(true).build();
        return userRepository.save(user);
    }

    public User updateUser(String id, Map<String, Object> req, User admin) {
        User user = getUserById(id);
        if (admin.getRole() == User.Role.ADMIN && !user.getDepartment().equals(admin.getDepartment()))
            throw new RuntimeException("Access denied: user is in a different department");
        if (req.containsKey("fullName")) user.setFullName((String) req.get("fullName"));
        if (req.containsKey("email")) user.setEmail((String) req.get("email"));
        if (req.containsKey("designation")) user.setDesignation((String) req.get("designation"));
        if (req.containsKey("phone")) user.setPhone((String) req.get("phone"));
        if (req.containsKey("active")) user.setActive(Boolean.TRUE.equals(req.get("active")));
        if (req.containsKey("password") && req.get("password") != null)
            user.setPassword(passwordEncoder.encode((String) req.get("password")));
        return userRepository.save(user);
    }

    public void deleteUser(String id, User admin) {
        User user = getUserById(id);
        if (admin.getRole() == User.Role.ADMIN && !user.getDepartment().equals(admin.getDepartment()))
            throw new RuntimeException("Access denied");
        if (user.getRole() == User.Role.ADMIN) throw new RuntimeException("Cannot delete an admin account");
        userRepository.deleteById(id);
    }

    public List<User> getManagersByDepartment(User.Department dept) { return userRepository.findByDepartmentAndRole(dept, User.Role.PROJECT_MANAGER); }
    public List<User> getEmployeesByDepartment(User.Department dept) { return userRepository.findByDepartmentAndRole(dept, User.Role.EMPLOYEE); }

    public Map<String, Object> getDepartmentStats(User.Department dept) {
        long admins = userRepository.findByDepartmentAndRole(dept, User.Role.ADMIN).size();
        long managers = userRepository.findByDepartmentAndRole(dept, User.Role.PROJECT_MANAGER).size();
        long employees = userRepository.findByDepartmentAndRole(dept, User.Role.EMPLOYEE).size();
        return Map.of("admins", admins, "managers", managers, "employees", employees, "total", admins + managers + employees);
    }
}