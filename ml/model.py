from sklearn.naive_bayes import BernoulliNB
from sklearn import datasets
from sklearn.metrics import confusion_matrix
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn import svm

cv = CountVectorizer()

class AntispamModel:
    def train(self):
        data = pd.read_csv("db.csv")

        X = list(map(lambda s: s.lower(), data['Text'].to_list()))
        Y = np.array(data['Result'])

        train_X = cv.fit_transform(X)

        model = svm.SVC()

        model.fit(train_X, Y)

        self.model = model
    
    def predict(self, text):
        test_X = cv.transform([text.lower()])
        prediction = self.model.predict(test_X)

        return prediction
