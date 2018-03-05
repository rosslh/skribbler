// ==UserScript==
// @name Skribbler
// @namespace https://rosshill.ca
// @match *://skribbl.io/*
// @grant none
// @version 1.0.4
// @author Ross Hill
// @icon https://skribbl.io/res/favicon.png
// @homepage https://github.com/rosslh/skribbler
// ==/UserScript==

var words = []
var pattern = ""
var content;
var wordsList;
var prevClue = ""


$(document).ready(function() {
  run = window.setInterval(function() {
    if($("#currentWord")[0].innerText){
      clearInterval(run);
      fetchWordsLists();
      main();
    }
  }, 500);
});

function fetchWordsLists(){
  $.get("https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt", function( one ) {
    words = one.split("\n");
    $.get("https://raw.githubusercontent.com/dolph/dictionary/master/popular.txt", function( two ) {
      two.split("\n").forEach(function(item) {
        if(words.indexOf(item) < 0) {
          words.push(item);
        }
      });
      words.sort();
    });
  });
}

function main(){
  content = document.createElement("span");
  wordsList = $(document.createElement("ul"));
  formArea = $("#formChat")[0];
  content.style.position = "relative";
  content.style.left = "295px";
  content.style.top = "-25px";
  wordsList[0].style.width = "70%";
  wordsList[0].style.margin = "0 auto";
  wordsList[0].style.marginTop = "10px";
  wordsList[0].style.backgroundColor = "#eee";
  wordsList[0].style.padding = "4px";
  wordsList[0].style.borderRadius = "2px";
  wordsList[0].style.listStylePosition = "inside";
  wordsList[0].style.columns = "4";
  formArea.appendChild(content);
  $("#screenGame")[0].appendChild(wordsList[0]);
  input = $('#inputChat')[0];
  input.style.border = "3px solid orange";

  window.setInterval(getWords, 500);
  validate();
  input.onkeyup = validate;
}

function validate(){
  word = $("#currentWord")[0].textContent.toLowerCase();
  var remaining = word.length - input.value.length;
  content.textContent = remaining;
  content.style.color = "unset";
  if(remaining > 0){
    content.textContent = "+" + content.textContent;
    content.style.color = "green";
  }
  else if(remaining < 0){
    content.style.color = "red";
  }
  pattern = new RegExp("^" + word.replace(/_/g, ".") + "$");
  short = new RegExp("^" + word.replace(/_/g, ".").substring(0, input.value.length) + "$");
  if(pattern.test(input.value)){
    input.style.border = "3px solid green";
  }
  else if(short.test(input.value)){
    input.style.border = "3px solid orange";
  }
  else{
    input.style.border = "3px solid red";
  }
}

function getWords(){
  var clue = $("#currentWord")[0].textContent.toLowerCase();
  pattern = new RegExp("^" + clue.replace(/_/g, ".") + "$");
  if(clue != prevClue){
    prevClue = clue;
    while (wordsList[0].firstChild) {
        wordsList[0].removeChild(wordsList[0].firstChild);
    }
    if(clue.replace(/_/g, "").length > 1){
      for(var i = 0; i<words.length; i++){
        if(words[i].length == clue.length && pattern.test(words[i])){
          console.log(words[i])
          var item = document.createElement("li");
          item.textContent = words[i];
          wordsList[0].appendChild(item);
        }
      }
      if(wordsList.children().length > 0){
        var heading = document.createElement("li");
        heading.textContent = clue +":";
        wordsList[0].insertBefore(heading, wordsList[0].firstChild)
      }
    }
  }

  if($(wordsList).is(':visible')){
      if(wordsList.children().length < 2){
        wordsList.hide();
      }
  }
  else if (wordsList.is(':hidden')){
      if(wordsList.children().length > 1){
        wordsList.show();
      }
  }
}
