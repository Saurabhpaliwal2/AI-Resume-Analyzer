package com.analyzer.controller;

import com.analyzer.dto.AuthResponse;
import com.analyzer.dto.LoginRequest;
import com.analyzer.model.User;
import com.analyzer.repository.UserRepository;
import com.analyzer.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository repository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        logger.info("Registration attempt for email: {}", user.getEmail());
        if (repository.findByEmail(user.getEmail()).isPresent()) {
            logger.warn("Registration failed: Email {} already exists", user.getEmail());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Email already registered");
            return ResponseEntity.badRequest().body(response);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        repository.save(user);
        logger.info("User {} registered successfully", user.getEmail());
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        logger.info("Login attempt for email: {}", request.getEmail());
        Optional<User> userOpt = repository.findByEmail(request.getEmail());
        if (userOpt.isPresent() && passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            logger.info("Login successful for user: {}", request.getEmail());
            String token = jwtUtils.generateToken(userOpt.get().getEmail());
            return ResponseEntity.ok(new AuthResponse(token, userOpt.get().getEmail(), userOpt.get().getName()));
        }
        logger.warn("Login failed for user: {}", request.getEmail());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Invalid credentials");
        return ResponseEntity.status(401).body(response);
    }
}
