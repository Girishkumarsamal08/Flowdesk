import requests
import time

BASE_URL = "http://127.0.0.1:8000/api/tickets"

def test_flowdesk():
    print("🚀 Starting Flowdesk API Test...")
    

    print("\n1. Creating a new ticket about a return...")
    payload = {
        "title": "Need a return",
        "customer_email": "test@example.com",
        "customer_name": "Test User",
        "initial_message": "Hi, I received my order but the item is completely wrong. What should I do?"
    }
    response = requests.post(BASE_URL + "/", json=payload)
    if response.status_code != 200:
        print("Failed to create ticket:", response.text)
        return
        
    ticket = response.json()
    ticket_id = ticket["id"]
    print(f"✅ Ticket created! ID: {ticket_id}")
    

    print("Waiting for AI response...")
    time.sleep(5)
    

    print("\n2. Checking conversation history...")
    response = requests.get(f"{BASE_URL}/{ticket_id}")
    ticket = response.json()
    
    for msg in ticket["messages"]:
        print(f"[{msg['sender_type']}] {msg['content']}")
        

    print("\n3. Simulating negative sentiment to trigger escalation...")
    message_payload = {
        "sender_type": "customer",
        "content": "This is terrible! I hate this service! I want a refund right now!"
    }
    response = requests.post(f"{BASE_URL}/{ticket_id}/messages", json=message_payload)
    

    print("Waiting for AI/Escalation processing...")
    time.sleep(5)
    

    response = requests.get(f"{BASE_URL}/{ticket_id}")
    ticket = response.json()
    print(f"\nFinal Ticket Status: {ticket['status']}")
    print(f"Final Priority: {ticket['priority']}")
    print("Final Conversation History:")
    for msg in ticket["messages"]:
        print(f"[{msg['sender_type']}] (Sentiment: {msg.get('sentiment')}) - {msg['content']}")

if __name__ == "__main__":
    test_flowdesk()
