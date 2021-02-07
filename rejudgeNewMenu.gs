function rejudgeNewMenu() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var book = SpreadsheetApp.openById(scriptProperties.getProperty('sheetId'));

  for(var year=2019;year<=new Date().getFullYear();year++){
    var sheet = book.getSheetByName(date.getFullYear());
    var lastRow = book.getDataRange().getLastRow();

    for(var r = 2; r < lastRow; r++){
      for(var c = 2; c < 32; c+=2){
        var menu = sheet.getRange(r,c).getValue();
        var textFinder = book.createTextFinder(menu).matchEntireCell(true);
        var foundRanges = textFinder.findAll();
        for(var i=0; i<foundRanges.length; i++){
          var sheetName = purseInt(foundRanges[i].getSheet().getName());
          if(sheetName <= year || 
            (sheetName == year && foundRanges[i].getRow())){
              sheet.getRange(r, c+1).setValue('🈟');
              console.log(menu);
              break;
          }
        }
      }
    }

  }
}
