try:
    from groq import Groq
except ModuleNotFoundError:
    Groq = None

from app.core.config import get_settings

GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_TIMEOUT = 30


def is_groq_configured() -> bool:
    return bool(get_settings().GROQ_API_KEY and Groq is not None)


def call_groq(prompt: str, max_tokens: int = 900, timeout: int = GROQ_TIMEOUT) -> str:
    if Groq is None:
        raise RuntimeError("Groq SDK is not installed")

    settings = get_settings()
    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=GROQ_MODEL,
        max_tokens=max_tokens,
        temperature=0.2,
        timeout=timeout,
    )
    return response.choices[0].message.content or ""
