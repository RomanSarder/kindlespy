/**
 * Created by Andrey Klochkov on 16.04.2015.
 */

// This script is for Firefox browser only

var buttons = require('sdk/ui/button/toggle');
var tabs = require('sdk/tabs');
var panels = require('sdk/panel');
var self = require('sdk/self');
var pageMod = require('sdk/page-mod');
var simpleStorage = require('sdk/simple-storage');
var array = require('sdk/util/array');
var pageWorker = require("sdk/page-worker");
var { setInterval } = require("sdk/timers");
var request = require("sdk/request").Request;
var base64 = require("sdk/base64");

// page scripts
var workers = [];


// Storage
function storageGet(port, messageObject){
    var result = {};
    result[messageObject.key] = simpleStorage.storage[messageObject.key];
    port.emit('storage-get-response-' + messageObject.id, result);
}

function storageSet(port, messageObject){
    for (var property in messageObject.data){
        if (messageObject.data.hasOwnProperty(property))
            simpleStorage.storage[property] = messageObject.data[property];
    }

    var bytesInUse = simpleStorage.quotaUsage * 5242880; // 5Mb
    port.emit('storage-set-response-' + messageObject.id, bytesInUse);
}

function storageClear(){
    simpleStorage.storage = {};
}


function initEventScript(worker){
    array.add(workers, worker);
    worker.on('pageshow', function() { array.add(workers, this); });
    worker.on('pagehide', function() { array.remove(workers, this); });
    worker.on('detach', function() { array.remove(workers, this); });

    var port = worker.port;
    port.on('storage-get', function(messageObject){
        storageGet(port, messageObject);
    });
    port.on('storage-set', function(messageObject){
        storageSet(port, messageObject);
    });
    port.on('storage-clear', function(messageObject){
        storageClear(port, messageObject);
    });
    port.on('request-bg', function(messageObject){
        backgroundWorker.port.emit('request-bg', messageObject);
        backgroundWorker.port.once('response-bg-' + messageObject.id, function(result){
            port.emit('response-bg-' + messageObject.id, result);
        });
    });
}

// Page script
pageMod.PageMod({
    include: ['*'],
    attachTo: ['existing', 'top'],
    onAttach: initEventScript,
    contentScriptWhen: 'start',
    contentScriptFile: [
        './libs/jquery-2.1.4.min.js',
        './browser-api/Firefox.js',
        "./src/common/Helper.js",
        "./src/common/Pager.js",
        "./src/common/BookStorage.js",
        "./src/common/AsyncRunner.js",
        "./src/common/DataStorage.js",
        "./src/parser/BookPageParser.js",
        "./src/parser/SearchPageParser.js",
        "./src/amazon/AmazonComParser.js",
        "./src/amazon/AmazonCoUkParser.js",
        "./src/amazon/AmazonDeParser.js",
        "./src/amazon/AmazonFrParser.js",
        "./src/amazon/AmazonCaParser.js",
        "./src/amazon/AmazonItParser.js",
        "./src/amazon/AmazonEsParser.js",
        "./src/amazon/AmazonInParser.js",
        "./src/amazon/AmazonJpParser.js",
        "./src/page/BestSellersPage.js",
        "./src/page/AuthorPage.js",
        "./src/page/SearchResultsPage.js",
        "./src/page/AuthorSearchResultsPage.js",
        "./src/page/SingleBookPage.js",
        "./src/pageScript.js"
    ]
});

function closePopup(){
    popup.hide();
}

function handleChange(state){
    if(state.checked){
        return popup.show({
            position: button
        });
    }

    closePopup();
}

// Button
var button = buttons.ToggleButton({
    id: 'extension-button',
    label: 'KindleSpy',
    icon: {
        '16': './icons/zoom-16.png',
        '48': './icons/zoom-48.png',
        '128': './icons/zoom-128.png'
    },
    onChange: handleChange
});


function handleHide(){
    button.state('window', {checked: false});
}

// Popup panel
var popup = panels.Panel({
    width: 772,
    height: 596,
    contentURL: './src/popup.html',
    onHide: handleHide
});

// Events
popup.on('show', function(){
    popup.port.emit('show');
});

popup.port.on('close', function(){
    closePopup();
});

popup.port.on('open-tab', function(url){
    tabs.open(url);
});

popup.port.on('get-image-data-request', function(messageObject){
    request({
        url: messageObject.message.url,
        overrideMimeType:"text/plain; charset=x-user-defined",
        onComplete: function(imageData) {
            var imageData = "data:image/jpeg;base64,"+base64.encode(imageData.text);
            popup.port.emit('get-image-data-response-' + messageObject.id, imageData);
        }
    }).get();
});

popup.port.on('storage-set', function(messageObject){
    storageSet(popup.port, messageObject);
});

popup.port.on('storage-get', function(messageObject){
    storageGet(popup.port, messageObject);
});

popup.port.on('storage-clear', function(){
    storageClear();
});

popup.port.on('request', function(messageObject){
    for (var i = 0; i < workers.length; i += 1) {
        if (workers[i].tab.index === tabs.activeTab.index) {
            workers[i].port.emit('request', messageObject);
            workers[i].port.once('response-' + messageObject.id, function(result){
                popup.port.emit('response-' + messageObject.id, result);
            });
            return;
        }
    }
    popup.port.emit('response-' + messageObject.id/*, undefined*/);
});

popup.port.on('request-bg', function(messageObject){
    backgroundWorker.port.emit('request-bg', messageObject);
    backgroundWorker.port.once('response-bg-' + messageObject.id, function(result){
        popup.port.emit('response-bg-' + messageObject.id, result);
    });
});


tabs.on('open', function () {
    closePopup();
});

// Page worker
var backgroundWorker = pageWorker.Page({
    contentScriptFile: [
        './libs/jquery-2.1.4.min.js',
        './browser-api/Firefox.js',
        "./src/common/Helper.js",
        "./src/common/BookStorage.js",
        "./src/parser/BookPageParser.js",
        "./src/amazon/AmazonComParser.js",
        "./src/amazon/AmazonCoUkParser.js",
        "./src/amazon/AmazonDeParser.js",
        "./src/amazon/AmazonFrParser.js",
        "./src/amazon/AmazonCaParser.js",
        "./src/amazon/AmazonItParser.js",
        "./src/amazon/AmazonEsParser.js",
        "./src/amazon/AmazonInParser.js",
        "./src/amazon/AmazonJpParser.js",
        './src/background.js'
    ]
});

backgroundWorker.port.on('create-alarm', function(alarmData){
    setInterval(function(alarmName) {
        backgroundWorker.port.emit('alarm', alarmName);
    }, alarmData.periodInMinutes * 60 * 1000, alarmData.alarmName);
});

backgroundWorker.port.on('storage-set', function(messageObject){
    storageSet(backgroundWorker.port, messageObject);
});

backgroundWorker.port.on('storage-get', function(messageObject){
    storageGet(backgroundWorker.port, messageObject);
});

backgroundWorker.port.on('storage-clear', function(){
    storageClear();
});

backgroundWorker.port.on('request', function(messageObject){
    for (var i = 0; i < workers.length; i += 1) {
        if (workers[i].tab.index === tabs.activeTab.index) {
            workers[i].port.emit('request', messageObject);
            workers[i].port.once('response-' + messageObject.id, function(result){
                backgroundWorker.port.emit('response-' + messageObject.id, result);
            });
            return;
        }
    }
    backgroundWorker.port.emit('response-' + messageObject.id/*, undefined*/);
});

var backgroundTab;
backgroundWorker.port.on('open-tab', function(request){
    var tab = tabs.open({
        url: 'http://example.com',
        inBackground: true,
        onReady: function (tab){
            backgroundTab = tab;
            tab.attach({
                contentScriptFile: [ ],
                contentScriptOptions: request
            })
        }
    });
});

backgroundWorker.port.on('close-tab', function(url){
    backgroundTab.close();
});

