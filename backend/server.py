from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uvicorn
from datetime import datetime
import uuid
import json

# Initialize FastAPI app
app = FastAPI(title="Nokia Games Platform API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.nokia_games

# Pydantic models
class User(BaseModel):
    id: str
    username: str
    email: str
    password_hash: str
    is_admin: bool = False
    created_at: datetime
    high_scores: dict = {}

class GameState(BaseModel):
    id: str
    user_id: str
    game_id: str
    slot_number: int  # 1-10 for save slots
    game_data: dict  # Serialized game state
    score: int
    saved_at: datetime
    name: Optional[str] = None  # User-given name for the save

class Game(BaseModel):
    id: str
    name: str
    description: str
    is_active: bool = True
    created_at: datetime

class UserRegistration(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class SaveGameRequest(BaseModel):
    game_id: str
    slot_number: int
    game_data: dict
    score: int
    name: Optional[str] = None

# Database collections
users_collection = db.users
games_collection = db.games
game_states_collection = db.game_states

@app.on_event("startup")
async def startup_event():
    """Initialize the database with default data"""
    # Create default games
    default_games = [
        {
            "id": "snake-game",
            "name": "Snake",
            "description": "Classic Nokia Snake game",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": "tetris-game",
            "name": "Tetris",
            "description": "Stack falling blocks to clear lines",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "id": "pong-game",
            "name": "Pong",
            "description": "Classic paddle ball game",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    for game in default_games:
        existing_game = await games_collection.find_one({"id": game["id"]})
        if not existing_game:
            await games_collection.insert_one(game)
            print(f"✅ {game['name']} game initialized in database")
    
    # Create default users
    default_users = [
        {
            "id": "admin-user",
            "username": "admin",
            "email": "admin@nokia.com",
            "password_hash": "admin123",  # In production, use proper hashing
            "is_admin": True,
            "created_at": datetime.utcnow(),
            "high_scores": {}
        },
        {
            "id": "demo-user",
            "username": "Demo Player",
            "email": "demo@nokia.com",
            "password_hash": "demo",
            "is_admin": False,
            "created_at": datetime.utcnow(),
            "high_scores": {}
        }
    ]
    
    for user in default_users:
        existing_user = await users_collection.find_one({"email": user["email"]})
        if not existing_user:
            await users_collection.insert_one(user)
            print(f"✅ {user['username']} user created: {user['email']} / {user['password_hash']}")

# ==================== HEALTH CHECK ====================
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Nokia Games Platform API"}

# ==================== GAME ENDPOINTS ====================
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        if "_id" in doc:
            doc.pop("_id")  # Remove MongoDB ObjectId
        return {key: serialize_doc(value) for key, value in doc.items()}
    return doc

@app.get("/api/games")
async def get_games():
    """Get all active games"""
    games = await games_collection.find({"is_active": True}).to_list(100)
    games = serialize_doc(games)
    return {"games": games}

@app.get("/api/games/{game_id}")
async def get_game(game_id: str):
    """Get specific game details"""
    game = await games_collection.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return serialize_doc(game)

# ==================== USER ENDPOINTS ====================
@app.post("/api/users/register")
async def register_user(user_data: UserRegistration):
    """Register a new user"""
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": user_data.password,  # In production, use proper hashing
        "is_admin": False,
        "created_at": datetime.utcnow(),
        "high_scores": {}
    }
    
    await users_collection.insert_one(new_user)
    
    # Return user without password
    new_user = serialize_doc(new_user)
    new_user.pop("password_hash", None)
    return {"user": new_user, "message": "User registered successfully"}

@app.post("/api/users/login")
async def login_user(login_data: UserLogin):
    """Login user"""
    user = await users_collection.find_one({"email": login_data.email})
    if not user or user["password_hash"] != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Return user without password
    user = serialize_doc(user)
    user.pop("password_hash", None)
    return {"user": user, "message": "Login successful"}

@app.get("/api/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user profile"""
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove password from response
    user = serialize_doc(user)
    user.pop("password_hash", None)
    return user

# ==================== GAME STATE ENDPOINTS ====================
@app.post("/api/game-states/save")
async def save_game_state(save_request: SaveGameRequest, user_id: str = "demo-user"):
    """Save game state to a specific slot"""
    # Validate slot number
    if not 1 <= save_request.slot_number <= 10:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 10")
    
    # Check if slot already has a save
    existing_save = await game_states_collection.find_one({
        "user_id": user_id,
        "game_id": save_request.game_id,
        "slot_number": save_request.slot_number
    })
    
    save_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "game_id": save_request.game_id,
        "slot_number": save_request.slot_number,
        "game_data": save_request.game_data,
        "score": save_request.score,
        "saved_at": datetime.utcnow(),
        "name": save_request.name or f"Save Slot {save_request.slot_number}"
    }
    
    if existing_save:
        # Update existing save
        await game_states_collection.replace_one(
            {"_id": existing_save["_id"]}, 
            save_data
        )
        message = f"Game saved to slot {save_request.slot_number} (overwritten)"
    else:
        # Create new save
        await game_states_collection.insert_one(save_data)
        message = f"Game saved to slot {save_request.slot_number}"
    
    return {"message": message, "save_data": serialize_doc(save_data)}

@app.get("/api/game-states/{user_id}/{game_id}")
async def get_user_game_states(user_id: str, game_id: str):
    """Get all saved states for a user and game"""
    saves = await game_states_collection.find({
        "user_id": user_id,
        "game_id": game_id
    }).sort("slot_number", 1).to_list(10)
    
    return {"saves": serialize_doc(saves)}

@app.get("/api/game-states/{user_id}/{game_id}/{slot_number}")
async def load_game_state(user_id: str, game_id: str, slot_number: int):
    """Load specific game state"""
    if not 1 <= slot_number <= 10:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 10")
    
    save = await game_states_collection.find_one({
        "user_id": user_id,
        "game_id": game_id,
        "slot_number": slot_number
    })
    
    if not save:
        raise HTTPException(status_code=404, detail="Save not found")
    
    return serialize_doc(save)

@app.delete("/api/game-states/{user_id}/{game_id}/{slot_number}")
async def delete_game_state(user_id: str, game_id: str, slot_number: int):
    """Delete specific game state"""
    if not 1 <= slot_number <= 10:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 10")
    
    result = await game_states_collection.delete_one({
        "user_id": user_id,
        "game_id": game_id,
        "slot_number": slot_number
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Save not found")
    
    return {"message": f"Save slot {slot_number} deleted"}

# ==================== SCORE ENDPOINTS ====================
@app.post("/api/scores/update")
async def update_high_score(game_id: str, score: int, user_id: str = "demo-user"):
    """Update user's high score for a game"""
    user = await users_collection.find_one({"id": user_id})
    if not user:
        # Create demo user if doesn't exist
        demo_user = {
            "id": user_id,
            "username": "Demo Player",
            "email": "demo@nokia.com",
            "password_hash": "demo",
            "is_admin": False,
            "created_at": datetime.utcnow(),
            "high_scores": {}
        }
        await users_collection.insert_one(demo_user)
        user = demo_user
    
    # Update high score if new score is higher
    current_high = user.get("high_scores", {}).get(game_id, 0)
    if score > current_high:
        await users_collection.update_one(
            {"id": user_id},
            {"$set": {f"high_scores.{game_id}": score}}
        )
        return {"message": "New high score!", "score": score, "previous_high": current_high}
    
    return {"message": "Score recorded", "score": score, "high_score": current_high}

@app.get("/api/scores/leaderboard/{game_id}")
async def get_leaderboard(game_id: str, limit: int = 10):
    """Get leaderboard for a specific game"""
    # Aggregate users with high scores for the game
    pipeline = [
        {"$match": {f"high_scores.{game_id}": {"$exists": True}}},
        {"$project": {
            "username": 1,
            "score": f"$high_scores.{game_id}"
        }},
        {"$sort": {"score": -1}},
        {"$limit": limit}
    ]
    
    leaderboard = await users_collection.aggregate(pipeline).to_list(limit)
    return {"leaderboard": serialize_doc(leaderboard)}

# ==================== ADMIN ENDPOINTS ====================
@app.get("/api/admin/users")
async def get_all_users():
    """Get all users (admin only)"""
    users = await users_collection.find({}).to_list(100)
    # Remove passwords from response
    users = serialize_doc(users)
    for user in users:
        user.pop("password_hash", None)
    return {"users": users}

@app.get("/api/admin/stats")
async def get_platform_stats():
    """Get platform statistics (admin only)"""
    total_users = await users_collection.count_documents({})
    total_games = await games_collection.count_documents({"is_active": True})
    total_saves = await game_states_collection.count_documents({})
    
    return {
        "total_users": total_users,
        "total_games": total_games,
        "total_saves": total_saves,
        "platform_name": "Nokia Games Platform"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)