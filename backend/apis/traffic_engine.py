def estimate_traffic(hour):
    """
    Estimates traffic level based on time of day (Heuristic)
    0 - Low
    1 - Moderate
    2 - High
    """
    # Rush Hour Peak
    if (7 <= hour <= 10) or (17 <= hour <= 20):
        return 2  # High
    
    # Business Busy Hours
    elif (11 <= hour <= 16):
        return 1  # Moderate
        
    # Late Night / Early Morning
    else:
        return 0  # Low
