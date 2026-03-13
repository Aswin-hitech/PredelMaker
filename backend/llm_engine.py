import os
from groq import Groq
from backend.config import Config
from backend.vector_store import get_similar_context


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def generate_explanation(probability, features):

    context = get_similar_context(
        features["traffic_level"],
        features["weather_condition"]
    )

    context_text = ""

    if context:
        context_text = "\n".join(
            [c.get("reason", "") for c in context]
        )

    prompt = f"""
You are an AI logistics assistant.

Delivery delay probability: {probability}

Traffic level: {features['traffic_level']}
Weather condition: {features['weather_condition']}
Stop duration: {features['stop_duration']} minutes

Previous similar delay contexts:
{context_text}

Explain briefly why the delivery may be delayed.
Keep the explanation under 25 words.
"""

    response = client.chat.completions.create(

        model=os.getenv("GROQ_MODEL"),

        messages=[
            {"role": "user", "content": prompt}
        ],

        temperature=0.4,
        max_tokens=60
    )

    return response.choices[0].message.content


def driver_suggestion(features):

    prompt = f"""
You are an AI assistant helping delivery drivers.

Traffic level: {features['traffic_level']}
Weather condition: {features['weather_condition']}

Provide 2 short suggestions to avoid delivery delay.

Keep it concise.
"""

    response = client.chat.completions.create(

        model=os.getenv("GROQ_MODEL"),

        messages=[
            {"role": "user", "content": prompt}
        ],

        temperature=0.3,
        max_tokens=80
    )

    return response.choices[0].message.content