/**
 * 1週間分のメニューをSpreadsheetに記録する
 * 日曜0時から10分毎に実行
 * 
 * @return
 */
function writeSpreadSheet(){
  var menuData = getWeekMenu();
  if(menuData.length != 0){
    deleteTenMinTriggerSS();
    for(var i=0;i<menuData.length;i++){
      recordMenu(menuData[i]);
    }
    tweetWeekMenu(menuData);
  }
  else{
    menuData = getWeekMenuFromForm();
    if(menuData.length != 0){
      deleteTenMinTriggerSS();
      for(var i=0;i<menuData.length;i++){
        recordMenu(menuData[i]);
      }
      tweetWeekMenu(menuData);
    }
  }
  return;
}

/**
 * 1週間分のメニューをformから取得し，次の形のJSONの配列で返す
 * {date:(msec),lunch1:[(string)],lunch2:[(string)],dinner:[(string)]}
 * 
 * @return {array} {date:(msec),lunch1:[(string)],lunch2:[(string)],dinner:[(string)]}
 */

function getWeekMenuFromForm(){
  // フォームを開いて，まえにチェックしたときのタイムスタンプ以降の回答を取得
  // https://developers.google.com/apps-script/reference/forms/item-response
  // formの入力をトリガーにする方法を見つけたのでそのうち変える
  var scriptProperties = PropertiesService.getScriptProperties();
  var form = FormApp.openById(scriptProperties.getProperty('formId'));
  var formResponses = form.getResponses(new Date(parseFloat(scriptProperties.getProperty('formTimeStamp'))));
  Logger.log(formResponses);

  if(!formResponses.length){
    return []; //新しい回答がなかった時
  }
  
  var formResponse = formResponses[formResponses.length-1];
  var itemResponses = formResponse.getItemResponses();
  // 月曜日の日付を取得，月曜日の09:00:00 GMT+09:00のdate obj
  var date = new Date(Date.parse(itemResponses[0].getResponse()));
  date.setHours(0);

  var menuData = [];
  for(var i = 0;i < 5; i++){
    var dateMillisec = date.valueOf(); //月曜日のi日後の00:00:00 GMT+09:00のdate obj
    date.setDate(date.getDate() + 1);
    //new Date(dateMillisec) で取り出した日付の00:00:00 GMT+09:00のdateobjが取り出せる
    var menus = [];
    for(var j=0;j<3;j++){
      var pre = itemResponses[i*3+j+1].getResponse();
      menus.push(pre.match(/^.*?$/mg));
    }
    menuData.push({date:dateMillisec,lunch1:menus[0],lunch2:menus[1],dinner:menus[2]});
    Logger.log({date:dateMillisec,lunch1:menus[0],lunch2:menus[1],dinner:menus[2]});
  }

  scriptProperties.setProperty('formTimeStamp',new Date().valueOf());

  return menuData;
}


/**
 * 1週間分のメニューをhttps://menus.kumano-ryo.com/ から取得し，次の形のJSONの配列で返す
 * {date:(msec),lunch1:[(string)],lunch2:[(string)],dinner:[(string)]}
 * 
 * @return {array} {date:(msec),lunch1:[(string)],lunch2:[(string)],dinner:[(string)]}
 */

function getWeekMenu(){
  //var htmlTemplate = HtmlService.createTemplateFromFile('menukumano');
  //var response = htmlTemplate.evaluate().getContent();
  var response = UrlFetchApp.fetch('https://menus.kumano-ryo.com/').getContentText();;
  
  response = response.replace(/[\s]/g,',');  //sフラグが使えないようなので空白文字をすべて','に
  response = response.replace(/,+/g,',');
  Logger.log(response);
  response = response.replace(/,</g,'<');     //HTMLタグ間は','消す
  var tbody = response.match(/<tbody>.*?<\/tbody>/);  //tbody内にtrでその日のメニューがある。
  var trows = tbody[0].match(/<tr>.*?<\/tr>/g);

  var menuData = [];
  if(trows == null){  //メニューがなかった時
    return menuData;
  }

  var today = new Date();
  
  for(var i = 0;i < trows.length; i++){
    var date = trows[i].match(/<th>(..)月,(..)日\(.\)<\/th>/);
    var dateMillisec = Date.parse(today.getFullYear() + '/' + date[1] + '/' + date[2]);
    //new Date(dateMillisec) で<th>から取り出した日付の00:00:00 GMT+09:00のdateobjが取り出せる
    var pre = trows[i].match(/<pre>.*?<\/pre>/g);
    var menus = [];
    for(var j=0;j<3;j++){
      //,hoge,fuga,poyo,の形だと，hogeとpoyoにしかマッチしてくれない。V8runtimeじゃないと先読みとか使えない
      pre[j] = pre[j].replace(/<\/??pre>/g,',');  //,hoge,fuga,poyo,
      pre[j] = pre[j].replace(/,+/g,',,');        //,,hoge,,fuga,,poyo,,
      menus.push(pre[j].match(/,.+?,/g));
      for(var k=0; menus[j] && k<menus[j].length; k++){
        menus[j][k] = menus[j][k].replace(/,/g,'');
      }
    }
    menuData.push({date:dateMillisec,lunch1:menus[0],lunch2:menus[1],dinner:menus[2]});
    Logger.log({date:dateMillisec,lunch1:menus[0],lunch2:menus[1],dinner:menus[2]});
  }
  return menuData;
}

/**
 * 1週間分のメニューを次の形のJSONの配列で受け取り，日付の行のSSに記録
 * {date:(msec),lunch1:[(string)],lunch2:[(string)],dinner:[(string)]}
 *  
 * @param {JSONobject} menuData {date:,lunch1:[],lunch2:[],dinner:[]}
 * @return {JSONobject} {date:,lunch1:[],lunch2:[],dinner:[]}
 */

function recordMenu(menuData){
  var scriptProperties = PropertiesService.getScriptProperties();
  var book = SpreadsheetApp.openById(scriptProperties.getProperty('sheetId'));

  //setする配列を作る
  var dataArray = [[]];
  //それぞれの要素についてメニュー名と新メニューかどうかを配列に入れます
  //メニュー数が日によって違うので，ここで全部5個に水増しします
  //昼食2はhttps://menus.kumano-ryo.com/ の仕様上4つまでしかありえませんが便宜的に5個にします
  //もっときれいな書き方があると思うけど分からん
  var menu = menuData.lunch1;
  for(var i=0;i<5;i++){
    //メニューを入れる
    if(menu && menu[i]){
      dataArray[0].push(menu[i]);
      //メニューの右のセルに新メニュー判定結果を入れる
      if(isNewMenuSS(menu[i],book)){
        dataArray[0].push('🈟');
      }
      else{
        dataArray[0].push('');  
      }
    }
    else{
      dataArray[0].push('');
      dataArray[0].push('');
    }
  }
  var menu = menuData.lunch2;
  for(var i=0;i<5;i++){
    //メニューを入れる
    if(menu && menu[i]){
      dataArray[0].push(menu[i]);
      //メニューの右のセルに新メニュー判定結果を入れる
      if(isNewMenuSS(menu[i],book)){
        dataArray[0].push('🈟');
      }
      else{
        dataArray[0].push('');  
      }
    }
    else{
      dataArray[0].push('');
      dataArray[0].push('');
    }
  }
  var menu = menuData.dinner;
  for(var i=0;i<5;i++){
    //メニューを入れる
    if(menu && menu[i]){
      dataArray[0].push(menu[i]);
      //メニューの右のセルに新メニュー判定結果を入れる
      if(isNewMenuSS(menu[i],book)){
        dataArray[0].push('🈟');
      }
      else{
        dataArray[0].push('');  
      }
    }
    else{
      dataArray[0].push('');
      dataArray[0].push('');
    }
  }

  //setすべき行を探す
  var date = new Date(menuData.date); //このmenuDataの日付の00:00:00 GMT+09:00
  var thisYear = new Date(date.getFullYear() + '/01/01'); //メニューの年のJan 01 00:00:00 GMT+09:00
  var elapsed = date.getTime() - thisYear.getTime(); //経過時間msec
  var dataRow = elapsed/1000/60/60/24 + 2; //除算で日数-1がでて，スプレッドシート2行目が1/1なので+2
  
  //setする
  var sheet = book.getSheetByName(date.getFullYear());
  
  //その年のシートが無ければ作る
  if(!sheet){
    sheet = makeNewSheet(book);
  }
  var range = sheet.getRange(dataRow,2,1,30);
  range.setValues(dataArray);
  return menuData;
}

/**
 * SSの適当な範囲(2年ぶんくらいか？)を検索して新メニューか判定
 *  
 * @param {string} menu
 * @param {SpreadSheetApp} spreadsheet
 * @return {Integer} true:1,false:0
 */
function isNewMenuSS(menu,spreadsheet){
  var textFinder = spreadsheet.createTextFinder(menu).matchEntireCell(true);
  if(textFinder.findNext() == null){
    return 1;
  }
  else{
    return 0;
  }
}

/**
 * 新年に新しいsheetを作る
 *  
 * @param {obj} book sheetを作るべきSpreadsheet
 * @return {obj} SpreadsheetApp sheet
 */

function makeNewSheet(book){
  var today = new Date();
  var thisYear = today.getFullYear();
  var date = new Date(thisYear + '/01/01'); //今年のJan 01 00:00:00 GMT+09:00
  var oldSheet = book.getSheetByName(thisYear - 1);
  //前年のシートをコピー
  var newSheet = oldSheet.copyTo(book);
  //名前を変更
  newSheet.setName(thisYear);
  //前年のメニューを消す
  newSheet.getRange(2,1,366,31).clearContent();
  //1列目に入れる日付一覧を作る
  var days = [];
  while(date.getFullYear() == thisYear){
    days.push([Utilities.formatDate(date, "JST", "MM月dd日")]);
    date.setDate(date.getDate()+1);
  }
  Logger.log(days);
  newSheet.getRange(2,1,days.length,1).setValues(days);
  return newSheet;
}

function columnWidth(){
  var scriptProperties = PropertiesService.getScriptProperties();
  var book = SpreadsheetApp.openById(scriptProperties.getProperty('sheetId'));
  var sheet = book.getSheetByName('2021');
  for(var i=0;i<15;i++){
    sheet.setColumnWidth(i*2+3, 20);
    sheet.setColumnWidth(i*2+2, 100);
  }
}