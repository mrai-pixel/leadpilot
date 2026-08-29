"""LeadPilot AI — backend API regression tests (pytest)."""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="session")
def test_credentials():
    p = Path("/app/memory/test_credentials.md")
    if not p.exists():
        pytest.skip("missing credentials file")
    c = p.read_text()
    e = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?email(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    pw = re.search(r'(?im)^\s*(?:[-*]\s*)?(?:\*\*)?password(?:\*\*)?\s*:\s*`?([^`\s]+)', c)
    if not e or not pw:
        pytest.skip("no creds parsed")
    return {"email": e.group(1), "password": pw.group(1)}


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_token(api_client, test_credentials):
    r = api_client.post(f"{BASE_URL}/api/auth/login", json=test_credentials, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("token")
    if not tok:
        pytest.fail("no token in login response")
    return tok


@pytest.fixture(scope="session")
def client(api_client, auth_token):
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ------------------------------------------------------------------ auth
class TestAuth:
    def test_demo_login(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/demo", json={}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert isinstance(d.get("token"), str) and len(d["token"]) > 20
        assert d["user"]["organization_id"] == "org-urbannest"

    def test_login_success(self, api_client, test_credentials):
        r = api_client.post(f"{BASE_URL}/api/auth/login", json=test_credentials, timeout=30)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == test_credentials["email"].lower()

    def test_login_invalid(self, api_client, test_credentials):
        r = api_client.post(f"{BASE_URL}/api/auth/login",
                            json={"email": test_credentials["email"], "password": "wrongpass"}, timeout=30)
        assert r.status_code == 401
        assert "detail" in r.json()

    def test_me_requires_auth(self, api_client):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_ok(self, client):
        r = client.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "password_hash" not in d and "_id" not in d

    def test_bcrypt_hash_format(self):
        """Verify stored password hash is bcrypt $2b$ (direct DB check)."""
        import asyncio
        from motor.motor_asyncio import AsyncIOMotorClient
        from dotenv import dotenv_values as dv
        env = dv("/app/backend/.env")

        async def _check():
            cl = AsyncIOMotorClient(env["MONGO_URL"])
            u = await cl[env["DB_NAME"]].users.find_one({"id": "user-demo"})
            cl.close()
            return u
        u = asyncio.get_event_loop().run_until_complete(_check())
        assert u is not None, "demo user missing"
        assert u["password_hash"].startswith("$2b$"), u["password_hash"][:10]

    def test_bad_token_rejected(self, api_client):
        r = requests.get(f"{BASE_URL}/api/auth/me",
                         headers={"Authorization": "Bearer not.a.token"}, timeout=30)
        assert r.status_code == 401


# ------------------------------------------------------------------ dashboard / org / agent
class TestDashboard:
    def test_dashboard(self, client):
        r = client.get(f"{BASE_URL}/api/dashboard", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["org_name"] == "UrbanNest Realty"
        m = d["metrics"]
        assert m["new_leads"] == 124 and m["ai_calls"] == 87 and m["conversations"] == 42
        assert m["qualified"] == 19 and m["appointments"] == 8 and m["pipeline"] == "₹18.4L"
        assert [f["stage"] for f in d["funnel"]] == ["NEW", "CONTACTED", "ENGAGED", "QUALIFIED", "APPOINTMENT", "WON"]
        assert len(d["hot_leads"]) == 5
        assert len(d["activities"]) >= 10
        assert d["agent_status"] == "ACTIVE"

    def test_dashboard_unauth(self):
        assert requests.get(f"{BASE_URL}/api/dashboard", timeout=30).status_code == 401

    def test_organization(self, client):
        r = client.get(f"{BASE_URL}/api/organization", timeout=30)
        assert r.status_code == 200
        assert r.json()["industry"] == "Real Estate"

    def test_agent_get_and_update(self, client):
        r = client.get(f"{BASE_URL}/api/agent", timeout=30)
        assert r.status_code == 200
        a = r.json()
        assert a["status"] == "ACTIVE"
        assert a["name"].startswith("Alex")
        orig_tone = a["tone"]
        up = client.put(f"{BASE_URL}/api/agent", json={"tone": "TEST_Friendly"}, timeout=30)
        assert up.status_code == 200
        assert up.json()["tone"] == "TEST_Friendly"
        assert client.get(f"{BASE_URL}/api/agent", timeout=30).json()["tone"] == "TEST_Friendly"
        client.put(f"{BASE_URL}/api/agent", json={"tone": orig_tone}, timeout=30)


# ------------------------------------------------------------------ leads CRUD
class TestLeads:
    def test_list_leads(self, client):
        r = client.get(f"{BASE_URL}/api/leads", timeout=30)
        assert r.status_code == 200
        leads = r.json()
        assert len(leads) >= 22
        scores = [l["lead_score"] for l in leads]
        assert scores == sorted(scores, reverse=True)
        assert all("_id" not in l for l in leads)
        assert any(l["name"] == "Rahul Sharma" and l.get("star_demo") for l in leads)

    def test_get_lead_detail(self, client):
        leads = client.get(f"{BASE_URL}/api/leads", timeout=30).json()
        lead = next(l for l in leads if l["name"] == "Priya Malhotra")
        r = client.get(f"{BASE_URL}/api/leads/{lead['id']}", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["lead"]["name"] == "Priya Malhotra"
        for k in ("calls", "appointments", "followups", "activities"):
            assert isinstance(d[k], list)

    def test_get_lead_404(self, client):
        assert client.get(f"{BASE_URL}/api/leads/does-not-exist", timeout=30).status_code == 404

    def test_create_lead_and_persist(self, client):
        payload = {"name": "TEST_Lead One", "phone": "+91 90000 00001",
                   "email": "test_lead1@example.com", "source": "Website",
                   "budget": "₹1.9 Cr", "requirement": "3BHK", "location": "Gurgaon"}
        r = client.post(f"{BASE_URL}/api/leads", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["name"] == payload["name"] and d["status"] == "NEW" and d["lead_score"] == 15
        g = client.get(f"{BASE_URL}/api/leads/{d['id']}", timeout=30)
        assert g.status_code == 200
        assert g.json()["lead"]["email"] == payload["email"]

    def test_create_lead_validation(self, client):
        r = client.post(f"{BASE_URL}/api/leads", json={"phone": "123"}, timeout=30)
        assert r.status_code == 422

    def test_import_csv(self, client):
        csv_text = ("name,phone,email,source,budget,requirement,location,timeline\n"
                    "TEST_CSV Alpha,+91 90000 11111,csv1@example.com,CSV,₹2 Cr,3BHK,Gurgaon,30 days\n"
                    "TEST_CSV Beta,+91 90000 22222,csv2@example.com,CSV,₹1.6 Cr,2BHK,Gurgaon,90 days\n"
                    ",,,,,,,\n")
        r = client.post(f"{BASE_URL}/api/leads/import", json={"csv_text": csv_text}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["imported"] == 2
        names = {l["name"] for l in d["leads"]}
        assert names == {"TEST_CSV Alpha", "TEST_CSV Beta"}
        all_names = {l["name"] for l in client.get(f"{BASE_URL}/api/leads", timeout=30).json()}
        assert names <= all_names

    def test_update_stage_persists(self, client):
        created = client.post(f"{BASE_URL}/api/leads",
                              json={"name": "TEST_Stage Lead"}, timeout=30).json()
        r = client.put(f"{BASE_URL}/api/leads/{created['id']}/stage",
                       json={"status": "ENGAGED"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "ENGAGED"
        assert client.get(f"{BASE_URL}/api/leads/{created['id']}",
                          timeout=30).json()["lead"]["status"] == "ENGAGED"


# ------------------------------------------------------------------ THE AI CALL (killer flow)
class TestAICall:
    def test_star_lead_ai_call_full_flow(self, client):
        leads = client.get(f"{BASE_URL}/api/leads", timeout=30).json()
        rahul = next(l for l in leads if l["name"] == "Rahul Sharma")
        r = client.post(f"{BASE_URL}/api/leads/{rahul['id']}/ai-call", json={}, timeout=120)
        assert r.status_code == 200, r.text[:500]
        d = r.json()
        assert d["score"] == 91
        assert d["temperature"] == "HOT"
        pts = [b["points"] for b in d["breakdown"]]
        assert pts == [25, 20, 20, 15, 11]
        lead = d["lead"]
        assert lead["status"] == "APPOINTMENT"
        assert lead["lead_score"] == 91 and lead["temperature"] == "HOT"
        assert lead["budget"] == "₹2 Cr" and lead["requirement"] == "3BHK"
        assert lead["location"] == "Gurgaon" and lead["timeline"] == "30 days"
        assert lead["financing"] == "Home Loan" and lead["intent"] == "High"
        assert len(lead["ai_summary"]) > 30, lead["ai_summary"]
        assert d["appointment"]["day"] == "Saturday" and d["appointment"]["time"] == "11:30 AM"
        assert d["appointment"]["type"] == "Site Visit"
        assert d["followup"]["status"] == "Scheduled"
        assert len(d["transcript"]) >= 6
        assert d["call"]["outcome"] == "Qualified — Site visit booked"
        assert len(d["activities"]) == 4

    def test_ai_call_persistence(self, client):
        leads = client.get(f"{BASE_URL}/api/leads", timeout=30).json()
        rahul = next(l for l in leads if l["name"] == "Rahul Sharma")
        det = client.get(f"{BASE_URL}/api/leads/{rahul['id']}", timeout=30).json()
        assert det["lead"]["lead_score"] == 91
        assert det["lead"]["status"] == "APPOINTMENT"
        assert det["lead"]["temperature"] == "HOT"
        assert det["lead"]["ai_summary"]
        assert len(det["lead"]["score_breakdown"]) == 5
        assert len(det["calls"]) >= 1
        assert any(a["day"] == "Saturday" and a["time"] == "11:30 AM" for a in det["appointments"])
        assert len(det["followups"]) >= 1

    def test_ai_call_404(self, client):
        assert client.post(f"{BASE_URL}/api/leads/nope/ai-call", json={}, timeout=60).status_code == 404

    def test_ai_call_non_star_lead(self, client):
        created = client.post(f"{BASE_URL}/api/leads",
                             json={"name": "TEST_AICall Lead", "budget": "₹1.6 Cr",
                                   "requirement": "3BHK", "timeline": "90 days"}, timeout=30).json()
        r = client.post(f"{BASE_URL}/api/leads/{created['id']}/ai-call", json={}, timeout=120)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["lead"]["status"] == "APPOINTMENT"
        assert 0 < d["score"] <= 100
        assert d["temperature"] in ("HOT", "WARM", "COLD")


# ------------------------------------------------------------------ appointments / calls / activities
class TestOther:
    def test_appointments(self, client):
        r = client.get(f"{BASE_URL}/api/appointments", timeout=30)
        assert r.status_code == 200
        appts = r.json()
        assert len(appts) >= 8
        # Rahul's Saturday 11:30 AM site visit exists only after the AI call has been run.
        rahul_appt = [a for a in appts if a["lead_name"] == "Rahul Sharma"]
        if rahul_appt:
            assert any(a["time"] == "11:30 AM" and a["day"] == "Saturday" for a in rahul_appt)
        assert any(a["type"] == "Site Visit" for a in appts)
        assert all("_id" not in a for a in appts)

    def test_calls_list_and_detail(self, client):
        r = client.get(f"{BASE_URL}/api/calls", timeout=30)
        assert r.status_code == 200
        calls = r.json()
        assert len(calls) >= 15
        c = calls[0]
        assert isinstance(c["transcript"], list) and c["transcript"]
        d = client.get(f"{BASE_URL}/api/calls/{c['id']}", timeout=30)
        assert d.status_code == 200
        assert d.json()["id"] == c["id"]
        assert client.get(f"{BASE_URL}/api/calls/bad-id", timeout=30).status_code == 404

    def test_activities(self, client):
        r = client.get(f"{BASE_URL}/api/activities", timeout=30)
        assert r.status_code == 200
        acts = r.json()
        assert len(acts) >= 25
        assert all(a.get("description") for a in acts)


# ------------------------------------------------------------------ cleanup
@pytest.fixture(scope="session", autouse=True)
def cleanup(request):
    yield
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    from dotenv import dotenv_values as dv
    env = dv("/app/backend/.env")

    async def _rm():
        cl = AsyncIOMotorClient(env["MONGO_URL"])
        db = cl[env["DB_NAME"]]
        ids = [l["id"] async for l in db.leads.find({"name": {"$regex": "^TEST_"}}, {"id": 1})]
        await db.leads.delete_many({"name": {"$regex": "^TEST_"}})
        if ids:
            await db.calls.delete_many({"lead_id": {"$in": ids}})
            await db.appointments.delete_many({"lead_id": {"$in": ids}})
            await db.followups.delete_many({"lead_id": {"$in": ids}})
            await db.activities.delete_many({"lead_id": {"$in": ids}})
        cl.close()
    asyncio.new_event_loop().run_until_complete(_rm())
