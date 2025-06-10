import requests
import unittest
import sys
import os
import json
from datetime import datetime

class NokiaSnakeGameAPITest(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(NokiaSnakeGameAPITest, self).__init__(*args, **kwargs)
        # Get backend URL from frontend .env file
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.strip().split('=')[1].strip('"\'')
                    break
        
        print(f"Using backend URL: {self.base_url}")
        
        # Test user data
        self.test_user_id = "demo-user"
        self.game_id = "snake-game"
        self.test_score = 150

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
        
        # Check if snake game is in the list
        snake_game = None
        for game in data["games"]:
            if game["id"] == "snake-game":
                snake_game = game
                break
        
        self.assertIsNotNone(snake_game, "Snake game should be in the games list")
        self.assertEqual(snake_game["name"], "Snake", "Game name should be 'Snake'")
        print("✅ Games list endpoint test passed")

    def test_03_specific_game(self):
        """Test getting a specific game"""
        print("\n🔍 Testing specific game endpoint...")
        response = requests.get(f"{self.base_url}/api/games/{self.game_id}")
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        game = response.json()
        self.assertEqual(game["id"], self.game_id, f"Game ID should be '{self.game_id}'")
        self.assertEqual(game["name"], "Snake", "Game name should be 'Snake'")
        print("✅ Specific game endpoint test passed")

    def test_04_update_score(self):
        """Test updating a user's score"""
        print("\n🔍 Testing score update endpoint...")
        response = requests.post(
            f"{self.base_url}/api/scores/update?game_id={self.game_id}&score={self.test_score}&user_id={self.test_user_id}"
        )
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        data = response.json()
        self.assertIn("message", data, "Response should contain 'message' key")
        self.assertIn("score", data, "Response should contain 'score' key")
        self.assertEqual(data["score"], self.test_score, f"Score should be {self.test_score}")
        print("✅ Score update endpoint test passed")

    def test_05_leaderboard(self):
        """Test getting the leaderboard"""
        print("\n🔍 Testing leaderboard endpoint...")
        response = requests.get(f"{self.base_url}/api/scores/leaderboard/{self.game_id}")
        
        self.assertEqual(response.status_code, 200, f"Expected status code 200, got {response.status_code}")
        data = response.json()
        self.assertIn("leaderboard", data, "Response should contain 'leaderboard' key")
        
        # Check if our test user is in the leaderboard
        test_user_in_leaderboard = False
        for entry in data["leaderboard"]:
            if entry.get("username") == "Demo Player":
                test_user_in_leaderboard = True
                self.assertGreaterEqual(entry["score"], self.test_score, 
                                      f"User's score should be at least {self.test_score}")
                break
        
        self.assertTrue(test_user_in_leaderboard, "Test user should be in the leaderboard")
        print("✅ Leaderboard endpoint test passed")

    def test_06_game_state_save_and_load(self):
        """Test saving and loading game state"""
        print("\n🔍 Testing game state save endpoint...")
        
        # Test data
        game_data = {
            "snake": [{"x": 10, "y": 10}],
            "food": {"x": 5, "y": 5},
            "direction": {"x": 0, "y": -1}
        }
        
        save_data = {
            "game_id": self.game_id,
            "slot_number": 1,
            "game_data": game_data,
            "score": self.test_score,
            "name": "Test Save"
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
        print("🔍 Testing game state load endpoint...")
        load_response = requests.get(
            f"{self.base_url}/api/game-states/{self.test_user_id}/{self.game_id}/1"
        )
        
        self.assertEqual(load_response.status_code, 200, 
                        f"Expected status code 200 for load, got {load_response.status_code}")
        load_result = load_response.json()
        self.assertEqual(load_result["game_id"], self.game_id, "Loaded game ID should match")
        self.assertEqual(load_result["slot_number"], 1, "Loaded slot number should match")
        self.assertEqual(load_result["score"], self.test_score, "Loaded score should match")
        
        print("✅ Game state save and load endpoints test passed")

def run_tests():
    """Run all tests and return results"""
    test_suite = unittest.TestSuite()
    test_suite.addTest(NokiaSnakeGameAPITest('test_01_health_endpoint'))
    test_suite.addTest(NokiaSnakeGameAPITest('test_02_games_list'))
    test_suite.addTest(NokiaSnakeGameAPITest('test_03_specific_game'))
    test_suite.addTest(NokiaSnakeGameAPITest('test_04_update_score'))
    test_suite.addTest(NokiaSnakeGameAPITest('test_05_leaderboard'))
    test_suite.addTest(NokiaSnakeGameAPITest('test_06_game_state_save_and_load'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    print("🐍 Nokia Snake Game API Test Suite 🐍")
    print("=====================================")
    success = run_tests()
    sys.exit(0 if success else 1)
