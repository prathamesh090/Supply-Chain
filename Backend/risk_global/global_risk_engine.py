from .global_event_repository import get_active_events


def compute_global_risk():
    """
    Return currently active geopolitical risk events.
    """

    active_events = get_active_events()

    return {
        "status": "ok",
        "event_count": len(active_events),
        "events": active_events
    }