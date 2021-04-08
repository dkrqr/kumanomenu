function like() {
    const scriptProp = PropertiesService.getScriptProperties();
    const sinceId = scriptProp.getProperty('sinceId');
    var text;
    const regexp = new RegExp('寮食|残置', 'g');

    const status = getTweetsInLists("1340657292836925440", sinceId, null,true);
    for (var i = 0; i < status.length; i++) {
        text = status[i]["text"];
        if (text.match(regexp) &&
            status[i]["user"]["id_str"] != "1159017864658968578"){
            favorite(status[i]["id_str"]);
            Logger.log(text);
        }
    }
    if(status.length) {
        scriptProp.setProperty('sinceId', status[0]["id_str"]);        
    }
    return 0;
}

function searchAndLike() {
    const scriptProp = PropertiesService.getScriptProperties();
    
    const status = searchTweet("熊野+寮食").statuses;
    for (var i = 0; i < status.length; i++) {
        if (status[i]["user"]["screen_name"] != "kumanomenu" &&
            status[i]["user"]["screen_name"] != "ryosyoku_buono"){
            favorite(status[i]["id_str"]);
            //Logger.log(status[0]["user"]["id_str"]);
        }
    }
    if(status.length) {
        scriptProp.setProperty('sinceId', status[0]["id_str"]);        
    }
    return 0;
}

//list_id:1340657292836925440
function followersList() {
  const list = getFollowerAll();
  var screenNameList = [];
  for (var i = 0; i < list.users.length; i++) {
    screenNameList.push(list.users[i].screen_name);
    if(screenNameList.length == 100){
      addListMember("1340657292836925440",screenNameList);
      screenNameList=[];
    }
  }
  addListMember("1340657292836925440",screenNameList);
  return 0;
}