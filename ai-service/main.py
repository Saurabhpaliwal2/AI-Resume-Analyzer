from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import io
import json
import os
import re
from typing import List, Optional
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
    
    # Pre-process: lowercase and remove punctuation
    text_lower = text.lower()
    
    # Check for multi-word skills first
    for skill in TECH_SKILLS:
        if " " in skill or "." in skill or "-" in skill:
            if skill in text_lower:
                found_skills.add(skill)
    
    # Then check for single-word skills
    words = set(re.findall(r'\w+', text_lower))
    for word in words:
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
    geminiApiKey: Optional[str] = None

class AnalysisResponse(BaseModel):
    skillMatchPercentage: int
    matchedSkills: List[str]
    missingSkills: List[str]
    improvementSuggestions: List[str]
    jobRecommendations: List[str]
    skillScores: dict = {}
    profileData: dict = {}

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

        # Resolve Gemini API key with priority: Request > Env (GEMINI_API_KEY) > Env (API_ID)
        api_key = request.geminiApiKey or os.getenv("GEMINI_API_KEY") or os.getenv("API_ID")
        
        if api_key and api_key not in ["your_api_key_here", ""]:
            # Use Gemini AI for advanced analysis
            model = genAI.GenerativeModel('gemini-1.5-flash')
            
            # Configure genAI with the resolved key
            genAI.configure(api_key=api_key)
            
            is_standalone = not request.jobDescription.strip()
            
            if is_standalone:
                prompt = f"""
                Analyze the following resume and extract key profile details.
                Resume: {resume_text}
                
                Provide response strictly in JSON format:
                {{
                    "skillMatchPercentage": (General score 0-100 based on resume quality),
                    "matchedSkills": [list of all identified technical skills],
                    "missingSkills": ["Provide job description for target analysis"],
                    "improvementSuggestions": [list of general resume improvements],
                    "jobRecommendations": [list of suitable roles based on skills],
                    "profileData": {{
                        "name": "Extracted Name",
                        "email": "Extracted Email",
                        "summary": "3-sentence professional summary",
                        "experience": "Brief experience overview (e.g. 5+ years in Web Dev)"
                    }}
                }}
                """
            else:
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
                    "jobRecommendations": [list of suitable job titles],
                    "profileData": {{
                        "name": "Extracted Name",
                        "email": "Extracted Email",
                        "summary": "Quick summary of candidate's fit for THIS job",
                        "experience": "Relevant experience summary"
                    }}
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
        is_standalone = not request.jobDescription.strip()
        
        if is_standalone:
            print(f"[INFO] Standalone analysis (no JD provided)")
            jd_skills = set()
            matched = resume_skills
            missing = set()
            # Standalone score based on skill density and variety
            score = min(100, 40 + len(resume_skills) * 8)
            missing_display = ["Add a job description for specific match analysis"]
        else:
            jd_skills = extract_skills(request.jobDescription)
            print(f"[INFO] JD skills required: {jd_skills}")
            matched = resume_skills & jd_skills
            missing = jd_skills - resume_skills
            score = int((len(matched) / len(jd_skills)) * 100) if jd_skills else 50
            missing_display = sorted([s.title() for s in missing]) if missing else ["All required skills present!"]

        extra_resume = resume_skills - jd_skills if not is_standalone else set()
        score = min(score, 100)
        
        print(f"[INFO] Resume skills found: {resume_skills}")
        print(f"[INFO] Final Score: {score}%")
        
        # Generate suggestions
        suggestions = []
        if is_standalone:
            suggestions.append("Your resume shows a strong set of core technical skills.")
            suggestions.append("To get a more accurate match score, please paste a specific job description.")
            if len(resume_skills) < 5:
                suggestions.append("Consider adding more technical keywords to improve ATS visibility.")
        else:
            if missing:
                missing_list = list(missing)
                suggestions.append(f"Add these missing skills if you have them: {', '.join(missing_list[:5])}")
            if extra_resume:
                extra_list = list(extra_resume)
                suggestions.append(f"Your additional strengths ({', '.join(extra_list[:3])}) are great differentiators.")
            if score < 50:
                suggestions.append("Consider tailoring your resume more closely to this specific job description.")
            if score >= 70:
                suggestions.append("Strong match! Focus on quantifying achievements with metrics.")
        
        suggestions.append("Ensure your resume is ATS-friendly with clear headers and consistent formatting.")
        
        # Generate job recommendations
        job_recs = generate_job_recommendations(matched, missing, score)
        
        # Build per-skill confidence scores
        skill_scores = {}
        resume_lower = resume_text.lower()
        
        # For display, use top 10 skills if standalone
        display_skills = list(matched)[:10] if is_standalone else list(matched)
        
        for skill in display_skills:
            count = resume_lower.count(skill.lower())
            confidence = min(100, 45 + count * 15)
            skill_scores[skill.title()] = confidence
            
        if not is_standalone:
            for skill in list(missing):
                skill_scores[skill.title()] = 0

        # Logic to extract basic profile data if Gemini failed
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
        email = email_match.group(0) if email_match else "Not found"
        
        profile_data = {
            "name": request.resumeName.split(".")[0],
            "email": email,
            "summary": "Professional profile based on identified technical skills.",
            "experience": "Experience details available in full PDF text."
        }

        return {
            "skillMatchPercentage": score,
            "matchedSkills": sorted([s.title() for s in matched]),
            "missingSkills": missing_display,
            "improvementSuggestions": suggestions,
            "jobRecommendations": job_recs,
            "skillScores": skill_scores,
            "profileData": profile_data
        }

    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
