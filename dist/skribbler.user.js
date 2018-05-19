// ==UserScript==
// @name Skribbler
// @namespace https://rosshill.ca
// @match *://skribbl.io/*
// @version 2.5.3
// @author Ross Hill <rosshill.ca>
// @icon https://skribbl.io/res/favicon.png
// @connect skribbler.herokuapp.com
// @homepageURL https://github.com/rosslh/skribbler
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @licence MIT
// @support https://github.com/rosslh/skribbler/issues
// @grant GM.xmlHttpRequest
// @grant GM_xmlhttpRequest
// ==/UserScript==
const state = {
    content: document.createElement("span"),
    links: document.createElement("strong"),
    pattern: "",
    prevAnswer: "",
    prevClue: "",
    wordsList: $(document.createElement("ul"))
};
unsafeWindow.dictionary = {
    confirmed: [],
    guessed: [],
    oneOffWords: [],
    standard: [],
    validAnswers: []
};
function scrollDown() {
    if ($("#screenGame").is(":visible") &&
        $("html").scrollTop() < $("#screenGame").offset().top) {
        $("html, body").animate({
            scrollTop: $("#screenGame").offset().top
        }, 1000);
    }
}
function getPlayer() {
    const nameElem = $('.info .name[style="color: rgb(0, 0, 255);')[0];
    if (typeof nameElem !== "undefined") {
        return nameElem.innerText.split(" (")[0];
    }
    return "";
}
function validClue(clue, minCharsFound) {
    const someoneDrawing = $(".drawing").is(":visible");
    const charsFound = clue.replace(/_|-| /g, "").length;
    const noUnderscores = clue.replace(/_/g, "").length;
    if (someoneDrawing &&
        (unsafeWindow.dictionary.oneOffWords.length > 0 ||
            (charsFound >= minCharsFound && noUnderscores !== clue.length))) {
        return true;
    }
    if (!someoneDrawing) {
        unsafeWindow.dictionary.validAnswers = [];
        unsafeWindow.dictionary.guessed = [];
        unsafeWindow.dictionary.oneOffWords = [];
    }
    return false;
}
function wordGuessed() {
    if ($('.guessedWord .info .name[style="color: rgb(0, 0, 255);"]').length) {
        unsafeWindow.dictionary.validAnswers = [];
        unsafeWindow.dictionary.guessed = [];
        unsafeWindow.dictionary.oneOffWords = [];
        return true;
    }
    return false;
}
function missingChar(short, long) {
    for (let i = 1; i < long.length + 1; i++) {
        if (short === long.substring(0, i - 1) + long.substring(i, long.length)) {
            return true;
        }
    }
    return false;
}
function oneOff(listWord, guessedWord) {
    if (listWord.length === guessedWord.length) {
        let wrongLetters = 0;
        for (let i = 0; i < listWord.length; i++) {
            if (listWord.charAt(i) !== guessedWord.charAt(i)) {
                wrongLetters += 1;
            }
            if (wrongLetters > 1) {
                return false;
            }
        }
        return wrongLetters === 1;
    }
    if (listWord.length === guessedWord.length - 1) {
        return missingChar(listWord, guessedWord);
    }
    if (guessedWord.length === listWord.length - 1) {
        return missingChar(guessedWord, listWord);
    }
    return false;
}
function checkPastGuesses(notOBO, word) {
    if (unsafeWindow.dictionary.guessed.indexOf(word) !== -1) {
        return false;
    }
    for (const oneOffWord of unsafeWindow.dictionary.oneOffWords) {
        if (!oneOff(word, oneOffWord)) {
            return false;
        }
    }
    for (const str of notOBO) {
        if (oneOff(word, str)) {
            return false;
        }
    }
    return true;
}
function getRegex(clue) {
    return new RegExp(`^${clue.replace(/_/g, "[^- ]")}$`);
}
function filterWords(words, notOBO, clue) {
    return words
        .filter(word => word.length === clue.length &&
        state.pattern.test(word) &&
        checkPastGuesses(notOBO, word))
        .sort();
}
function getWords(clue) {
    const dict = unsafeWindow.dictionary;
    let words;
    if (dict.validAnswers.length === 0) {
        // && dict.guessed.length === 0
        words = dict.confirmed.slice();
        for (const item of dict.standard) {
            if (words.indexOf(item) === -1) {
                words.push(item);
            }
        }
    }
    else {
        words = dict.validAnswers;
    }
    state.pattern = getRegex(clue);
    const notOBO = [];
    for (const word of dict.guessed) {
        if (dict.oneOffWords.indexOf(word) === -1) {
            notOBO.push(word);
        }
    }
    if (!wordGuessed()) {
        dict.validAnswers = filterWords(words, notOBO, clue);
    }
    else {
        dict.validAnswers = [];
    }
    return dict.validAnswers;
}
function constructWordsList(clue) {
    const newList = $(document.createElement("ul"));
    if (validClue(clue, 0) && !wordGuessed()) {
        const words = getWords(clue);
        for (const word of words) {
            const item = document.createElement("li");
            if (unsafeWindow.dictionary.confirmed.indexOf(word) > -1) {
                item.innerHTML = `<strong>${word}</strong>`;
            }
            else
                item.innerText = word;
            newList[0].appendChild(item);
        }
    }
    state.wordsList.html(newList.html());
    state.wordsList.css({
        width: `${$(document).width() - $("#containerChat").width() - 40}px`
    });
}
function getClue() {
    return $("#currentWord");
}
function getClueText() {
    return getClue()[0].textContent.toLowerCase();
}
function findGuessedWords() {
    const player = getPlayer();
    if (player) {
        const guesses = $(`#boxMessages p[style='color: rgb(0, 0, 0);'] b:contains(${player}:)`)
            .parent()
            .find("span")
            .not(".skribblerHandled")
            .slice(-10);
        guesses.each((i, elem) => {
            const guessText = elem.innerText;
            if (unsafeWindow.dictionary.guessed.indexOf(guessText) === -1) {
                unsafeWindow.dictionary.guessed.push(guessText);
                elem.classList.add("skribblerHandled");
                constructWordsList(getClueText());
            }
        });
    }
}
function findCloseWords() {
    const close = $("#boxMessages p[style='color: rgb(204, 204, 0); font-weight: bold;'] span:contains( is close!)")
        .not(".skribblerHandled")
        .slice(-10);
    close.each((i, elem) => {
        const text = elem.innerText.split("'")[1];
        if (unsafeWindow.dictionary.oneOffWords.indexOf(text) === -1) {
            unsafeWindow.dictionary.oneOffWords.push(text);
            elem.classList.add("skribblerHandled");
            constructWordsList(getClueText());
        }
    });
}
function getInput() {
    return $("#inputChat");
}
function validateInput() {
    const word = getClueText();
    const input = getInput()[0];
    const remaining = word.length - input.value.length;
    state.content.textContent = remaining;
    state.content.style.color = "unset";
    if (remaining > 0) {
        state.content.textContent = `+${state.content.textContent}`;
        state.content.style.color = "green";
    }
    else if (remaining < 0) {
        state.content.style.color = "red";
    }
    state.pattern = getRegex(word);
    const short = getRegex(word.substring(0, input.value.length));
    if (state.pattern.test(input.value.toLowerCase())) {
        input.style.border = "3px solid green";
    }
    else if (short.test(input.value.toLowerCase())) {
        input.style.border = "3px solid orange";
    }
    else {
        input.style.border = "3px solid red";
    }
}
function showDrawLinks(clueText) {
    if (clueText.length > 0 && clueText.indexOf("_") === -1) {
        state.links.innerHTML = `<a style='color: blue' target='_blank'
href='https://www.google.ca/search?tbm=isch&q=${clueText}'>Images</a>, `;
        state.links.innerHTML += `<a style='color: blue' target='_blank'
href='https://www.google.ca/search?tbm=isch&tbs=itp:lineart&q=${clueText}'>Line art</a>`;
    }
    else {
        state.links.innerHTML = "";
    }
}
function clueChanged() {
    const clue = getClueText();
    if (clue !== state.prevClue) {
        state.prevClue = clue;
        validateInput();
        constructWordsList(clue);
        showDrawLinks(clue);
    }
}
function answerShown(username, password) {
    let answer = $("#overlay .content .text")[0].innerText;
    if (answer.slice(0, 14) === "The word was: ") {
        answer = answer.slice(14);
        if (answer !== state.prevAnswer) {
            state.prevAnswer = answer;
            unsafeWindow.dictionary.oneOffWords = [];
            unsafeWindow.dictionary.guessed = [];
            unsafeWindow.dictionary.validAnswers = [];
            if (admin) {
                handleWord(answer, username, password);
            }
        }
    }
}
function makeGuess(clue) {
    if (validClue(clue, 1) && !wordGuessed()) {
        const words = unsafeWindow.dictionary.validAnswers;
        const confWords = [];
        for (const item of words) {
            if (unsafeWindow.dictionary.confirmed.indexOf(item) > -1) {
                confWords.push(item);
            }
        }
        let guess;
        if (confWords.length > 0) {
            guess = confWords[Math.floor(Math.random() * confWords.length)];
        }
        else {
            guess = words[Math.floor(Math.random() * words.length)];
        }
        const submitProp = Object.keys(unsafeWindow.formChat).filter((k) => ~k.indexOf("jQuery") // tslint:disable-line no-bitwise
        )[0];
        window.setTimeout(() => {
            if (getInput().val() === "" && validClue(clue, 1) && !wordGuessed()) {
                getInput().val(guess);
                unsafeWindow.formChat[submitProp].events.submit[0].handler();
            }
        }, Math.floor(Math.random() * (Number($("#guessRate").val()) / 3)));
    }
}
function toggleWordsList() {
    if ($(state.wordsList).is(":visible")) {
        if (state.wordsList.children().length === 0 ||
            wordGuessed() ||
            !validClue(getClueText(), 0)) {
            state.wordsList.hide();
        }
    }
    else if (state.wordsList.children().length > 0 &&
        !wordGuessed() &&
        validClue(getClueText(), 0)) {
        state.wordsList.show();
    }
}
function stillHere() {
    if (document.hidden &&
        $(".modal-dialog:contains(Are you still here?)").is(":visible")) {
        alert("Action required.");
    }
}
function main(username, password) {
    $("#audio").css({
        left: "unset",
        right: "0px"
    }); // so it doesn't cover timer
    window.setInterval(scrollDown, 2000);
    $(state.links).css({
        padding: "0 1em 0 1em"
    });
    getClue().after(state.links);
    const formArea = $("#formChat")[0];
    $(state.content).css({
        left: "295px",
        position: "relative",
        top: "-25px"
    });
    state.wordsList.css({
        "background-color": "#eee",
        "border-radius": "2px",
        columns: "4",
        "list-style-position": "inside",
        "margin-top": "10px",
        padding: "4px",
        width: "70%"
    });
    formArea.appendChild(state.content);
    $("#screenGame")[0].appendChild(state.wordsList[0]);
    const input = getInput()[0];
    input.style.border = "3px solid orange";
    window.setInterval(() => {
        clueChanged();
        answerShown(username, password);
        findCloseWords();
        findGuessedWords();
        toggleWordsList();
        stillHere();
    }, 1000);
    $("#boxChatInput").append($(`<div style="background-color:#eee; position:relative;
top:-20px; padding:0 5px; width:auto; margin:0;">
<input id="guessEnabled" name="guessEnabled" style="width:6px; height:6px;" type="checkbox">
<label for="guessEnabled" style="all: initial; padding-left:5px;">Enable auto-guesser</label><br>
<label for="guessRate" style="all: initial; padding-right:5px;">Guess frequency (seconds):</label>
<input id="guessRate" name="guessRate" type="number" step="0.5" min="1" value="1.5" style="width:4em;"></div>`));
    let lastGuess = 0;
    let lastTyped = 0;
    window.setInterval(() => {
        if ($("#guessEnabled").is(":checked") &&
            Date.now() - lastTyped >= 1500 &&
            Date.now() - lastGuess >= 1000 * Number($("#guessRate").val())) {
            lastGuess = Date.now();
            makeGuess(getClueText());
        }
    }, 500);
    getInput().keyup(() => {
        lastTyped = Date.now();
    });
    getInput().keyup(validateInput);
}
function fetchWords(username, password) {
    GM.xmlHttpRequest({
        method: "GET",
        url: "https://skribbler.herokuapp.com/api/words",
        onload(res) {
            const response = JSON.parse(res.responseText);
            unsafeWindow.dictionary.standard = response.default;
            unsafeWindow.dictionary.confirmed = response.confirmed;
            const run = window.setInterval(() => {
                if (getClue()) {
                    clearInterval(run);
                    main(username, password);
                }
            }, 1000);
        }
    });
}
$(document).ready(() => {
    if (typeof GM === "undefined") {
        // polyfill GM4
        GM = {
            xmlHttpRequest: GM_xmlhttpRequest
        };
    }
    let activate;
    if (admin) {
        activate = $("<button>Activate skribbler (admin)</button>");
    }
    else
        activate = $("<button>Activate skribbler</button>");
    activate.css({
        "font-size": "0.6em"
    });
    $(".loginPanelTitle")
        .first()
        .append(activate);
    activate.click(() => {
        activate.hide();
        if (admin) {
            getLoginDetails();
        }
        else {
            fetchWords("", "");
        }
    });
});
const handleWord = (clue, username, password) => { };
const getLoginDetails = () => { };
const admin = false;
