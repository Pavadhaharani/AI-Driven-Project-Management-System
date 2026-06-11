package com.projectms.config;

import com.projectms.entity.User;
import com.projectms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createAdmin("admin_hr",  "admin_hr@company.com",  "HR Admin",             User.Department.HR);
        createAdmin("admin_pd",  "admin_pd@company.com",  "Project Dev Admin",    User.Department.PROJECT_DEVELOPMENT);
        createAdmin("admin_adm", "admin_adm@company.com", "Administration Admin", User.Department.ADMINISTRATION);
        createAdmin("admin_cs",  "admin_cs@company.com",  "Cybersecurity Admin",  User.Department.CYBERSECURITY);
    }

    private void createAdmin(String username, String email, String fullName, User.Department dept) {
        if (userRepository.existsByUsername(username)) return;
        User admin = User.builder().username(username).email(email)
                .password(passwordEncoder.encode("Admin@123")).fullName(fullName)
                .role(User.Role.ADMIN).department(dept).designation("Department Head").active(true).build();
        User saved = userRepository.save(admin);
        System.out.println("✅ Admin seeded: " + saved.getUsername() + " | active=" + saved.isActive() + " | role=" + saved.getRole());
    }
}