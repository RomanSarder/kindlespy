/**
 * Created by Andrey Klochkov on 11.10.2014.
 */

function BookStorage() {
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
    salesRankData: [
        {date: Date.UTC(2014, 11, 9), salesRank: 100},
        {date: Date.UTC(2014, 11, 10), salesRank: 110}
    ]
};

BookStorage.prototype.Clear = function () {
    this._storage.clear();
};

BookStorage.prototype.EnableTracking = function(bookUrl) {
    var _this = this;
    //TODO: search url in storage
    this.GetBookFromStorage(bookUrl, function(bookData) {
        console.log(bookData);
        var changeStatus = function(bookData){
            //TODO: change status to tracking
            console.log('aa');

            bookData.trackingEnabled = true;
            //TODO: update data
            _this.UpdateBookInStorage(bookUrl, bookData, function() {});
        };

        if(bookData !== undefined) {
            changeStatus(bookData);
            return;
        }

        //TODO: if not found, add new item to storage
        console.log('bb');
        var bookParser = new BookPageParser();
        bookParser.GetBookData(bookUrl, null, null, function(book){
            console.log('bbb');
            var bookData = {
                trackingEnabled: true,
                title: book.title,
                author: book.author,
                image: 'http://url.to/image.png', // not yet available
                currentSalesRank: book.salesRank,
                price: book.price,
                pages: book.printLength,
                estSales: book.estSale,
                estSalesRev: book.salesRecv,
                numberOfReviews: book.reviews,
                estDailyRev: '$233.00', // TODO: how to get it?
                salesRankData: [
                    {date: Date.UTC(2014, 11, 9), salesRank: 100},
                    {date: Date.UTC(2014, 11, 10), salesRank: 110}
                ]
            };

            changeStatus(bookData);
        });
    });
};

BookStorage.prototype.DisableTracking = function(bookUrl) {
    var _this = this;
    //TODO: search url in storage
    this.GetBookFromStorage(bookUrl, function(bookData) {
        //TODO: change status to not-tracking
        console.debug(bookData);
        if(bookData === undefined) return;
        bookData.trackingEnabled = false;
        _this.UpdateBookInStorage(bookUrl, bookData, function(bytesInUse) {});
    });
};

BookStorage.prototype.GetBookFromStorage = function(bookUrl, callback) {
    this._storage.get('trackingData', function(items) {
        console.log(items);
        if(items !== undefined && items.trackingData !== undefined) callback(items.trackingData[bookUrl]);
        callback(undefined);
    });
};

/**
 *
 * @param bookUrl
 * @param bookData
 * @param callback function(integer bytesInUse) {...};
 */
BookStorage.prototype.UpdateBookInStorage = function(bookUrl, bookData, callback) {
    var _this = this;
    this._storage.get('trackingData', function(items) {
        console.log(items);
        if(items === undefined) items = {};
        if(items.trackingData === undefined) items.trackingData = {};
        items.trackingData[bookUrl] = bookData;
        _this._storage.set(items, callback);
    });
};

BookStorage.prototype.TrackData = function () {
    var _this = this;
    this._storage.get('lastUpdate', function(result) {
        console.log(result);
        if(result === undefined) result = {};
        if(result.lastUpdate === undefined) result.lastUpdate = 0;
        console.log(result.lastUpdate);
        var dateDiffMillis = Date.now() - Number(result.lastUpdate);
        console.log(dateDiffMillis);
        // if previous update was < 2h ago then do nothing
        if(dateDiffMillis / 1000 / 60 / 60 < 2) return;
        _this._storage.set({lastUpdate:Date.now()}, function(bytesInUse) {
            //var today = new Date().setHours(0,0,0,0);
            //TODO: iterate through all tracked books
            //TODO: if the last data is not from today
            //TODO: add the today's day data
        });
    });
};
