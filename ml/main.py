from sklearn.naive_bayes import BernoulliNB
from sklearn import datasets
from sklearn.metrics import confusion_matrix
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer

cv = CountVectorizer()

data = pd.read_csv("sample.csv")
print(data.head())

X = list(map(lambda s: s.lower(), data['Text'].to_list()))
Y = np.array(data['Result'])

train_X = cv.fit_transform(X)

model = BernoulliNB()

model.fit(train_X, Y)

txt = ''

while txt != 'exit':
    txt = input('> ').lower()

    if txt == 'exit':
        break

    test_X = cv.transform([txt])
    prediction = model.predict(test_X)
    print(prediction)