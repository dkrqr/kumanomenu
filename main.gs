function today(){
  var menu={};
  for(var i=0;i<3;i++){
    //script propertyに記録されているメニューを取得
    menu[i] = getMenuProp(i);
    menu[i] = menu[i].replace(/明日/g,'今日');
  }
  
  //propertyになければwebから取得
  if(!menu[0]&&!menu[1]&&!menu[2]){
    //今日のメニューを取得
    var stringToday = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'MM月,dd日');
    menu = getMenu(stringToday);
  
    //なければ終わり
    if(menu==0) return -1;
    
    menu[0] = "今日" + menu[0];
  }
  
  var result;
  for(var i=0;i<3;i++){
    result = postLongTweet(menu[i],result);
    if(result.getResponseCode() != 200){
      Logger.log(menu[i] + "を送信できませんでした");
      return 1;
    }
  }
  
  //10分毎トリガーを削除
  deleteTenMinTrigger();
  return 0;
}

function tomorrow(){
  //明日のメニューを取得
  var date = new Date();
  date.setDate(date.getDate() + 1);
  var stringTomorrow = Utilities.formatDate(date, 'Asia/Tokyo', 'MM月,dd日');
  var menu = getMenu(stringTomorrow);
  
  //なければ終わり
  if(menu==0){  //金曜の夜実行時はここに入るはず
    for(var i=0;i<3;i++){  //土曜日にtoday()を実行したときにPropertyが空でないといけないので
      setMenuProp(i,'');
    }
    return -1;
  }
  
  menu[0] = "明日" + menu[0];
  
  var result;
  for(var i=0;i<3;i++){
    //翌昼のためにメニューをscript propertyに記録
    setMenuProp(i,menu[i]);
    
    result = postLongTweet(menu[i],result);
    if(result.getResponseCode() != 200){
      Logger.log(menu[i] + "を送信できませんでした");
      return 1;
    }
  }
  return 0;
}

//メニューをscript propertyに記録
function setMenuProp(i,menu){
  //i=2;menu="";
  var scriptProp = PropertiesService.getScriptProperties();
  scriptProp.deleteProperty('menu' + i);
  scriptProp.setProperty('menu' + i, menu);
  return 0;
}

//メニューをscript propertyから取得&削除
function getMenuProp(i){
  var scriptProp = PropertiesService.getScriptProperties();
  var menu = scriptProp.getProperty('menu' + i);
  //deleteにすると読み取れなかった時点でエラーになるので空文字列をセット
  //scriptProp.setProperty('menu' + i,'');
  return menu;
}

function getMenu(stringDate){
  var regExp = new RegExp('<tr><th>'+ stringDate + '.*?<\/tr>');
  Logger.log(regExp);
  stringDate = stringDate.replace(',','');
  var response = UrlFetchApp.fetch('https://menus.kumano-ryo.com/');
  var contentString = response.getContentText();
  contentString = contentString.replace(/[\s]+/g,',');
  contentString = contentString.replace(/>,</g,'><');
  Logger.log(contentString);
  var allMenu = contentString.match(regExp);
  Logger.log('allMenu:' + allMenu);
  if(!allMenu){return 0;}
  var menu = allMenu[0].match(/<pre>.*?<\/pre>/g);
  for(var i=0;i<3;i++){
    menu[i] = menu[i].replace(/<\/??pre>/g,',');
    menu[i] = isNewMenu(menu[i]);
    menu[i] = menu[i].replace(/,/g,'\n');
    //ヨーグルトサラダ好き
    menu[i] = menu[i].replace(/ヨーグルトサラダ/g,'＿人人人人人人人人人人＿\n＞　ヨーグルトサラダ　＜\n￣Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^￣');
    //卯の花嫌い
    //menu[i] = menu[i].replace(/卯の花/g,'卯゛の゛花゛');
    
    if(menu[i]=='\n')
      menu[i] = '\nなし';
  }
  menu[0]="(" + stringDate + ")の #熊野寮食\n[昼食1]" + menu[0];
  menu[1]="[昼食2]" + menu[1];
  menu[2]="[夕食]" + menu[2];
  return menu;
}

//新メニューか判定し，新メニューなら記録し🈟をつける
function isNewMenu(menu){
  //メニュー記録用ドキュメント
  var docId = PropertiesService.getScriptProperties().getProperty('docId');
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  
  //正規表現で処理するために','を2個に(<pre>から変換した,は1個のまま)
  menu = menu.replace(/,/g,',,').substr(1);
  Logger.log(menu);
  
  //,hoge,を抽出
  var dish = menu.match(/,.+?,/g);
  
  for(var i=0;dish[i];i++){
    dish[i]= dish[i].substr(1);
    Logger.log(dish[i]);
    if(!body.findText(dish[i])){
      body.setText(body.getText() + dish[i]);
      menu = menu.replace(dish[i], '🈟' + dish[i]);  //新メニュー機能を外すときはこの行をコメントアウト
    }
  }
  //連続する','を1個に
  menu = menu.replace(/,+/g,',');
  Logger.log(menu);
  return menu;
}

function getMenu2(){
  var date = new Date();
  date.setDate(date.getDate() - 1);
  var stringTomorrow = Utilities.formatDate(date, 'Asia/Tokyo', 'MM月,dd日');
  var menu = getMenu(stringTomorrow);
  return 0;
}

function LogScriptProperty(){
  for(var i=0;i<3;i++){
    var scriptProp = PropertiesService.getScriptProperties();
    var menu = scriptProp.getProperty('menu' + i);
    Logger.log(menu);
  }
  return 0;
}