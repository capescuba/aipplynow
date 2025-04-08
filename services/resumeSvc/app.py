from flask import Flask, request, jsonify
import PyPDF2
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

def extract_text_from_pdf(pdf_file):
    """Extract and clean text from a PDF resume."""
    try:
        reader = PyPDF2.PdfReader(pdf_file)
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
        reader = PyPDF2.PdfReader(pdf_file)
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
            if skill in text.lower():
                skills.add(skill)
    if job_skills:
        skills.update(skill for skill in job_skills if skill in text.lower())

    exp_matches = re.findall(r"(\d+)\s*(years?|yrs?)\s*(of)?\s*(experience|exp)?\s*(in)?\s*([a-z\s]+)?", text, re.IGNORECASE)
    total_exp = 0
    relevant_exp = {}
    for match in exp_matches:
        years = int(match[0])
        role = match[5].strip() if match[5] else "general"
        total_exp += years
        relevant_exp[role] = relevant_exp.get(role, 0) + years

    edu_matches = re.findall(r"(bachelor'?s|master'?s|phd|doctorate)\s*(in)?\s*([a-z\s]+)?", text, re.IGNORECASE)
    cert_matches = re.findall(r"(certified|certification)\s*([a-z\s]+)", text, re.IGNORECASE)

    return {
        "skills": list(skills),
        "total_experience_years": total_exp,
        "relevant_experience": relevant_exp,
        "education": [f"{deg} in {field}" for deg, _, field in edu_matches if field],
        "certifications": [cert[1] for cert in cert_matches]
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

def analyze_with_ai(resume_text, job_desc, local_data, formatting_penalty):
    """Use xAI to refine data, score, and suggest improvements."""
    base_prompt = """
You are an ATS optimization expert. Analyze the resume text and job description below, refine the resume data, score ATS compatibility (0-100%), and provide 3-5 specific suggestions. Return *only* a JSON object with the following structure, with no additional text, comments, or markdown outside the JSON:

{
  "data": {
    "skills": [list of strings],
    "total_experience_years": number,
    "relevant_experience": {"role": years},
    "education": [list of strings],
    "certifications": [list of strings]
  },
  "ats_score": "XX.XX%",
  "breakdown": {
    "skills": number,
    "experience": number,
    "education_certifications": number,
    "formatting": number
  },
  "improvement_suggestions": [list of strings]
}
"""
    prompt = (
        base_prompt +
        "**Resume Text:**\n" + resume_text + "\n\n" +
        "**Job Description:**\n" + job_desc + "\n\n" +
        "**Locally Extracted Data:**\n" + str(local_data) + "\n\n" +
        "**Formatting Penalty:**\n" + str(formatting_penalty)
    )

    try:
        logger.info("Calling xAI API")
        completion = client.chat.completions.create(
            model="grok-2-latest",
            messages=[
                {"role": "system", "content": "You are an ATS optimization expert."},
                {"role": "user", "content": prompt}
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
            "skills": 0, "experience": 0, "education_certifications": 0, "formatting": 0
        })
        ai_result.setdefault("improvement_suggestions", ai_result.pop("suggestions", []))
        return ai_result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from xAI response: {str(e)}. Raw response: {repr(response_text)}. Cleaned response: {repr(cleaned_response)}")
        return None
    except Exception as e:
        logger.error(f"AI analysis failed: {str(e)}")
        return None

def analyze_no_ai(resume_text, job_desc, pdf_file):
    """Wrapper for no-AI analysis."""
    return weighted_score_no_ai(resume_text, job_desc, pdf_file)

@app.route("/resume/parse", methods=["POST"])
def parse_and_rank():
    """Parse resume and rank it with a consistent response structure."""
    if "resume" not in request.files or "job_desc" not in request.form:
        return jsonify({"error": "Missing resume PDF or job description"}), 400

    resume_file = request.files["resume"]
    job_desc = request.form["job_desc"]

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
                    "skills": 0, "experience": 0, "education_certifications": 0, "formatting": 0
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
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({"error": f"Internal processing error: {str(e)}"}), 500

if __name__ == "__main__":
    logger.info(f"Starting service with USE_AI={USE_AI}")
    app.run(host="0.0.0.0", port=5000, debug=False)