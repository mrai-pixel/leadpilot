"""Remove QA/test leads (and their calls/appointments/followups/activities) from the demo DB."""
import asyncio
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")

PREFIXES = ("QA Escape", "QA Button", "TEST_", "Persist QA", "Mayank Test")


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    leads = await db.leads.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    targets = [l for l in leads if any(l["name"].startswith(p) for p in PREFIXES)]
    for l in targets:
        for coll in (db.calls, db.appointments, db.followups, db.activities):
            await coll.delete_many({"lead_id": l["id"]})
        await db.activities.delete_many({"lead_name": l["name"]})
        await db.leads.delete_one({"id": l["id"]})
        print("deleted", l["name"], l["id"])
    print("total removed:", len(targets))


asyncio.run(main())
