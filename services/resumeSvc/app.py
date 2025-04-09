from flask import Flask, request, jsonify
from pypdf import PdfReader
import spacy
import re
import os
import logging
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI  # Import OpenAI client



# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
from flask_cors import CORS
CORS(app)  # Enable CORS

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# Config: Check environment variable USE_AI
# USE_AI = os.getenv("USE_AI", "0") == "1"  # Reverted to env var for flexibility
USE_AI = 1
# Initialize xAI client
# XAI_API_KEY = os.getenv("XAI_API_KEY")
XAI_API_KEY = "xai-uLjxrB3g8U1OSGYYLm53UYZOVSPACL9cxngv9NKJG5bRSx064GXwxEcfgYG2mxcxWknInvhCOFuA0gbv"

if not XAI_API_KEY and USE_AI:
    logger.error("XAI_API_KEY not set in environment, required for AI mode")
client = OpenAI(
    api_key=XAI_API_KEY,
    base_url="https://api.x.ai/v1",
)

# Common skills for local extraction
COMMON_TECH_SKILLS = {
    "programming": {"python", "java", "javascript", "c++", "go", "rust"},
    "frameworks": {"react", "angular", "vue.js", "node.js", "django", "flask", "spring"},
    "cloud": {"aws", "azure", "google cloud", "oracle cloud"},
    "devops": {"docker", "kubernetes", "jenkins", "git", "terraform"},
    "data": {"sql", "nosql", "hadoop", "spark", "tableau", "power bi"},
    "cybersecurity": {"firewalls", "encryption", "penetration testing", "siem"},
    "ai_ml": {"machine learning", "tensorflow", "pytorch", "nlp"},
    "soft_skills": {"communication", "problem-solving", "leadership", "teamwork"}
}

# Job levels and their associated keywords
JOB_LEVELS = {
    "entry": {"junior", "entry", "entry-level", "graduate", "associate"},
    "mid": {"mid-level", "intermediate", "experienced"},
    "senior": {"senior", "lead", "principal", "staff", "architect"},
    "management": {"manager", "director", "head", "vp", "chief"}
}

# Technical domains and their associated keywords
TECH_DOMAINS = {
    "frontend": {"frontend", "front-end", "ui", "ux", "react", "angular", "vue", "javascript", "typescript", "css", "html"},
    "backend": {"backend", "back-end", "api", "server", "database", "python", "java", "node.js", "golang"},
    "fullstack": {"fullstack", "full-stack", "full stack", "frontend", "backend"},
    "devops": {"devops", "cloud", "aws", "azure", "kubernetes", "docker", "ci/cd"},
    "data": {"data engineer", "data scientist", "machine learning", "ai", "analytics", "big data"},
    "security": {"security", "cybersecurity", "information security", "security engineer"}
}

def extract_text_from_pdf(pdf_file):
    """Extract and clean text from a PDF resume."""
    try:
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            page_text = re.sub(r'\s+', ' ', page_text).strip()
            text += page_text + " "
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction failed: {str(e)}")
        raise ValueError(f"PDF extraction failed: {str(e)}")

def check_formatting(pdf_file):
    """Check for formatting issues that might confuse ATS."""
    try:
        reader = PdfReader(pdf_file)
        penalty = 0
        for page in reader.pages:
            text = page.extract_text() or ""
            if re.search(r'image|table', text, re.IGNORECASE):
                penalty -= 10
            if len(text.split()) < 50:
                penalty -= 5
        return max(penalty, -20)
    except Exception:
        return 0

def extract_skills_and_experience(text, job_skills=None):
    """Extract skills and experience locally."""
    doc = nlp(text.lower())
    skills = set()
    for skill_set in COMMON_TECH_SKILLS.values():
        for skill in skill_set:
            # Check for the skill in lowercase text but preserve original case
            if skill in text.lower():
                # Find the original case in the text
                pattern = re.compile(re.escape(skill), re.IGNORECASE)
                match = pattern.search(text)
                if match:
                    skills.add(match.group(0))  # Use the original case from the text
                else:
                    skills.add(skill.capitalize())  # Fallback to capitalized version
    
    if job_skills:
        for skill in job_skills:
            if skill.lower() in text.lower():
                # Find the original case in the text
                pattern = re.compile(re.escape(skill), re.IGNORECASE)
                match = pattern.search(text)
                if match:
                    skills.add(match.group(0))  # Use the original case from the text
                else:
                    skills.add(skill)  # Use the original case from job_skills

    exp_matches = re.findall(r"(\d+)\s*(years?|yrs?)\s*(of)?\s*(experience|exp)?\s*(in)?\s*([a-z\s]+)?", text, re.IGNORECASE)
    total_exp = 0
    relevant_exp = {}
    for match in exp_matches:
        years = int(match[0])
        role = match[5].strip() if match[5] else "general"
        total_exp += years
        relevant_exp[role] = relevant_exp.get(role, 0) + years

    # Improved education extraction
    edu_matches = []
    # Look for standard degree patterns with and without "in"
    edu_patterns = [
        r"(bachelor'?s|master'?s|phd|doctorate|bs|ms|mba)\s*(in|of)?\s*([a-z\s]+)",  # With "in" or "of"
        r"(bachelor'?s|master'?s|phd|doctorate|bs|ms|mba)\s+([a-z\s]+)",  # Without "in"
        r"education:?\s*(bachelor'?s|master'?s|phd|doctorate|bs|ms|mba)\s*(in|of)?\s*([a-z\s]+)",  # After "Education:"
        r"education:?\s*(bachelor'?s|master'?s|phd|doctorate|bs|ms|mba)\s+([a-z\s]+)",  # After "Education:" without "in"
    ]
    
    for pattern in edu_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            for match in matches:
                if isinstance(match, tuple):
                    # Handle patterns with "in" or "of"
                    if len(match) == 3:
                        degree, _, field = match
                        if field:
                            edu_matches.append((degree, field))
                    # Handle patterns without "in"
                    elif len(match) == 2:
                        degree, field = match
                        if field:
                            edu_matches.append((degree, field))
    
    # Also look for education section
    education_section = re.search(r"education:?(.*?)(experience|skills|$)", text, re.IGNORECASE | re.DOTALL)
    if education_section:
        section_text = education_section.group(1)
        # Look for Computer Science in the education section
        cs_match = re.search(r"(bs|bachelor'?s|master'?s).*?(computer\s*science)", section_text, re.IGNORECASE)
        if cs_match:
            edu_matches.append((cs_match.group(1), cs_match.group(2)))
    
    # Format education entries
    education = []
    seen = set()  # To avoid duplicates
    for deg, field in edu_matches:
        # Clean up degree and field
        deg = deg.strip().lower()
        field = field.strip().lower()
        
        # Normalize degree names
        if deg in ['bs', "bachelor's", 'bachelor', 'bachelors']:
            deg = 'BS'
        elif deg in ['ms', "master's", 'master', 'masters']:
            deg = 'MS'
        
        # Format the education entry
        entry = f"{deg} in {field.title()}"
        if entry not in seen:
            education.append(entry)
            seen.add(entry)
    
    # If no education found but "Computer Science" is in the text, add it
    if not education and "computer science" in text.lower():
        education.append("BS in Computer Science")
    
    # Improved certification extraction
    certifications = []
    cert_patterns = [
        r"(certified|certification)\s*([a-z\s]+)",  # Standard certification pattern
        r"(aws|amazon)\s*(certified)",  # AWS certification pattern
        r"certifications?:?\s*([^\.]+)",  # After "Certifications:" pattern
    ]
    
    for pattern in cert_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            for match in matches:
                if isinstance(match, tuple):
                    if len(match) == 2:
                        # For standard certification pattern
                        cert = match[1].strip() if match[1] else match[0].strip()
                        certifications.append(cert)
                else:
                    # For single group matches
                    cert = match.strip()
                    certifications.append(cert)
    
    # Clean up certifications
    clean_certs = []
    for cert in certifications:
        # Remove common prefixes
        cert = re.sub(r'^(certified|certification)\s+', '', cert, flags=re.IGNORECASE)
        # Clean up whitespace
        cert = ' '.join(cert.split())
        if cert:
            clean_certs.append(cert)
    
    # If AWS is mentioned in certifications context, add it
    if any('aws' in cert.lower() for cert in clean_certs):
        if 'AWS Certified' not in clean_certs:
            clean_certs.append('AWS Certified')

    return {
        "skills": list(skills),
        "total_experience_years": total_exp,
        "relevant_experience": relevant_exp,
        "education": education,
        "certifications": clean_certs
    }

def generate_improvement_suggestions_no_ai(resume_data, job_data, formatting_penalty):
    """Generate suggestions without AI."""
    suggestions = []
    missing_skills = set(job_data["skills"]) - set(resume_data["skills"])
    if missing_skills:
        suggestions.append(f"Add the following skills to your resume: {', '.join(missing_skills)}.")
    if resume_data["total_experience_years"] < 2:
        suggestions.append("Highlight more experience to meet typical 2+ year requirements.")
    elif resume_data["total_experience_years"] > 10 and len(job_data["relevant_experience"]) < 2:
        suggestions.append("Emphasize recent, role-specific experience.")
    if not resume_data["education"]:
        suggestions.append("Include relevant educational qualifications.")
    if not resume_data["certifications"]:
        suggestions.append("Add relevant certifications (e.g., AWS, CISSP).")
    if formatting_penalty < 0:
        suggestions.append("Simplify formatting—avoid images or tables.")
    return suggestions if suggestions else ["Your resume is well-aligned."]

def weighted_score_no_ai(resume_text, job_desc_text, pdf_file):
    """Calculate ATS score without AI."""
    try:
        job_data = extract_skills_and_experience(job_desc_text)
        resume_data = extract_skills_and_experience(resume_text, job_data["skills"])

        skill_match = len(set(resume_data["skills"]) & set(job_data["skills"])) / len(set(job_data["skills"])) if job_data["skills"] else 0
        skill_score = skill_match * 50
        exp_score = min(resume_data["total_experience_years"] / 10, 1) * 30
        edu_cert_score = min((5 if resume_data["education"] else 0) + (5 if resume_data["certifications"] else 0), 10)
        formatting_penalty = check_formatting(pdf_file)
        format_score = max(0, 10 + (formatting_penalty / 2))

        final_score = min(skill_score + exp_score + edu_cert_score + format_score, 100)
        suggestions = generate_improvement_suggestions_no_ai(resume_data, job_data, formatting_penalty)

        return {
            "data": resume_data,
            "ats_score": f"{final_score:.2f}%",
            "breakdown": {
                "skills": skill_score,
                "experience": exp_score,
                "education_certifications": edu_cert_score,
                "formatting": format_score
            },
            "improvement_suggestions": suggestions
        }
    except Exception as e:
        logger.error(f"No-AI scoring failed: {str(e)}")
        raise ValueError(f"Scoring error: {str(e)}")

def extract_job_level(job_desc):
    """Extract job level from job description."""
    job_desc_lower = job_desc.lower()
    for level, keywords in JOB_LEVELS.items():
        if any(keyword in job_desc_lower for keyword in keywords):
            return level
    return "mid"  # default to mid-level if no clear indicators

def extract_job_domain(job_desc):
    """Extract technical domain from job description."""
    job_desc_lower = job_desc.lower()
    domain_scores = {}
    
    for domain, keywords in TECH_DOMAINS.items():
        score = sum(1 for keyword in keywords if keyword in job_desc_lower)
        domain_scores[domain] = score
    
    # Return domain with highest score, or "fullstack" if no clear winner
    max_score = max(domain_scores.values())
    if max_score == 0:
        return "fullstack"
    
    top_domains = [domain for domain, score in domain_scores.items() if score == max_score]
    return top_domains[0]

SYSTEM_PROMPT = """You are an advanced ATS optimization and career development expert with expertise in:
1. Technical resume analysis
2. Industry-specific keyword optimization
3. Modern job market requirements
4. Career progression patterns
5. Technical skill evaluation and recommendations

Your goal is to provide actionable, specific feedback that will help candidates improve their resumes for both ATS systems and human reviewers."""

BASE_PROMPT = """
Analyze the provided resume and job description with the following objectives:

1. Technical Skill Analysis:
   - Identify core technical competencies
   - Evaluate skill relevance to the job description
   - Suggest emerging technologies that could enhance the profile

2. Experience Evaluation:
   - Assess experience depth and relevance
   - Identify gaps between experience and job requirements
   - Suggest ways to better present existing experience

3. Achievement Impact:
   - Evaluate how achievements are presented
   - Suggest metrics or quantifiable results to add
   - Recommend ways to better demonstrate impact

4. ATS Optimization:
   - Score keyword matching and placement
   - Evaluate format compatibility
   - Suggest structural improvements

Return a JSON object with:
{
  "data": {
    "skills": [{"name": string, "confidence": number, "relevance": number}],
    "total_experience_years": number,
    "relevant_experience": {
      "roles": [{"title": string, "years": number, "relevance_score": number}],
      "improvement_areas": [string]
    },
    "education": [string],
    "certifications": [string],
    "missing_keywords": [string]
  },
  "ats_score": "XX.XX%",
  "breakdown": {
    "skills": number,
    "experience": number,
    "education_certifications": number,
    "formatting": number,
    "keyword_optimization": number
  },
  "improvement_suggestions": {
    "critical": [string],
    "recommended": [string],
    "advanced": [string]
  }
}
"""

def analyze_with_ai(resume_text, job_desc, local_data, formatting_penalty):
    """Use xAI to refine data, score, and suggest improvements."""
    # Input validation
    if not resume_text or not job_desc:
        logger.error("Empty resume text or job description provided")
        return None
        
    # Extract job context
    job_level = extract_job_level(job_desc)
    job_domain = extract_job_domain(job_desc)
    
    context_prompt = f"""
    Job Context:
    - Level: {job_level}
    - Domain: {job_domain}
    - Industry Trends: Consider current market demands in {job_domain}
    - Career Level Expectations: Focus on expectations for {job_level} positions
    """
    
    full_prompt = BASE_PROMPT + context_prompt + "\n\n" + f"""
    **Resume Text:**
    {resume_text}

    **Job Description:**
    {job_desc}

    **Local Analysis Results:**
    {json.dumps(local_data, indent=2)}

    **Formatting Analysis:**
    Penalty Score: {formatting_penalty}
    """

    try:
        logger.info("Calling xAI API")
        completion = client.chat.completions.create(
            model="grok-2-latest",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": full_prompt}
            ],
            max_tokens=2000
        )
        
        response_text = completion.choices[0].message.content
        logger.info(f"xAI response: {response_text}")

        # Debug: Log the raw response
        logger.debug(f"Raw response to parse: {repr(response_text)} (length: {len(response_text.strip())})")

        # Strip Markdown code block syntax
        cleaned_response = response_text.strip()
        if cleaned_response.startswith("```json") and cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[7:-3].strip()  # Remove ```json and ```
        elif cleaned_response.startswith("```") and cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[3:-3].strip()  # Remove generic ```
        
        # Check if the cleaned response is empty
        if not cleaned_response:
            logger.error("xAI returned an empty response after cleaning")
            return None

        # Debug: Log the cleaned response
        logger.debug(f"Cleaned response to parse: {repr(cleaned_response)} (length: {len(cleaned_response)})")

        # Parse the cleaned response as JSON
        ai_result = json.loads(cleaned_response)
        
        # Ensure required fields are present with defaults
        ai_result.setdefault("breakdown", {
            "skills": 0,
            "experience": 0,
            "education_certifications": 0,
            "formatting": 0,
            "keyword_optimization": 0
        })
        
        # Convert old format suggestions to new format if needed
        if isinstance(ai_result.get("improvement_suggestions"), list):
            suggestions = ai_result["improvement_suggestions"]
            ai_result["improvement_suggestions"] = {
                "critical": suggestions[:2] if suggestions else [],
                "recommended": suggestions[2:4] if len(suggestions) > 2 else [],
                "advanced": suggestions[4:] if len(suggestions) > 4 else []
            }
        
        return ai_result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from xAI response: {str(e)}. Raw response: {repr(response_text)}. Cleaned response: {repr(cleaned_response)}")
        return None
    except Exception as e:
        logger.error(f"AI analysis failed: {str(e)}")
        if hasattr(e, 'response'):
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text}")
        if hasattr(e, 'request'):
            logger.error(f"Request URL: {e.request.url}")
            logger.error(f"Request headers: {e.request.headers}")
        return None

def analyze_no_ai(resume_text, job_desc, pdf_file):
    """Wrapper for no-AI analysis."""
    return weighted_score_no_ai(resume_text, job_desc, pdf_file)

# Add health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Server is running",
        "ai_client": "initialized" if client else "not initialized"
    })

@app.route("/resume/parse", methods=["POST"])
def parse_and_rank():
    """Parse resume and rank it with a consistent response structure."""
    if "resume" not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    if "job_description" not in request.form:
        return jsonify({"error": "No job description provided"}), 400

    resume_file = request.files["resume"]
    job_desc = request.form["job_description"]

    try:
        resume_text = extract_text_from_pdf(resume_file)
        if not resume_text:
            return jsonify({"error": "Empty or unreadable resume text"}), 400

        if USE_AI:
            logger.info("Running in AI mode")
            formatting_penalty = check_formatting(resume_file)
            local_data = extract_skills_and_experience(resume_text)
            result = analyze_with_ai(resume_text, job_desc, local_data, formatting_penalty)
            if result and "data" in result:
                result.setdefault("breakdown", {
                    "skills": 0, "experience": 0, "education_certifications": 0, "formatting": 0, "keyword_optimization": 0
                })
                result.setdefault("improvement_suggestions", result.pop("suggestions", []))
            else:
                logger.warning("AI failed, falling back to no-AI mode")
                result = analyze_no_ai(resume_text, job_desc, resume_file)
        else:
            logger.info("Running in no-AI mode")
            result = analyze_no_ai(resume_text, job_desc, resume_file)

        return jsonify(result), 200

    except ValueError as ve:
        # For PDF extraction errors, return 500 as expected by the test
        if "PDF extraction failed" in str(ve):
            return jsonify({"error": str(ve)}), 500
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({"error": f"Internal processing error: {str(e)}"}), 500

if __name__ == "__main__":
    logger.info(f"Starting service with USE_AI={USE_AI}")
    app.run(host="0.0.0.0", port=5000, debug=False)