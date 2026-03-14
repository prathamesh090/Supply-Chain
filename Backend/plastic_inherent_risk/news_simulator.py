import time
import random

from plastic_inherent_risk.service import process_inherent_risk


# Curated demo news events
SIMULATED_NEWS_EVENTS = [

    "Explosion at BASF polymer production plant",
    "Chemical leak reported at BASF facility during maintenance shutdown",
    "Fire damages polypropylene production line at BASF plant",
    "Cooling system failure halts BASF polymer extrusion unit",
    "Safety incident reported at BASF resin packaging facility",

    "Dow chemical plant reports operational disruption affecting polymer output",
    "Labor strike disrupts polyethylene shipments from major supplier",
    "Maintenance shutdown impacts polymer production capacity",

    "Regulatory inspection launched after safety concerns at plastics manufacturing site",
    "Supply chain disruption reported due to industrial accident at polymer plant"
]


def start_news_simulator():

    print("✓ Real-time news simulator started")

    while True:

        news = random.choice(SIMULATED_NEWS_EVENTS)

        print(f"[SIMULATED NEWS] {news}")

        try:
            process_inherent_risk(news, None)
        except Exception as e:
            print(f"News simulation error: {e}")

        # Wait before next news event
        time.sleep(30)