declare let unsafeWindow: UnsafeWindow;
declare let GM: GM;
declare let GM_xmlhttpRequest: any;

interface UnsafeWindow {
  dictionary: Dictionary;
  formChat: any;
  submitGuess: any;
  getInput: any;
}

interface Dictionary {
  confirmed: string[];
  guessed: string[];
  oneOffWords: string[];
  standard: string[];
  validAnswers: string[];
}

interface GM {
  xmlHttpRequest: any;
}
