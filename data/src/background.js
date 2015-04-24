/**
 * Created by Andrey Klochkov on 23.04.2015.
 */

Api.addAlarmListener('update-tracker', trackData);
Api.createAlarm('update-tracker', 60);

function trackData(){
    var bookStorage = new BookStorage();
    bookStorage.trackData();
}
