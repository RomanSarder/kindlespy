/**
 * Created by Andrey Klochkov on 11.10.2014.
 */

function BookStorage(){
    this._storage = chrome.storage.local;
}

var bookDataExample = {
    trackingEnabled: true,
    title: 'test title',
    author: 'A. Lastname',
    image: 'http://url.to/image.png', // not yet available
    currentSalesRank: 2233,
    price: '$7.95',
    pages: 131, // Print length
    estSales: 2233,
    estSalesRev: '$7,000.00',
    numberOfReviews: 31,
    estDailyRev: '$233.00', // TODO: how to get it?
    salesRankData: []
};

BookStorage.prototype.EnableTracking = function(bookUrl) {
    //TODO: search url in storage
    this.GetBookFromStorage(bookUrl, function(bookData){
        //TODO: if not found, add new item to storage

        //TODO: change status to tracking
        //TODO: update data

    });
};

BookStorage.prototype.DisableTracking = function(bookUrl) {
    //TODO: search url in storage
    //TODO: change status to not-tracking

    ;
};

BookStorage.prototype.GetBookFromStorage = function(bookUrl, callback){
    this._storage.get('trackingData', function(items){
        callback(items[bookUrl]);
    });
};

/**
 *
 * @param bookUrl
 * @param bookData
 * @param callback function(integer bytesInUse) {...};
 */
BookStorage.prototype.UpdateBookInStorage = function(bookUrl, bookData, callback){
    var _this = this;
    this._storage.get('trackingData', function(items){
        items[bookUrl] = bookData;
        _this._storage.set({trackingData: items}, callback);
    });
};

BookStorage.prototype.TrackData = function (){
    var _this = this;
    this._storage.get('lastUpdate', function(result){
        var dateDiffMillis = Date.now() - Number(result);
        // if previous update was < 2h ago then do nothing
        if(dateDiffMillis / 1000 / 60 / 60 < 2) return;
        _this._storage.set({lastUpdate:Date.now()}, function(bytesInUse){
            //var today = new Date().setHours(0,0,0,0);
            //TODO: iterate through all tracked books
            //TODO: if the last data is not from today
            //TODO: add the today's day data
        });
    });
};

