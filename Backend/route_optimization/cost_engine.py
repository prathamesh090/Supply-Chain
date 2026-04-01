# route_optimization/cost_engine.py

import math


class CostEngine:
    EARTH_RADIUS_KM = 6371
    COST_PER_KM = 45

    @staticmethod
    def haversine_distance(lat1, lon1, lat2, lon2):
        lat1, lon1, lat2, lon2 = map(
            math.radians,
            [lat1, lon1, lat2, lon2]
        )

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1)
            * math.cos(lat2)
            * math.sin(dlon / 2) ** 2
        )

        c = 2 * math.asin(math.sqrt(a))

        return round(CostEngine.EARTH_RADIUS_KM * c, 2)

    @staticmethod
    def transport_cost(distance_km):
        return round(distance_km * CostEngine.COST_PER_KM, 2)


cost_engine = CostEngine()