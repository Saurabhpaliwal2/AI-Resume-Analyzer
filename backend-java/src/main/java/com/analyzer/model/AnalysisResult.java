package com.analyzer.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class AnalysisResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(columnDefinition = "TEXT")
    private String resumeName;

    private int skillMatchPercentage;

    @ElementCollection
    private List<String> matchedSkills;

    @ElementCollection
    private List<String> missingSkills;

    @ElementCollection
    private List<String> improvementSuggestions;

    @ElementCollection
    private List<String> jobRecommendations;
}
