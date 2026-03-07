from datetime import datetime

# In-memory event store (can be replaced by DB later)
GLOBAL_EVENTS = []


def add_event(event: dict):
    GLOBAL_EVENTS.append(event)


def get_active_events():
    today = datetime.utcnow().date()

    active = []

    for event in GLOBAL_EVENTS:
        start = datetime.fromisoformat(event["valid_from"]).date()
        end = datetime.fromisoformat(event["valid_to"]).date()

        if start <= today <= end:
            active.append(event)

    return active