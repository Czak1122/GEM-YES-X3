import requests
import unittest
import sys
import os
import json
import uuid
from datetime import datetime

class NokiaGamesAPITest(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(NokiaGamesAPITest, self).__init__(*args, **kwargs)
        # Get backend URL from frontend .env file
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.strip().split('=')[1].strip('"\'')
                    break
        
        print(f"Using backend URL: {self.base_url}")
        
        # Test user data
        self.test_user_id = "demo-user"
        self.admin_user_id = "admin-user"
        self.test_score = 150
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "testpassword"
        self.test_username = f"TestUser_{uuid.uuid4().hex[:8]}"
        
        # Game IDs
        self.snake_game_id = "snake-game"
        self.tetris_game_id = "tetris-game"
        self.pong_game_id = "pong-game"
        
        # Store registered user data
        self.registered_user = None

    def test_01_health_endpoint(self):
        """Test the health endpoint"""
        print("\n🔍 Testing health endpoint...")
        response = requests.get(f"{self.base_url}/api/health")
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        data = response.json()
        self.assertEqual(data["status"], "healthy", "Health status should be 'healthy'")
        self.assertEqual(data["service"], "Nokia Games Platform API", "Service name mismatch")
        print("✅ Health endpoint test passed")

    def test_02_games_list(self):
        """Test the games list endpoint"""
        print("\n🔍 Testing games list endpoint...")
        response = requests.get(f"{self.base_url}/api/games")
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        data = response.json()
        self.assertIn("games", data, "Response should contain 'games' key")
        
        # Check if all three games are in the list
        games = {game["id"]: game for game in data["games"]}
        
        self.assertIn(self.snake_game_id, games, "Snake game should be in the games list")
        self.assertEqual(games[self.snake_game_id]["name"], "Snake", "Game name should be 'Snake'")
        
        self.assertIn(self.tetris_game_id, games, "Tetris game should be in the games list")
        self.assertEqual(games[self.tetris_game_id]["name"], "Tetris", "Game name should be 'Tetris'")
        
        self.assertIn(self.pong_game_id, games, "Pong game should be in the games list")
        self.assertEqual(games[self.pong_game_id]["name"], "Pong", "Game name should be 'Pong'")
        
        print("✅ Games list endpoint test passed")

    def test_03_specific_game(self):
        """Test getting specific game details"""
        for game_id, game_name in [
            (self.snake_game_id, "Snake"),
            (self.tetris_game_id, "Tetris"),
            (self.pong_game_id, "Pong")
        ]:
            print(f"\n🔍 Testing specific game endpoint for {game_name}...")
            response = requests.get(f"{self.base_url}/api/games/{game_id}")
            
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            game = response.json()
            self.assertEqual(game["id"], game_id, f"Game ID should be '{game_id}'")
            self.assertEqual(game["name"], game_name, f"Game name should be '{game_name}'")
            print(f"✅ Specific game endpoint test for {game_name} passed")

    def test_04_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing user registration...")
        
        # Register a new user
        registration_data = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = requests.post(
            f"{self.base_url}/api/users/register",
            json=registration_data
        )
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        data = response.json()
        self.assertIn("user", data, "Response should contain 'user' key")
        self.assertIn("message", data, "Response should contain 'message' key")
        self.assertEqual(data["message"], "User registered successfully", "Registration message mismatch")
        
        # Store the registered user for later tests
        self.registered_user = data["user"]
        self.assertIn("id", self.registered_user, "User should have an ID")
        self.assertEqual(self.registered_user["username"], self.test_username, "Username mismatch")
        self.assertEqual(self.registered_user["email"], self.test_email, "Email mismatch")
        self.assertNotIn("password_hash", self.registered_user, "Password hash should not be returned")
        
        print("✅ User registration test passed")

    def test_05_user_login(self):
        """Test user login"""
        print("\n🔍 Testing user login...")
        
        # Test login with demo credentials
        login_data = {
            "email": "demo@nokia.com",
            "password": "demo"
        }
        
        response = requests.post(
            f"{self.base_url}/api/users/login",
            json=login_data
        )
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        data = response.json()
        self.assertIn("user", data, "Response should contain 'user' key")
        self.assertIn("message", data, "Response should contain 'message' key")
        self.assertEqual(data["message"], "Login successful", "Login message mismatch")
        self.assertEqual(data["user"]["id"], "demo-user", "User ID mismatch")
        self.assertEqual(data["user"]["email"], "demo@nokia.com", "User email mismatch")
        
        # Test login with admin credentials
        admin_login_data = {
            "email": "admin@nokia.com",
            "password": "admin123"
        }
        
        admin_response = requests.post(
            f"{self.base_url}/api/users/login",
            json=admin_login_data
        )
        
        self.assertEqual(admin_response.status_code, 200, f"Expected status code 200, got {admin_response.status_code}")
        admin_data = admin_response.json()
        self.assertEqual(admin_data["user"]["id"], "admin-user", "Admin ID mismatch")
        self.assertEqual(admin_data["user"]["email"], "admin@nokia.com", "Admin email mismatch")
        self.assertTrue(admin_data["user"]["is_admin"], "User should be an admin")
        
        # Test login with registered user
        if self.registered_user:
            registered_login_data = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            registered_response = requests.post(
                f"{self.base_url}/api/users/login",
                json=registered_login_data
            )
            
            self.assertEqual(registered_response.status_code, 200, f"Expected status code 200, got {registered_response.status_code}")
            registered_data = registered_response.json()
            self.assertEqual(registered_data["user"]["id"], self.registered_user["id"], "Registered user ID mismatch")
            self.assertEqual(registered_data["user"]["email"], self.test_email, "Registered user email mismatch")
        
        # Test login with invalid credentials
        invalid_login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        invalid_response = requests.post(
            f"{self.base_url}/api/users/login",
            json=invalid_login_data
        )
        
        self.assertEqual(invalid_response.status_code, 401, f"Expected status code 401, got {invalid_response.status_code}")
        
        print("✅ User login test passed")

    def test_06_user_profile(self):
        """Test getting user profile"""
        print("\n🔍 Testing user profile endpoint...")
        
        # Get demo user profile
        response = requests.get(f"{self.base_url}/api/users/{self.test_user_id}/profile")
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        user = response.json()
        self.assertEqual(user["id"], self.test_user_id, "User ID mismatch")
        self.assertEqual(user["username"], "Demo Player", "Username mismatch")
        self.assertEqual(user["email"], "demo@nokia.com", "Email mismatch")
        self.assertNotIn("password_hash", user, "Password hash should not be returned")
        
        # Get admin user profile
        admin_response = requests.get(f"{self.base_url}/api/users/{self.admin_user_id}/profile")
        
        self.assertEqual(admin_response.status_code, 200, f"Expected status code 200, got {admin_response.status_code}")
        admin = admin_response.json()
        self.assertEqual(admin["id"], self.admin_user_id, "Admin ID mismatch")
        self.assertTrue(admin["is_admin"], "User should be an admin")
        
        # Get registered user profile
        if self.registered_user:
            registered_response = requests.get(f"{self.base_url}/api/users/{self.registered_user['id']}/profile")
            
            self.assertEqual(registered_response.status_code, 200, f"Expected status code 200, got {registered_response.status_code}")
            registered = registered_response.json()
            self.assertEqual(registered["id"], self.registered_user["id"], "Registered user ID mismatch")
            self.assertEqual(registered["username"], self.test_username, "Registered username mismatch")
        
        # Test with non-existent user ID
        nonexistent_response = requests.get(f"{self.base_url}/api/users/nonexistent-user/profile")
        
        self.assertEqual(nonexistent_response.status_code, 404, f"Expected status code 404, got {nonexistent_response.status_code}")
        
        print("✅ User profile endpoint test passed")

    def test_07_update_score(self):
        """Test updating scores for all games"""
        for game_id, game_name in [
            (self.snake_game_id, "Snake"),
            (self.tetris_game_id, "Tetris"),
            (self.pong_game_id, "Pong")
        ]:
            print(f"\n🔍 Testing score update endpoint for {game_name}...")
            
            # Update score for demo user
            score = self.test_score + (10 if game_id == self.snake_game_id else 20 if game_id == self.tetris_game_id else 30)
            
            response = requests.post(
                f"{self.base_url}/api/scores/update?game_id={game_id}&score={score}&user_id={self.test_user_id}"
            )
            
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            data = response.json()
            self.assertIn("message", data, "Response should contain 'message' key")
            self.assertIn("score", data, "Response should contain 'score' key")
            self.assertEqual(data["score"], score, f"Score should be {score}")
            
            # Update score for registered user if available
            if self.registered_user:
                registered_score = score - 50
                
                registered_response = requests.post(
                    f"{self.base_url}/api/scores/update?game_id={game_id}&score={registered_score}&user_id={self.registered_user['id']}"
                )
                
                self.assertEqual(registered_response.status_code, 200, f"Expected status code 200, got {registered_response.status_code}")
            
            print(f"✅ Score update endpoint test for {game_name} passed")

    def test_08_leaderboard(self):
        """Test getting leaderboards for all games"""
        for game_id, game_name in [
            (self.snake_game_id, "Snake"),
            (self.tetris_game_id, "Tetris"),
            (self.pong_game_id, "Pong")
        ]:
            print(f"\n🔍 Testing leaderboard endpoint for {game_name}...")
            
            response = requests.get(f"{self.base_url}/api/scores/leaderboard/{game_id}")
            
            self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
            data = response.json()
            self.assertIn("leaderboard", data, "Response should contain 'leaderboard' key")
            
            # Check if our test user is in the leaderboard
            test_user_in_leaderboard = False
            for entry in data["leaderboard"]:
                if entry.get("username") == "Demo Player":
                    test_user_in_leaderboard = True
                    break
            
            self.assertTrue(test_user_in_leaderboard, "Test user should be in the leaderboard")
            
            print(f"✅ Leaderboard endpoint test for {game_name} passed")

    def test_09_game_state_save_and_load(self):
        """Test saving and loading game state for all games"""
        for game_id, game_name in [
            (self.snake_game_id, "Snake"),
            (self.tetris_game_id, "Tetris"),
            (self.pong_game_id, "Pong")
        ]:
            print(f"\n🔍 Testing game state save/load endpoints for {game_name}...")
            
            # Test data
            if game_id == self.snake_game_id:
                game_data = {
                    "snake": [{"x": 10, "y": 10}],
                    "food": {"x": 5, "y": 5},
                    "direction": {"x": 0, "y": -1}
                }
            elif game_id == self.tetris_game_id:
                game_data = {
                    "board": [[0, 0, 0], [1, 1, 0], [1, 1, 0]],
                    "currentPiece": {"type": "T", "rotation": 0, "x": 5, "y": 2}
                }
            else:  # Pong
                game_data = {
                    "playerY": 150,
                    "aiY": 120,
                    "ballX": 200,
                    "ballY": 150,
                    "ballSpeedX": 5,
                    "ballSpeedY": 3
                }
            
            score = self.test_score + (10 if game_id == self.snake_game_id else 20 if game_id == self.tetris_game_id else 30)
            slot_number = 1 if game_id == self.snake_game_id else 2 if game_id == self.tetris_game_id else 3
            
            save_data = {
                "game_id": game_id,
                "slot_number": slot_number,
                "game_data": game_data,
                "score": score,
                "name": f"Test {game_name} Save"
            }
            
            # Save game state
            save_response = requests.post(
                f"{self.base_url}/api/game-states/save?user_id={self.test_user_id}",
                json=save_data
            )
            
            self.assertEqual(save_response.status_code, 200, 
                            f"Expected status code 200 for save, got {save_response.status_code}")
            save_result = save_response.json()
            self.assertIn("message", save_result, "Save response should contain 'message' key")
            self.assertIn("save_data", save_result, "Save response should contain 'save_data' key")
            
            # Load game state
            load_response = requests.get(
                f"{self.base_url}/api/game-states/{self.test_user_id}/{game_id}/{slot_number}"
            )
            
            self.assertEqual(load_response.status_code, 200, 
                            f"Expected status code 200 for load, got {load_response.status_code}")
            load_result = load_response.json()
            self.assertEqual(load_result["game_id"], game_id, "Loaded game ID should match")
            self.assertEqual(load_result["slot_number"], slot_number, "Loaded slot number should match")
            self.assertEqual(load_result["score"], score, "Loaded score should match")
            
            # Get all saved states for user and game
            states_response = requests.get(
                f"{self.base_url}/api/game-states/{self.test_user_id}/{game_id}"
            )
            
            self.assertEqual(states_response.status_code, 200, 
                            f"Expected status code 200 for states, got {states_response.status_code}")
            states_result = states_response.json()
            self.assertIn("saves", states_result, "States response should contain 'saves' key")
            self.assertTrue(len(states_result["saves"]) > 0, "Should have at least one save")
            
            # Test deleting a save
            delete_response = requests.delete(
                f"{self.base_url}/api/game-states/{self.test_user_id}/{game_id}/{slot_number}"
            )
            
            self.assertEqual(delete_response.status_code, 200, 
                            f"Expected status code 200 for delete, got {delete_response.status_code}")
            
            # Verify it's deleted
            load_after_delete = requests.get(
                f"{self.base_url}/api/game-states/{self.test_user_id}/{game_id}/{slot_number}"
            )
            
            self.assertEqual(load_after_delete.status_code, 404, 
                            f"Expected status code 404 after delete, got {load_after_delete.status_code}")
            
            print(f"✅ Game state save/load endpoints test for {game_name} passed")

    def test_10_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n🔍 Testing admin endpoints...")
        
        # Test getting all users (admin only)
        users_response = requests.get(f"{self.base_url}/api/admin/users")
        
        self.assertEqual(users_response.status_code, 200, f"Expected status code 200, got {users_response.status_code}")
        users_data = users_response.json()
        self.assertIn("users", users_data, "Response should contain 'users' key")
        self.assertTrue(len(users_data["users"]) >= 2, "Should have at least 2 users (admin and demo)")
        
        # Verify no password hashes are returned
        for user in users_data["users"]:
            self.assertNotIn("password_hash", user, "Password hash should not be returned")
        
        # Test getting platform stats (admin only)
        stats_response = requests.get(f"{self.base_url}/api/admin/stats")
        
        self.assertEqual(stats_response.status_code, 200, f"Expected status code 200, got {stats_response.status_code}")
        stats_data = stats_response.json()
        self.assertIn("total_users", stats_data, "Response should contain 'total_users' key")
        self.assertIn("total_games", stats_data, "Response should contain 'total_games' key")
        self.assertIn("total_saves", stats_data, "Response should contain 'total_saves' key")
        self.assertIn("platform_name", stats_data, "Response should contain 'platform_name' key")
        self.assertEqual(stats_data["platform_name"], "Nokia Games Platform", "Platform name mismatch")
        
        print("✅ Admin endpoints test passed")

def run_tests():
    """Run all tests and return results"""
    test_suite = unittest.TestSuite()
    test_suite.addTest(NokiaGamesAPITest('test_01_health_endpoint'))
    test_suite.addTest(NokiaGamesAPITest('test_02_games_list'))
    test_suite.addTest(NokiaGamesAPITest('test_03_specific_game'))
    test_suite.addTest(NokiaGamesAPITest('test_04_user_registration'))
    test_suite.addTest(NokiaGamesAPITest('test_05_user_login'))
    test_suite.addTest(NokiaGamesAPITest('test_06_user_profile'))
    test_suite.addTest(NokiaGamesAPITest('test_07_update_score'))
    test_suite.addTest(NokiaGamesAPITest('test_08_leaderboard'))
    test_suite.addTest(NokiaGamesAPITest('test_09_game_state_save_and_load'))
    test_suite.addTest(NokiaGamesAPITest('test_10_admin_endpoints'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    print("📱 Nokia Games Platform API Test Suite 📱")
    print("========================================")
    success = run_tests()
    sys.exit(0 if success else 1)
