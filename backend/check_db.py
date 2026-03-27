from db.database import SessionLocal
from db.models import User

db = SessionLocal()
users = db.query(User).all()
print(f"Total Users: {len(users)}")
for u in users:
    print(f"ID: {u.id} | User: '{u.username}' | Email: '{u.email}' | HashLen: {len(u.hashed_password)} | Hash: {u.hashed_password[:15]}...")
