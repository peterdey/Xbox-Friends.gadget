////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//  Copyright © 2015 Intermatrix                                              //
//  All rights reserved.                                                      //
//                                                                            //
//  http://www.intermatrix.com.au                                             //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

System.Gadget.settingsUI = "settings.html";
System.Gadget.onSettingsClosed = onSettingsClosed;

var apiKey;
var callsPerHour = 120;
var apiError = false;
var totalUsage = 0;
var timer;
var timeout;

var friends = new Array();
 
function onLoad() {
    loadSettings();
    onTimer();
    setInterval("refreshDisplay()", 10000);
}

function onUnload() {
}

function onSettingsClosed() {
    loadSettings();
}

function onTimer() {
    apiError = false;
    fetchFriends();
    refreshDisplay();
}

function fetchFriends() {
    if (apiKey == '') {
        gamerTag1.innerText = "API Key not set.";
        gamerTag1.style.color = '#E11841';
        apiError = true;
        return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('get', 'https://xboxapi.com/v2/2535415988011128/friends', true);
    xhr.responseType = 'text';
    xhr.setRequestHeader("X-AUTH", apiKey);
    xhr.onreadystatechange = function () {
        gadgetTitle.innerText = "Refreshing" + Array(xhr.readyState+1).join(".");
        if (xhr.readyState==4 && xhr.status==403) {
            gadgetTitle.innerText = "API Rate Limit Exceeded";
            gamerTag1.innerText = "API Rate Limit Exceeded";
            gamerTag1.style.color = '#E11841';
            apiError = true;
            
            // API Rate Limit exceeded; retry in 5 mins.
            clearInterval(timer);
            clearTimeout(timeout);
            timeout = setTimeout("onTimer()", (5*60000));
        } else if (xhr.readyState==4 && xhr.status==200) {
            clearTimeout(timeout);
            gadgetTitle.innerText = "Friends Online";
            apiError = false;
            
            eval('var freshFriends = ' + xhr.responseText);
            if (freshFriends.length != friends.length) {
                // Number of friends has changed.  Update friends array, and reset the refresh timer.
                friends.length = 0;
                eval('friends = ' + xhr.responseText);
                
                // Set refresh timer so we don't exceed our API Rate Limit.
                if (friends.length > 0)
                    var delay = (friends.length + 1) / (callsPerHour / (60*60000));
                else // In case we didn't get any friends for some reason.
                    var delay = 60000;
                clearInterval(timer);
                timer = setInterval("onTimer()", delay);
            }
            refreshDisplay();
            fetchPresence();
        } else if (xhr.readyState == 4) {
            gamerTag1.innerText = "Error " + xhr.status;
            gamerTag1.style.color = '#E11841';
            gamerTag2.innerText = xhr.responseBody;
        }
    }
    xhr.send();
    totalUsage++;
    
    // Set 1 minute timeout to retry, in case of failure.
    clearTimeout(timeout);
    timeout = setTimeout("onTimer()", 60000);
}


function fetchPresence() {
    var xhr = [];
    for (i = 0; i < friends.length; i++){
        (function (i){
            xhr[i] = new XMLHttpRequest();
            xhr[i].open('get', 'https://xboxapi.com/v2/' + friends[i].id + '/presence', true);
            xhr[i].responseType = 'text';
            xhr[i].setRequestHeader("X-AUTH", apiKey);
            xhr[i].onreadystatechange = function () {
                if (xhr[i].readyState == 4 && xhr[i].status == 200) {
                    gamerTag1.innerText = "xhr[" + i + "]: " + xhr[i].readyState;
                    var data;
                    eval('data = ' + xhr[i].responseText);
                    friends[i].presence = data;
                    refreshDisplay();
                }
            };
            xhr[i].send();
            totalUsage++;
        })(i);
    }
}

function refreshDisplay() {
    var label;
    
    usgTotal.innerText = totalUsage;
    
    var numOnline = 0;
    for (i = 0; i < friends.length; i++) {
        if (friends[i].presence != null && friends[i].presence.state != 'Offline') {
            numOnline++;
            if (numOnline <= 5) {
                label = document.getElementById("gamerTag" + numOnline);
                game = document.getElementById("gameTitle" + numOnline);

                label.innerText = friends[i].Gamertag;
                game.innerText = '';
                try {
                    game.innerText = friends[i].presence.devices[0].titles[0].name.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
                } catch (ex) { }

                ping = document.getElementById("bar" + numOnline);
                pingImg = document.getElementById("imgbar" + numOnline);
                if (friends[i].presence.state == 'Online') {
                    label.style.color = '#90EE90';
                    ping.style.width = 6;
                    pingImg.src = 'bargreen.png';
                } else if (friends[i].presence.state == 'Away') {
                    label.style.color = '#FFA07A';
                    ping.style.width = 6;
                    pingImg.src = 'barorange.png';
                }
            }
        }
    }
    if (numOnline < 5 && friends.length > 0) {
        for (i = numOnline+1; i <= 5; i++) {
            label = document.getElementById("gamerTag" + i);
            game = document.getElementById("gameTitle" + i);
            ping = document.getElementById("bar" + i);
            label.innerText = "";
            game.innerText = "";
            ping.style.width = 0;
        }
    }
    if (apiError) {
    } else if (numOnline == 0 && friends.length > 0) {
        gamerTag1.innerText = "0/" + friends.length + " friends online.";
        gamerTag1.style.color = '#87CEFA';
    }
}    
    

function loadSettings() {
    var oFSO = new ActiveXObject("Scripting.FileSystemObject");
    apiKey = System.Gadget.Settings.read("APIKey");
    
    if (apiKey == "" && oFSO.FileExists(System.Gadget.path+"\\apikey.txt")) {
        var apiKeyFileFile = oFSO.OpenTextFile(System.Gadget.path+"\\apikey.txt", 1);
        apiKey = apiKeyFileFile.ReadLine();
        apiKeyFileFile.Close();
    }
}
