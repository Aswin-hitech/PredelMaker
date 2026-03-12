from pymongo import MongoClient
from backend.config import Config

client = MongoClient(Config.MONGO_URI)

db = client[Config.DB_NAME]

collection = db["delay_context"]


def save_context(context):

    collection.insert_one(context)


def get_all_contexts():

    results = list(collection.find({}, {"_id": 0}))

    return results