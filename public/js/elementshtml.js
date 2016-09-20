"use strict";

//initialse menu and state variables
var menu={active:"none"}; //info on the menu
var state={alerts:true}; // state of the interface


function uploadJSON(){
  brainmap.readJSONpolygon(brainmap.inputJSON.files[0]);
}

function badgeUp(id){
  if (menu.active=="home"){
    return;
  }
  var badge=document.getElementById(id);
  badge.innerHTML=parseInt(badge.innerHTML)+1;
}


function badgeDown(id){
  if (menu.active=="home"){
    return;
  }
  var badge=document.getElementById(id);
  badge.innerHTML=parseInt(badge.innerHTML)-1;
}

function badgeWorking(id){
  var badge=document.getElementById(id);
  if (menu.active=="home"){
    return;
  }

  badge.innerHTML="<i class='fa fa-spinner fa-spin'></i>"
  badge.setAttribute("class","badge badge-notify inv");
}

function badgeHide(id){
  var badge=document.getElementById(id);
  if (menu.active=="home"){
    badge.setAttribute("class","badge badge-notify inv");
    return;
  }

  badge.innerHTML=0;
  badge.setAttribute("class","badge badge-notify inv");
}

function badgeShow(id){
  if (menu.active=="home"){
    return;
  }
  var badge=document.getElementById(id);
  badge.setAttribute("class","badge badge-notify");
}

function warningNote(note){

  $("#alert-note").alert('close');
  if (note=="none" | note==null ){
    return;
  }
  addAlert("alert-note","alert-warning","Map Note",note,"info-sign");
}

function showLocalStorage(){
  $('#localStorageModal').modal('toggle');
}


function toggleAlert(obj){
  state.alerts=!state.alerts;
 if (state.alerts){
   document.getElementById("toggleAlertButton").setAttribute("class","enabled-inline-text");
 }
 else{
   document.getElementById("toggleAlertButton").setAttribute("class","disable-inline-text");

 }

}


function toggleUnbiasedDensity(obj){
  obj.state.unbiasedDensity=!obj.state.unbiasedDensity;
  if (obj.state.unbiasedDensity){
    document.getElementById("toggleUnbiasedDensityButton").setAttribute("class","enabled-inline-text");
  }
  else{
    document.getElementById("toggleUnbiasedDensityButton").setAttribute("class","disable-inline-text");
  }
}

function toggleComputation(obj){
  obj.state.computePolygon=!obj.state.computePolygon;
  if (obj.state.computePolygon){
    document.getElementById("toggleComputationButton").setAttribute("class","enabled-inline-text");
  }
  else{
    document.getElementById("toggleComputationButton").setAttribute("class","disable-inline-text");

  }
}


function toggleGrid(obj){
  obj.state.showGrid=!obj.state.showGrid;
  if (obj.state.showGrid){
    var grid=L.simpleGraticule({ interval: 256/(obj.dim_px/1024), redraw: 'moveend',})
    grid.addTo(obj.map);
    obj.grid=grid;
    document.getElementById("toggleGridButton").setAttribute("class","enabled-inline-text");
  }
  else{
    obj.map.removeLayer(obj.grid);
    document.getElementById("toggleGridButton").setAttribute("class","disable-inline-text");

  }
}

function toggleLocalStorage(obj){
  obj.state.localStorage=!obj.state.localStorage;
  if (obj.state.localStorage){
    document.getElementById("toggleLocalStorageButton").setAttribute("class","enabled-inline-text");
  }
  else{
    document.getElementById("toggleLocalStorageButton").setAttribute("class","disable-inline-text");
  }
}

function toggleWebWorkers(obj){
  obj.useWorkers=!obj.useWorkers;
  if (obj.useWorkers){
    document.getElementById("toggleWebWorkers").setAttribute("class","enabled-inline-text");
  }
  else{
    document.getElementById("toggleWebWorkers").setAttribute("class","disable-inline-text");
  }
}

function toggleFastArea(obj){
  obj.state.fastArea=!obj.state.fastArea;
  if (!obj.state.fastArea){
    document.getElementById("toggleFastArea").setAttribute("class","enabled-inline-text");
  }
  else{
    document.getElementById("toggleFastArea").setAttribute("class","disable-inline-text");

  }
}


function change(){

  document.getElementById("homeBody").setAttribute("class","element-sidebar-inactive");
  document.getElementById("settingBody").setAttribute("class","element-sidebar-inactive");
  document.getElementById("homeButton").setAttribute("class","inactive");
  document.getElementById("setButton").setAttribute("class","inactive");

  if (menu.active=="change"){
    menu.active="none";
    document.getElementById("changeButton").setAttribute("class","inactive");
    sidebar.minimize();
  }
  else{
    menu.active="change";
    document.getElementById("changeButton").setAttribute("class","active");
    document.getElementById("changeBody").setAttribute("class","element-sidebar-active");
    sidebar.display();
  }

}

function setting(){

  document.getElementById("homeBody").setAttribute("class","element-sidebar-inactive");
  document.getElementById("changeBody").setAttribute("class","element-sidebar-inactive");
  document.getElementById("changeButton").setAttribute("class","inactive");
  document.getElementById("homeButton").setAttribute("class","inactive");

  if (menu.active=="setting"){
    menu.active="none";
    document.getElementById("setButton").setAttribute("class","inactive");
    sidebar.minimize();
  }
  else{

    menu.active="setting";
    document.getElementById("setButton").setAttribute("class","active");
    document.getElementById("settingBody").setAttribute("class","element-sidebar-active");
    sidebar.display();
  }

}


function home(){
  document.getElementById("settingBody").setAttribute("class","element-sidebar-inactive");
  document.getElementById("changeBody").setAttribute("class","element-sidebar-inactive");
  document.getElementById("setButton").setAttribute("class","inactive");
  document.getElementById("changeButton").setAttribute("class","inactive");
  badgeHide("region-badge");

  if (menu.active=="home"){
    menu.active="none";
    document.getElementById("homeButton").setAttribute("class","inactive");
    sidebar.minimize();
  }
  else{

    menu.active="home";
    document.getElementById("homeButton").setAttribute("class","active");
    document.getElementById("homeBody").setAttribute("class","element-sidebar-active");
    sidebar.display();
  }
}

function fieldTable(field,cont,th){
  if (th){
    var val=document.createElement("TH");
  }
  else{
    var val=document.createElement("TD");

  }
  val.innerHTML=field;
  if (cont){
    cont.appendChild(val);
  }
  else{
  return(val);}
}

function addPolInfoEl(name,values,icon,iconAt){
  /*
  var temp=document.createElement("LI");
  temp.setAttribute("class","list-group-item");
  temp.setAttribute("style","font-size: 1.1em;");
  temp.innerHTML=name;
  var sp=document.createElement("SPAN");
  sp.setAttribute("class",cls);
  sp.innerHTML=value;
  temp.appendChild(sp);
  document.getElementById("polygonsInfo").appendChild(temp);
  */
  var temp=document.getElementById("table_"+name);
  if (temp){
    empty(temp,temp.firstChild);
  }
  else{
    var temp=document.createElement("TR");
    temp.setAttribute("id","table_"+name);
    document.getElementById("polygonsInfo").appendChild(temp);

  }
  var nm=document.createElement("TD");
  nm.innerHTML=name;
  temp.appendChild(nm);
  values.map(function(x){fieldTable(x,temp);});
  if (icon){

    var ic=document.createElement("TD");
    var sp=document.createElement("I");
    if (iconAt){
      iconAt.map(function(x){sp.setAttribute(x.att,x.vAt)});

    }
    sp.setAttribute("class",icon);
    ic.appendChild(sp);
    temp.appendChild(ic);
  }

}
function addHeadPolInfoEl(name,values,icon,iconAt){
  /*
  var temp=document.createElement("LI");
  temp.setAttribute("class","list-group-item");
  temp.setAttribute("style","font-size: 1.1em;");
  temp.innerHTML=name;
  var sp=document.createElement("SPAN");
  sp.setAttribute("class",cls);
  sp.innerHTML=value;
  temp.appendChild(sp);
  document.getElementById("polygonsInfo").appendChild(temp);
  */
  var temp=document.getElementById("table_"+name);
  if (temp){
    empty(temp,temp.firstChild);
  }
  else{
    var temp=document.createElement("TR");
    temp.setAttribute("id","table_"+name);
    document.getElementById("polygonsInfo").appendChild(temp);

  }
  var nm=document.createElement("TH");
  nm.innerHTML=name;
  temp.appendChild(nm);
  values.map(function(x){fieldTable(x,temp,true);});
  if (icon){

    var ic=document.createElement("TD");
    var sp=document.createElement("I");
    if (iconAt){
      iconAt.map(function(x){sp.setAttribute(x.att,x.vAt)});

    }
    sp.setAttribute("class",icon);
    ic.appendChild(sp);
    temp.appendChild(ic);
  }

}

function buttonHide(){
map.addControl(buttonShowSidebar);
}

function empty(parent,child){
  if (parent){
  if (child){
    parent.removeChild(child);
    empty(parent,parent.firstChild);
  }
}
}


function closeAlertBottom(){
  if (document){
  $("#alert-bottom").alert('close');
}
}

function addProgressBar(id){
  if (document){
  var cont=document.createElement("DIV");
  cont.setAttribute("class","progress");
  cont.setAttribute("id","parent"+id);
  var bar=document.createElement("DIV");
  bar.setAttribute("id","progress-bar"+id);
  cont.appendChild(bar);
  bar.style["min-width"]= "2em";
  bar.setAttribute("class","progress-bar");
  bar.setAttribute("role","progressbar");
  bar.setAttribute("aria-valuenow","100");
  bar.setAttribute("aria-valuemin","0");
  bar.setAttribute("aria-valuemax","100");
  bar.style.width="0%";
  bar.innerHTML="0%";
  document.getElementById("progress-container").appendChild(cont);
}
}

function updateProgressBar(id,value){
  if (document){
  var temp= ""+value.toPrecision(3)+"%";
  var bar=document.getElementById("progress-bar"+id);
  bar.style.width=temp;
  bar.setAttribute("aria-valuenow",value);
  bar.innerHTML=temp;
}
}

function stepProgressBar(id,value){
  if (document){
  var bar=document.getElementById("progress-bar"+id);
  var temp=parseInt(bar["aria-valuenow"]);
  temp=temp+value;
  bar.style.width=""+temp+"%";
  bar.setAttribute("aria-valuenow",temp);
  bar.innerHTML=temp+"%";
}
}

function closeProgressBar(id){
  if (document){
    var par=document.getElementById("parent"+id);
      if (par){
          par.removeChild(document.getElementById("progress-bar"+id));
          document.getElementById("progress-container").removeChild(par);
      }
}
}

function addAlert(id,alertclass,strongText,bodyText,icon){
  if (document && state.alerts){
if (document.getElementById("id")!=undefined){
 var alert=document.getElementById("id");
}
else{
	var container=document.getElementById("alerts-container");
	var alert=document.createElement("DIV");
	container.appendChild(alert);
}
alert.setAttribute("class","alert alert-dismissible fade in "+ alertclass);
alert.setAttribute("role","alert");
alert.setAttribute("id",id);
var strong = document.createElement("STRONG");
strong.setAttribute("id",id+"-strong")
strong.innerHTML=" "+strongText;
if (icon){
  var span=document.createElement("I");
  span.setAttribute("class","glyphicon "+icon);
  alert.appendChild(span);
}
var button=document.createElement("BUTTON");
button.setAttribute("type","button");
button.setAttribute("class","close");
button.setAttribute("data-dismiss","alert");
var sp=document.createElement("SPAN");
sp.innerHTML="&times;";
button.appendChild(sp);
alert.appendChild(button);
alert.appendChild(strong);
var body = document.createElement("P");
body.setAttribute("id",id+"-body")
body.innerHTML=bodyText;
alert.appendChild(body);
}
}

 function updateMapMenu(lis){
  if (document){
	var addEntry=function(el){
		var nodeLink = document.createElement("A");
		nodeLink.appendChild(document.createTextNode(el.slice(0,15)));
		var role = document.createAttribute("role");
		var href = document.createAttribute("href");
		var action = document.createAttribute("onclick");
		//action.value = "document.getElementById('map_url').value='" + el+"'; changeMap('"+el+"');" ;
    action.value = " changeMap('"+el+"');" ;
		href.value = "#";
		role.value="button";
		nodeLink.setAttributeNode(href);
		nodeLink.setAttributeNode(role);
		nodeLink.setAttributeNode(action);
		var nodeEl = document.createElement("LI");
		nodeEl.appendChild(nodeLink);
    nodeLink.setAttribute("title", el);
    nodeLink.setAttribute("class","list-group-item");
		document.getElementById("map_chooser").appendChild(nodeLink);
	}
	lis.map(addEntry);
	//document.getElementById("map_number").innerHTML=lis.length;
}
}


function localStorageCheck(timeout){
  if (document){
    var temp=document.createElement("P");
  if (localStorage){
    addAlert("alert-storage","alert-success","Local Storage",
    "Local storage is available in your browser. Regions will be saved");

    temp.innerHTML=  "Local storage is available in your browser. Regions will be saved";
    temp.setAttribute("class","alert-success");
  }
  else{
    addAlert("alert-storage","alert-warning","Local Storage",
    "Local storage is unavailable in your browser, regions will not be saved");
    temp.innerHTML=  "Local storage is unavailable in your browser, regions will not be saved";
  }
  document.getElementById("aboutStatus").appendChild(temp);
  if (timeout){
  setTimeout(function(){
    $('#alert-storage').alert("close");
  }, timeout);
}
}
}

function workerCheck(timeout){
  if (document){
    var temp=document.createElement("P");
  if (localStorage){
    addAlert("alert-worker","alert-success","Web workers",
    "Web workers are available in your browser.");
    temp.innerHTML= "Web workers are available in your browser.";
    temp.setAttribute("class","alert-success");
  }
  else{
    addAlert("alert-worker","alert-warning","Web workers",
    "Web workers are unavailable in your browser.");
    temp.innerHTML=  "Web workers are unavailable in your browser.";
  }
  document.getElementById("aboutStatus").appendChild(temp);
  if (timeout){
  setTimeout(function(){
    $('#alert-worker').alert("close");
  }, timeout);
}
}
}


function densityOk(){
  if (document){
	$('#alert-density').alert("close");}
}

function densityError(){
  if (document){
	$('#alert-density').alert("close");
	addAlert("alert-density","alert-danger","Warning!","Unable to find or parse the file, most probable cause: no file");
  }
}

function listOk(configUrl){
  if (document){
  $('#alert-maplist').alert("close");}
}

function listError(){
  if (document){
  $('#alert-maplist').alert("close");
  addAlert("alert-maplist","alert-danger","Warning!","Unable to find the maplist file, most probable cause: no mapList.csv file,please contact administrator at gherardo.varando@gmail.com. You can still use the app if you know the template url of the map");
}
}

  function configOk(configUrl){
    if (document){
    $('#alert-config').alert("close");
  }
  }

function configError(configUrl){
    if (document){
    $('#alert-config').alert("close");
    addAlert("alert-config","alert-danger","Warning!","Unable to find the mapconfig file, most probable cause: no mapname.mapconfig file");
    //emptyConfig(); //generate an empty/standard configuration
  }
  }

function mapOk(){
    if (document){
    $('#alert-map').alert("close");
  }
  }

  function mapError(){
    if (document){
    $('#alert-map').alert("close");
    addAlert("alert-map","alert-danger","Warning!","The provided map/url template is not valid, most probable cause: no map directory");
    emptyConfig();
  }
  }


function   newModal(id,header,body){
    if (document){
    var modal=document.createElement("DIV");
    modal.setAttribute("id",id);
    modal.setAttribute("class","modal fade");
    modal.setAttribute("tabindex","-1");
    modal.setAttribute("role","dialog");
    modal.setAttribute("aria-labelledby","aboutModalLabel");
    var dialog=document.createElement("DIV");
    dialog.setAttribute("class","modal-dialog");
    dialog.setAttribute("role","document");
    var content=document.createElement("DIV");
    content.setAttribute("class","modal-content");
    var head=document.createElement("DIV");
    head.setAttribute("class","modal-header");
    var button=document.createElement("BUTTON");
    button.setAttribute("type","button");
    button.setAttribute("class","close");
    button.setAttribute("data-dismiss","modal");
    button.setAttribute("aria-label","Close");
    var span=document.createElement("SPAN");
    span.innerHTML="&times;";
    var title=document.createElement("DIV");
    title.setAttribute("class","modal-title");
    title.setAttribute("id",id+"-title");
    title.innerHTML=header;
    var bodyy=document.createElement("DIV");
    bodyy.setAttribute("class","modal-body");
    bodyy.setAttribute("id",id+"-body");
    button.appendChild(span);
    head.appendChild(button);
    head.appendChild(title);
    if (body){
    bodyy.appendChild(body);
  }
    content.appendChild(head);
    content.appendChild(bodyy);
    dialog.appendChild(content);
    modal.appendChild(dialog);
    return(modal);
  }
  }
