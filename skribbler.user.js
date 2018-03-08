// ==UserScript==
// @name Skribbler
// @namespace https://rosshill.ca
// @match *://skribbl.io/*
// @grant GM.xmlHttpRequest
// @version 2.0.0
// @author Ross Hill
// @icon https://skribbl.io/res/favicon.png
// @homepageURL https://github.com/rosslh/skribbler
// @connect skribbler.herokuapp.com
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

var pattern = ""
var content;
var wordsList;
var prevClue = ""
var links;
var prevAnswer = ""

$(document).ready(function() {
    fetchWordsLists();
});

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
            } else if (response.status == 409){
                alert("User already exists. Please reload and try another username.")
            } else {
                alert("User creation unsuccessful. Please try again later.")
            }
        }
    });
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

function addToConfirmed(clue, username, password){
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
            if (response.status < 200 || response.status >= 300) {
                alert("Could not add '" + clue + "' to your confirmed words.")
            }
        }
    });
}

function clueChanged(standard, confirmed, username, password) {
    var clue = getClueText();
    if (clue != prevClue) {
        prevClue = clue;
        validateInput();
        getWords(clue, standard, confirmed);
        showDrawLinks(clue);
    }
}

function answerShown(username, password){
    answer = $('#overlay .content .text')[0].innerText;
    if(answer.slice(0, 14) == "The word was: "){
        answer = answer.slice(14);
        if(answer != prevAnswer){
            prevAnswer = answer;
            addToConfirmed(answer, username, password);
        }
    }

}

function main(standard, confirmed, username, password) {
    links = document.createElement("strong");
    $(links).css({
        "padding": "0 1em 0 1em"
    });
    getClue().after(links)
    content = document.createElement("span");
    wordsList = $(document.createElement("ul"));
    formArea = $("#formChat")[0];
    $(content).css({
        "position": "relative",
        "left": "295px",
        "top": "-25px"
    });
    wordsList.css({
        "width": "70%",
        "margin": "0 auto",
        "margin-top": "10px",
        "background-color": "#eee",
        "padding": "4px",
        "border-radius": "2px",
        "list-style-position": "inside",
        "columns": "4"
    })
    formArea.appendChild(content);
    $("#screenGame")[0].appendChild(wordsList[0]);
    input = getInput()[0];
    input.style.border = "3px solid orange";
    window.setInterval(function() {
        clueChanged(standard, confirmed, username, password);
    }, 500);
    window.setInterval(function() {
        answerShown(username, password);
    }, 300);
    input.onkeyup = validateInput;
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
    content.textContent = remaining;
    content.style.color = "unset";
    if (remaining > 0) {
        content.textContent = "+" + content.textContent;
        content.style.color = "green";
    } else if (remaining < 0) {
        content.style.color = "red";
    }
    pattern = getRegex(word);
    short = getRegex(word.substring(0, input.value.length));
    if (pattern.test(input.value.toLowerCase())) {
        input.style.border = "3px solid green";
    } else if (short.test(input.value.toLowerCase())) {
        input.style.border = "3px solid orange";
    } else {
        input.style.border = "3px solid red";
    }
}

function showDrawLinks(clueText) {
    if (clueText.length > 0 && clueText.indexOf("_") == -1) {
        links.innerHTML = "<a style='color: blue' target='_blank' href='https://www.google.ca/search?tbm=isch&q=" + clueText + "'>Images</a>, ";
        links.innerHTML += "<a style='color: blue' target='_blank' href='https://www.google.ca/search?tbm=isch&tbs=itp:lineart&q=" + clueText + "'>Line art</a>";
    } else {
        links.innerHTML = "";
    }
}

function getWords(clue, standard, confirmed) {
    var words =
        standard;
    confirmed.forEach(function(item) {
        if (words.indexOf(item) == -1) {
            words.push(item);
        }
    });
    pattern = getRegex(clue);
    while (wordsList[0].firstChild) {
        wordsList[0].removeChild(wordsList[0].firstChild);
    }
    if (clue.replace(/_/g, "").length > 1) {
        for (var i = 0; i < words.length; i++) {
            if (words[i].length == clue.length && pattern.test(words[i])) {
                var item = document.createElement("li");
                if (confirmed.indexOf(words[i]) > -1) {
                    item.innerHTML = "<strong>" + words[i] + "</strong>";
                } else {
                    item.innerText = words[i];
                }
                wordsList[0].appendChild(item);
            }
        }
        if (wordsList.children().length > 0) {
            var heading = document.createElement("li");
            heading.textContent = clue + ":";
            wordsList[0].insertBefore(heading, wordsList[0].firstChild)
        }
    }

    if ($(wordsList).is(':visible')) {
        if (wordsList.children().length < 2) {
            wordsList.hide();
        }
    } else if (wordsList.is(':hidden')) {
        if (wordsList.children().length > 1) {
            wordsList.show();
        }
    }
}
