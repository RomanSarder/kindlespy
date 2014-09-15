/**
 * Created by Andrey on 15.09.2014.
 */

function Pager(itemsPerPage, loadPageFunction){
    this.itemsInResult = 20;
    this.itemsPerPage = itemsPerPage;
    this.LoadPageFunction = loadPageFunction;//function(pageIndex, startFromIndex, maxResults){};
    this.lastPage = 1;
    this.alreadyPulled = 0;
    this.pagesLoaded = 0;
}

Pager.prototype.LoadPage = function(pageNumber) {
    if(pageNumber<=this.pagesLoaded) return;
    for(var i=this.pagesLoaded;i<=pageNumber;i++) {
        this.LoadNextPage();
    }
};

Pager.prototype.LoadNextPage = function(){
    if (this.alreadyPulled === undefined) return;

    var totalItemsLoaded = 0;
    var pulledItems;
    var i=this.lastPage;
    for(;totalItemsLoaded<this.itemsInResult;i++) {
        var startFromIndex = (i - 1) * this.itemsPerPage + this.alreadyPulled;
        var maxResults = this.itemsInResult - totalItemsLoaded;
        pulledItems = this.LoadPageFunction(i, startFromIndex, maxResults);
        if(pulledItems === undefined) break;
        totalItemsLoaded += pulledItems;
        this.alreadyPulled = 0;
    }
    this.pagesLoaded++;
    this.lastPage = i-1;
    this.alreadyPulled = pulledItems;
};