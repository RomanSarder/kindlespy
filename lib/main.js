var buttons = require('sdk/ui/button/toggle');
var tabs = require('sdk/tabs');
var panels = require('sdk/panel');
var self = require('sdk/self');
var pageMod = require('sdk/page-mod');
var simpleStorage = require('sdk/simple-storage');
var array = require('sdk/util/array');

// page scripts
var workers = [];

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

function closePopup(){
    popup.hide();
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
}

pageMod.PageMod({
    include: ['about:blank', '*'],
    attachTo: 'top',
    onAttach: initEventScript,
    contentScriptWhen: 'start',
    contentScriptFile: [
        './libs/jquery-2.0.3.min.js',
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
        "./src/page/BestSellersPage.js",
        "./src/page/AuthorPage.js",
        "./src/page/SearchResultsPage.js",
        "./src/page/AuthorSearchResultsPage.js",
        "./src/page/SingleBookPage.js",
        "./src/pageScript.js"
    ]
});


function handleChange(state){
    if(state.checked){
        return popup.show({
            position: button
        });
    }

    closePopup();
}

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

tabs.on('open', function () {
    closePopup();
});

function handleHide(){
    button.state('window', {checked: false});
}

var popup = panels.Panel({
    width: 772,
    height: 596,
    contentURL: './src/popup.html',
    onHide: handleHide
});

popup.on('show', function(){
    popup.port.emit('show');
});

popup.port.on('close', function(){
    closePopup();
});

popup.port.on('open-tab', function(url){
    tabs.open(url);
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
        }
    }
});