def update_eta(distance_km, speed_kmh=40, traffic_delay=0, stop_delay=0, weather_delay=0, toll_delay=0, terrain_type="plain"):
    """
    Calculates ETA based on distance, speed, and delays.
    Formula: base_eta = distance / speed
    Final ETA = base_eta + traffic_delay + stop_delay + weather_delay + toll_delay
    Apply terrain multiplier (1.35 for mountain).
    """
    if speed_kmh <= 0:
        speed_kmh = 40 # Default fallback
        
    base_eta_hours = distance_km / speed_kmh
    base_eta_minutes = int(base_eta_hours * 60)
    
    total_delay_minutes = int(traffic_delay + stop_delay + weather_delay + toll_delay)
    
    # Calculate pre-terrain ETA
    final_eta_minutes = base_eta_minutes + total_delay_minutes
    
    # Apply Terrain Multiplier
    terrain_multiplier = 1.35 if terrain_type == "mountain" else 1.0
    final_eta_minutes = int(final_eta_minutes * terrain_multiplier)
    
    return {
        "base_eta_minutes": base_eta_minutes,
        "total_delay_minutes": total_delay_minutes,
        "weather_delay_minutes": weather_delay,
        "terrain_multiplier": terrain_multiplier,
        "new_eta": final_eta_minutes
    }