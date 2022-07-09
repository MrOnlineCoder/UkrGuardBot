from flask import Flask
from model import AntispamModel
from flask import request

am = AntispamModel()

am.train()

app = Flask(__name__)

@app.route('/')
def ping():
    return "pong"


@app.route('/predict', methods=['POST'])
def predict():
    query = request.json["query"]
    
    if not query or query == None:
        return {
            "query": None,
            "result": None
        }

    result = am.predict(query)

    return {
        "query": query,
        "result": result[0]
    }
