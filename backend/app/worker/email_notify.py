try:
    import resend
except ModuleNotFoundError:
    resend = None

from app.core.config import get_settings


def send_analysis_notification(
    analysis_id: int,
    status: str,
    mode: str,
) -> None:
    settings = get_settings()
    if resend is None or not settings.RESEND_API_KEY or not settings.NOTIFICATION_EMAIL:
        return

    resend.api_key = settings.RESEND_API_KEY
    result_url = f"{settings.FRONTEND_URL.rstrip('/')}/analysis/{analysis_id}"
    is_ok = status == "completed"

    subject = (
        f"✅ Analise #{analysis_id} concluida — {mode}"
        if is_ok
        else f"❌ Analise #{analysis_id} falhou — {mode}"
    )

    html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <p style="font-size:12px;text-transform:uppercase;letter-spacing:.15em;color:#C99A2E;margin:0">
    Copy&amp;Paste · Auditoria documental
  </p>
  <h1 style="font-size:20px;font-weight:600;margin:12px 0 4px">
    {"Analise concluida" if is_ok else "Falha no processamento"}
  </h1>
  <p style="color:#888;font-size:13px;margin:0 0 24px">
    Analise #{analysis_id} · Modo: {mode}
  </p>
  <a href="{result_url}"
     style="display:inline-block;background:#C99A2E;color:#1a1a1a;font-weight:600;
            font-size:13px;padding:10px 20px;text-decoration:none;border-radius:4px">
    Ver resultado
  </a>
  <p style="font-size:11px;color:#555;margin:32px 0 0">
    Esta mensagem foi enviada automaticamente pelo sistema Copy&amp;Paste.
  </p>
</div>
"""

    try:
        resend.Emails.send({
            "from": "Copy&Paste <onboarding@resend.dev>",
            "to": [settings.NOTIFICATION_EMAIL],
            "subject": subject,
            "html": html,
        })
    except Exception:
        pass
