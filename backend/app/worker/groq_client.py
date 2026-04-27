from groq import Groq

from app.core.config import get_settings

GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_TIMEOUT = 30


def is_groq_configured() -> bool:
    return bool(get_settings().GROQ_API_KEY)


def call_groq(prompt: str) -> str:
    settings = get_settings()
    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=GROQ_MODEL,
        max_tokens=900,
        temperature=0.2,
        timeout=GROQ_TIMEOUT,
    )
    return response.choices[0].message.content or ""
