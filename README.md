# Flowdesk - AI-Powered Customer Support Platform

Flowdesk is an autonomous, agentic customer support platform built to handle customer queries using Artificial Intelligence, significantly reducing the workload on human agents.

## How It Works

1. **Customer Submits a Ticket**: A customer goes to the `Contact Us` page and submits an issue (e.g., "What is your refund policy?").
2. **AI Processing (RAG Engine)**: Behind the scenes, the FastAPI backend sends this ticket to our AI engine.
3. **Knowledge Retrieval**: The AI uses **Retrieval-Augmented Generation (RAG)** to read the company's internal policy documents (`.txt` files located in the `data/` folder).
4. **Intelligent Response**: The AI (powered by LangChain & Llama 3 via Groq) formulates a factual answer based *only* on the company policies and automatically replies to the customer.
5. **Sentiment Analysis & Escalation**: The AI constantly monitors the conversation. If the customer's sentiment turns **negative**, or if the bot has tried to help multiple times without success, the system automatically **Escalates** the ticket to a human agent.
6. **Agent Dashboard**: Human support agents log into the Flowdesk dashboard to view all tickets, monitor bot conversations, and take over escalated tickets.

## Tech Stack
*   **Backend**: Python, FastAPI
*   **Database**: SQLite via SQLAlchemy ORM
*   **AI / LLM**: LangChain, Groq API (Llama 3), ChromaDB (Vector Database)
*   **Frontend**: HTML, Vanilla CSS, JavaScript (Jinja2 Templates)

---

## How to Set Up and Run the Project

1. **Install Dependencies**:
   Ensure you have Python installed. Open your terminal in the `Flowdesk` folder and run:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and add your `GROQ_API_KEY`. You can get a free API key from [console.groq.com](https://console.groq.com).

3. **Start the Application**:
   Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

---

## How to Demonstrate This Project in an Interview

When showcasing this to an HR or Technical Interviewer, follow this script and visual flow:

### Step 1: The Pitch
*   **You say:** *"Let me show you Flowdesk. I built this because customer support teams waste hours answering the exact same questions. Flowdesk uses AI to read company policies and automatically resolve 80% of routine tickets, only escalating complex or angry customers to human agents."*

### Step 2: The Customer Experience
1. Open your browser and navigate to exactly: `http://localhost:8000/contact` (This is the customer view).
2. Fill out the form with a straightforward question.
   *   **Name:** John
   *   **Email:** john@example.com
   *   **Subject:** Return request
   *   **Message:** "Hi, I bought a shirt 15 days ago and I want to return it. What is your refund policy?"
3. Click **Submit Ticket**. The page will route you to the specific ticket view.
4. **You tell the interviewer:** *"As soon as the customer hits submit, the AI processes the message, searches our company's `return_policy.txt` using RAG, and instantly generates a factual reply."* Refresh the page to show the AI's polite and accurate response.

### Step 3: The Human Agent Dashboard
1. Now, navigate to: `http://localhost:8000/dashboard`
2. **You tell the interviewer:** *"This is the internal dashboard for the support team. Notice how all the tickets are categorized by Open, Escalated, and Closed statuses."*
3. Show them that they can click into the ticket and read the entire chat history between the Bot and the Customer.

### Step 4: The Intelligent Escalation Demo (The "Wow" Factor!)
1. Go back to the ticket view where you were chatting as the customer.
2. Send an angry message, such as: *"You guys are terrible! Your AI isn't helping me, I want to talk to a human right now, this is so frustrating!"*
3. Submit the message.
4. Go back to the `http://localhost:8000/dashboard`.
5. **You tell the interviewer:** *"The AI runs real-time sentiment analysis on every message. Because I just sent an angry message, the system detected a Negative sentiment and immediately flagged this ticket as 'ESCALATED'. Now, a human agent knows exactly which ticket they need to prioritize."*

This flow proves you understand **User Experience, Backend Engineering, and Applied Artificial Intelligence**!
