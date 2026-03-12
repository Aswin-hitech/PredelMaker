def calculate_risk(probability):

    if probability < 0.3:
        return "LOW"

    elif probability < 0.6:
        return "MEDIUM"

    else:
        return "HIGH"