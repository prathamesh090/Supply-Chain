import secrets, base64
key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip('=')
print(f"SECRET_KEY={key}")

# SECRET_KEY=NjRguk7-1psSRONb7BUb8FSkDUpDYCXPmtfP-oHO5XA