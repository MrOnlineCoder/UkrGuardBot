from flask import Flask
from model import AntispamModel
from flask import request

am = AntispamModel()

am.train()

app = Flask(__name__)

@app.route('/')
def ping():
    return "pong"


@app.route('/predict')
def predict():
    query = request.args["query"]
    result = am.predict(query)

    return {
        "query": query,
        "result": result[0]
    }
