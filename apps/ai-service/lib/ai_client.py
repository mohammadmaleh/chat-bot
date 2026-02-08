from openai import OpenAI
from lib.config import settings
from typing import List, Dict, Generator
import json

client = OpenAI(
    api_key=settings.groq_api_key,
    base_url="https://api.groq.com/openai/v1"
)

SYSTEM_PROMPT = """You are a helpful AI shopping assistant for a German price comparison platform.

Your role:
- Help users find the best prices for products across German online stores
- Provide personalized gift recommendations
- Compare products and explain differences
- Be conversational and friendly
- Always mention prices in EUR (€)

When users ask about products:
1. Search the database for relevant products
2. Compare prices across stores
3. Recommend the best deals
4. Consider user's budget and preferences

For gift recommendations:
- Ask clarifying questions (budget, interests, occasion)
- Suggest thoughtful options
- Explain why each suggestion works

Be concise but helpful. Use emojis occasionally to be friendly. 🛍️"""

def chat_with_context(
    user_message: str,
    conversation_history: List[Dict[str, str]] = None,
    product_context: str = None
) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if conversation_history:
        messages.extend(conversation_history[-10:])
    
    if product_context:
        messages.append({
            "role": "system",
            "content": f"Product information from database:\n{product_context}"
        })
    
    messages.append({"role": "user", "content": user_message})
    
    try:
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return "I'm sorry, I'm having trouble processing your request right now. Please try again."

def chat_with_streaming(
    user_message: str,
    conversation_history: List[Dict[str, str]] = None,
    product_context: str = None
) -> Generator[str, None, None]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if conversation_history:
        messages.extend(conversation_history[-10:])
    
    if product_context:
        messages.append({
            "role": "system",
            "content": f"Product information:\n{product_context}"
        })
    
    messages.append({"role": "user", "content": user_message})
    
    try:
        stream = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        print(f"Error streaming from Groq: {e}")
        yield "I'm sorry, I encountered an error. Please try again."

def extract_search_intent(user_message: str) -> dict:
    prompt = f"""Analyze this user message and extract shopping intent:
"{user_message}"

Return ONLY a JSON object with:
- search_query: main product keywords
- category: product category (Electronics, Home & Kitchen, etc)
- budget_max: max budget if mentioned (number only)
- intent: one of [search, gift, compare, general]

Example: {{"search_query": "headphones", "category": "Electronics", "budget_max": 100, "intent": "search"}}"""
    
    try:
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=150,
        )
        
        content = response.choices[0].message.content.strip()
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(content[start:end])
        return {"intent": "general"}
    except Exception as e:
        print(f"Error extracting intent: {e}")
        return {"intent": "general"}
