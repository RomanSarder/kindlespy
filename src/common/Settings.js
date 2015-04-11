/**
 * Created by Andrey Klochkov on 12.04.2015.
 */

function Settings(){
    this.defaultSettings = {
        isWaitingForPulling: false,
        isPulling: false,
        pageNum: {
            MainTab: '1',
            KeywordAnalysisTab: '1'
        },
        totalResults: '',
        books:
            [
                //{"No": "", "Url":"", "ParentUrl":"", "NextUrl": "", "Title":"", "Description":"", "Price": "", "EstSales": "", "SalesRecv": "", "Reviews": "", "SalesRank": "", "Category": "", "CategoryKind":"Seller", "PrintLength":"", "Author":"", "DateOfPublication":"", "GoogleSearchUrl":"", "GoogleImageSearchUrl":"", "Rating":"",
                // PullingToken: ''}
            ]
    };

    this.storage = {};
}

Settings.prototype.getSettings = function(){
    if(this.storage.settings === undefined)
    // clone object
        this.storage.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    return this.storage.settings;
};

Settings.prototype.removeSettings = function(){
    this.storage.settings = undefined;
};