from english_words import get_english_words_set

def generate_words(word_length) -> list[str]:
    'Generates a list of words of the specified length from the English words set.'
    words = get_english_words_set(["web2"], lower = True, alpha = True)
    words_of_length = [word for word in words if len(word) == word_length]
    return words_of_length