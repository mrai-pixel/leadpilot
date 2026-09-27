from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import uuid
import logging
import bcrypt
import jwt
import csv
import io
from datetime import datetime, timezone, timedelta

# ------------------------------------------------------------------ config
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="LeadPilot AI")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("leadpilot")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def next_saturday_1130():
    today = datetime.now(timezone.utc)
    days = (5 - today.weekday()) % 7
    days = days if days != 0 else 7
    sat = today + timedelta(days=days)
    return sat.strftime("%Y-%m-%d"), "Saturday", "11:30 AM"


# ------------------------------------------------------------------ auth utils
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ------------------------------------------------------------------ schemas
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class LeadInput(BaseModel):
    name: str
    phone: str = ""
    email: str = ""
    source: str = "Website"
    budget: str = ""
    requirement: str = ""
    location: str = "Gurgaon"
    timeline: str = ""
    financing: str = ""
    auto_call: bool = False


class CsvInput(BaseModel):
    csv_text: str


class StageInput(BaseModel):
    status: str


class AgentInput(BaseModel):
    tone: Optional[str] = None
    objective: Optional[str] = None
    questions: Optional[List[str]] = None
    name: Optional[str] = None


# ------------------------------------------------------------------ scoring
def compute_score(budget, timeline, requirement, intent, appointment, engaged=True):
    breakdown = []
    b = (budget or "").lower()
    if "2" in b and "cr" in b:
        breakdown.append({"label": "Strong budget fit", "points": 25})
    elif "1.5" in b or "1.8" in b or "cr" in b:
        breakdown.append({"label": "Good budget fit", "points": 20})
    elif budget:
        breakdown.append({"label": "Budget shared", "points": 12})

    t = (timeline or "").lower()
    if "30" in t or "month" in t or "immediate" in t:
        breakdown.append({"label": "Purchase within 30 days", "points": 20})
    elif "60" in t or "90" in t or "3 month" in t:
        breakdown.append({"label": "Purchase within 90 days", "points": 15})
    elif timeline:
        breakdown.append({"label": "Timeline shared", "points": 8})

    intent_l = (intent or "").lower()
    if intent_l == "high":
        breakdown.append({"label": "High intent", "points": 20})
    elif intent_l == "medium":
        breakdown.append({"label": "Medium intent", "points": 12})
    elif intent:
        breakdown.append({"label": "Low intent", "points": 6})

    if requirement:
        breakdown.append({"label": "Clear requirement", "points": 15})

    if appointment:
        breakdown.append({"label": "Accepted site visit", "points": 11})

    score = min(100, sum(x["points"] for x in breakdown))
    return score, breakdown


def temperature_for(score):
    if score >= 80:
        return "HOT"
    if score >= 55:
        return "WARM"
    return "COLD"


# ------------------------------------------------------------------ seed data
async def seed():
    if await db.organizations.find_one({"id": "org-urbannest"}):
        return
    logger.info("Seeding demo data...")

    org = {
        "id": "org-urbannest",
        "name": "UrbanNest Realty",
        "industry": "Real Estate",
        "location": "Gurgaon, India",
        "website": "urbannest.example",
        "description": "Premium 3BHK apartments in Gurgaon (₹1.5 Cr – ₹2.5 Cr).",
        "demo_metrics": {
            "new_leads": 124, "ai_calls": 87, "conversations": 42,
            "qualified": 19, "appointments": 8, "pipeline": "₹18.4L",
            "hours_saved": 127, "leads_contacted": 87, "followups": 143,
        },
        "created_at": now_iso(),
    }
    await db.organizations.insert_one(org)

    await db.users.insert_one({
        "id": "user-demo",
        "name": "UrbanNest Admin",
        "email": os.environ["ADMIN_EMAIL"].lower(),
        "password_hash": hash_password(os.environ["ADMIN_PASSWORD"]),
        "organization_id": "org-urbannest",
        "created_at": now_iso(),
    })

    await db.agents.insert_one({
        "id": "agent-alex",
        "organization_id": "org-urbannest",
        "name": "Alex — UrbanNest AI Sales Employee",
        "status": "ACTIVE",
        "tone": "Professional + Consultative",
        "objective": "Qualify leads and book site visits.",
        "questions": [
            "What type of property are you looking for?",
            "Which location?",
            "What is your approximate budget?",
            "When are you planning to purchase?",
            "Would you like to schedule a site visit?",
        ],
    })

    sat_date, sat_day, sat_time = next_saturday_1130()

    # 22 leads. Rahul is the demo star (starts un-qualified).
    leads_seed = [
        # star
        {"name": "Rahul Sharma", "phone": "+91 98110 24567", "email": "rahul.sharma@gmail.com",
         "source": "Website", "status": "CONTACTED", "lead_score": 42, "temperature": "WARM",
         "budget": "", "requirement": "", "location": "Gurgaon", "timeline": "", "financing": "",
         "intent": "", "star_demo": True, "next_action": "Run AI qualification call"},

        {"name": "Priya Malhotra", "phone": "+91 99102 33421", "email": "priya.m@gmail.com",
         "source": "Facebook Ads", "status": "QUALIFIED", "lead_score": 84, "temperature": "HOT",
         "budget": "₹2.2 Cr", "requirement": "3BHK", "location": "Golf Course Road", "timeline": "45 days",
         "financing": "Home Loan", "intent": "High", "next_action": "Site visit recommended"},

        {"name": "Neha Kapoor", "phone": "+91 98730 11220", "email": "neha.kapoor@outlook.com",
         "source": "Google Ads", "status": "ENGAGED", "lead_score": 71, "temperature": "WARM",
         "budget": "₹1.8 Cr", "requirement": "3BHK", "location": "Sector 65", "timeline": "60 days",
         "financing": "Home Loan", "intent": "Medium", "next_action": "Follow-up call"},

        {"name": "Arjun Mehta", "phone": "+91 99999 44521", "email": "arjun.mehta@gmail.com",
         "source": "Referral", "status": "CONTACTED", "lead_score": 55, "temperature": "WARM",
         "budget": "₹1.6 Cr", "requirement": "3BHK", "location": "Sohna Road", "timeline": "90 days",
         "financing": "Self-funded", "intent": "Medium", "next_action": "Send brochure"},

        {"name": "Ananya Gupta", "phone": "+91 98180 77654", "email": "ananya.g@gmail.com",
         "source": "Website", "status": "APPOINTMENT", "lead_score": 88, "temperature": "HOT",
         "budget": "₹2.4 Cr", "requirement": "4BHK", "location": "DLF Phase 5", "timeline": "30 days",
         "financing": "Home Loan", "intent": "High", "next_action": "Attend site visit"},

        {"name": "Rohan Verma", "phone": "+91 98991 22110", "email": "rohan.verma@gmail.com",
         "source": "Instagram", "status": "NEW", "lead_score": 20, "temperature": "COLD",
         "budget": "", "requirement": "2BHK", "location": "Gurgaon", "timeline": "", "financing": "",
         "intent": "Low", "next_action": "First contact"},

        {"name": "Aditi Bansal", "phone": "+91 99711 88342", "email": "aditi.bansal@gmail.com",
         "source": "Referral", "status": "WON", "lead_score": 95, "temperature": "HOT",
         "budget": "₹2.5 Cr", "requirement": "4BHK", "location": "Golf Course Road", "timeline": "Closed",
         "financing": "Home Loan", "intent": "High", "next_action": "Onboarding"},

        {"name": "Vikram Singh", "phone": "+91 98220 55671", "email": "vikram.singh@gmail.com",
         "source": "Google Ads", "status": "QUALIFIED", "lead_score": 79, "temperature": "WARM",
         "budget": "₹1.9 Cr", "requirement": "3BHK", "location": "Sector 65", "timeline": "60 days",
         "financing": "Home Loan", "intent": "High", "next_action": "Book site visit"},

        {"name": "Sneha Agarwal", "phone": "+91 98455 12098", "email": "sneha.a@gmail.com",
         "source": "Website", "status": "ENGAGED", "lead_score": 66, "temperature": "WARM",
         "budget": "₹1.7 Cr", "requirement": "3BHK", "location": "Sohna Road", "timeline": "90 days",
         "financing": "Home Loan", "intent": "Medium", "next_action": "Follow-up"},

        {"name": "Karan Khanna", "phone": "+91 98700 33445", "email": "karan.khanna@gmail.com",
         "source": "Facebook Ads", "status": "CONTACTED", "lead_score": 48, "temperature": "COLD",
         "budget": "₹1.5 Cr", "requirement": "2BHK", "location": "Sector 65", "timeline": "6 months",
         "financing": "Self-funded", "intent": "Low", "next_action": "Nurture"},

        {"name": "Ishaan Reddy", "phone": "+91 99456 77120", "email": "ishaan.reddy@gmail.com",
         "source": "Referral", "status": "APPOINTMENT", "lead_score": 82, "temperature": "HOT",
         "budget": "₹2.1 Cr", "requirement": "3BHK", "location": "DLF Phase 5", "timeline": "30 days",
         "financing": "Home Loan", "intent": "High", "next_action": "Confirm site visit"},

        {"name": "Meera Nair", "phone": "+91 98120 66093", "email": "meera.nair@gmail.com",
         "source": "Website", "status": "NEW", "lead_score": 18, "temperature": "COLD",
         "budget": "", "requirement": "3BHK", "location": "Gurgaon", "timeline": "", "financing": "",
         "intent": "", "next_action": "First contact"},

        {"name": "Aryan Kapoor", "phone": "+91 99881 23456", "email": "aryan.k@gmail.com",
         "source": "Google Ads", "status": "ENGAGED", "lead_score": 63, "temperature": "WARM",
         "budget": "₹1.8 Cr", "requirement": "3BHK", "location": "Sohna Road", "timeline": "75 days",
         "financing": "Home Loan", "intent": "Medium", "next_action": "Send floor plans"},

        {"name": "Tanya Chopra", "phone": "+91 98333 90012", "email": "tanya.chopra@gmail.com",
         "source": "Instagram", "status": "QUALIFIED", "lead_score": 76, "temperature": "WARM",
         "budget": "₹2.0 Cr", "requirement": "3BHK", "location": "Golf Course Road", "timeline": "45 days",
         "financing": "Home Loan", "intent": "High", "next_action": "Book site visit"},

        {"name": "Devansh Jain", "phone": "+91 99012 45678", "email": "devansh.jain@gmail.com",
         "source": "Referral", "status": "CONTACTED", "lead_score": 51, "temperature": "WARM",
         "budget": "₹1.6 Cr", "requirement": "3BHK", "location": "Sector 65", "timeline": "90 days",
         "financing": "Self-funded", "intent": "Medium", "next_action": "Follow-up"},

        {"name": "Kavya Iyer", "phone": "+91 98455 67012", "email": "kavya.iyer@gmail.com",
         "source": "Website", "status": "LOST", "lead_score": 30, "temperature": "COLD",
         "budget": "₹1.2 Cr", "requirement": "2BHK", "location": "Gurgaon", "timeline": "12 months",
         "financing": "Self-funded", "intent": "Low", "next_action": "Archived — budget mismatch"},

        {"name": "Nikhil Rao", "phone": "+91 99887 11234", "email": "nikhil.rao@gmail.com",
         "source": "Google Ads", "status": "WON", "lead_score": 92, "temperature": "HOT",
         "budget": "₹2.3 Cr", "requirement": "4BHK", "location": "DLF Phase 5", "timeline": "Closed",
         "financing": "Home Loan", "intent": "High", "next_action": "Onboarding"},

        {"name": "Simran Kaur", "phone": "+91 98120 44567", "email": "simran.kaur@gmail.com",
         "source": "Facebook Ads", "status": "ENGAGED", "lead_score": 68, "temperature": "WARM",
         "budget": "₹1.9 Cr", "requirement": "3BHK", "location": "Sohna Road", "timeline": "60 days",
         "financing": "Home Loan", "intent": "Medium", "next_action": "Follow-up call"},

        {"name": "Manav Desai", "phone": "+91 99456 00123", "email": "manav.desai@gmail.com",
         "source": "Referral", "status": "NEW", "lead_score": 22, "temperature": "COLD",
         "budget": "", "requirement": "3BHK", "location": "Gurgaon", "timeline": "", "financing": "",
         "intent": "", "next_action": "First contact"},

        {"name": "Pooja Reddy", "phone": "+91 98330 55678", "email": "pooja.reddy@gmail.com",
         "source": "Website", "status": "APPOINTMENT", "lead_score": 85, "temperature": "HOT",
         "budget": "₹2.2 Cr", "requirement": "3BHK", "location": "Golf Course Road", "timeline": "30 days",
         "financing": "Home Loan", "intent": "High", "next_action": "Attend site visit"},

        {"name": "Harsh Vardhan", "phone": "+91 99001 78234", "email": "harsh.v@gmail.com",
         "source": "Google Ads", "status": "CONTACTED", "lead_score": 46, "temperature": "COLD",
         "budget": "₹1.5 Cr", "requirement": "2BHK", "location": "Sector 65", "timeline": "8 months",
         "financing": "Self-funded", "intent": "Low", "next_action": "Nurture"},

        {"name": "Riya Sethi", "phone": "+91 98455 33210", "email": "riya.sethi@gmail.com",
         "source": "Instagram", "status": "QUALIFIED", "lead_score": 80, "temperature": "HOT",
         "budget": "₹2.1 Cr", "requirement": "3BHK", "location": "DLF Phase 5", "timeline": "45 days",
         "financing": "Home Loan", "intent": "High", "next_action": "Book site visit"},
    ]

    lead_docs = []
    for i, l in enumerate(leads_seed):
        created = (datetime.now(timezone.utc) - timedelta(days=(i % 14), hours=(i * 3) % 24))
        doc = {
            "id": str(uuid.uuid4()),
            "organization_id": "org-urbannest",
            "name": l["name"], "phone": l["phone"], "email": l["email"],
            "source": l["source"], "status": l["status"],
            "lead_score": l["lead_score"], "temperature": l["temperature"],
            "budget": l["budget"], "requirement": l["requirement"], "location": l["location"],
            "timeline": l["timeline"], "financing": l["financing"], "intent": l["intent"],
            "next_action": l.get("next_action", ""),
            "star_demo": l.get("star_demo", False),
            "ai_summary": "",
            "score_breakdown": [],
            "last_contact": created.isoformat(),
            "created_at": created.isoformat(),
            "updated_at": created.isoformat(),
        }
        lead_docs.append(doc)
    await db.leads.insert_many(lead_docs)

    by_name = {d["name"]: d for d in lead_docs}

    # Calls (15+) for engaged/qualified/won leads
    call_outcomes = {
        "QUALIFIED": ("Qualified", "Lead qualified — budget and timeline confirmed."),
        "APPOINTMENT": ("Site visit booked", "Qualified and booked a site visit."),
        "WON": ("Deal closed", "Customer confirmed booking after site visit."),
        "ENGAGED": ("Interested", "Lead engaged, needs follow-up on financing."),
        "CONTACTED": ("Contacted", "Reached lead, shared property details."),
    }
    calls = []
    call_leads = [d for d in lead_docs if d["status"] in call_outcomes and not d["star_demo"]]
    for i, d in enumerate(call_leads):
        outcome, summ = call_outcomes[d["status"]]
        dur = 60 + (i * 17) % 180
        calls.append({
            "id": str(uuid.uuid4()),
            "lead_id": d["id"], "lead_name": d["name"],
            "status": "completed", "duration": dur,
            "transcript": _demo_transcript(d),
            "summary": f"{d['name'].split()[0]} — {summ}",
            "outcome": outcome, "score": d["lead_score"],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=i % 10, hours=i)).isoformat(),
        })
    await db.calls.insert_many(calls)

    # Appointments (8+) for APPOINTMENT / WON leads
    appt_leads = [d for d in lead_docs if d["status"] in ("APPOINTMENT", "WON")]
    appts = []
    times = ["10:00 AM", "11:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"]
    for i, d in enumerate(appt_leads):
        dt = datetime.now(timezone.utc) + timedelta(days=(i % 6) + 1)
        appts.append({
            "id": str(uuid.uuid4()),
            "lead_id": d["id"], "lead_name": d["name"], "lead_score": d["lead_score"],
            "date": dt.strftime("%Y-%m-%d"),
            "day": dt.strftime("%A"),
            "time": times[i % len(times)],
            "type": "Site Visit",
            "status": "Confirmed" if d["status"] == "WON" else "Scheduled",
            "notes": f"{d['requirement']} • {d['location']}",
        })
    # ensure at least 8
    while len(appts) < 8:
        d = lead_docs[len(appts) % len(lead_docs)]
        dt = datetime.now(timezone.utc) + timedelta(days=(len(appts) % 6) + 1)
        appts.append({
            "id": str(uuid.uuid4()), "lead_id": d["id"], "lead_name": d["name"],
            "lead_score": d["lead_score"], "date": dt.strftime("%Y-%m-%d"),
            "day": dt.strftime("%A"), "time": times[len(appts) % len(times)],
            "type": "Site Visit", "status": "Scheduled", "notes": f"{d['requirement']} • {d['location']}",
        })
    await db.appointments.insert_many(appts)

    # Follow-ups
    fups = []
    for d in lead_docs:
        if d["status"] in ("ENGAGED", "QUALIFIED", "APPOINTMENT", "CONTACTED"):
            fups.append({
                "id": str(uuid.uuid4()), "lead_id": d["id"], "lead_name": d["name"],
                "type": "call", "status": "Scheduled",
                "message": "Send property details and follow up on requirement.",
                "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            })
    await db.followups.insert_many(fups)

    # Activities (25+)
    acts = []
    templates = [
        ("qualified", "{n} qualified as a HOT lead"),
        ("call", "AI completed a call with {n}"),
        ("appointment", "Site visit booked with {n}"),
        ("followup", "Follow-up scheduled for {n}"),
        ("score", "{n} scored {s}/100"),
    ]
    for i, d in enumerate(lead_docs):
        if d.get("star_demo"):
            continue
        t = templates[i % len(templates)]
        acts.append({
            "id": str(uuid.uuid4()), "lead_id": d["id"], "lead_name": d["name"],
            "type": t[0],
            "description": t[1].format(n=d["name"], s=d["lead_score"]),
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=i * 2)).isoformat(),
        })
    # a few extra to exceed 25
    extra = [
        ("call", "AI completed a call with Priya Malhotra"),
        ("appointment", "Site visit booked with Ananya Gupta"),
        ("score", "Riya Sethi scored 80/100"),
        ("qualified", "Vikram Singh qualified as a WARM lead"),
        ("followup", "Follow-up scheduled for Neha Kapoor"),
    ]
    for i, (typ, desc) in enumerate(extra):
        acts.append({
            "id": str(uuid.uuid4()), "lead_id": lead_docs[i]["id"], "lead_name": "",
            "type": typ, "description": desc,
            "created_at": (datetime.now(timezone.utc) - timedelta(minutes=i * 12)).isoformat(),
        })
    await db.activities.insert_many(acts)
    logger.info("Seed complete.")


def _demo_transcript(lead):
    fn = lead["name"].split()[0]
    return [
        {"speaker": "AI", "text": f"Hi {fn}, I'm calling from UrbanNest Realty. You recently enquired about our 3BHK apartments in Gurgaon. Is this a good time to speak?"},
        {"speaker": "Lead", "text": "Yes, sure."},
        {"speaker": "AI", "text": "Great. May I ask what budget you're considering?"},
        {"speaker": "Lead", "text": f"Around {lead.get('budget') or '1.8 crore'}."},
        {"speaker": "AI", "text": "And when are you planning to purchase?"},
        {"speaker": "Lead", "text": f"{lead.get('timeline') or 'In a couple of months'}."},
        {"speaker": "AI", "text": "Would you be interested in a site visit this Saturday?"},
        {"speaker": "Lead", "text": "Yes, that works."},
        {"speaker": "AI", "text": "Perfect, I'll reserve a slot and send the details. Thank you!"},
    ]


# ------------------------------------------------------------------ LLM summary
async def generate_ai_summary(lead: dict) -> str:
    fn = lead["name"].split()[0]
    fallback = (f"{fn} is actively looking for a {lead.get('requirement') or 'premium'} property in "
                f"{lead.get('location') or 'Gurgaon'} with a budget of approximately {lead.get('budget') or 'N/A'}. "
                f"They plan to purchase within {lead.get('timeline') or 'the coming months'} and are open to a site visit.")
    if not EMERGENT_LLM_KEY:
        return fallback
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summary-{lead['id']}",
            system_message="You are a real estate sales assistant. Write a concise 2-sentence lead summary in a professional tone. No preamble, no markdown.",
        ).with_model("anthropic", "claude-sonnet-4-6")
        prompt = (f"Lead: {lead['name']}. Budget: {lead.get('budget')}. Requirement: {lead.get('requirement')}. "
                  f"Location: {lead.get('location')}. Timeline: {lead.get('timeline')}. "
                  f"Financing: {lead.get('financing')}. Intent: {lead.get('intent')}. "
                  f"Accepted site visit: yes. Write the summary.")
        resp = await chat.send_message(UserMessage(text=prompt))
        text = resp if isinstance(resp, str) else str(resp)
        return text.strip() or fallback
    except Exception as e:
        logger.warning(f"LLM summary failed: {e}")
        return fallback


# ------------------------------------------------------------------ auth routes
@api.post("/auth/register")
async def register(inp: RegisterInput):
    email = inp.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    await db.users.insert_one({
        "id": uid, "name": inp.name, "email": email,
        "password_hash": hash_password(inp.password),
        "organization_id": "org-urbannest", "created_at": now_iso(),
    })
    return {"token": create_token(uid, email),
            "user": {"id": uid, "name": inp.name, "email": email, "organization_id": "org-urbannest"}}


@api.post("/auth/login")
async def login(inp: LoginInput):
    email = inp.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    return {"token": create_token(user["id"], email),
            "user": {"id": user["id"], "name": user["name"], "email": email,
                     "organization_id": user["organization_id"]}}


@api.post("/auth/demo")
async def demo_login():
    user = await db.users.find_one({"id": "user-demo"})
    return {"token": create_token(user["id"], user["email"]),
            "user": {"id": user["id"], "name": user["name"], "email": user["email"],
                     "organization_id": user["organization_id"]}}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ------------------------------------------------------------------ org / agent
@api.get("/organization")
async def get_org(user: dict = Depends(get_current_user)):
    org = await db.organizations.find_one({"id": user["organization_id"]}, {"_id": 0})
    return org


@api.get("/agent")
async def get_agent(user: dict = Depends(get_current_user)):
    a = await db.agents.find_one({"organization_id": user["organization_id"]}, {"_id": 0})
    return a


@api.put("/agent")
async def update_agent(inp: AgentInput, user: dict = Depends(get_current_user)):
    upd = {k: v for k, v in inp.dict().items() if v is not None}
    await db.agents.update_one({"organization_id": user["organization_id"]}, {"$set": upd})
    return await db.agents.find_one({"organization_id": user["organization_id"]}, {"_id": 0})


# ------------------------------------------------------------------ dashboard
@api.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    oid = user["organization_id"]
    org = await db.organizations.find_one({"id": oid}, {"_id": 0})
    leads = await db.leads.find({"organization_id": oid}, {"_id": 0}).to_list(1000)

    stages = ["NEW", "CONTACTED", "ENGAGED", "QUALIFIED", "APPOINTMENT", "WON"]
    funnel = [{"stage": s, "count": len([l for l in leads if l["status"] == s])} for s in stages]

    hot = sorted(leads, key=lambda x: x["lead_score"], reverse=True)[:5]
    activities = await db.activities.find({}, {"_id": 0}).sort("created_at", -1).to_list(12)

    return {
        "org_name": org["name"],
        "metrics": org["demo_metrics"],
        "funnel": funnel,
        "hot_leads": hot,
        "activities": activities,
        "agent_status": "ACTIVE",
    }


# ------------------------------------------------------------------ leads
@api.get("/leads")
async def list_leads(user: dict = Depends(get_current_user)):
    leads = await db.leads.find({"organization_id": user["organization_id"]}, {"_id": 0}) \
        .sort("lead_score", -1).to_list(1000)
    return leads


@api.get("/leads/{lead_id}")
async def get_lead(lead_id: str, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(404, "Lead not found")
    calls = await db.calls.find({"lead_id": lead_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    appts = await db.appointments.find({"lead_id": lead_id}, {"_id": 0}).to_list(50)
    fups = await db.followups.find({"lead_id": lead_id}, {"_id": 0}).to_list(50)
    acts = await db.activities.find({"lead_id": lead_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"lead": lead, "calls": calls, "appointments": appts, "followups": fups, "activities": acts}


@api.post("/leads")
async def create_lead(inp: LeadInput, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()), "organization_id": user["organization_id"],
        "name": inp.name, "phone": inp.phone, "email": inp.email, "source": inp.source,
        "status": "NEW", "lead_score": 15, "temperature": "COLD",
        "budget": inp.budget, "requirement": inp.requirement, "location": inp.location,
        "timeline": inp.timeline, "financing": inp.financing, "intent": "",
        "next_action": "First contact", "star_demo": False, "ai_summary": "",
        "score_breakdown": [], "last_contact": now_iso(),
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.leads.insert_one(doc)
    doc.pop("_id", None)
    await db.activities.insert_one({
        "id": str(uuid.uuid4()), "lead_id": doc["id"], "lead_name": doc["name"],
        "type": "score", "description": f"New lead {doc['name']} added", "created_at": now_iso(),
    })
    if inp.auto_call:
        result = await run_ai_qualification(doc)
        return {**result["lead"], "auto_called": True}
    return doc


@api.post("/leads/import")
async def import_csv(inp: CsvInput, user: dict = Depends(get_current_user)):
    reader = csv.DictReader(io.StringIO(inp.csv_text.strip()))
    created = []
    for row in reader:
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        if not row.get("name"):
            continue
        doc = {
            "id": str(uuid.uuid4()), "organization_id": user["organization_id"],
            "name": row.get("name"), "phone": row.get("phone", ""), "email": row.get("email", ""),
            "source": row.get("source", "CSV Import"), "status": "NEW",
            "lead_score": 15, "temperature": "COLD",
            "budget": row.get("budget", ""), "requirement": row.get("requirement", ""),
            "location": row.get("location", "Gurgaon"), "timeline": row.get("timeline", ""),
            "financing": row.get("financing", ""), "intent": "",
            "next_action": "First contact", "star_demo": False, "ai_summary": "",
            "score_breakdown": [], "last_contact": now_iso(),
            "created_at": now_iso(), "updated_at": now_iso(),
        }
        await db.leads.insert_one(doc)
        doc.pop("_id", None)
        created.append(doc)
    return {"imported": len(created), "leads": created}


@api.put("/leads/{lead_id}/stage")
async def update_stage(lead_id: str, inp: StageInput, user: dict = Depends(get_current_user)):
    await db.leads.update_one({"id": lead_id}, {"$set": {"status": inp.status, "updated_at": now_iso()}})
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return lead


# ------------------------------------------------------------------ THE AI CALL
async def run_ai_qualification(lead: dict) -> dict:
    """Runs the (simulated) AI qualification call and persists all resulting state.
    Reused by the ai-call endpoint and by auto-call-on-create."""
    lead_id = lead["id"]
    star = lead.get("star_demo")
    if star:
        qual = {"budget": "₹2 Cr", "requirement": "3BHK", "location": "Gurgaon",
                "timeline": "30 days", "financing": "Home Loan", "intent": "High"}
    else:
        qual = {
            "budget": lead.get("budget") or "₹1.8 Cr",
            "requirement": lead.get("requirement") or "3BHK",
            "location": lead.get("location") or "Gurgaon",
            "timeline": lead.get("timeline") or "60 days",
            "financing": lead.get("financing") or "Home Loan",
            "intent": lead.get("intent") or "High",
        }

    score, breakdown = compute_score(qual["budget"], qual["timeline"], qual["requirement"],
                                     qual["intent"], appointment=True)
    if star:
        score, breakdown = 91, [
            {"label": "Strong budget fit", "points": 25},
            {"label": "Purchase within 30 days", "points": 20},
            {"label": "High intent", "points": 20},
            {"label": "Clear requirement", "points": 15},
            {"label": "Accepted site visit", "points": 11},
        ]
    temp = temperature_for(score)

    summary = await generate_ai_summary({**lead, **qual})
    sat_date, sat_day, sat_time = next_saturday_1130()
    transcript = _demo_transcript({**lead, **qual})

    call = {
        "id": str(uuid.uuid4()), "lead_id": lead_id, "lead_name": lead["name"],
        "status": "completed", "duration": 134,
        "transcript": transcript,
        "summary": summary, "outcome": "Qualified — Site visit booked", "score": score,
        "created_at": now_iso(),
    }
    await db.calls.insert_one(call)

    lead_update = {
        "status": "APPOINTMENT", "lead_score": score, "temperature": temp,
        "budget": qual["budget"], "requirement": qual["requirement"], "location": qual["location"],
        "timeline": qual["timeline"], "financing": qual["financing"], "intent": qual["intent"],
        "ai_summary": summary, "score_breakdown": breakdown,
        "next_action": "Attend site visit", "last_contact": now_iso(), "updated_at": now_iso(),
    }
    await db.leads.update_one({"id": lead_id}, {"$set": lead_update})

    await db.appointments.delete_many({"lead_id": lead_id, "type": "Site Visit", "status": "Scheduled"})
    appt = {
        "id": str(uuid.uuid4()), "lead_id": lead_id, "lead_name": lead["name"], "lead_score": score,
        "date": sat_date, "day": sat_day, "time": sat_time, "type": "Site Visit",
        "status": "Scheduled", "notes": f"{qual['requirement']} • {qual['location']}",
    }
    await db.appointments.insert_one(appt)

    await db.followups.delete_many({"lead_id": lead_id, "type": "message", "status": "Scheduled"})
    fup = {
        "id": str(uuid.uuid4()), "lead_id": lead_id, "lead_name": lead["name"],
        "type": "message", "status": "Scheduled",
        "message": "Send property details and site visit confirmation.",
        "scheduled_at": now_iso(),
    }
    await db.followups.insert_one(fup)

    new_acts = [
        {"id": str(uuid.uuid4()), "lead_id": lead_id, "lead_name": lead["name"], "type": "qualified",
         "description": f"{lead['name']} qualified as a {temp} lead", "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "lead_id": lead_id, "lead_name": lead["name"], "type": "score",
         "description": f"{lead['name']} scored {score}/100", "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "lead_id": lead_id, "lead_name": lead["name"], "type": "appointment",
         "description": f"AI qualified {lead['name']} and booked a site visit for {sat_day} at {sat_time}",
         "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "lead_id": lead_id, "lead_name": lead["name"], "type": "followup",
         "description": f"Follow-up scheduled for {lead['name']}", "created_at": now_iso()},
    ]
    await db.activities.insert_many(new_acts)

    updated_lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    call.pop("_id", None)
    appt.pop("_id", None)
    fup.pop("_id", None)
    for a in new_acts:
        a.pop("_id", None)
    return {"lead": updated_lead, "call": call, "appointment": appt,
            "followup": fup, "activities": new_acts, "transcript": transcript,
            "score": score, "temperature": temp, "breakdown": breakdown}


@api.post("/leads/{lead_id}/ai-call")
async def ai_call(lead_id: str, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(404, "Lead not found")
    return await run_ai_qualification(lead)


@api.post("/leads/{lead_id}/reset")
async def reset_lead(lead_id: str, user: dict = Depends(get_current_user)):
    """Clears all AI-call state so the demo call can be replayed from a clean start."""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(404, "Lead not found")
    star = lead.get("star_demo")
    reset_fields = {
        "status": "CONTACTED" if star else "NEW",
        "lead_score": 42 if star else 15,
        "temperature": "WARM" if star else "COLD",
        "budget": "", "requirement": "", "location": "Gurgaon",
        "timeline": "", "financing": "", "intent": "",
        "ai_summary": "", "score_breakdown": [],
        "next_action": "Run AI qualification call",
        "last_contact": now_iso(), "updated_at": now_iso(),
    }
    await db.leads.update_one({"id": lead_id}, {"$set": reset_fields})
    await db.calls.delete_many({"lead_id": lead_id})
    await db.appointments.delete_many({"lead_id": lead_id})
    await db.followups.delete_many({"lead_id": lead_id})
    await db.activities.delete_many({"lead_id": lead_id})
    updated = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return {"lead": updated}


# ------------------------------------------------------------------ others
@api.get("/appointments")
async def list_appointments(user: dict = Depends(get_current_user)):
    return await db.appointments.find({}, {"_id": 0}).sort("date", 1).to_list(200)


@api.get("/calls")
async def list_calls(user: dict = Depends(get_current_user)):
    return await db.calls.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.get("/calls/{call_id}")
async def get_call(call_id: str, user: dict = Depends(get_current_user)):
    call = await db.calls.find_one({"id": call_id}, {"_id": 0})
    if not call:
        raise HTTPException(404, "Call not found")
    return call


@api.get("/activities")
async def list_activities(user: dict = Depends(get_current_user)):
    return await db.activities.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


# ------------------------------------------------------------------ mount
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.leads.create_index("organization_id")
    try:
        await db.users.create_index("email", unique=True)
    except Exception:
        pass
    await seed()


@app.on_event("shutdown")
async def shutdown():
    client.close()
