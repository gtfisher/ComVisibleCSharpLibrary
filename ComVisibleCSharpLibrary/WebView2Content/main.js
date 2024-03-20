console.info("main");

var delayInMilliseconds = 2000; //1 second

setTimeout(function() {
    console.info("timeout");
    var div = document.getElementById('h1');

    div.innerHTML += ' Extra stuff';
  //your code to be executed after 1 second
}, delayInMilliseconds);


