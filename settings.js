////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//  Copyright © 2015 Intermatrix                                              //
//  All rights reserved.                                                      //
//                                                                            //
//  http://www.intermatrix.com.au                                             //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

System.Gadget.onSettingsClosing = SettingsClosing;

function onLoad() {
    loadSettings();
}

function onUnload() {
    saveSettings();
}

function SettingsClosing(event) {
    if (event.closeAction == event.Action.commit) {
        saveSettings();
        System.Gadget.document.parentWindow.loadSettings();
        System.Gadget.document.parentWindow.onTimer();
        System.Gadget.document.parentWindow.gamerTag1.innerText = '';
    }
}

function loadSettings() {
    txtApiKey.value = System.Gadget.Settings.readString("APIKey");
}

function saveSettings() {
    var username = document.getElementById("txtApiKey").value;
    System.Gadget.Settings.write("APIKey", username);
}