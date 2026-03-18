from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import io
import json
import os
import re
from typing import List
import google.generativeai as genAI
from dotenv import load_dotenv
from PyPDF2 import PdfReader

import nltk

# Download required NLTK resources
try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('stopwords', quiet=True)
except Exception as e:
    print(f"NLTK download note: {e}")

from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

load_dotenv()

app = FastAPI()

genAI.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Comprehensive skill/keyword database for matching
TECH_SKILLS = {
    # Programming languages
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "ruby", "go", "golang",
    "rust", "swift", "kotlin", "scala", "php", "perl", "r", "matlab", "dart", "lua",
    "objective-c", "assembly", "bash", "shell", "powershell", "groovy", "haskell", "erlang",
    # Frontend
    "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs", "vue.js",
    "nextjs", "next.js", "nuxt", "svelte", "redux", "webpack", "babel", "sass", "less",
    "tailwind", "tailwindcss", "bootstrap", "material-ui", "mui", "chakra", "html", "html5",
    "css", "css3", "jquery", "ajax", "dom", "responsive",
    # Backend
    "node", "nodejs", "node.js", "express", "expressjs", "fastapi", "flask", "django",
    "spring", "springboot", "spring-boot", "spring boot", "hibernate", "jpa",
    "asp.net", ".net", "dotnet", "laravel", "rails", "ruby on rails", "gin", "fiber",
    "nestjs", "koa", "hapi", "strapi",
    # Databases
    "sql", "mysql", "postgresql", "postgres", "sqlite", "oracle", "mongodb", "cassandra",
    "redis", "elasticsearch", "dynamodb", "firestore", "firebase", "neo4j", "mariadb",
    "couchdb", "influxdb", "supabase",
    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "heroku", "vercel", "netlify", "digitalocean",
    "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins", "ci/cd", "cicd",
    "github actions", "gitlab", "bitbucket", "circleci", "travis", "nginx", "apache",
    "linux", "unix", "ubuntu",
    # AI/ML/Data
    "machine learning", "deep learning", "artificial intelligence", "ai", "ml",
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas", "numpy",
    "matplotlib", "seaborn", "opencv", "nlp", "natural language processing",
    "computer vision", "neural network", "cnn", "rnn", "lstm", "transformer",
    "gpt", "bert", "llm", "gemini", "openai", "langchain", "huggingface",
    "data science", "data analysis", "data engineering", "etl", "spark", "hadoop",
    "tableau", "power bi", "powerbi",
    # Mobile
    "android", "ios", "react native", "flutter", "xamarin", "ionic", "cordova",
    "swiftui", "jetpack compose",
    # Tools & Practices
    "git", "github", "version control", "agile", "scrum", "kanban", "jira",
    "confluence", "slack", "trello", "figma", "postman", "swagger",
    "rest", "restful", "api", "graphql", "grpc", "websocket", "microservices",
    "monolith", "serverless", "lambda", "oauth", "jwt", "authentication",
    "authorization", "testing", "unit testing", "integration testing", "tdd", "bdd",
    "selenium", "cypress", "jest", "mocha", "pytest", "junit",
    # Soft skills
    "leadership", "communication", "teamwork", "problem solving", "problem-solving",
    "analytical", "critical thinking", "collaboration", "mentoring", "presentation",
    "project management", "time management", "adaptability", "creativity", "innovation",
}

def extract_skills(text: str) -> set:
    """Extract skills from text using multi-word and single-word matching."""
    text_lower = text.lower()
    found_skills = set()

    # Multi-word skill matching first
    for skill in TECH_SKILLS:
        if ' ' in skill or '-' in skill or '.' in skill:
            if skill in text_lower:
                found_skills.add(skill)

    # Single-word matching via tokenization
    try:
        stop_words = set(stopwords.words('english'))
    except:
        stop_words = set()
    
    words = word_tokenize(text_lower)
    meaningful_words = [w for w in words if w not in stop_words and len(w) > 1]
    
    for word in meaningful_words:
        if word in TECH_SKILLS:
            found_skills.add(word)

    return found_skills


def generate_job_recommendations(matched: set, missing: set, score: int) -> list:
    """Generate relevant job recommendations based on matched skills."""
    roles = []
    matched_lower = {s.lower() for s in matched}
    
    if matched_lower & {"react", "reactjs", "angular", "vue", "html", "css", "javascript"}:
        roles.append("Frontend Developer")
    if matched_lower & {"node", "nodejs", "express", "django", "flask", "spring", "springboot", "fastapi"}:
        roles.append("Backend Developer")
    if matched_lower & {"react", "angular", "vue"} and matched_lower & {"node", "express", "spring", "django"}:
        roles.append("Full Stack Developer")
    if matched_lower & {"python", "machine learning", "deep learning", "tensorflow", "pytorch", "ai", "ml"}:
        roles.append("ML/AI Engineer")
    if matched_lower & {"data science", "data analysis", "pandas", "numpy", "tableau", "power bi"}:
        roles.append("Data Scientist / Analyst")
    if matched_lower & {"docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ci/cd"}:
        roles.append("DevOps Engineer")
    if matched_lower & {"android", "ios", "react native", "flutter"}:
        roles.append("Mobile App Developer")
    if matched_lower & {"sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch"}:
        roles.append("Database Administrator")
    if matched_lower & {"agile", "scrum", "project management", "jira"}:
        roles.append("Technical Project Manager")
    
    if not roles:
        if score >= 60:
            roles = ["Software Engineer", "Technical Consultant"]
        else:
            roles = ["Junior Developer", "IT Support Specialist"]
    
    return roles[:5]


class AnalysisRequest(BaseModel):
    resumeBase64: str
    resumeName: str
    jobDescription: str

class AnalysisResponse(BaseModel):
    skillMatchPercentage: int
    matchedSkills: List[str]
    missingSkills: List[str]
    improvementSuggestions: List[str]
    jobRecommendations: List[str]
    skillScores: dict = {}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(request: AnalysisRequest):
    try:
        # Decode PDF
        pdf_bytes = base64.b64decode(request.resumeBase64)
        pdf_file = io.BytesIO(pdf_bytes)
        
        # Extract text from all pages
        reader = PdfReader(pdf_file)
        resume_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                resume_text += page_text + "\n"

        print(f"[INFO] Extracted {len(resume_text)} characters from {request.resumeName}")

        # Check for Gemini API key
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key and api_key != "your_api_key_here":
            # Use Gemini AI for advanced analysis
            model = genAI.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Analyze the following resume against the job description.
            
            Resume: {resume_text}
            Job Description: {request.jobDescription}
            
            Provide response strictly in JSON format:
            {{
                "skillMatchPercentage": (number 0-100),
                "matchedSkills": [list of matching skills],
                "missingSkills": [list of missing skills],
                "improvementSuggestions": [list of specific suggestions],
                "jobRecommendations": [list of suitable job titles]
            }}
            """
            try:
                response = model.generate_content(prompt)
                clean_json = response.text.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_json)
            except Exception as api_err:
                print(f"[WARN] Gemini API error: {api_err}. Falling back to smart analysis.")

        # Smart Keyword-Based Analysis (fallback or default)
        print(f"[INFO] Using Smart Keyword Analysis for: {request.resumeName}")
        
        resume_skills = extract_skills(resume_text)
        jd_skills = extract_skills(request.jobDescription)
        
        print(f"[INFO] Resume skills found: {resume_skills}")
        print(f"[INFO] JD skills required: {jd_skills}")
        
        matched = resume_skills & jd_skills
        missing = jd_skills - resume_skills
        extra_resume = resume_skills - jd_skills  # Skills in resume but not in JD
        
        # Calculate match percentage
        if not jd_skills:
            score = 50  # Default if no recognizable skills in JD
        else:
            score = int((len(matched) / len(jd_skills)) * 100)
        
        # Cap at 100
        score = min(score, 100)
        
        print(f"[INFO] Match: {len(matched)}/{len(jd_skills)} = {score}%")
        
        # Generate suggestions
        suggestions = []
        if missing:
            missing_list = list(missing)
            suggestions.append(f"Add these skills to your resume if you have experience: {', '.join(missing_list[:5])}")
        if extra_resume:
            extra_list = list(extra_resume)
            suggestions.append(f"Your additional strengths ({', '.join(extra_list[:3])}) could differentiate you from competitors.")
        if score < 50:
            suggestions.append("Consider tailoring your resume more closely to this specific job description.")
        if score >= 70:
            suggestions.append("Strong match! Focus on quantifying your achievements with numbers and metrics.")
        suggestions.append("Ensure your resume is ATS-friendly with clear section headers and consistent formatting.")
        
        # Generate job recommendations based on actual matched skills
        job_recs = generate_job_recommendations(matched, missing, score)
        
        # Format skill names nicely (capitalize)
        matched_display = sorted([s.title() for s in matched]) if matched else ["No direct skill matches found"]
        missing_display = sorted([s.title() for s in missing]) if missing else ["All required skills present!"]
        
        # Build per-skill confidence scores
        skill_scores = {}
        resume_lower = resume_text.lower()
        # Score matched skills based on frequency in resume
        for skill in matched:
            count = resume_lower.count(skill)
            confidence = min(100, 40 + count * 20)  # base 40% + 20% per mention
            skill_scores[skill.title()] = confidence
        # Score missing skills as 0
        for skill in missing:
            skill_scores[skill.title()] = 0
        # Also score extra resume skills at moderate confidence
        for skill in list(extra_resume)[:5]:
            count = resume_lower.count(skill)
            skill_scores[skill.title()] = min(100, 30 + count * 15)

        return {
            "skillMatchPercentage": score,
            "matchedSkills": matched_display,
            "missingSkills": missing_display,
            "improvementSuggestions": suggestions,
            "jobRecommendations": job_recs,
            "skillScores": skill_scores
        }

    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
