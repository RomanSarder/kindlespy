/**
 * Created by Andrey Klochkov on 12.04.2015.
 */

/**
 * firefox browser API wrapper class
 */
function Api(){
}

Api.messageListener = function(message, callback){};

/**
 * Add message listener
 * @param messageListener
 */
Api.addListener = function(messageListener){
    Api.messageListener = messageListener;
    self.port.on('request', function(messageObject){
        messageListener(messageObject.message, function(response){
            self.port.emit('response-' + messageObject.id, response);
        });
    });
};

Api._idCounter = 0;
Api._generateMessageId = function(){
    return Date.now().toString() + Api._idCounter++;
};

Api.sentFromPageScript = function(){
    return typeof addon === 'undefined';
};

/**
 * Send a message to the active tab in browser
 * @param message
 * @param callback
 */
Api.sendMessageToActiveTab = function(message, callback){
    if (typeof callback === 'undefined') callback = function(){};
    if (Api.sentFromPageScript()){
        Api.messageListener(message, function(result){
            return callback(result);
        });
        return;
    }
    var messageId = Api._generateMessageId();
    addon.port.emit('request', {id: messageId, message: message});
    addon.port.once('response-' + messageId, function(result){
        return callback(result);
    });
};
// TODO: Following code should be in index.js
//var workers = [];
//function initEventScript(worker){
//    array.add(workers, worker);
//    worker.on('pageshow', function() { array.add(workers, this); });
//    worker.on('pagehide', function() { array.remove(workers, this); });
//    worker.on('detach', function() { array.remove(workers, this); });
//}
//
//popup.port.on('request', function(messageObject){
//    for (var i = 0; i < workers.length; i += 1) {
//        if (workers[i].tab.index === tabs.activeTab.index) {
//            workers[i].port.emit('request', messageObject);
//            workers[i].port.once('response-' + messageObject.id, function(result){
//                popup.port.emit('response-' + messageObject.id, result);
//            });
//        }
//    }
//});


Api.openNewTab = function(url){
    addon.port.emit('open-tab', url);
    addon.port.emit('close');
};
// TODO: Following code should be in index.js
//popup.port.on('open-tab', function(url){
//    tabs.open(url);
//});


Api.registerOnShowEvent = function(eventListener){
    addon.port.on('show', eventListener);
};

Api.storage = {
    set: function(data, callback){
        var port = (typeof addon !== 'undefined') ? addon.port : self.port;
        var messageId = Api._generateMessageId();
        port.emit('storage-set', {id: messageId, data: data});
        port.once('storage-set-response-' + messageId, function(result){
            callback(result);
        });
    },
    get: function(key, callback){
        var port = (typeof addon !== 'undefined') ? addon.port : self.port;
        var messageId = Api._generateMessageId();
        port.emit('storage-get', {id: messageId, key: key});
        port.once('storage-get-response-' + messageId, function(result){
            callback(result);
        });
    },
    clear: function(){
        var port = (typeof addon !== 'undefined') ? addon.port : self.port;
        port.emit('storage-clear');
    }
};

// TODO: Following code should be in index.js
//function storageGet(port, messageObject){
//    var result = {};
//    result[messageObject.key] = simpleStorage.storage[messageObject.key];
//    port.emit('storage-get-response-' + messageObject.id, result);
//}
//
//function storageSet(port, messageObject){
//    for (var property in messageObject.data){
//        if (messageObject.data.hasOwnProperty(property))
//            simpleStorage.storage[property] = messageObject.data[property];
//    }
//
//    var bytesInUse = simpleStorage.quotaUsage * 5242880; // 5Mb
//    port.emit('storage-set-response-' + messageObject.id, bytesInUse);
//}
//
//function storageClear(){
//    simpleStorage.storage = {};
//}
//
// TODO: In init worker function
//var port = worker.port;
//port.on('storage-get', function(messageObject){
//    storageGet(port, messageObject);
//});
//port.on('storage-set', function(messageObject){
//    storageSet(port, messageObject);
//});
//port.on('storage-clear', function(messageObject){
//    storageClear(port, messageObject);
//});
//
// TODO: In popup events section
//popup.port.on('storage-set', function(messageObject){
//    storageSet(popup.port, messageObject);
//});
//
//popup.port.on('storage-get', function(messageObject){
//    storageGet(popup.port, messageObject);
//});
//
//popup.port.on('storage-clear', function(){
//    storageClear();
//});
//
// TODO: In background events section
//backgroundWorker.port.on('storage-set', function(messageObject){
//    storageSet(backgroundWorker.port, messageObject);
//});
//
//backgroundWorker.port.on('storage-get', function(messageObject){
//    storageGet(backgroundWorker.port, messageObject);
//});
//
//backgroundWorker.port.on('storage-clear', function(){
//    storageClear();
//});


Api.addAlarmListener = function(alarmName, listener){
    self.port.on('alarm', function(name){
        if (name === alarmName) listener();
    })
};

Api.createAlarm = function(alarmName, periodInMinutes){
    self.port.emit('create-alarm', {alarmName: alarmName, periodInMinutes: periodInMinutes});
};

// TODO: Following code should be in index.js
//backgroundWorker.port.on('create-alarm', function(alarmData){
//    setInterval(function(alarmName) {
//        backgroundWorker.port.emit('alarm', alarmName);
//    }, alarmData.periodInMinutes * 60 * 1000, alarmData.alarmName);
//});