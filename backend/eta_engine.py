def update_eta(base_eta_minutes, probability):

    delay_minutes = int(probability * 10)

    new_eta = base_eta_minutes + delay_minutes

    return {
        "delay_minutes": delay_minutes,
        "new_eta": new_eta
    }