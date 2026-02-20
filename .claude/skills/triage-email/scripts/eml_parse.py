# Minimal EML/TXT parser to extract subject/body safely (no external deps).# NOTE: This is a scaffold; extend as needed.
from email import policy
from email.parser import BytesParser
from pathlib import Path
def load_email_text(path: str) -> dict:
    p = Path(path)
    raw = p.read_bytes()
    if p.suffix.lower() == ".eml":
        msg = BytesParser(policy=policy.default).parsebytes(raw)
        subject = msg.get("Subject", "")
        sender = msg.get("From", "")
        to = msg.get("To", "")
        cc = msg.get("Cc", "")
        # Prefer plain text parts; fallback to HTML stripped if needed        
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    body += part.get_content()
        else:
            body = msg.get_content()
        return {"subject": subject, "from": sender, "to": to, "cc": cc, "body": body}
    else:
         # Treat as raw text file        
        text = raw.decode("utf-8", errors="ignore")
        first = text.splitlines()[0:3]
        subject = first[0].replace("Subject:", "").strip() if first else ""
        return {"subject": subject, "from": "", "to": "", "cc": "", "body": text}