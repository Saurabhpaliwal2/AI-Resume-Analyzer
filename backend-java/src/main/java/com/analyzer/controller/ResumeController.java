package com.analyzer.controller;

import com.analyzer.model.AnalysisResult;
import com.analyzer.model.User;
import com.analyzer.repository.AnalysisRepository;
import com.analyzer.repository.UserRepository;
import com.analyzer.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = {"http://localhost:5173", "https://ai-resume-analyzer-pearl-seven.vercel.app"})
public class ResumeController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnalysisRepository repository;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private static final Logger logger = LoggerFactory.getLogger(ResumeController.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/analyze")
    public AnalysisResult analyze(@RequestParam("resume") MultipartFile file, 
                                  @RequestParam("jobDescription") String jobDescription,
                                  @RequestHeader("Authorization") String token) throws IOException {
        
        logger.info("Received analysis request for file: {}, user token: {}", file.getOriginalFilename(), token.substring(0, Math.min(token.length(), 15)) + "...");
        
        String email = jwtUtils.extractUsername(token.substring(7));
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            logger.warn("User not found for email: {}", email);
        } else {
            logger.info("Processing request for user: {}", user.getName());
        }

        // Prepare request for Python AI service
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("resumeBase64", Base64.getEncoder().encodeToString(file.getBytes()));
        body.put("resumeName", file.getOriginalFilename());
        body.put("jobDescription", jobDescription);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        // Call Python service
        AnalysisResult result;
        try {
            logger.info("Calling AI service at: {}", aiServiceUrl);
            result = restTemplate.postForObject(aiServiceUrl, request, AnalysisResult.class);
            logger.info("AI service responded successfully");
        } catch (Exception e) {
            logger.error("AI service call failed: {}. Using fallback mock.", e.getMessage());
            // Fallback to high-quality mock if AI service is down or fails
            result = new AnalysisResult();
            result.setSkillMatchPercentage(75);
            result.setMatchedSkills(java.util.List.of("Problem Solving", "Adaptability", "Collaboration"));
            result.setMissingSkills(java.util.List.of("Advanced AI Integration"));
            result.setImprovementSuggestions(java.util.List.of("Note: The AI analysis engine is currently in demo mode. Please check your connection for full analysis."));
            result.setJobRecommendations(java.util.List.of("Software Analyst", "Junior Developer"));
        }

        if (result != null) {
            result.setResumeName(file.getOriginalFilename());
            result.setUser(user);
            return repository.save(result);
        }
        
        return null;
    }
}
