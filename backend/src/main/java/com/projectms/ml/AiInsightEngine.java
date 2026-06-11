package com.projectms.ml;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

// Apache POI imports (poi-ooxml 5.x)
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.*;

@Component
public class AiInsightEngine {

    // ===== RISK LEXICONS =====
    private static final Map<String, List<String>> RISK_LEXICONS = new LinkedHashMap<>();
    static {
        RISK_LEXICONS.put("SCHEDULE", Arrays.asList(
            "deadline", "delay", "overdue", "late", "timeline", "schedule", "behind", "extension",
            "milestone", "delivery", "sprint", "backlog", "bottleneck", "estimate", "drift"
        ));
        RISK_LEXICONS.put("BUDGET", Arrays.asList(
            "budget", "cost", "expense", "funding", "financial", "resource", "allocation",
            "overspend", "underfunded", "investment", "roi", "revenue", "payment", "billing"
        ));
        RISK_LEXICONS.put("TECHNICAL", Arrays.asList(
            "integration", "api", "dependency", "legacy", "scalability", "performance",
            "architecture", "technical debt", "bug", "crash", "failure", "downtime", "migration",
            "compatibility", "infrastructure", "database", "security", "vulnerability"
        ));
        RISK_LEXICONS.put("TEAM", Arrays.asList(
            "resource", "team", "skill", "expertise", "turnover", "availability", "capacity",
            "training", "communication", "collaboration", "conflict", "staffing", "shortage"
        ));
        RISK_LEXICONS.put("SCOPE", Arrays.asList(
            "scope creep", "requirement change", "unclear", "ambiguous", "undefined",
            "scope", "feature", "change request", "revision", "rework", "unclear requirements"
        ));
        RISK_LEXICONS.put("SECURITY", Arrays.asList(
            "security", "breach", "vulnerability", "attack", "threat", "unauthorized", "data loss",
            "compliance", "audit", "encryption", "authentication", "access control", "firewall"
        ));
    }

    private static final Map<String, List<String>> MITIGATION_TEMPLATES = new LinkedHashMap<>();
    static {
        MITIGATION_TEMPLATES.put("SCHEDULE", Arrays.asList(
            "Implement Agile sprint planning with 2-week iterations to detect delays early",
            "Set up automated deadline alerts and escalation workflows",
            "Add 20% buffer time to all critical path tasks",
            "Daily stand-ups for real-time progress tracking",
            "Use critical path method (CPM) to identify schedule dependencies"
        ));
        MITIGATION_TEMPLATES.put("BUDGET", Arrays.asList(
            "Establish a monthly budget review cadence with variance reporting",
            "Create a 15% contingency reserve fund for unexpected costs",
            "Implement purchase approval workflows for expenses above threshold",
            "Track actual vs. planned costs weekly using earned value management",
            "Prioritize must-have features to reduce scope if budget is threatened"
        ));
        MITIGATION_TEMPLATES.put("TECHNICAL", Arrays.asList(
            "Conduct architecture review sessions before major development phases",
            "Implement automated testing with 80%+ code coverage requirement",
            "Establish code review policies with minimum 2 reviewer approvals",
            "Create technical spike tasks to validate risky integrations early",
            "Maintain a technical debt backlog and allocate 20% of sprint for repayment"
        ));
        MITIGATION_TEMPLATES.put("TEAM", Arrays.asList(
            "Cross-train team members to eliminate single points of failure",
            "Document all critical processes and knowledge in a shared wiki",
            "Conduct regular 1-on-1s to identify morale and workload issues early",
            "Establish clear RACI matrices for all project roles",
            "Build a roster of pre-vetted contractors for resource surge capacity"
        ));
        MITIGATION_TEMPLATES.put("SCOPE", Arrays.asList(
            "Implement a formal change control board (CCB) for all scope changes",
            "Freeze requirements at the end of design phase with sign-off process",
            "Use MoSCoW prioritization (Must/Should/Could/Won't) to manage features",
            "Create detailed user stories with acceptance criteria before development",
            "Conduct weekly scope review meetings with stakeholders"
        ));
        MITIGATION_TEMPLATES.put("SECURITY", Arrays.asList(
            "Integrate security scanning (SAST/DAST) into CI/CD pipeline",
            "Conduct penetration testing before each major release",
            "Implement role-based access control (RBAC) across all systems",
            "Establish security incident response plan and runbook",
            "Ensure OWASP Top 10 compliance through automated checks"
        ));
    }

    private static final String[] MILESTONE_PHASES = {
        "Documents & Information Collection",
        "Design the Application",
        "Development",
        "Testing",
        "Review",
        "Publish"
    };

    private static final Map<String, int[]> PHASE_DURATION_WEEKS = new LinkedHashMap<>();
    static {
        PHASE_DURATION_WEEKS.put("Documents & Information Collection", new int[]{1, 2});
        PHASE_DURATION_WEEKS.put("Design the Application", new int[]{2, 4});
        PHASE_DURATION_WEEKS.put("Development", new int[]{4, 12});
        PHASE_DURATION_WEEKS.put("Testing", new int[]{2, 4});
        PHASE_DURATION_WEEKS.put("Review", new int[]{1, 2});
        PHASE_DURATION_WEEKS.put("Publish", new int[]{1, 1});
    }

    // ===== DOCUMENT EXTRACTION =====

    public String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        if (filename.endsWith(".pdf")) {
            // PDFBox 3.x: Loader.loadPDF(byte[]) is the correct API
            try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(doc);
            }
        } else if (filename.endsWith(".docx")) {
            try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
                StringBuilder sb = new StringBuilder();
                doc.getParagraphs().forEach(p -> sb.append(p.getText()).append("\n"));
                return sb.toString();
            }
        } else if (filename.endsWith(".txt")) {
            return new String(file.getBytes());
        }
        throw new RuntimeException("Unsupported file format. Use PDF, DOCX, or TXT.");
    }

    // ===== TF-IDF ANALYSIS =====

    private Map<String, Double> computeTfIdf(String text) {
        String[] words = text.toLowerCase().replaceAll("[^a-zA-Z0-9\\s]", " ").split("\\s+");
        Map<String, Integer> freq = new HashMap<>();
        for (String w : words) {
            if (w.length() > 3) freq.merge(w, 1, Integer::sum);
        }
        int total = words.length;
        Map<String, Double> tfidf = new HashMap<>();
        freq.forEach((w, f) -> tfidf.put(w, (double) f / total));
        return tfidf;
    }

    // ===== COMPLEXITY SCORING =====

    private String assessComplexity(String text, Map<String, Double> riskScores) {
        int wordCount = text.split("\\s+").length;
        double totalRisk = riskScores.values().stream().mapToDouble(Double::doubleValue).sum();
        if (wordCount > 3000 || totalRisk > 15) return "HIGH";
        if (wordCount > 1000 || totalRisk > 7) return "MEDIUM";
        return "LOW";
    }

    // ===== MAIN ANALYSIS =====

    public Map<String, Object> analyze(String text, String filename) {
        Map<String, Double> tfidf = computeTfIdf(text);
        String[] words = text.toLowerCase().split("\\s+");
        int wordCount = words.length;

        String analysis = buildAnalysis(text, wordCount, tfidf);
        Map<String, Double> riskScores = new LinkedHashMap<>();
        List<Map<String, Object>> risks = identifyRisks(words, riskScores);
        List<Map<String, Object>> recommendations = buildRecommendations(riskScores);
        List<Map<String, Object>> roadmap = buildRoadmap(text, riskScores);

        double confidence = Math.min(0.95, 0.70 + (Math.min(wordCount, 2000) / 2000.0) * 0.25);
        String complexity = assessComplexity(text, riskScores);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("analysis", analysis);
        result.put("risks", risks);
        result.put("recommendations", recommendations);
        result.put("roadmap", roadmap);
        result.put("confidenceScore", Math.round(confidence * 100.0) / 100.0);
        result.put("documentName", filename);
        result.put("wordCount", wordCount);
        result.put("complexityLevel", complexity);
        return result;
    }

    private String buildAnalysis(String text, int wordCount, Map<String, Double> tfidf) {
        List<String> topKeywords = tfidf.entrySet().stream()
                .filter(e -> e.getValue() > 0.002)
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(8)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        String domain = detectDomain(text.toLowerCase());
        long sentences = Arrays.stream(text.split("[.!?]")).filter(s -> s.trim().length() > 10).count();

        StringBuilder sb = new StringBuilder();
        sb.append("📄 Document Overview: This project document contains approximately ").append(wordCount)
          .append(" words across ").append(sentences).append(" key statements. ");
        sb.append("The document pertains to the ").append(domain).append(" domain. ");
        if (!topKeywords.isEmpty()) {
            sb.append("Primary focus areas identified: ").append(String.join(", ", topKeywords)).append(". ");
        }

        boolean hasObjectives = text.toLowerCase().contains("objective") || text.toLowerCase().contains("goal");
        boolean hasTimeline = text.toLowerCase().contains("timeline") || text.toLowerCase().contains("deadline") || text.toLowerCase().contains("date");
        boolean hasTeam = text.toLowerCase().contains("team") || text.toLowerCase().contains("member") || text.toLowerCase().contains("role");
        boolean hasBudget = text.toLowerCase().contains("budget") || text.toLowerCase().contains("cost");
        boolean hasRequirements = text.toLowerCase().contains("requirement") || text.toLowerCase().contains("feature") || text.toLowerCase().contains("specification");

        sb.append("\n\n✅ Document Completeness Assessment:\n");
        sb.append(hasObjectives ? "✔ Project objectives defined\n" : "⚠ Project objectives not clearly stated\n");
        sb.append(hasRequirements ? "✔ Requirements/specifications present\n" : "⚠ Requirements documentation incomplete\n");
        sb.append(hasTimeline ? "✔ Timeline/deadlines mentioned\n" : "⚠ No clear timeline defined\n");
        sb.append(hasTeam ? "✔ Team structure referenced\n" : "⚠ Team roles not defined\n");
        sb.append(hasBudget ? "✔ Budget considerations included\n" : "⚠ Budget/cost planning absent\n");

        int completeness = (int) Arrays.asList(hasObjectives, hasTimeline, hasTeam, hasBudget, hasRequirements)
                .stream().filter(b -> b).count() * 20;
        sb.append("\n📊 Completeness Score: ").append(completeness).append("%");

        return sb.toString();
    }

    private String detectDomain(String text) {
        Map<String, String[]> domains = new LinkedHashMap<>();
        domains.put("Web/Software Development", new String[]{"frontend", "backend", "api", "database", "react", "spring", "code", "software", "application", "web"});
        domains.put("Cybersecurity", new String[]{"security", "vulnerability", "threat", "firewall", "encryption", "audit", "compliance", "breach"});
        domains.put("Human Resources", new String[]{"hiring", "recruitment", "onboarding", "employee", "training", "hr", "payroll", "performance review"});
        domains.put("Infrastructure", new String[]{"server", "network", "cloud", "deployment", "infrastructure", "devops", "kubernetes", "docker"});
        domains.put("Business/Administration", new String[]{"business", "strategy", "management", "stakeholder", "governance", "policy", "process"});

        String bestDomain = "General Project";
        int bestScore = 0;
        for (Map.Entry<String, String[]> entry : domains.entrySet()) {
            int score = 0;
            for (String kw : entry.getValue()) if (text.contains(kw)) score++;
            if (score > bestScore) { bestScore = score; bestDomain = entry.getKey(); }
        }
        return bestDomain;
    }

    private List<Map<String, Object>> identifyRisks(String[] words, Map<String, Double> riskScores) {
        Set<String> wordSet = new HashSet<>(Arrays.asList(words));
        List<Map<String, Object>> risks = new ArrayList<>();

        RISK_LEXICONS.forEach((category, keywords) -> {
            long hits = keywords.stream().filter(kw -> {
                if (kw.contains(" ")) return String.join(" ", words).contains(kw);
                return wordSet.contains(kw);
            }).count();

            if (hits > 0) {
                double score = Math.min(10.0, hits * 1.5);
                riskScores.put(category, score);

                String severity = score >= 6 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW";
                List<String> matchedKws = keywords.stream()
                        .filter(kw -> kw.contains(" ") ? String.join(" ", words).contains(kw) : wordSet.contains(kw))
                        .limit(3).collect(Collectors.toList());

                Map<String, Object> risk = new LinkedHashMap<>();
                risk.put("category", category + " RISK");
                risk.put("description", buildRiskDescription(category, matchedKws));
                risk.put("severity", severity);
                risk.put("score", Math.round(score * 10.0) / 10.0);
                risk.put("indicators", matchedKws);
                risks.add(risk);
            }
        });

        risks.sort((a, b) -> Double.compare((Double) b.get("score"), (Double) a.get("score")));
        return risks;
    }

    private String buildRiskDescription(String category, List<String> indicators) {
        Map<String, String> templates = new HashMap<>();
        templates.put("SCHEDULE", "Schedule risk detected based on timeline-related terms. Indicators suggest potential delays in project delivery.");
        templates.put("BUDGET", "Financial risk identified. Document contains budget-sensitive terminology suggesting cost overrun potential.");
        templates.put("TECHNICAL", "Technical complexity risk present. Architecture and integration challenges may impact delivery quality.");
        templates.put("TEAM", "Resource and team risk detected. Capacity planning or skill gaps may affect project execution.");
        templates.put("SCOPE", "Scope management risk identified. Unclear or changing requirements could lead to scope creep.");
        templates.put("SECURITY", "Security risk flagged. The project involves security-sensitive operations requiring dedicated controls.");
        return templates.getOrDefault(category, "Risk identified in " + category + " area based on document analysis.");
    }

    private List<Map<String, Object>> buildRecommendations(Map<String, Double> riskScores) {
        List<Map<String, Object>> recommendations = new ArrayList<>();

        riskScores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .forEach(entry -> {
                    String category = entry.getKey();
                    double score = entry.getValue();
                    List<String> mitigations = MITIGATION_TEMPLATES.getOrDefault(category, List.of());
                    int count = score >= 6 ? 3 : score >= 3 ? 2 : 1;
                    for (int i = 0; i < Math.min(count, mitigations.size()); i++) {
                        Map<String, Object> rec = new LinkedHashMap<>();
                        rec.put("category", category);
                        rec.put("action", mitigations.get(i));
                        rec.put("priority", score >= 6 ? "CRITICAL" : score >= 3 ? "HIGH" : "MEDIUM");
                        rec.put("rationale", "Risk score " + Math.round(score * 10.0) / 10.0 + "/10 detected for " + category.toLowerCase() + " risks in document");
                        recommendations.add(rec);
                    }
                });

        Map<String, Object> general = new LinkedHashMap<>();
        general.put("category", "GENERAL");
        general.put("action", "Implement weekly project health reviews covering schedule, budget, risks, and team morale");
        general.put("priority", "HIGH");
        general.put("rationale", "Proactive monitoring reduces project failure probability by 35% (PMI Pulse of the Profession)");
        recommendations.add(general);

        return recommendations;
    }

    private List<Map<String, Object>> buildRoadmap(String text, Map<String, Double> riskScores) {
        double complexity = riskScores.values().stream().mapToDouble(Double::doubleValue).sum();
        double multiplier = complexity > 15 ? 1.5 : complexity > 7 ? 1.2 : 1.0;

        List<Map<String, Object>> roadmap = new ArrayList<>();
        Calendar cal = Calendar.getInstance();

        for (String phase : MILESTONE_PHASES) {
            int[] baseDuration = PHASE_DURATION_WEEKS.get(phase);
            int weeks = (int) Math.ceil(baseDuration[0] + (baseDuration[1] - baseDuration[0]) * 0.5 * multiplier);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("phase", phase);
            item.put("estimatedDuration", weeks + " week" + (weeks > 1 ? "s" : ""));
            item.put("startDate", formatDate(cal.getTime()));
            cal.add(Calendar.WEEK_OF_YEAR, weeks);
            item.put("endDate", formatDate(cal.getTime()));
            item.put("status", "PLANNED");
            item.put("keyActivities", getKeyActivities(phase));
            item.put("riskLevel", getPhaseRisk(phase, riskScores));
            roadmap.add(item);
        }
        return roadmap;
    }

    private List<String> getKeyActivities(String phase) {
        Map<String, List<String>> activities = new LinkedHashMap<>();
        activities.put("Documents & Information Collection", Arrays.asList(
            "Gather stakeholder requirements", "Define project scope and objectives",
            "Create BRD (Business Requirements Document)", "Identify key constraints and assumptions"
        ));
        activities.put("Design the Application", Arrays.asList(
            "Create system architecture diagram", "Design database schema",
            "Develop UI/UX wireframes", "Conduct design review with stakeholders"
        ));
        activities.put("Development", Arrays.asList(
            "Set up development environment and CI/CD", "Implement core features by priority",
            "Code reviews and unit testing", "Regular sprint demos to stakeholders"
        ));
        activities.put("Testing", Arrays.asList(
            "Execute functional and regression tests", "Performance and load testing",
            "Security vulnerability assessment", "User Acceptance Testing (UAT)"
        ));
        activities.put("Review", Arrays.asList(
            "Stakeholder review and sign-off", "Documentation finalization",
            "Bug fixes and polish", "Deployment readiness checklist"
        ));
        activities.put("Publish", Arrays.asList(
            "Production deployment", "Smoke testing in production",
            "Handover and knowledge transfer", "Post-launch monitoring setup"
        ));
        return activities.getOrDefault(phase, List.of("Phase activities to be defined"));
    }

    private String getPhaseRisk(String phase, Map<String, Double> riskScores) {
        Map<String, String> phaseRiskMap = new HashMap<>();
        phaseRiskMap.put("Documents & Information Collection", "SCOPE");
        phaseRiskMap.put("Design the Application", "TECHNICAL");
        phaseRiskMap.put("Development", "TECHNICAL");
        phaseRiskMap.put("Testing", "SCHEDULE");
        phaseRiskMap.put("Review", "SCOPE");
        phaseRiskMap.put("Publish", "SECURITY");

        String riskCategory = phaseRiskMap.getOrDefault(phase, "GENERAL");
        double score = riskScores.getOrDefault(riskCategory, 0.0);
        return score >= 6 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW";
    }

    private String formatDate(java.util.Date date) {
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(date);
    }
}