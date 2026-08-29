"""Reset the star demo lead (Rahul Sharma) to pre-AI-call state for UI demo testing."""
import asyncio
from dotenv import dotenv_values
from motor.motor_asyncio import AsyncIOMotorClient

env = dotenv_values("/app/backend/.env")


async def main():
    cl = AsyncIOMotorClient(env["MONGO_URL"])
    db = cl[env["DB_NAME"]]
    lead = await db.leads.find_one({"star_demo": True})
    if not lead:
        print("star lead not found")
        return
    lid = lead["id"]
    await db.leads.update_one({"id": lid}, {"$set": {
        "status": "CONTACTED", "lead_score": 42, "temperature": "WARM",
        "budget": "", "requirement": "", "timeline": "", "financing": "", "intent": "",
        "ai_summary": "", "score_breakdown": [], "next_action": "Run AI qualification call",
    }})
    await db.calls.delete_many({"lead_id": lid})
    await db.appointments.delete_many({"lead_id": lid})
    await db.followups.delete_many({"lead_id": lid})
    await db.activities.delete_many({"lead_id": lid})
    print("reset done", lid)
    cl.close()


asyncio.run(main())
