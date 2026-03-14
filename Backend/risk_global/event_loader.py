from .global_event_repository import add_event


def load_global_events():
    """
    Register predefined geopolitical risk events.
    """

    events = [

        {
            "event_id": "GEO-001",
            "event_type": "Trade Sanctions",
            "risk_score": 85,
            "risk_level": "High",

            "affected_regions": ["Europe"],
            "affects": ["suppliers", "routes"],

            "valid_from": "2026-03-01",
            "valid_to": "2026-05-01"
        },

        {
            "event_id": "GEO-002",
            "event_type": "Regional Conflict",
            "risk_score": 90,
            "risk_level": "High",

            "affected_regions": ["Middle East"],
            "affects": ["routes"],

            "valid_from": "2026-03-01",
            "valid_to": "2026-06-01"
        },

        {
            "event_id": "GEO-003",
            "event_type": "Port Strike",
            "risk_score": 70,
            "risk_level": "Medium",

            "affected_regions": ["Asia-Pacific"],
            "affects": ["routes", "logistics"],

            "valid_from": "2026-03-05",
            "valid_to": "2026-04-10"
        }

    ]

    for event in events:
        add_event(event)