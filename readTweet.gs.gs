function readTweet() {
  var response = getUserTimeline('kumanomenu',null,'1223077813105909761');
  //Logger.log(response);
  //Logger.log(response.length);
  var inReplyToStatusIdStr = '';
  var menuData = {date:{},lunch1:{},lunch2:{},dinner:{}};
  while(response.length){
    for(var i = 0; i < response.length; i++){
      var status = response[i];
      //Logger.log("date:%s\ntext:%s\nid:%s\nin reply:%s",status.created_at,status.text,status.id_str,status.in_reply_to_status_id_str);
      if(status.text.search(/\[夕食\]/) != -1){
        inReplyToStatusIdStr = status.in_reply_to_status_id_str;
        menuData.dinner = formatTweet(status.text);
        //Logger.log(inReplyToStatusIdStr);
      }
      if(status.id_str == inReplyToStatusIdStr){
        if(status.text.search(/\[昼食2\]/) != -1){
          inReplyToStatusIdStr = status.in_reply_to_status_id_str;
          menuData.lunch2 = formatTweet(status.text);
        }
        if(status.text.search(/\[昼食1\]/) != -1){
          menuData.lunch1 = formatTweet(status.text);
          menuData.date = formatTweetDate(status);
          recordMenu(menuData);
          //Logger.log(menuData);
        }
      }
    }
    Logger.log(inReplyToStatusIdStr);
    response = getUserTimeline('kumanomenu',null,inReplyToStatusIdStr);
  }
}


/*
 * @param {string} text
 * @return {[string]}
*/
function formatTweet(text){
  text = text.replace(/[今明].*?寮食\n/,'');
  text = text.replace(/\[.*?\]\n/,'');
  text = text.replace(/🈟/g,'');
  text = text.replace(/＿人人人人人人人人人人＿\n＞　ヨーグルトサラダ　＜\n.*?$/g,'ヨーグルトサラダ');
  text = text.replace(/（卵入り：除去.*?可）/g,'');
  var menus = [];
  menus = text.match(/^.*?$/mg);
  return menus;
}

function formatTweetDate(status){
  var date = status.text.match(/(..)月(..)日/);
  var today = id2date(status.id);
  return Date.parse(today.getFullYear() + '/' + date[1] + '/' + date[2]);
}

function id2date(id){
  id = id / Math.pow(2,22);
  id = id + 1288834974657;
  return new Date(id);
}
