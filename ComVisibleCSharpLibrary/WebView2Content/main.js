console.info("main");

var delayInMilliseconds = 2000; //1 second

setTimeout(function() {
    console.info("timeout");
    var div = document.getElementById('h1');

    div.innerHTML += ' Extra stuff';
  //your code to be executed after 1 second
}, delayInMilliseconds);

function show(msg) {
    console.log("show called")
    var div = document.getElementById('h2');
    div.innerHTML = msg;
    return "done"
}


document.showMsg = function (msg) {
    console.info("showMsg");
    var div = document.getElementById('h2');
    div.innerHTML += "message"; // msg;
  //your code to be executed after 1 second
}
   