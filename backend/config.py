import os
from dotenv import load_dotenv

load_dotenv()

class Config:

    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI")
    DB_NAME = os.getenv("DB_NAME")

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    # OSRM
    OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "http://router.project-osrm.org/route/v1/driving")

    # Monitoring
    GPS_UPDATE_INTERVAL = int(os.getenv("GPS_UPDATE_INTERVAL", 5))
    CUSTOMER_REFRESH_INTERVAL = int(os.getenv("CUSTOMER_REFRESH_INTERVAL", 10))
    OPEN_METEO_BASE_URL = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1/forecast")

    # Model path
    MODEL_PATH = "models/delay_xgb_model.pkl"