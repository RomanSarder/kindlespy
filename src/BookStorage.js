/**
 * Created by Andrey Klochkov on 11.10.2014.
 */

function BookStorage() {
    if ( BookStorage.prototype._singletonInstance )
        return BookStorage.prototype._singletonInstance;
    BookStorage.prototype._singletonInstance = this;

    this._storage = chrome.storage.local;
    this.logger = new Logger();
}

var bookDataExample = {
    url: 'http://book.url',
    trackingEnabled: true,
    title: 'test title',
    description: 'test description',
    author: 'A. Lastname',
    image: 'http://url.to/image.png', // not yet available
    currentSalesRank: 2233,
    price: '$7.95',
    pages: 131, // Print length
    estSales: 2233,
    estSalesRev: '$7,000.00',
    numberOfReviews: 31,
    salesRankData: [
        {date: Date.UTC(2014, 11, 9), salesRank: '100'},
        {date: Date.UTC(2014, 11, 10), salesRank: '110'}
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
 * @param {function=} callback function() {...}
 */
BookStorage.prototype.EnableTracking = function(bookUrl, callback) {
    callback = ValueOrDefault(callback, function() {});
    var _this = this;
    // search url in storage
    this.GetBook(bookUrl, function(bookData) {
        var changeStatus = function(bookData){
            // change status to tracking
            bookData.trackingEnabled = true;
            // update data
            _this.UpdateBookInStorage(bookUrl, bookData, callback);
        };

        if(bookData !== undefined) {
            changeStatus(bookData);
            return;
        }

        // if not found, add new item to storage
        _this.InitBookFromUrl(bookUrl, changeStatus);
    });
};

/**
 * Disable tracking for the book
 * @param bookUrl
 * @param {function=} callback function(bytesInUse) {...}
 */
BookStorage.prototype.DisableTracking = function(bookUrl, callback) {
    callback = ValueOrDefault(callback, function() {});
    var _this = this;
    // search url in storage
    this.GetBook(bookUrl, function(bookData) {
        if(bookData === undefined) return;
        // change status to not-tracking
        bookData.trackingEnabled = false;
        _this.UpdateBookInStorage(bookUrl, bookData, callback);
    });
};

/**
 * Takes a book from the storage and returns it
 * If not found, grabs data from the page
 * @param bookUrl
 * @param callback function(object bookData) {...};
 */
BookStorage.prototype.GetBook = function(bookUrl, callback) {
    var _this = this;
    this._storage.get('trackingData', function(items) {
        if(items !== undefined && items.trackingData !== undefined) {
            var index = _this.FindUrlIndex(items.trackingData, bookUrl);
            callback(items.trackingData[index]);
            return;
        }

        callback(undefined);
    });
};

BookStorage.prototype.InitBookFromUrl = function(bookUrl, callback) {
    var bookParser = new BookPageParser(bookUrl);
    bookParser.GetBookData(bookUrl, null, null, function(book){
        var bookData = {
            url: bookUrl,
            trackingEnabled: false,
            title: book.title,
            description: book.description,
            author: book.author,
            image: book.imageUrl,
            currentSalesRank: book.salesRank,
            price: book.price,
            pages: book.printLength,
            estSales: book.estSale,
            estSalesRev: book.salesRecv,
            numberOfReviews: book.reviews,
            salesRankData: [
                {date: new Date().setHours(0,0,0,0), salesRank: book.salesRank}
            ]
        };
        callback(bookData);
    });
};

/**
 * Returns all books from the storage
 * @param {function} callback function(object bookData) {...};
 */
BookStorage.prototype.GetAllBooks = function(callback) {
    this._storage.get('trackingData', function(items) {
        if(items !== undefined && items.trackingData !== undefined) {
            callback(items.trackingData);
            return;
        }

        callback(undefined);
    });
};

BookStorage.prototype.FindUrlIndex = function(trackingData, url) {
    var index;
    for (var i = 0; i < trackingData.length; i++) {
        if (trackingData[i].url === url) {
            index = i;
            break;
        }
    }

    return index;
};

/**
 * Inserts or updates a book in the storage with new bookData object
 * @param bookUrl
 * @param bookData
 * @param callback function(integer bytesInUse) {...};
 */
BookStorage.prototype.UpdateBookInStorage = function(bookUrl, bookData, callback) {
    this.logger.SaveLogDataToFile("BookStorage.UpdateBookInStorage start for book: " + bookUrl);
    var _this = this;
    this._storage.get('trackingData', function(items) {
        if(items === undefined) items = {};
        if(items.trackingData === undefined) items.trackingData = [];
        var index = _this.FindUrlIndex(items.trackingData, bookUrl);
        if(index === undefined) {
            items.trackingData.push(bookData);
        }else{
            items.trackingData[index] = bookData;
        }

        _this._storage.set(items, callback);
    });
};

/**
 * Scans all books and fill them with today's data
 */
BookStorage.prototype.TrackData = function () {
    var _this = this;
    this.logger.SaveLogDataToFile("Start run BookStorage.TrackData method");
    this._storage.get('lastUpdate', function(result) {
        if(result === undefined) result = {};
        if(result.lastUpdate === undefined) result.lastUpdate = 0;
        var dateDiffMillis = Date.now() - Number(result.lastUpdate);
        // if previous update was < 1h ago then do nothing
        if(dateDiffMillis / 1000 / 60 / 60 < 1) {
            _this.logger.SaveLogDataToFile("Previous update was " + dateDiffMillis / 1000 / 60 / 60 + " ago that's why do nothing");
            return;
        }
        _this._storage.set({lastUpdate:Date.now()}, function(bytesInUse) {
            _this.logger.SaveLogDataToFile("Set lastUpdate: " + GetFormattedDate(new Date()));
            _this.GetAllBooks(function(/** Array */ books) {
                if(books === undefined) return;
                var today = new Date().setHours(0,0,0,0);
                // iterate through all tracked books
                books.forEach(function(book) {
                    // if the last data is not from today
                    for(var i=0;i<book.salesRankData.length;i++) {
                        if(!book.trackingEnabled || book.salesRankData[i].date === today) {
                            _this.logger.SaveLogDataToFile("Book: " + book.url + " is trackingEnabled: " + book.trackingEnabled + "  salesRankData date = " + GetFormattedDate(new Date(today)));
                            return;
                        }
                    }

                    // add the today's day data
                    var bookParser = new BookPageParser(book.url);
                    bookParser.GetSalesRankFromUrl(book.url, function(salesRank){
                        book.currentSalesRank = salesRank;
                        book.salesRankData.push({
                            date: today,
                            salesRank: salesRank
                        });
                        if((book.salesRankData.length % 30) === 0) {
                            book.trackingEnabled = false;
                            _this.logger.SaveLogDataToFile("salesRankData tracked more than 30 days");
                        }
                        _this.UpdateBookInStorage(book.url, book, function() {
                            _this.logger.SaveLogDataToFile("BookStorage.UpdateBookInStorage already updated");
                        });
                    });
                });
            });
        });
    });
};

/**
 * Returns number of books from the storage
 * @param {function} callback function(object bookData) {...};
 */
BookStorage.prototype.GetNumberOfBooks = function(callback) {
    this._storage.get('trackingData', function(items) {
        if(items !== undefined && items.trackingData !== undefined) {
            callback(items.trackingData.length);
            return;
        }

        callback(undefined);
    });
};

/**
 * Remove tracked book in the storage by Url
 * @param bookUrl
 * @param callback function(integer bytesInUse) {...};
 */
BookStorage.prototype.RemoveBookInStorage = function(bookUrl, callback) {
    var _this = this;
    this._storage.get('trackingData', function(items) {
        if(items === undefined) return;
        if(items.trackingData === undefined) return;
        var index = _this.FindUrlIndex(items.trackingData, bookUrl);
        if(index !== undefined)
            items.trackingData.splice(index, 1);
        _this._storage.set(items, callback);
    });
};
function GetFormattedDate(d){
    return d.getFullYear() + "-" + (('0'+(d.getMonth()+1)).slice(-2)) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ":" + d.getMilliseconds();
}
