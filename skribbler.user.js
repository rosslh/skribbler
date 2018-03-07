// ==UserScript==
// @name Skribbler
// @namespace https://rosshill.ca
// @match *://skribbl.io/*
// @grant none
// @version 1.0.8
// @author Ross Hill
// @icon https://skribbl.io/res/favicon.png
// @homepage https://github.com/rosslh/skribbler
// ==/UserScript==

var words = []
var pattern = ""
var content;
var wordsList;
var prevClue = ""
var links;


$(document).ready(function() {
    run = window.setInterval(function() {
        if (getClue()) {
            clearInterval(run);
            fetchWordsLists();
            main();
        }
    }, 500);
});

function fetchWordsLists() {
    $.get("https://raw.githubusercontent.com/rosslh/skribbler/master/words.txt", function(source) {
        words = source.split("\n");
    });
}

function clueChanged(){
  var clue = getClueText();
  if(clue != prevClue){
    prevClue = clue;
    validateInput();
    getWords(clue);
    showDrawLinks(clue);
  }
}

function main() {
    links = document.createElement("strong");
    $(links).css({"padding": "0 1em 0 1em"});
    getClue().after(links)
    content = document.createElement("span");
    wordsList = $(document.createElement("ul"));
    formArea = $("#formChat")[0];
    $(content).css({"position": "relative", "left": "295px", "top": "-25px"});
    wordsList.css({"width": "70%", "margin": "0 auto", "margin-top": "10px", "background-color": "#eee", "padding": "4px", "border-radius": "2px", "list-style-position": "inside", "columns": "4"})
    formArea.appendChild(content);
    $("#screenGame")[0].appendChild(wordsList[0]);
    input = getInput()[0];
    input.style.border = "3px solid orange";
    window.setInterval(clueChanged, 500);
    input.onkeyup = validateInput;
}

function getInput(){
  return $('#inputChat');
}

function getRegex(clue){
  return new RegExp("^" + clue.replace(/_/g, "[^- ]") + "$");
}

function getClueText(){
  return getClue()[0].textContent.toLowerCase();
}

function getClue(){
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

function showDrawLinks(clueText){
  if(clueText.length > 0 && clueText.indexOf("_") == -1){
    links.innerHTML = "<a style='color: blue' target='_blank' href='https://www.google.ca/search?tbm=isch&q=" + clueText + "'>Images</a>, ";
    links.innerHTML += "<a style='color: blue' target='_blank' href='https://www.google.ca/search?tbm=isch&tbs=itp:lineart&q=" + clueText + "'>Line art</a>";
  }
  else{
    links.innerHTML = "";
  }
}

function getWords(clue) {
    pattern = getRegex(clue);
    while (wordsList[0].firstChild) {
        wordsList[0].removeChild(wordsList[0].firstChild);
    }
    if (clue.replace(/_/g, "").length > 1) {
        for (var i = 0; i < words.length; i++) {
            if (words[i].length == clue.length && pattern.test(words[i])) {
                var item = document.createElement("li");
                item.textContent = words[i];
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
