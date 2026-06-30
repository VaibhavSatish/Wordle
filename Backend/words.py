#get a word to use
from english_words import english_words_lower_alpha_set

WORD_LENGTH = 5

words = english_words_lower_alpha_set(["web2"], lower = True, alpha = True)
words_of_length = [word for word in words if len(word) == WORD_LENGTH]

VALID_WORDS = words_of_length