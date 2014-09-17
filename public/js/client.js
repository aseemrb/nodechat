/* HTML5 magic
- GeoLocation
- WebSpeech
*/

// //WebSpeech API
// var final_transcript = '';
// var recognizing = false;
// var last10messages = []; //to be populated later
var smlist = [':car:', ':truck:', ':paw:', ':music:', ':bolt:', ':tree:', ':warning:', ':bomb:', ':bug:', ':bell-o:', ':camera:', ':magic:', ':gift:', ':meh-o:', ':smile-o:', ':clock-o:', ':star-o:', ':sun-o:']
function validlink(text){
  if(text.indexOf('http://')>-1 || text.indexOf('.com')>-1 || text.indexOf('.co')>-1 ||
    text.indexOf('.org')>-1 || text.indexOf('.in')>-1 || text.indexOf('.net')>-1 ||
    text.indexOf('.edu')>-1 || text.indexOf('.gov')>-1 || text.indexOf('.biz')>-1 ||
    text.indexOf('.mobi')>-1 || text.indexOf('https://')>-1)
    return true;
  return false;
}

function smiley(s){
  if(s==':)' || s==':-)' || s=='=)')return '<i class="fa fa-smile-o"></i>';
  else if(s==':(' || s==':-(' || s=='=(') return '<i class="fa fa-frown-o"></i>';
  else if(s==':|') return '<i class="fa fa-meh-o"></i>';
  else if(s=='<3' || s==':heart:') return '<i class="fa fa-heart-o"></i>';
  else if(s=='(y)' || s==':like:') return '<i class="fa fa-thumbs-o-up"></i>';
  else if(s==':dislike:') return '<i class="fa fa-thumbs-o-down"></i>';
  else if(smlist.indexOf(s)>-1 ) return '<i class="fa fa-'+s.substring(1, s.length-1)+'"></i>';
  else if(smlist.indexOf(s.substring(0, s.length-1)+'-o:')>-1) return '<i class="fa fa-'+s.substring(1, s.length-1)+'-o"></i>';
  return s;
}

// if (!('webkitSpeechRecognition' in window)) {
//   console.log("webkitSpeechRecognition is not available");
// } else {
//   var recognition = new webkitSpeechRecognition();
//   recognition.continuous = true;
//   recognition.interimResults = true;

//   recognition.onstart = function() {
//     recognizing = true;
//   };

//   recognition.onresult = function(event) {
//     var interim_transcript = '';
//     for (var i = event.resultIndex; i < event.results.length; ++i) {
//       if (event.results[i].isFinal) {
//         final_transcript += event.results[i][0].transcript;
//         $('#msg').addClass("final");
//         $('#msg').removeClass("interim");
//       } else {
//         interim_transcript += event.results[i][0].transcript;
//         $("#msg").val(interim_transcript);
//         $('#msg').addClass("interim");
//         $('#msg').removeClass("final");
//       }
//     }
//     $("#msg").val(final_transcript);
//     };
//   }

//   function startButton(event) {
//     if (recognizing) {
//       recognition.stop();
//       recognizing = false;
//       $("#start_button").prop("value", "Record");
//       return;
//     }
//     final_transcript = '';
//     recognition.lang = "en-GB"
//     recognition.start();
//     $("#start_button").prop("value", "Recording ... Click to stop.");
//     $("#msg").val();
//   }
// //end of WebSpeech

/*
Functions
*/
function toggleNameForm() {
   $("#login-screen").toggle();
}

function toggleChatWindow() {
  $("#main-chat-screen").toggle();
}

$(document).ready(function() {
  //setup "global" variables first
  var socket = io.connect("127.0.0.1:3000");    // ip config
  var myRoomID = null;

  $("form").submit(function(event) {
    event.preventDefault();
  });

  $("#conversation").bind("DOMSubtreeModified",function() {
    $("#conversation").animate({
        scrollTop: $("#conversation")[0].scrollHeight
      });
  });

  $("#main-chat-screen").hide();
  $("#errors").hide();
  $("#name").focus();
  $("#join").attr('disabled', 'disabled'); 
  
  if ($("#name").val() === "") {
    $("#join").attr('disabled', 'disabled');
  }

  //enter screen
  $("#nameForm").submit(function() {
    var name = $("#name").val();
    var device = "desktop";
    if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
      device = "mobile";
    }
    if (name === "" || name.length < 2) {
      $("#errors").empty();
      $("#errors").append("Please enter a name");
      $("#errors").show();
    } else {
      socket.emit("joinserver", name, device);
      toggleNameForm();
      toggleChatWindow();
      $("#msg").focus();
    }
  });

  $("#name").keypress(function(e){
    var name = $("#name").val();
    if(name.length < 2) {
      $("#join").attr('disabled', 'disabled'); 
    } else {
      $("#errors").empty();
      $("#errors").hide();
      $("#join").removeAttr('disabled');
    }
  });

  //main chat screen
  $("#chatForm").submit(function() {
    var msg = $("#msg").val();
    if (msg !== "") {
      socket.emit("send", msg);
      $("#msg").val("");
    }
  });

  //'is typing' message
  var typing = false;
  var timeout = undefined;

  function timeoutFunction() {
    typing = false;
    socket.emit("typing", false);
  }

  $("#msg").keypress(function(e){
    if (e.which !== 13) {
      if (typing === false && myRoomID !== null && $("#msg").is(":focus")) {
        typing = true;
        socket.emit("typing", true);
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 3000);
      }
    }
  });

  socket.on("isTyping", function(data) {
    if (data.isTyping) {
      if ($("#"+data.person+"").length === 0) {
        $("#updates").append("<li id='"+ data.person +"'><span class='text-muted'><i class='fa fa-keyboard-o'></i> " + data.person + " is typing ...</li>");
        timeout = setTimeout(timeoutFunction, 3000);
      }
    } else {
      $("#"+data.person+"").remove();
    }
  });


/*
  $("#msg").keypress(function(){
    if ($("#msg").is(":focus")) {
      if (myRoomID !== null) {
        socket.emit("isTyping");
      }
    } else {
      $("#keyboard").remove();
    }
  });

  socket.on("isTyping", function(data) {
    if (data.typing) {
      if ($("#keyboard").length === 0)
        $("#updates").append("<li id='keyboard'><span class='text-muted'><i class='fa fa-keyboard-o'></i>" + data.person + " is typing.</li>");
    } else {
      socket.emit("clearMessage");
      $("#keyboard").remove();
    }
    console.log(data);
  });
*/

  $("#showCreateRoom").click(function() {
    $("#createRoomForm").toggle();
  });

  $("#createRoomBtn").click(function() {
    var roomExists = false;
    var roomName = $("#createRoomName").val();
    socket.emit("check", roomName, function(data) {
      roomExists = data.result;
       if (roomExists) {
          $("#errors").empty();
          $("#errors").show();
          $("#errors").append("Room <i>" + roomName + "</i> already exists");
        } else {
        if (roomName.length > 0) { //also check for roomname
          socket.emit("createRoom", roomName);
          $("#errors").empty();
          $("#errors").hide();
          }
        }
    });
  });

  $("#rooms").on('click', '.joinRoomBtn', function() {
    var roomName = $(this).siblings("span").text();
    var roomID = $(this).attr("id");
    socket.emit("joinRoom", roomID);
  });

  $("#rooms").on('click', '.removeRoomBtn', function() {
    var roomName = $(this).siblings("span").text();
    var roomID = $(this).attr("id");
    socket.emit("removeRoom", roomID);
    $("#createRoom").show();
  }); 

  $("#leave").click(function() {
    var roomID = myRoomID;
    socket.emit("leaveRoom", roomID);
    $("#createRoom").show();
  });

  $("#people").on('click', '.whisper', function() {
    var name = $(this).siblings("span").text();
    $("#msg").val("w:"+name+":");
    $("#msg").focus();
  });
/*
  $("#whisper").change(function() {
    var peopleOnline = [];
    if ($("#whisper").prop('checked')) {
      console.log("checked, going to get the peeps");
      //peopleOnline = ["Tamas", "Steve", "George"];
      socket.emit("getOnlinePeople", function(data) {
        $.each(data.people, function(clientid, obj) {
          console.log(obj.name);
          peopleOnline.push(obj.name);
        });
        console.log("adding typeahead")
        $("#msg").typeahead({
            local: peopleOnline
          }).each(function() {
            if ($(this).hasClass('input-lg'))
              $(this).prev('.tt-hint').addClass('hint-lg');
        });
      });
      
      console.log(peopleOnline);
    } else {
      console.log('remove typeahead');
      $('#msg').typeahead('destroy');
    }
  });
  // $( "#whisper" ).change(function() {
  //   var peopleOnline = [];
  //   console.log($("#whisper").prop('checked'));
  //   if ($("#whisper").prop('checked')) {
  //     console.log("checked, going to get the peeps");
  //     peopleOnline = ["Tamas", "Steve", "George"];
  //     // socket.emit("getOnlinePeople", function(data) {
  //     //   $.each(data.people, function(clientid, obj) {
  //     //     console.log(obj.name);
  //     //     peopleOnline.push(obj.name);
  //     //   });
  //     // });
  //     //console.log(peopleOnline);
  //   }
  //   $("#msg").typeahead({
  //         local: peopleOnline
  //       }).each(function() {
  //         if ($(this).hasClass('input-lg'))
  //           $(this).prev('.tt-hint').addClass('hint-lg');
  //       });
  // });
*/

//socket-y stuff
socket.on("exists", function(data) {
  $("#errors").empty();
  $("#errors").show();
  $("#errors").append(data.msg + " Try <strong>" + data.proposedName + "</strong>");
    toggleNameForm();
    toggleChatWindow();
});

socket.on("joined", function() {
  $("#errors").hide();
  if (navigator.geolocation) { //get lat lon of user
    navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
  } else {
    $("#errors").show();
    $("#errors").append("Your browser is ancient and it doesn't support GeoLocation.");
  }
  function positionError(e) {
    console.log(e);
  }

  function positionSuccess(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    //consult the yahoo service
    $.ajax({
      type: "GET",
      url: "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.placefinder%20where%20text%3D%22"+lat+"%2C"+lon+"%22%20and%20gflags%3D%22R%22&format=json",
      dataType: "json",
       success: function(data) {
        socket.emit("countryUpdate", {country: data.query.results.Result.countrycode});
      }
    });
  }
});

socket.on("history", function(data) {
  if (data.length !== 0) {
    $("#msgs").append("<li style='background:#fff;'><hr style='border-color:#222;'></li>");
    $("#msgs").append("<li style='background:#fff;'><strong><span class='text-warning'>Last 10 messages:</span></strong></li>");
    $.each(data, function(data, msg) {
      var msgwords = msg.split(' ');
      msg = "";
      msgwords.forEach(function(text){
          if(validlink(text))
          {
            if(text.indexOf('http://')>-1)
              text = '<a style="text-decoration:underline;" target="_blank" href="'+text+'">'+text+'</a>';
            else
              text = '<a style="text-decoration:underline;" target="_blank" href="http://'+text+'">'+text+'</a>';

          }
          text = smiley(text);
          msg += text+' ';
      });
      $("#msgs").append("<li>" + msg + "</li>");
    });
    $("#msgs").append("<li style='background:#fff;'><hr style='border-color:#222;'></li>");
  } else {
    $("#msgs").append("<li style='background:#fff;'><strong><span class='text-warning'>No past messages in this room.</span></strong></li>");
  }
});

  socket.on("update", function(msg) {
    $("#msgs").append("<li style='background:#fff;'><small style='color:#0ad;'>" + msg + "</small></li>");
  });

  socket.on("update-people", function(data){
    $("#people").empty();
    $('#people').append("<li class=\"list-group-item active\"><b>People Online</b> <span class=\"badge\">"+data.count+"</span></li>");
    $.each(data.people, function(a, obj) {
      if (!("country" in obj)) {
        html = "";
      } else {
        html = "<img class=\"flag flag-"+obj.country+"\"/>";
      }
      $('#people').append("<li class=\"list-group-item\"><i class=\"fa fa-"+obj.device+"\"></i> <span>" + obj.name + "</span> " + html + " <a href=\"#\" class=\"whisper btn btn-xs\">whisper</a></li>");
    });
  });

  socket.on("chat", function(person, msg) {
    var msgwords = msg.split(' ');
    msg = "";
    msgwords.forEach(function(text){
        if(validlink(text))
        {
          if(text.indexOf('http://')>-1)
            text = '<a style="text-decoration:underline;" target="_blank" href="'+text+'">'+text+'</a>';
          else
            text = '<a style="text-decoration:underline;" target="_blank" href="http://'+text+'">'+text+'</a>';
        }
        text = smiley(text);
        msg += text+' ';
    });
    $("#msgs").append("<li><strong><span class='text-success'>" + person.name + "</span></strong>: " + msg + "</li>");
    

    //clear typing field
    $("#"+person.name+"").remove();
    clearTimeout(timeout);
    timeout = setTimeout(timeoutFunction, 0);
  });

  socket.on("whisper", function(person, msg) {
    if (person.name === "You") {
      s = "whisper"
    } else {
      s = "whispers"
    }
    $("#msgs").append("<li><strong><span class='text-muted'>" + person.name + "</span></strong> "+s+": " + msg + "</li>");
  });

  socket.on("roomList", function(data) {
    $("#rooms").text("");
    $("#rooms").append("<li class=\"list-group-item active\"><b>List of Rooms</b> <span class=\"badge\">"+data.count+"</span></li>");
     if (!jQuery.isEmptyObject(data.rooms)) { 
      $.each(data.rooms, function(id, room) {
        var html = "<button id="+id+" class='joinRoomBtn btn btn-default btn-xs' >Join</button>" + " " + "<button id="+id+" class='removeRoomBtn btn btn-default btn-xs'>Remove</button>";
        $('#rooms').append("<li id="+id+" class=\"list-group-item\"><i class='fa fa-weixin'></i> <strong> " + room.name + "</strong> " + html + "</li>");
      });
    } else {
      $("#rooms").append("<li class=\"list-group-item\">There are no rooms yet &nbsp;&nbsp;&nbsp;<img src='css/alone.jpg'></li>");
    }
  });

  socket.on("sendRoomID", function(data) {
    myRoomID = data.id;
  });

  socket.on("disconnect", function(){
    $("#msgs").append("<li><strong><span class='text-warning'>The server is not available</span></strong></li>");
    $("#msg").attr("disabled", "disabled");
    $("#send").attr("disabled", "disabled");
  });

});
