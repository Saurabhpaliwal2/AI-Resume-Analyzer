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

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "https://ai-resume-analyzer-pearl-seven.vercel.app"})
public class UserController {

    @Autowired
    private UserRepository repository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (repository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        repository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = repository.findByEmail(request.getEmail());
        if (userOpt.isPresent() && passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            String token = jwtUtils.generateToken(userOpt.get().getEmail());
            return ResponseEntity.ok(new AuthResponse(token, userOpt.get().getEmail(), userOpt.get().getName()));
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }
}
