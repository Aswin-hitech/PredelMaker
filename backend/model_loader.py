import joblib
from backend.onfig import Config

class ModelLoader:

    model = None

    @classmethod
    def load_model(cls):
        if cls.model is None:
            cls.model = joblib.load(Config.MODEL_PATH)
        return cls.model