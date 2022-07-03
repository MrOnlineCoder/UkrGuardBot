from model import AntispamModel

am = AntispamModel()

am.train()

txt = ''

while txt != 'exit':
    txt = input('> ').lower()

    if txt == 'exit':
        break

    print(am.predict(txt))
