/**
 * Created by Andrey Klochkov on 01.04.15.
 */

// AsyncRunner class
var AsyncRunner = {
    itemsInProgress: 0,
    finished: function(){
    },
    itemLoaded: function(){
        ContentScript.sendMessage({type:"set-IsPulling", IsPulling: false});
    },
    start: function(worker){
        var _this = this;
        _this.itemsInProgress++;
        worker(function(){
            _this.itemsInProgress--;
            _this.itemLoaded();
            if(_this.itemsInProgress == 0) {
                _this.finished();
            }
        });
    }
};
