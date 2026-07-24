import nltk
nltk.download('wordnet')
from nltk.corpus import wordnet

def generate_words(word_length) -> list[str]:
    'Generates a list of words of the specified length from the English words set.'
    words_dict = list(w.lower() for w in wordnet.words())
    words_of_length = [word for word in words_dict if len(word) == word_length]
    return words_of_length