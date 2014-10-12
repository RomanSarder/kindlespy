/**
 * Created by Andrey Klochkov on 11.10.2014.
 */

function BookStorage() {
    this._storage = chrome.storage.local;
}

var bookDataExample = {
    url: 'http://book.url',
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

/**
 * Empty storage
 */
BookStorage.prototype.Clear = function () {
    this._storage.clear();
};

/**
 * Enable tracking for the book
 * @param bookUrl
 */
BookStorage.prototype.EnableTracking = function(bookUrl) {
    var _this = this;
    // search url in storage
    this.GetBook(bookUrl, function(bookData) {
        var changeStatus = function(bookData){
            // change status to tracking
            bookData.trackingEnabled = true;
            // update data
            _this.UpdateBookInStorage(bookUrl, bookData, function() {});
        };

        if(bookData !== undefined) {
            changeStatus(bookData);
            return;
        }

        // if not found, add new item to storage
        _this.InitBookFromUrl(bookUrl, changeStatus);
//        var bookParser = new BookPageParser();
//        bookParser.GetBookData(bookUrl, null, null, function(book){
//            var bookData = {
//                url: bookUrl,
//                trackingEnabled: true,
//                title: book.title,
//                author: book.author,
//                image: 'http://url.to/image.png', // TODO: fix after parsing is done
//                currentSalesRank: book.salesRank,
//                price: book.price,
//                pages: book.printLength,
//                estSales: book.estSale,
//                estSalesRev: book.salesRecv,
//                numberOfReviews: book.reviews,
//                estDailyRev: '$233.00', // TODO: how to get it?
//                salesRankData: [
//                    {date: Date.UTC(2014, 11, 9), salesRank: 100},
//                    {date: Date.UTC(2014, 11, 10), salesRank: 110}
//                ]
//            };
//
//            changeStatus(bookData);
//        });
    });
};

/**
 * Disable tracking for the book
 * @param bookUrl
 */
BookStorage.prototype.DisableTracking = function(bookUrl) {
    var _this = this;
    // search url in storage
    this.GetBook(bookUrl, function(bookData) {
        if(bookData === undefined) return;
        // change status to not-tracking
        bookData.trackingEnabled = false;
        _this.UpdateBookInStorage(bookUrl, bookData, function(bytesInUse) {});
    });
};

/**
 * Takes a book from the storage and returns it
 * If not found, grabs data from the page
 * @param bookUrl
 * @param callback function(object bookData) {...};
 */
BookStorage.prototype.GetBook = function(bookUrl, callback) {
    this._storage.get('trackingData', function(items) {
        if(items !== undefined && items.trackingData !== undefined) {
            callback(items.trackingData[bookUrl]);
            return;
        }

        callback(undefined);
    });
};

BookStorage.prototype.InitBookFromUrl = function(bookUrl, callback) {
    var bookParser = new BookPageParser();
    bookParser.GetBookData(bookUrl, null, null, function(book){
        var bookData = {
            url: bookUrl,
            trackingEnabled: false,
            title: book.title,
            author: book.author,
            image: book.imageUrl,
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
        callback(bookData);
    });
};

/**
 * Returns all books from the storage
 * @param callback function(object bookData) {...};
 */
BookStorage.prototype.GetAllBooks = function(callback) {
    this._storage.get('trackingData', function(items) {
        if(items !== undefined && items.trackingData !== undefined) callback(items.trackingData);
        callback(undefined);
    });
};

/**
 * Inserts or updates a book in the storage with new bookData object
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

/**
 * Scans all books and fill them with today's data
 */
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
