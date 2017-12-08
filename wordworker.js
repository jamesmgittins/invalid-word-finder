function checkWordIsBad(word, context, lineNo) {

  if (!isNaN(word) || word.match(/^\$?\d+%?s?/g))
    return;

  var badWord = true;
  if (dictionary[word.toUpperCase()]) {
    badWord = false;
  }
  if (badWord) {
    if (self.badWords[word] == undefined) {
      var start = context.indexOf(word) - 30;
      var end = context.indexOf(word) + 30 + word.length;
      self.badWords[word] = {key:word, value:1, context:context.substring(start, end), lineNo: (lineNo + 1).toFixed()};
    } else {
      self.badWords[word].value++;
      self.badWords[word].lineNo += ", " + lineNo + 1;
    }
    var percentage = (self.count / self.totalWords * 100);
    if (percentage > self.lastUpdatedList + 1) {
      self.postMessage("Processing (" + (self.count / self.totalWords * 100).toFixed() + "%)");
    }
  }
}

function checkForBadWords() {
  console.log("worker checking for bad words");
  self.totalWords = 0;
  self.count = 0;
  self.lastUpdatedList = 0;
  for (var x = 0; x < self.inputWords.length; x++) {
    self.totalWords += self.inputWords[x].length;
  }
  for (var x = 0; x < self.inputWords.length; x++) {
    for (var i = 0; i < self.inputWords[x].length; i++) {
      var linesWords = self.inputWords[x][i].split(/\s+|\.|,|\(|\)|\/|"|-|:|;|\?|{|}|=|>|<|!|\+|\-|&|\[|\]|\^|\*|—/g);
      for (var j = 0; j < linesWords.length; j++) {
        checkWordIsBad(linesWords[j], self.inputWords[x][i], i);
      }
      self.count++;
    }
  }
  self.postMessage({badWords:self.badWords, msg:"Process Complete!", complete:true});
}


self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'start':
      self.postMessage('Processing Started');
      self.inputWords = data.inputWords;
      self.dictionary = data.dictionary;
      self.badWords = [];
      checkForBadWords();
      break;
    case 'stop':
      self.postMessage("Processing Stopped");
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  }
}, false);
