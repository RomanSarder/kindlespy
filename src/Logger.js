/**
 * Created by Andrey Klochkov on 30.10.2014.
 */
function Logger() {
    Logger.userID;
}

var waitForId = false;
Logger.prototype.GetCustomerID = function(callback){
    callback = ValueOrDefault(callback, function() {});
    if (waitForId) {
        var _this = this;
        setTimeout(function(){_this.GetCustomerID(callback);}, 700);
        return;
    }
    if ((Logger.userID!==undefined)&&(Logger.userID!="")) callback(Logger.userID);
    waitForId = true;
    var _this = this;
    this.GetCustomerIDFromStorage(function(id){
        if(id === undefined){
            _this.GetCustomerIDFromFile(function(id){
                _this.SaveCustomerIDToStorage(id);
                Logger.userID = id;
                waitForId = false;
                callback(id);
                return;
            });
        }else{
            Logger.userID = id;
            waitForId = false;
            callback(id);
        }
    });
};

Logger.prototype.GetCustomerIDFromFile = function(callback){
    callback = ValueOrDefault(callback, function() {});
    $.ajax({
        type: "GET",
        url:  "http://www.kdspy.com/kdspy-log/Logger.php",
        data: "f=getId"
    })
    .success(function( id ) {
        if (id == "fail") callback(undefined);
        else if (id === undefined) callback(undefined);
        callback(id);
    })
    .error(function(XMLHttpRequest, textStatus, errorThrown) {
        console.error(textStatus);
        callback(undefined);
    });
};

Logger.prototype.GetCustomerIDFromStorage = function(callback){
    callback = ValueOrDefault(callback, function() {});
    chrome.storage.local.get("customerID", function(item) {
        if(item !== undefined && item.customerID !== undefined) {
            callback(item.customerID);
            return;
        }
        callback(undefined);
    });
};

Logger.prototype.SaveCustomerIDToStorage = function(id){
    chrome.storage.local.get("customerID", function(item) {
        if(item === undefined) item = {};
        item["customerID"] = id;
        chrome.storage.local.set(item);
    });
};

Logger.prototype.SaveLogDataToFile = function(text){
    this.GetCustomerID(function(result){
        $.ajax({
            type: "GET",
            data: {f:"saveToLogFile",id:result,t:text},
            url: "http://www.kdspy.com/kdspy-log/Logger.php"
        })
            .success(function( status ) {
                //console.log("Save log-data to file.");
            })
            .error(function(XMLHttpRequest, textStatus, errorThrown) {
                console.error(textStatus)
            });
    });
 };
