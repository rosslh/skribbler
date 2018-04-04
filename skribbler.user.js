// ==UserScript==
// @name Skribbler
// @namespace https://rosshill.ca
// @match *://skribbl.io/*
// @version 2.2.0
// @author Ross Hill
// @downloadURL https://raw.githubusercontent.com/rosslh/skribbler/master/skribbler.user.js
// @icon https://skribbl.io/res/favicon.png
// @homepageURL https://github.com/rosslh/skribbler
// @connect skribbler.herokuapp.com
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant GM.xmlHttpRequest
// @grant GM_xmlhttpRequest
// ==/UserScript==

var state = {
    pattern: "",
    content: null,
    wordsList: null,
    prevClue: "",
    links: null,
    prevAnswer: "",
    prevGuess: "",
    prevOneOff: ""
}

unsafeWindow.words = {
    oneOffWords: [],
    guessed: [],
    validAnswers: []
}

$(document).ready(function() {
    if (typeof GM === 'undefined') { // polyfill GM4
        GM = {};
        GM.xmlHttpRequest = GM_xmlhttpRequest;
    }
    var activate = $("<button>Activate skribbler</button>");
    activate.css({
        "font-size": "0.6em"
    });
    activate.click(function() {
        activate.hide();
        fetchWordsLists();
    });
    $("#audio").css({
        "left": "unset",
        "right": "0px"
    }); // so it doesn't cover timer
    $('.loginPanelTitle').first().append(activate);
    window.setInterval(scrollDown, 2000);
});

function scrollDown() {
    if ($('#screenGame').is(':visible') && $(this).scrollTop() < $('#screenGame').offset().top) {
        $('html, body').animate({
            scrollTop: $("#screenGame").offset().top
        }, 1000);
    }
}

function createAccount(standard, username, password) {
    GM.xmlHttpRequest({
        method: "POST",
        data: JSON.stringify({
            username: username,
            password: password
        }),
        headers: {
            "Content-Type": "application/json"
        },
        url: "https://skribbler.herokuapp.com/api/users",
        onload: function(response) {
            if (response.status == 201) {
                alert("User created.")
                getConfirmedWords(standard, username, password)
            } else if (response.status == 409) {
                alert("User already exists. Please reload and try another username.")
            } else {
                alert("User creation unsuccessful. Please try again later.")
            }
        }
    });
}

function getUsername() {
    var nameElem = $(".info .name[style='color: rgb(0, 0, 255);")[0];
    if (typeof nameElem !== "undefined") {
        return nameElem.innerText.split(" (")[0];
    }
}

function findGuessedWords(standard, confirmed) {
    var username = getUsername();
    if (username) {
        var guess = $("#boxMessages p[style='color: rgb(0, 0, 0);'] b:contains(" + username + ":)").parent().find("span").last();
        guess = guess.text();
        if (guess && guess != state.prevGuess) {
            state.prevGuess = guess;
            if (unsafeWindow.words.guessed.indexOf(guess) == -1) {
                unsafeWindow.words.guessed.push(guess);
                constructWordsList(getClueText(), standard, confirmed)
            }
        }
    }
}

function findCloseWords(standard, confirmed) {
    var close = $("#boxMessages p[style='color: rgb(204, 204, 0); font-weight: bold;'] span:contains( is close!)").last();
    close = close.text().split("'")[1]
    if (close && close != state.prevOneOff) {
        state.prevOneOff = close;
        if (unsafeWindow.words.oneOffWords.indexOf(close) == -1) {
            unsafeWindow.words.oneOffWords.push(close);
            constructWordsList(getClueText(), standard, confirmed)
        }
    }
}

function getConfirmedWords(standard, username, password) {
    GM.xmlHttpRequest({
        method: "GET",
        url: "https://skribbler.herokuapp.com/api/words",
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        },
        onload: function(response) {
            if (300 > response.status && response.status >= 200) {
                alert("Login successful, words retrieved.")
                var confirmed = JSON.parse(response.responseText);
                var run = window.setInterval(function() {
                    if (getClue()) {
                        clearInterval(run);
                        main(standard, confirmed, username, password);
                    }
                }, 500);
            } else {
                alert("Confirmed words not retrieved. Please try again later.")
            }
        }
    });
}

function getLoginDetails(standard) {
    var username;
    var password;
    if (prompt("Have you already created your skribbler account? (yes/no)").toLowerCase() == 'yes') {
        username = prompt("Please enter your skribbler username").toLowerCase();
        password = prompt("Please enter your skribbler password");
        getConfirmedWords(standard, username, password);
    } else {
        username = prompt("Please enter a username").toLowerCase();
        password = prompt("Please enter a unique password");
        if (password == prompt("Reenter password")) {
            createAccount(standard, username, password);
            return {
                username: username,
                password: password
            };
        }
    }
}

function fetchWordsLists() {
    GM.xmlHttpRequest({
        method: "GET",
        url: "https://skribbler.herokuapp.com/api/default",
        onload: function(response) {
            if (300 > response.status && response.status >= 200) {
                var standard = JSON.parse(response.responseText);
                getLoginDetails(standard);
            } else {
                alert("Default words list retrieval unsuccessful. Please try again later.")
            }
        }
    });
}

function addToConfirmed(clue, username, password) {
    GM.xmlHttpRequest({
        method: "POST",
        data: JSON.stringify({
            word: clue
        }),
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(username + ":" + password)
        },
        url: "https://skribbler.herokuapp.com/api/words",
        onload: function(response) {
            if ((response.status < 200 || response.status >= 300) && response.status != 409) {
                alert("Could not add '" + clue + "' to your confirmed words.")
            }
        }
    });
}

function clueChanged(standard, confirmed, username, password) {
    var clue = getClueText();
    if (clue != state.prevClue) {
        state.prevClue = clue;
        validateInput();
        constructWordsList(clue, standard, confirmed);
        showDrawLinks(clue);
    }
}

function answerShown(username, password) {
    answer = $('#overlay .content .text')[0].innerText;
    if (answer.slice(0, 14) == "The word was: ") {
        answer = answer.slice(14);
        if (answer != state.prevAnswer) {
            state.prevAnswer = answer;
            addToConfirmed(answer, username, password);
        }
    }
}


function main(standard, confirmed, username, password) {
    state.links = document.createElement("strong");
    $(state.links).css({
        "padding": "0 1em 0 1em"
    });
    getClue().after(state.links)
    state.content = document.createElement("span");
    state.wordsList = $(document.createElement("ul"));
    formArea = $("#formChat")[0];
    $(content).css({
        "position": "relative",
        "left": "295px",
        "top": "-25px"
    });
    state.wordsList.css({
        "width": "70%",
        "margin": "0 auto",
        "margin-top": "10px",
        "background-color": "#eee",
        "padding": "4px",
        "border-radius": "2px",
        "list-style-position": "inside",
        "columns": "4"
    })
    formArea.appendChild(state.content);
    $("#screenGame")[0].appendChild(state.wordsList[0]);
    input = getInput()[0];
    input.style.border = "3px solid orange";
    window.setInterval(function() {
        clueChanged(standard, confirmed, username, password);
    }, 750);
    window.setInterval(function() {
        answerShown(username, password);
    }, 750);
    window.setInterval(function() {
        findCloseWords(standard, confirmed);
    }, 750);
    window.setInterval(function() {
        findGuessedWords(standard, confirmed);
    }, 750);
    window.setInterval(function() {
        toggleWordsList();
    }, 1500);

    $("#formChat").append($('<div style="background-color:#eee; position:relative; top:-20px; padding:0 5px; width:auto; margin:0;"><input id="guessEnabled" name="guessEnabled" style="width:5px; height:5px; filter: brightness(0.8);" type="checkbox"><label for="guessEnabled" style="all: initial; padding-left:5px;">Enable auto-guesser</label></div>'));

    var lastGuess = 0;
    var lastTyped = 0;
    var guess = window.setInterval(function() {
        if ($("#guessEnabled").is(':checked') && Date.now() - lastTyped > 2000 && Date.now() - lastGuess > 2000) {
            lastGuess = Date.now();
            makeGuess(getClueText(), standard, confirmed);
        }
    }, 1000);
    getInput().keyup(function() {
        lastTyped = Date.now();
    });
    getInput().keyup(validateInput);
}

function makeGuess(clue, standard, confirmed) {
    if (validClue(clue) && !wordGuessed()) {
        var words = getWords(clue, standard, confirmed);
        var confWords = [];
        confirmed.forEach(function(item) {
            if (words.indexOf(item) != -1) {
                confWords.push(item);
            }
        });
        if (confWords.length != 0) {
            var guess = confWords[Math.floor(Math.random() * confWords.length)];
        } else {
            var guess = words[Math.floor(Math.random() * words.length)];
        }
        var submitProp = Object.keys(unsafeWindow.formChat).filter(function(k) {
            return ~k.indexOf("jQuery")
        })[0];
        window.setTimeout(function() {
            if (getInput().val() == "" && validClue(clue) && !wordGuessed()) {
                getInput().val(guess);
                unsafeWindow.formChat[submitProp].events.submit[0].handler();
            }
        }, Math.floor((Math.random() * 1000)));
    }
}

function getInput() {
    return $('#inputChat');
}

function getRegex(clue) {
    return new RegExp("^" + clue.replace(/_/g, "[^- ]") + "$");
}

function getClueText() {
    return getClue()[0].textContent.toLowerCase();
}

function getClue() {
    return $("#currentWord");
}

function validateInput() {
    word = getClueText();
    var input = getInput()[0];
    var remaining = word.length - input.value.length;
    state.content.textContent = remaining;
    state.content.style.color = "unset";
    if (remaining > 0) {
        state.content.textContent = "+" + state.content.textContent;
        state.content.style.color = "green";
    } else if (remaining < 0) {
        state.content.style.color = "red";
    }
    state.pattern = getRegex(word);
    short = getRegex(word.substring(0, input.value.length));
    if (state.pattern.test(input.value.toLowerCase())) {
        input.style.border = "3px solid green";
    } else if (short.test(input.value.toLowerCase())) {
        input.style.border = "3px solid orange";
    } else {
        input.style.border = "3px solid red";
    }
}

function showDrawLinks(clueText) {
    if (clueText.length > 0 && clueText.indexOf("_") == -1) {
        state.links.innerHTML = "<a style='color: blue' target='_blank' href='https://www.google.ca/search?tbm=isch&q=" + clueText + "'>Images</a>, ";
        state.links.innerHTML += "<a style='color: blue' target='_blank' href='https://www.google.ca/search?tbm=isch&tbs=itp:lineart&q=" + clueText + "'>Line art</a>";
    } else {
        state.links.innerHTML = "";
    }
}

function oneOff(listWord, guessedWord) {
    if (listWord.length == guessedWord.length) {
        var wrongLetters = 0;
        for (var i = 0; i < listWord.length; i++) {
            if (listWord.charAt(i) != guessedWord.charAt(i)) {
                wrongLetters++;
            }
            if (wrongLetters > 1) {
                return false;
            }
        }
        return wrongLetters == 1;
    } else if (listWord.length == guessedWord.length - 1) {
        for (var i = 1; i < guessedWord.length + 1; i++) {
            if (listWord == guessedWord.substring(0, i - 1) + guessedWord.substring(i, guessedWord.length)) {
                return true;
            }
        }
    } else if (guessedWord.length == listWord.length - 1) {
        for (var i = 1; i < listWord.length + 1; i++) {
            if (guessedWord == listWord.substring(0, i - 1) + listWord.substring(i, listWord.length)) {
                return true;
            }
        }
    }
    return false;
}

function checkPastGuesses(notOBO, word) {
    if (unsafeWindow.words.guessed.indexOf(word) != -1) {
        return false;
    }
    for (var i = 0; i < unsafeWindow.words.oneOffWords.length; i++) {
        if (!oneOff(word, unsafeWindow.words.oneOffWords[i])) {
            return false;
        }
    }
    for (var i = 0; i < notOBO.length; i++) {
        if (oneOff(word, notOBO[i])) {
            return false;
        }
    }
    return true;
}

function wordGuessed() {
    if ($(".guessedWord .info .name[style='color: rgb(0, 0, 255);']").length) {
        unsafeWindow.words.validAnswers = [];
        unsafeWindow.words.guessed = [];
        unsafeWindow.words.oneOffWords = [];
        return true;
    }
    return false;
}

function toggleWordsList() {
    if ($(state.wordsList).is(':visible')) {
        if (state.wordsList.children().length == 0 || wordGuessed() || !validClue(getClueText())) {
            state.wordsList.hide();
        }
    } else if (state.wordsList.is(':hidden')) {
        if (state.wordsList.children().length > 0 && !wordGuessed() && validClue(getClueText())) {
            state.wordsList.show();
        }
    }
}

function validClue(clue) {
    var someoneDrawing = $(".drawing").is(":visible");
    var noUnderscore = clue.replace(/_/g, "").length;
    if (someoneDrawing &&
        (noUnderscore > 0 && noUnderscore != clue.length || unsafeWindow.words.oneOffWords.length > 0)) {
        return true;
    }
    unsafeWindow.words.validAnswers = [];
    unsafeWindow.words.guessed = [];
    unsafeWindow.words.oneOffWords = [];
    return false;
}

function constructWordsList(clue, standard, confirmed) {
    var newList = $(document.createElement("ul"));
    newList.css({
        "width": "70%",
        "margin": "0 auto",
        "margin-top": "10px",
        "background-color": "#eee",
        "padding": "4px",
        "border-radius": "2px",
        "list-style-position": "inside",
        "columns": "4",
        "display": state.wordsList.css('display'),
        "visibility": state.wordsList.css('visibility')
    })
    if (validClue(clue) && !wordGuessed()) {
        var words = getWords(clue, standard, confirmed);
        for (var i = 0; i < words.length; i++) {
            var item = document.createElement("li");
            if (confirmed.indexOf(words[i]) > -1) {
                item.innerHTML = "<strong>" + words[i] + "</strong>";
            } else {
                item.innerText = words[i];
            }
            newList[0].appendChild(item);
        }
    }
    state.wordsList.html(newList.html());
}

function getWords(clue, standard, confirmed) {
    if (unsafeWindow.words.validAnswers.length == 0) {
        confirmed.forEach(function(item) {
            if (standard.indexOf(item) == -1) {
                standard.push(item);
            }
        });
    }
    var words = unsafeWindow.words.validAnswers.length > 0 ? unsafeWindow.words.validAnswers : standard;
    var out = [];
    state.pattern = getRegex(clue);
    var notOBO = [];
    unsafeWindow.words.guessed.forEach(function(word) {
        if (unsafeWindow.words.oneOffWords.indexOf(word) == -1) {
            notOBO.push(word);
        }
    });
    if (!wordGuessed()) {
        for (var i = 0; i < words.length; i++) {
            if (words[i].length == clue.length && state.pattern.test(words[i]) && checkPastGuesses(notOBO, words[i])) {
                out.push(words[i]);
            }
        }
    }
    unsafeWindow.words.validAnswers = out;
    return out;
}
