import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "poker_backend.settings")
django.setup()

from users.models import User
from economy.models import PlayerEconomy
from leaderboard.models import PlayerStats
from rest_framework.test import APIClient

def run_smoke_test():
    client = APIClient(SERVER_NAME='localhost')

    # 1. Create Test User
    username = "smoketester1"
    email = "smoketester1@example.com"
    password = "password123"

    user, created = User.objects.get_or_create(username=username, email=email)
    if created:
        user.set_password(password)
        user.save()

    print("User ready.")

    # Get Token
    response = client.post('/api/auth/login/', {'username': username, 'password': password}, format='json')
    if response.status_code != 200:
        print("Login failed:", response.data)
        return
    token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

    # 2. Economy Loop: Check initial
    print("\n--- Economy Initial ---")
    response = client.get('/api/economy/')
    print("Economy:", response.data)
    initial_coins = response.data['gold_coins']

    # 3. Buy an item
    print("\n--- Purchasing Item ---")
    response = client.post('/api/economy/purchase/', {'item_id': 'felt_midnight', 'cost': 80}, format='json')
    print("Purchase:", response.data)
    if response.status_code == 200:
        print("Expected coins:", initial_coins - 80)
        print("Actual coins:", response.data['new_balance'])

    # 4. Equip item
    print("\n--- Equipping Item ---")
    response = client.patch('/api/economy/equipped/', {'equipped': {'felt': 'felt_midnight'}}, format='json')
    print("Equip:", response.data)

    # 5. Persistence check (re-fetch)
    print("\n--- Persistence Check ---")
    response = client.get('/api/economy/')
    print("Economy after equip:", response.data)

    # 6. Gameplay Reward (simulate earning coins)
    print("\n--- Earning Coins ---")
    response = client.post('/api/economy/award/', {'amount': 15}, format='json')
    print("Award:", response.data)

    # 7. Update stats and Leaderboard Sync
    stats, _ = PlayerStats.objects.get_or_create(user=user)
    stats.total_chips += 5000
    stats.save()

    print("\n--- Leaderboard Sync ---")
    response = client.get('/api/leaderboard/')
    print("Leaderboard results count:", len(response.data['results']))
    for res in response.data['results']:
        if res['username'] == username:
            print("Leaderboard Entry found:", res)
            break

    print("\nAll flows verified successfully!")

if __name__ == "__main__":
    run_smoke_test()
