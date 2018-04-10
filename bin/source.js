const state = {
  pattern: '',
  content: document.createElement('span'),
  wordsList: $(document.createElement('ul')),
  prevClue: '',
  links: document.createElement('strong'),
  prevAnswer: '',
};

unsafeWindow.dictionary = {
  confirmed: [],
  standard: [],
  oneOffWords: [],
  guessed: [],
  validAnswers: [],
};

function scrollDown() {
  if ($('#screenGame').is(':visible') && $(this).scrollTop() < $('#screenGame').offset().top) {
    $('html, body').animate({
      scrollTop: $('#screenGame').offset().top,
    }, 1000);
  }
}

function getPlayer() {
  const nameElem = $(".info .name[style='color: rgb(0, 0, 255);")[0];
  if (typeof nameElem !== 'undefined') {
    return nameElem.innerText.split(' (')[0];
  }
  return '';
}

function validClue(clue) {
  const someoneDrawing = $('.drawing').is(':visible');
  const noUnderscore = clue.replace(/_/g, '').length;
  if (someoneDrawing &&
    ((noUnderscore > 0 && noUnderscore !== clue.length)
    || unsafeWindow.dictionary.oneOffWords.length > 0)) {
    return true;
  }
  unsafeWindow.dictionary.validAnswers = [];
  unsafeWindow.dictionary.guessed = [];
  unsafeWindow.dictionary.oneOffWords = [];
  return false;
}

function wordGuessed() {
  if ($(".guessedWord .info .name[style='color: rgb(0, 0, 255);']").length) {
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
  } else if (listWord.length === guessedWord.length - 1) {
    return missingChar(listWord, guessedWord);
  } else if (guessedWord.length === listWord.length - 1) {
    return missingChar(guessedWord, listWord);
  }
  return false;
}

function checkPastGuesses(notOBO, word) {
  if (unsafeWindow.dictionary.guessed.indexOf(word) !== -1) {
    return false;
  }
  for (let a = 0; a < unsafeWindow.dictionary.oneOffWords.length; a++) {
    if (!oneOff(word, unsafeWindow.dictionary.oneOffWords[a])) {
      return false;
    }
  }
  for (let i = 0; i < notOBO.length; i++) {
    if (oneOff(word, notOBO[i])) {
      return false;
    }
  }
  return true;
}

function getRegex(clue) {
  return new RegExp(`^${clue.replace(/_/g, '[^- ]')}$`);
}

function getWords(clue, wordsList) {
  const list = wordsList || unsafeWindow.dictionary.confirmed;
  if (unsafeWindow.dictionary.validAnswers.length === 0) {
    unsafeWindow.dictionary.validAnswers = list;
  }
  const words = unsafeWindow.dictionary.validAnswers;
  const out = [];
  state.pattern = getRegex(clue);
  const notOBO = [];
  unsafeWindow.dictionary.guessed.forEach((word) => {
    if (unsafeWindow.dictionary.oneOffWords.indexOf(word) === -1) {
      notOBO.push(word);
    }
  });
  if (!wordGuessed()) {
    for (let i = 0; i < words.length; i++) {
      if (words[i].length === clue.length && state.pattern.test(words[i])
        && checkPastGuesses(notOBO, words[i])) {
        out.push(words[i]);
      }
    }
  }
  unsafeWindow.dictionary.validAnswers = out;
  if (out.length !== 0) {
    return out;
  }
  return getWords(clue, unsafeWindow.dictionary.standard);
}

function constructWordsList(clue) {
  const newList = $(document.createElement('ul'));
  newList.css({
    width: '70%',
    margin: '0 auto',
    'margin-top': '10px',
    'background-color': '#eee',
    padding: '4px',
    'border-radius': '2px',
    'list-style-position': 'inside',
    columns: '4',
    display: state.wordsList.css('display'),
    visibility: state.wordsList.css('visibility'),
  }); // looking for a drier way to do this...
  if (validClue(clue) && !wordGuessed()) {
    const words = getWords(clue);
    for (let i = 0; i < words.length; i++) {
      const item = document.createElement('li');
      item.innerText = words[i];
      newList[0].appendChild(item);
    }
  }
  state.wordsList.html(newList.html());
}

function getClue() {
  return $('#currentWord');
}

function getClueText() {
  return getClue()[0].textContent.toLowerCase();
}

function findGuessedWords() {
  const player = getPlayer();
  if (player) {
    const guesses = $(`#boxMessages p[style='color: rgb(0, 0, 0);'] b:contains(${player}:)`).parent().find('span').not('.skribblerHandled')
      .slice(-10);
    for (let i = 0; i < guesses.length; i++) {
      const guess = guesses[i].innerText;
      if (unsafeWindow.dictionary.guessed.indexOf(guess) === -1) {
        unsafeWindow.dictionary.guessed.push(guess);
        guesses[i].classList.add('skribblerHandled');
        constructWordsList(getClueText());
      }
    }
  }
}

function findCloseWords() {
  const close = $("#boxMessages p[style='color: rgb(204, 204, 0); font-weight: bold;'] span:contains( is close!)").not('.skribblerHandled').slice(-10);
  for (let i = 0; i < close.length; i++) {
    const text = close[i].innerText.split("'")[1];
    if (unsafeWindow.dictionary.oneOffWords.indexOf(text) === -1) {
      unsafeWindow.dictionary.oneOffWords.push(text);
      close[i].classList.add('skribblerHandled');
      constructWordsList(getClueText());
    }
  }
}

function addToConfirmed(clue, username, password) {
  GM.xmlHttpRequest({
    method: 'POST',
    data: JSON.stringify({
      word: clue,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    },
    url: 'https://skribbler.herokuapp.com/api/words',
    onload(response) {
      if ((response.status < 200 || response.status >= 300)
        && response.status !== 409) {
        alert(`Could not add '${clue}' to your confirmed words.`);
      }
    },
  });
}

function getInput() {
  return $('#inputChat');
}

function validateInput() {
  const word = getClueText();
  const input = getInput()[0];
  const remaining = word.length - input.value.length;
  state.content.textContent = remaining;
  state.content.style.color = 'unset';
  if (remaining > 0) {
    state.content.textContent = `+${state.content.textContent}`;
    state.content.style.color = 'green';
  } else if (remaining < 0) {
    state.content.style.color = 'red';
  }
  state.pattern = getRegex(word);
  const short = getRegex(word.substring(0, input.value.length));
  if (state.pattern.test(input.value.toLowerCase())) {
    input.style.border = '3px solid green';
  } else if (short.test(input.value.toLowerCase())) {
    input.style.border = '3px solid orange';
  } else {
    input.style.border = '3px solid red';
  }
}

function showDrawLinks(clueText) {
  if (clueText.length > 0 && clueText.indexOf('_') === -1) {
    state.links.innerHTML = `<a style='color: blue' target='_blank' href='https://www.google.ca/search?tbm=isch&q=${clueText}'>Images</a>, `;
    state.links.innerHTML += `<a style='color: blue' target='_blank' href='https://www.google.ca/search?tbm=isch&tbs=itp:lineart&q=${clueText}'>Line art</a>`;
  } else {
    state.links.innerHTML = '';
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
  let answer = $('#overlay .content .text')[0].innerText;
  if (answer.slice(0, 14) === 'The word was: ') {
    answer = answer.slice(14);
    if (answer !== state.prevAnswer) {
      state.prevAnswer = answer;
      unsafeWindow.dictionary.oneOffWords = [];
      unsafeWindow.dictionary.guessed = [];
      unsafeWindow.dictionary.validAnswers = [];
      addToConfirmed(answer, username, password);
    }
  }
}

function makeGuess(clue) {
  if (validClue(clue) && !wordGuessed()) {
    const words = getWords(clue);
    const confWords = [];
    unsafeWindow.dictionary.confirmed.forEach((item) => {
      if (words.indexOf(item) !== -1) {
        confWords.push(item);
      }
    });
    let guess;
    if (confWords.length !== 0) {
      guess = confWords[Math.floor(Math.random() * confWords.length)];
    } else {
      guess = words[Math.floor(Math.random() * words.length)];
    }
    const submitProp = Object.keys(unsafeWindow.formChat)
      .filter(k => ~k.indexOf('jQuery'))[0]; // eslint-disable-line no-bitwise
    window.setTimeout(() => {
      if (getInput().val() === '' && validClue(clue) && !wordGuessed()) {
        getInput().val(guess);
        unsafeWindow.formChat[submitProp].events.submit[0].handler();
      }
    }, Math.floor((Math.random() * 800)));
  }
}

function toggleWordsList() {
  if ($(state.wordsList).is(':visible')) {
    if (state.wordsList.children().length === 0 || wordGuessed() || !validClue(getClueText())) {
      state.wordsList.hide();
    }
  } else if (state.wordsList.is(':hidden')) {
    if (state.wordsList.children().length > 0 && !wordGuessed() && validClue(getClueText())) {
      state.wordsList.show();
    }
  }
}

function stillHere() {
  if ($('.modal-dialog:contains(Are you still here?)').is(':visible') && document.hidden) {
    alert('Action required.');
  }
}

function main(username, password) {
  $('#audio').css({
    left: 'unset',
    right: '0px',
  }); // so it doesn't cover timer
  window.setInterval(scrollDown, 2000);
  $(state.links).css({
    padding: '0 1em 0 1em',
  });
  getClue().after(state.links);
  const formArea = $('#formChat')[0];
  $(state.content).css({
    position: 'relative',
    left: '295px',
    top: '-25px',
  });
  state.wordsList.css({
    width: '70%',
    margin: '0 auto',
    'margin-top': '10px',
    'background-color': '#eee',
    padding: '4px',
    'border-radius': '2px',
    'list-style-position': 'inside',
    columns: '4',
  });
  formArea.appendChild(state.content);
  $('#screenGame')[0].appendChild(state.wordsList[0]);
  const input = getInput()[0];
  input.style.border = '3px solid orange';
  window.setInterval(() => {
    clueChanged();
    answerShown(username, password);
    findCloseWords();
    findGuessedWords();
    toggleWordsList();
    stillHere();
  }, 800);
  $('#formChat').append($('<div style="background-color:#eee; position:relative; top:-20px; padding:0 5px; width:auto; margin:0;"><input id="guessEnabled" name="guessEnabled" style="width:5px; height:5px; filter: brightness(0.8);" type="checkbox"><label for="guessEnabled" style="all: initial; padding-left:5px;">Enable auto-guesser</label></div>'));

  let lastGuess = 0;
  let lastTyped = 0;
  window.setInterval(() => {
    if ($('#guessEnabled').is(':checked') && Date.now() - lastTyped > 1500 && Date.now() - lastGuess > 1500) {
      lastGuess = Date.now();
      makeGuess(getClueText());
    }
  }, 1000);
  getInput().keyup(() => {
    lastTyped = Date.now();
  });
  getInput().keyup(validateInput);
}

function fetchWords(username, password) {
  GM.xmlHttpRequest({
    method: 'GET',
    url: 'https://skribbler.herokuapp.com/api/default',
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    },
    onload(response1) {
      unsafeWindow.dictionary.standard = JSON.parse(response1.responseText);
      GM.xmlHttpRequest({
        method: 'GET',
        url: 'https://skribbler.herokuapp.com/api/words',
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
        onload(response2) {
          if (response2.status < 300 && response2.status >= 200) {
            alert('Login successful, words retrieved.');
            unsafeWindow.dictionary.confirmed = JSON.parse(response2.responseText);
            const run = window.setInterval(() => {
              if (getClue()) {
                clearInterval(run);
                main(username, password);
              }
            }, 500);
          } else {
            alert('Confirmed words not retrieved. Please try again later.');
          }
        },
      });
    },
  });
}

function createAccount(username, password) {
  GM.xmlHttpRequest({
    method: 'POST',
    data: JSON.stringify({
      username,
      password,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    url: 'https://skribbler.herokuapp.com/api/users',
    onload(response) {
      if (response.status === 201) {
        alert('User created.');
        fetchWords(username, password);
      } else if (response.status === 409) {
        alert('User already exists. Please reload and try another username.');
      } else {
        alert('User creation unsuccessful. Please try again later.');
      }
    },
  });
}

function getLoginDetails() {
  let username;
  let password;
  if (prompt('Have you already created your skribbler account? (yes/no)').toLowerCase() === 'yes') {
    username = prompt('Please enter your skribbler username').toLowerCase();
    password = prompt('Please enter your skribbler password');
    fetchWords(username, password);
  } else {
    username = prompt('Please enter a username').toLowerCase();
    password = prompt('Please enter a unique password');
    if (password === prompt('Reenter password')) {
      createAccount(username, password);
    }
  }
}

$(document).ready(() => {
  if (typeof GM === 'undefined') { // polyfill GM4
    GM = {}; // eslint-disable-line no-global-assign
    GM.xmlHttpRequest = GM_xmlhttpRequest; // eslint-disable-line camelcase
  }
  const activate = $('<button>Activate skribbler</button>');
  activate.css({
    'font-size': '0.6em',
  });
  $('.loginPanelTitle').first().append(activate);
  activate.click(() => {
    activate.hide();
    getLoginDetails();
  });
});
