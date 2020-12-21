

// 認証
function authorize() {
  twitter.authorize();
}

// 認証解除
function reset() {
  twitter.reset();
}

// 認証後のコールバック
function authCallback(request) {
  return twitter.authCallback(request);
}

// タイムラインを取得
function getUserTimeline(screenName) {
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/user_timeline.json'
                               + '?screen_name=' + screenName
                               + '&trim_user=true'  
  );
  response = JSON.parse(response);
//  Logger.log(response);
  return response;
}

// あるtweet以降のタイムラインを取得
function getUserTimelineSinceId(screenName,sinceId) {
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/user_timeline.json'
                               + '?screen_name=' + screenName
                               + '&trim_user=true'
                               + '&since_id=' + sinceId
  );
  response = JSON.parse(response);
  Logger.log(response);
  return response;
}

function test(){
  postLongTweet("ああああああああああああああああああhttps://www.youtube.com/watch?v=Fk4sgvvHyeI www.youtube.com/watch?v=Fk4sgvvHyeIああああああああああああああああああああああああああああああああああああああああああああああああああbit.ly/TaSKTaSKああああああああああああああああああああああああああああああああああああああああああああああああああぷgoogle.comああいおおおおおおおおおおおおお");
  return 0;
}

function modifyContent(content){
  //contentを修正
  var regExp = new RegExp("((https?|ftp):\/\/)?[-_a-zA-Z0-9]+\.[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+","g");
  var urlString = regExp.exec(content);
  var tweetLength = 140;
  while(urlString!=null){
    if(urlString.index <= tweetLength - 12){
      tweetLength+=urlString[0].length-12;
    }
    else if(urlString.index < tweetLength){
      tweetLength=urlString.index;
    }
    urlString = regExp.exec(content);
  }
  content=content.replace(/[死殺]/g,"○");
  content=content.replace(/fuck/gi,"f**k");
  var tweet = [content.substr(0,tweetLength),content.substr(tweetLength)];
  return tweet;
}

// ツイートを投稿
function postTweet(content) {
  content = modifyContent(content)[0];
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/update.json',
    {
    method: 'post',
    payload: {
      status: content
    },
    muteHttpExceptions:true
  });
  Logger.log(response);
  return response;
}

// リプライを投稿
function postReply(content, status) {
  var inReplyToStatusId;
  if(typeof(status) == "object"){
    status = JSON.parse(status);
    inReplyToStatusId = JSON.stringify(status["id_str"]);
  }
  if(typeof(inReplyToStatusId) == "string"){
    inReplyToStatusId = inReplyToStatusId.substr(1,inReplyToStatusId.length-2);
    Logger.log(inReplyToStatusId);
  }
  
  content = modifyContent(content)[0];
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/update.json',
    {
    method: 'post',
    payload: {
      in_reply_to_status_id: inReplyToStatusId,
      auto_populate_reply_metadata: "true",
      status: content
    },
    muteHttpExceptions:true
  });
  Logger.log(response);
  Logger.log(typeof(response));
  return response;
}

// 一続きのtweetを投稿
function postLongTweet(originalContent, status) {
  var content = originalContent;
  var tweet;
  while(content != ""){
    var temp = modifyContent(content);
    tweet = temp[0];
    content = temp[1];
    status = postReply(tweet,status);
    if(status.getResponseCode() != 200){
      return status;
    }
  }
  return status;
}

//ユーザー情報を取得
function getUserInfo() {
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/account/verify_credentials.json');
  response = JSON.parse(response);
  Logger.log(response);
  return response;
}

//ユーザー情報を変更
function setUserInfo(name, url, location, description) {
  var service  = twitter.getService();
  var fetchUrl = 'https://api.twitter.com/1.1/account/update_profile.json?'
  if(name)        fetchUrl += '&name='        + name;
  if(url)         fetchUrl += '&url='         + url;
  if(location)    fetchUrl += '&location='    + location;
  if(description) fetchUrl += '&description=' + description;
  fetchUrl = fetchUrl.replace(/\?\&/,'?');
  Logger.log(fetchUrl);
  var response = service.fetch(fetchUrl,
    {
    method: 'post',
    muteHttpExceptions:true
  });
  response = JSON.parse(response);
  Logger.log(response);
  return response;
}