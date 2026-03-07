from .global_event_repository import get_active_events


def compute_global_risk():

    events = get_active_events()

    return {
        "status": "ok",
        "event_count": len(events),
        "events": events
    }