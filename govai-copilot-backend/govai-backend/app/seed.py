"""
Idempotent seed script — creates demo accounts matching the ones already
referenced in the existing frontend README, so login works out of the box.
Run with: python -m app.seed
"""
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, Officer
from app.models.enums import UserRole

DEMO_OFFICERS = [
    {"username": "admin", "email": "admin@govai.local", "password": "Admin@123",
     "role": UserRole.ADMIN, "full_name": "System Administrator", "department": "All", "designation": "Admin"},
    {"username": "supervisor.revenue", "email": "supervisor.revenue@govai.local", "password": "Supervisor@123",
     "role": UserRole.SUPERVISOR, "full_name": "Revenue Supervisor", "department": "Revenue", "designation": "Supervisor"},
    {"username": "officer.revenue", "email": "officer.revenue@govai.local", "password": "Officer@123",
     "role": UserRole.OFFICER, "full_name": "Revenue Officer", "department": "Revenue", "designation": "Department Officer"},
    {"username": "officer.municipal", "email": "officer.municipal@govai.local", "password": "Officer@123",
     "role": UserRole.OFFICER, "full_name": "Municipal Officer", "department": "Municipal Administration", "designation": "Department Officer"},
    {"username": "officer.grievance", "email": "officer.grievance@govai.local", "password": "Officer@123",
     "role": UserRole.OFFICER, "full_name": "Grievance Officer", "department": "Public Grievance Cell", "designation": "Department Officer"},
]


def run():
    db = SessionLocal()
    try:
        for entry in DEMO_OFFICERS:
            existing = db.query(User).filter(User.username == entry["username"]).first()
            if existing:
                continue
            user = User(
                username=entry["username"],
                email=entry["email"],
                hashed_password=hash_password(entry["password"]),
                role=entry["role"],
            )
            db.add(user)
            db.flush()
            db.add(Officer(
                user_id=user.id,
                full_name=entry["full_name"],
                department=entry["department"],
                designation=entry["designation"],
            ))
            print(f"Seeded {entry['role'].value}: {entry['username']}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
