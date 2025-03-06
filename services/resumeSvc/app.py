from flask import Flask, request, jsonify
import PyPDF2
import spacy
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load spaCy model (ensure 'en_core_web_sm' is installed: python -m spacy download en_core_web_sm)
nlp = spacy.load("en_core_web_sm")

# Common skills and keywords for tech roles (expandable and dynamic)
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

def extract_text_from_pdf(pdf_file):
    """Extract text from a PDF resume, handling formatting issues."""
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            # Clean up text (remove excessive whitespace, special chars)
            page_text = re.sub(r'\s+', ' ', page_text).strip()
            text += page_text + " "
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction failed: {str(e)}")
        raise ValueError(f"PDF extraction failed: {str(e)}")

def check_formatting(pdf_file):
    """Check for complex formatting (e.g., images, tables) that might confuse ATS."""
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        formatting_penalty = 0
        for page in reader.pages:
            text = page.extract_text() or ""
            if re.search(r'image|table', text, re.IGNORECASE):
                formatting_penalty -= 10  # Penalty for complex formatting
            if len(text.split()) < 50:  # Very sparse text might indicate issues
                formatting_penalty -= 5
        return max(formatting_penalty, -20)  # Cap penalty at -20
    except Exception as e:
        logger.error(f"Formatting check failed: {str(e)}")
        return 0

def extract_skills_and_experience(text, job_skills=None):
    """Extract skills and experience with context and relevance."""
    doc = nlp(text.lower())
    
    # Extract skills dynamically, prioritizing job-specific skills if provided
    skills = set()
    for skill_set in COMMON_TECH_SKILLS.values():
        for skill in skill_set:
            if skill in text.lower():
                skills.add(skill)
    
    if job_skills:
        skills.update(skill for skill in job_skills if skill in text.lower())

    # Extract experience with context (job titles, recency)
    experience_matches = re.findall(r"(\d+)\s*(years?|yrs?)\s*(of)?\s*(experience|exp)?\s*(in)?\s*([a-z\s]+)?", text, re.IGNORECASE)
    total_experience = 0
    relevant_experience = {}
    for match in experience_matches:
        years = int(match[0])
        role = match[5].strip() if match[5] else "general"
        total_experience += years
        relevant_experience[role] = relevant_experience.get(role, 0) + years

    # Extract education and certifications (basic regex for simplicity)
    education_matches = re.findall(r"(bachelor'?s|master'?s|phd|doctorate)\s*(in)?\s*([a-z\s]+)?", text, re.IGNORECASE)
    certifications = re.findall(r"(certified|certification)\s*([a-z\s]+)", text, re.IGNORECASE)

    return {
        "skills": list(skills),
        "total_experience_years": total_experience,
        "relevant_experience": relevant_experience,
        "education": [f"{degree} in {field}" for degree, _, field in education_matches if field],
        "certifications": [cert[1] for cert in certifications]
    }

def generate_improvement_suggestions(resume_data, job_data, formatting_penalty):
    """Generate suggestions for improving the ATS score."""
    suggestions = []
    
    # Skills suggestions
    missing_skills = set(job_data["skills"]) - set(resume_data["skills"])
    if missing_skills:
        suggestions.append(f"Add the following skills to your resume: {', '.join(missing_skills)}. These are listed in the job description but not found in your resume.")

    # Experience suggestions
    if resume_data["total_experience_years"] < 2:  # Example threshold
        suggestions.append("Increase your years of experience or highlight relevant experience more prominently to meet typical job requirements (e.g., 2+ years).")
    elif resume_data["total_experience_years"] > 10 and len(job_data["relevant_experience"]) < 2:
        suggestions.append("Consider emphasizing recent or role-specific experience, as extensive experience may need context for relevance to this role.")

    # Education and certifications suggestions
    if not resume_data["education"]:
        suggestions.append("Include educational qualifications (e.g., Bachelor’s, Master’s) relevant to the role, as the job may prefer or require them.")
    if not resume_data["certifications"]:
        suggestions.append("Add relevant certifications (e.g., AWS, CISSP) to strengthen your candidacy, as these are often valued in tech roles.")

    # Formatting suggestions
    if formatting_penalty < 0:
        suggestions.append("Simplify resume formatting—avoid images, tables, or sparse text, as these can confuse ATS systems and reduce your score.")

    return suggestions if suggestions else ["Your resume is well-aligned with the job description. No major improvements suggested."]

def weighted_score(resume_text, job_desc_text):
    """Calculate a weighted ATS score with detailed breakdown and suggestions."""
    try:
        # Extract job-specific and resume data
        job_data = extract_skills_and_experience(job_desc_text)
        resume_data = extract_skills_and_experience(resume_text, job_data["skills"])

        # Skill match score (50% weight)
        resume_skills = set(resume_data["skills"])
        job_skills_set = set(job_data["skills"])
        skill_match = len(resume_skills.intersection(job_skills_set)) / len(job_skills_set) if job_skills_set else 0
        skill_score = skill_match * 50

        # Experience score (30% weight)
        total_exp = resume_data["total_experience_years"]
        exp_score = min(total_exp / 10, 1) * 30  # Cap at 10 years, 30% weight

        # Education and certifications score (10% weight, basic check)
        education_bonus = 5 if resume_data["education"] else 0
        cert_bonus = 5 if resume_data["certifications"] else 0
        edu_cert_score = min(education_bonus + cert_bonus, 10)

        # Formatting penalty (up to -20, normalized to 0–10)
        formatting_penalty = check_formatting(request.files["resume"])
        format_score = max(0, 10 + (formatting_penalty / 2))  # Convert -20 to 0, 0 to 10

        # Total score (capped at 100)
        final_score = skill_score + exp_score + edu_cert_score + format_score
        ats_score = min(final_score, 100)

        # Generate improvement suggestions
        suggestions = generate_improvement_suggestions(resume_data, job_data, formatting_penalty)

        return {
            "score": ats_score,
            "breakdown": {
                "skills": skill_score,
                "experience": exp_score,
                "education_certifications": edu_cert_score,
                "formatting": format_score
            },
            "suggestions": suggestions
        }

    except Exception as e:
        logger.error(f"Scoring failed: {str(e)}")
        raise ValueError(f"Scoring error: {str(e)}")

@app.route("/parse", methods=["POST"])
def parse_and_rank():
    """Parse resume and rank it against a job description with improvement suggestions."""
    if "resume" not in request.files or "job_desc" not in request.form:
        return jsonify({"error": "Missing resume PDF or job description"}), 400

    resume_file = request.files["resume"]
    job_desc = request.form["job_desc"]

    try:
        # Extract text from resume
        resume_text = extract_text_from_pdf(resume_file)
        if not resume_text:
            return jsonify({"error": "Empty or unreadable resume text"}), 400

        # Extract and score data
        resume_data = extract_skills_and_experience(resume_text)
        score_data = weighted_score(resume_text, job_desc)

        return jsonify({
            "data": resume_data,
            "ats_score": f"{score_data['score']:.2f}%",
            "score_breakdown": score_data["breakdown"],
            "improvement_suggestions": score_data["suggestions"]
        }), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({"error": f"Internal processing error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)