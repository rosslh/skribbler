### Installation
* Make sure you have a userscript manager extension installed (Violentmonkey, Tampermonkey, Greasemonkey, etc.)
* Go here: https://raw.githubusercontent.com/rosslh/skribbler/master/skribbler.user.js
* The script should start to install automatically. If not, please manually enter that url into your userscript manager.

### Features
* Once the clue has two or more letters visible, this script will show a list of English words that match the pattern
    * This does not work for multi-word phrases
* The input field now turns green if input is a valid guess, orange/red if not
* Input field has a characters remaining indicator
* When drawing, links to Google image results for the topic are provided for easy reference

### Words list
* Skribbler's words list is built from combining the following:
    * [Google's most commonly used English words](https://github.com/first20hours/google-10000-english) (no swears) – 9899 words
    * [Dolph's aggregated words list](https://github.com/dolph/dictionary) – 25,322
    * Combined, these lists come out to the 27,702 unique words in words.txt
* If you have any good words lists I should add, please let me know!

### Feedback
* If you encounter any problems or have a feature request, please [submit an issue](https://github.com/rosslh/skribbler/issues/new)!
