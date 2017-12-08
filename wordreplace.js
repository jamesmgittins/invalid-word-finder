var dictionary = [];
var inputWords = [];
var sortedArray = [];

$(document).ready(function() {
  $("#dictionary").on("change", function(){

  });
});

function changeStatus(value) {
  $("#status").html(value);
}

function loadDictionary() {
  var files = $("#dictionary")[0].files;

  if (files.length == 0) {
    changeStatus("You must select a dictionary file first!");
    return;
  }

  changeStatus("Loading dictionary file...");
  var file = files[0];
  var reader = new FileReader();
  reader.onload = function(event) {
    changeStatus("Dictionary file loaded, processing...");
    var tempDictionary = event.target.result.split(/\s+/g);
    dictionary = [];
    tempDictionary.forEach(function(word){
     dictionary[word.toUpperCase()] = true;
    });
    loadInputFiles();
  };
  reader.readAsText(file);
}

function loadInputFile(index) {
  var files = $("#input")[0].files;

  if (files.length == 0) {
    changeStatus("You must select an input file first!");
    return;
  }

  changeStatus("Loading input file " + (index + 1) + "...");
  var file = files[index];
  var reader = new FileReader();
  reader.onload = function(event) {
   changeStatus("Input file " + (index + 1) + " loaded, processing...");
   inputWords[index] = event.target.result.split(/\r|\n/);
  //  inputWords[index] = event.target.result.split(/\s+|\.|,|\(|\)|\/|"|-|:|;|\?|{|}|=|>|<|!|\+|\-|&|\[|\]/g);
   if (index < files.length - 1) {
     loadInputFile(index + 1);
   } else {
     startWorker();
   }
  };
  reader.readAsText(file);
}

function loadInputFiles() {
  loadInputFile(0);
}


function startWorker() {
  var worker = new Worker('wordworker.js');

  worker.addEventListener('message', function(e) {
    if (typeof e.data === "string") {
      changeStatus(e.data);
    } else {
      changeStatus(e.data.msg);
      updateBadWordCounter(e.data.badWords);
      if (e.data.complete) {
        $("#csv").prop("disabled",false);
      }
    }
  }, false);

  worker.postMessage({'cmd': 'start', 'dictionary': dictionary, "inputWords" : inputWords}); // Send data to our worker.
}

function processFiles() {
  loadDictionary();
}

function updateBadWordCounter(badWords) {

  sortedArray = [];

  Object.keys(badWords).forEach(function(key){
    sortedArray.push({key:key,value:badWords[key].value,context:badWords[key].context, lineNo:badWords[key].lineNo});
  });

  sortedArray.sort(function(a,b){
    if (a.value < b.value)
      return 1;
    if (a.value > b.value)
      return -1;
    return 0;
  });

  var wordsHtml = "";

  sortedArray.forEach(function(element){
    wordsHtml += "<tr><td>" + element.key + "</td><td>" + element.value + "</td><td>" + element.context + "</td><td>" + element.lineNo.substring(0,10) + "... </td></tr>";
  });

  $("#badWordTable > tbody").html(wordsHtml);
}

function downloadCSV() {
  var csvContent = "data:text/csv;charset=utf-8,word,occurrences,context,appears on lines\r\n";
  sortedArray.forEach(function(element){
    csvContent += element.key + "," + element.value + ",\"" + element.context + "\",\"" + element.lineNo + "\"\r\n";
  });
  var encodedUri = encodeURI(csvContent);
  window.open(encodedUri);
}
