console.info("main");

var delayInMilliseconds = 1000; //1 second

setTimeout(function() {
    console.info("timeout");
    var div = document.getElementById('h1');

    div.innerHTML += ' Extra stuff';

    var divp = document.getElementById('p1');
    divp.innerHTML = "Waiting"
  //your code to be executed after 1 second
}, delayInMilliseconds);

function showMsg(msg){
  var divp = document.getElementById('p1');
  console.log("got msg:", msg);
  divp.innerHTML = msg

}
