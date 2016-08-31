"use strict";

//leaflet is required
//papaparse is required

//sum function to be used in reduce()
function getSum(total, num) {
    return total + num;
}


// check if point is inside polygon
// point is a 2 dimensional vector
// polygon is a vector of latlngs components, as returned by leaflet .getLatLngs method
function pointinpolygon (point, polygon) {
   // ray-casting algorithm based on
   // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
   var x = point[0], y = point[1];  // extract x and y form point

   //convert latlngs to a vector of coordinates
   var vs=polygon.map( function(ltlng){ return([ ltlng.lat, ltlng.lng ])} );

   var inside = false; //initialize inside variable to false

   //ray-casting algorithm
   for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
       var xi = vs[i][0], yi = vs[i][1];
       var xj = vs[j][0], yj = vs[j][1];
       var intersect = ((yi > y) != (yj > y))
           && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
       if (intersect) inside = !inside;
   }
   return inside;
};



// area of polygon, this function is used in the fast setting, in the slow setting,
// instead the area is computed using the holes mask
   // code from http://www.mathopenref.com/coordpolygonarea2.html
   // original from http://alienryderflex.com/polygon_area/
   //  Public-domain function by Darel Rex Finley, 2006.
   function polygonArea(coords)
   {
     coords=coords.map(function(ltlng){return([ltlng.lat,ltlng.lng])});
     var numPoints=coords.length;
  var area = 0;         // Accumulates area in the loop
  var j = numPoints-1;  // The last vertex is the 'previous' one to the first

  for (var i=0; i<numPoints; i++)
    { area = area +  (coords[j][0]+coords[i][0]) * (coords[j][1]-coords[i][1]);
      j = i;  //j is previous vertex to i
    }
  return Math.abs(area/2);
}


// brainMap creator
// brainMap is a
 function brainMap(name,map,sidebar){

  // valid field for the configuration files, just thhose field will be read
  // just add a string in this vector and the corresponding field will be read from
  // the configuration file of the map
  this.validConfigFields=["name","tileDim","maxZoom","dim_px","scale_px",
  "depth_px","dim_cal","depth_cal","scale_cal","unit_cal","author","reference",
  "url","date","tilesUrlTemplate","note","pointsUrlTemplate","holesUrlTemplate",
  "holesMapUrlTemplate","objectsUrlTemplate","X_0","Y_0"];

  this.basePath="";
 // check if name is given otherwise use 'map'

  if (name){
  this.name=name;
  }
  else{this.name="map"}

  //check if a map obeject is given, otherwise create it (require leaflet)
  if (map){
    this.map=map;
  }
  else{
    this.map = L.map('map',{minZoom:0,  crs: L.CRS.Simple, maxBounds: [[60,-60],
      [-280,280]], fullscreenControl: false }).setView([-100,100],1);
  }
  this.state={configError:false, unClickable:true, computePolygon:true,
    showGrid:false, unbiasedDensity:true, fastArea: false};
  this.localStorage=false;
  this.useWorkers=true;

  //initialize empty/standard/basic configurations, this configuration change with baseMap change
  this.initialiseEmptyConfig=function(){
  this.name="map";
  this.tilesUrlTemplate=undefined;
  this.onServer=true;
  this.tileDim=256;
  this.maxZoom=20;
  this.dim_px=256;
  this.scale_px=256;
  this.depth_px=1;
  this.dim_cal=256;
  this.scale_cal=256;
  this.depth_cal=1;
  this.unit_cal="px";
  this.author="unknown";
  this.reference="unknown";
  this.url="#";
  this.date="11/01/1966";
  this.polygons=[];
  this.px2calAreaFactor=1;
  this.px2calVolumeFactor=1;
  this.calVolumeVoxel=1;
}



// initialise the layer to store the drawn items
// requrie leaflet.draw
  this.initialiseDrawnItems=function(){
    var self=this;
    var drawnItems = new L.FeatureGroup(); //where items are stored

    //every time a polygon is added to the layer..
    drawnItems.on("layeradd",function(e){
      var poly=e.layer;
      if (poly.getLatLngs){ //if it is a polygon, avoid markers and others.
      self.addPolygon(poly);
      self.state.unClickable=false; //enable the click options over polygons
      }
    })
    this.drawnItems=drawnItems;

    this.map.addLayer(drawnItems);

}


this.inintialiseDrawControls=function(){
  if (!this.drawnItems){
    this.initialiseDrawnItems();
  }
  //we have to add some logic for when the region are edited, like recomputing the info

  var self=this;
  //define and add the control to map
  //see leaflet and leaflet.draw documentaion
  var drawControl = new L.Control.Draw({
  position: "bottomleft", //position of the control
  edit: {
      featureGroup: self.drawnItems, //specifies where to store the items
      edit: { },
      remove: { }
  },
  draw:{
    polyline: false,
    circle: false,
    marker: false,
    rectangle: {
      showArea: false
    },
    polygon: {
      showArea: false,
      allowIntersection: false
    }
  }
  } );
  this.map.addControl(drawControl);

  //define actions on events listener
  //on the creation of a new item
  this.map.on('draw:created', function (e) {
    self.state.unClickable=false;
    self.map.dragging.enable();
    if (self.freeDraw){
    self.freeDraw.setMode(L.FreeDraw.MODES.VIEW);
    }
  var type = e.layerType,
      layer = e.layer;
  self.drawnItems.addLayer(layer);
  });

//on edit
  this.map.on('draw:edited', function (e) {
  var layers = e.layers;
  if (self.freeDraw){
  self.freeDraw.setMode(L.FreeDraw.MODES.VIEW);
  }
  layers.eachLayer(function (layer) {
  self.computeDensity(layer);
  });
});

// where items are removed
this.map.on('draw:deleted', function (e) {
var layers = e.layers;
if (self.freeDraw){
self.freeDraw.setMode(L.FreeDraw.MODES.VIEW);
}
layers.eachLayer(function (layer) {
  self.deletePolygon(layer,self.drawnItems);
});
});

this.map.on('draw:drawstart',function(){
self.state.unClickable=true;
if (self.freeDraw){
self.freeDraw.setMode(L.FreeDraw.MODES.VIEW);
}
self.map.dragging.disable();
});

// disable clikkable regions on edit
this.map.on('draw:editstart',function(){
self.state.unClickable=true;
if (self.freeDraw){
self.freeDraw.setMode(L.FreeDraw.MODES.VIEW);
}});
this.map.on('draw:editstop',function(){
self.state.unClickable=false;

});
this.map.on('draw:deletestart',function(){
self.state.unClickable=true;
if (self.freeDraw){
self.freeDraw.setMode(L.FreeDraw.MODES.VIEW);
}});
this.map.on('draw:deletestop',function(){
self.state.unClickable=false;
});
}

this.initialiseFreeDrawControls=function(){
  if (!this.drawnItems){
    this.initialiseDrawnItems();
  }
  var self=this;
  this.freeDraw=new L.FreeDraw({modes: L.FreeDraw.MODES.VIEW,
     drawnItems: self.drawnItems});
  this.freeDraw.options.setHullAlgorithm(false);
  this.freeDraw.options.simplifyPolygon=false;
  this.freeDraw.options.setBoundariesAfterEdit(false);
  this.freeDraw.options.attemptMerge=false;
  this.map.addLayer(this.freeDraw);
  this.freeDrawControl= L.easyButton('fa-pencil', function(btn, map){
    self.freeDraw.setMode(L.FreeDraw.MODES.CREATE);
    self.state.unClickable=true;
},{position: "bottomleft"});
  this.map.addControl(self.freeDrawControl);
}


 // projections from original calibrations  -> map (256 tiles dim)
  this.project_cal=function(point){
    point[0]=point[0]*256/this.dim_cal;
    point[1]=point[1]*256/this.dim_cal;
    return(point);
  }

//projections from original pixels -> map (256 tile dim)
  this.project_px=function(point){
  var x=point[0]*256/this.dim_px;
  var y=point[1]*256/this.dim_px;
    return([x,y]);
  }

// inverse of project_px
  this.inverseProject_px=function(point){
    var x=point[0]*this.dim_px/256;
    var y=point[1]*this.dim_px/256;
    return([x,y]);
  }

//define the standar tilesurlTemplate to be used in leaflet
  this.guessTilesUrlTemplate=function(){
    return("maps/"+this.name+"/tiles/{z}/{x}/{y}.png")
  }

//define the standard gonfig file path, that is actually the only path that is tryed
  this.guessConfigUrl=function(){
    return("maps/"+this.name+"/"+this.name+".mapconfig")
  }

//define the standard holesUrlTemplate, (not used??)
  this.guessholesUrlTemplate=function(){
    return("maps/"+this.name+"_holes"+"tiles/{z}/{x}/{y}.png")
  }

// function that given bounds (as .getBounds leaflet method)
// return references for finding the originals 1024x1024 tiles
// we have to include the original tiles dimension as a variable (read from config file)
this.getReferences = function(bounds){
 var self=this;
 if (bounds){


var x0=0;
var y0=0;
var temp=[];
var xstart=Math.floor(bounds.getWest()*self.scale_px/1024);
var xstop=Math.floor(bounds.getEast()*self.scale_px/1024);
var ystart=Math.floor(-bounds.getNorth()*self.scale_px/1024);
var ystop=Math.floor(-bounds.getSouth()*self.scale_px/1024);
if (this.X_0){
  x0=this.X_0;
}
if (this.Y_0){
  y0=this.Y_0
}
for (var i=xstart;i<=xstop;i++){
  for (var j=ystart;j<=ystop;j++){
    //if (i>=0 && j>=0){
    temp.push([i,j]);
  //}
  }
}

var res=temp.map(function(coord){
  return({
  col: coord[0]+x0,
  row: coord[1]+y0,
  x: coord[0]*1024,
  y: coord[1]*1024})} );

return( res);
 }
}







  this.generateSummaryElement=function(tag){
    if (this[tag]){
    var temp=document.createElement("LI");
    temp.setAttribute("class","list-group-item");
    var temp2=document.createElement("H4");
    temp2.setAttribute("class","list-group-item-heading")
    var temp3=document.createElement("P");
    temp3.setAttribute("class","list-group-item-text");
    temp3.innerHTML=this[tag];
    temp2.innerHTML=tag ;
    temp.appendChild(temp2);
    temp.appendChild(temp3);
    return(temp);
  }
  else{
    return(undefined);
  }
  }

  this.generateSummary=function(tags,id){
    if (document){
      var nice = document.createElement("DIV");
      nice.setAttribute("class","panel panel-primary");
      var cont = document.createElement("UL");
      cont.setAttribute("class","list-group panel-body");
      cont.style.width="100%";
      //cont.style["font-size"]= "20px";
      for (var i=0;i<tags.length;i++){
        var tt=this.generateSummaryElement(tags[i]);
        if (tt){cont.appendChild(tt);}
      }
      //var listElSum=this.validConfigFields.map(this.generateSummaryElement);
      //istElSum.map(function(a){if (a!=undefined){cont.appendChild(a);}});
      //window.alert(listElSum[0]);
      cont.setAttribute("id",id);

      var head=document.createElement("DIV");
      head.setAttribute("class","panel-heading");
      head.innerHTML="Map info";
      nice.appendChild(head);
      nice.appendChild(cont);
      return(cont);
    }
  }





 this.updateMapInfo=function(newinfo){   // map,tileDim,maxZoom,width_px,height_px,width_cal,height_cal,author,reference,url,date
   if (newinfo){
     var self=this;
   this.validConfigFields.map(function(tag){
     self[tag]=newinfo[tag];
   })
   if (this.url){
     this.attribution="<a href="+this.url+">"+this.url+"</a>";
   }

 }
 this.px2calAreaFactor=(this.dim_cal*this.dim_cal)/(this.dim_px*this.dim_px);
 this.px2calVolumeFactor=this.px2calAreaFactor*this.depth_cal;
 this.calVolumeVoxel=this.px2calVolumeFactor/this.depth_px;
  }


 this.defineLayer=function(){
   if (this.tilesUrlTemplate){
     this.layer = L.tileLayer(this.tilesUrlTemplate,{continuousWorld: true,
       maxZoom: this.maxZoom,
       errorTileUrl: "images/black.png",
       attribution:this.attribution});
   }
   else{
     this.tilesUrlTemplate=this.guessTilesUrlTemplate();
     this.defineLayer();
   }
 }


 this.savePolygonLocalStorage=function(polygon){
  if (localStorage){
    var n=parseInt(localStorage.getItem(this.name+"_nPolygons"));
    if (n==undefined | n==NaN | n<-1 ){
      n=-1;
    }
    n=n+1;
    localStorage[this.name+"_nPolygons"]=n;
    localStorage[this.name+"_polygon_"+n]=polygon;
  }
 }


 this.retrivePolygonLocalStorage=function(){
   if (localStorage && this.localStorage){
     for (var i=0; i<=localStorage.length-1; i++){
       var key = localStorage.key(i);
       if (key.includes(this.name+"_polygon_")){
         window.alert();
         var str=localStorage.getItem(key);
         var parsed=JSON.parse(str);
         if (parsed){
           var pol=L.multiPolygon(parsed.latlngs);
           window.alert("adding");
           pol.area_px=parsed.area_px;
           pol.points=parsed.holes_vx;
           pol.points=parsed.points;
           this.addPolygon(pol,true);
         }
       }
   }
 }
 }

this.uplaodJSON = function(){
  var inp=document.createElement("INPUT");
  var self=this;
  inp.setAttribute("type","file");
  inp.setAttribute("accept",".json");
  this.inputJSON=inp;
  inp.setAttribute("onchange","uploadJSON();");
  document.getElementsByTagName("body")[0].appendChild(inp);
  inp.click();
  document.getElementsByTagName("body")[0].removeChild(inp);
  }


 this.readJSONpolygon= function(file){
   var self=this;
   var reader=new FileReader;
  reader.readAsText(file);
  reader.onloadend= function(){
  var jsonString=reader.result;
  var pol=JSON.parse(jsonString);
  self.drawnItems.addLayer(L.polygon(pol.latlngs,{color: "#802000"}));
  self.polygons[self.polygons.length-1].area_px = pol.area_px;
  self.polygons[self.polygons.length-1].holes_vx = pol.holes_vx;
  self.polygons[self.polygons.length-1].points = pol.points;
  self.showInfoPolygon(self.polygons[self.polygons.length-1]);
}
 }

 this.downloadRegionsCSV = function(regions){
   var self=this;
   var data = "data:text/csv;charset=utf-8,";
   var lines="id, density, density_neuropilum, number_points, volume, volume_holes \n";
   if (!regions){
    var regions=this.polygons;
   }

   regions.map(function(x){
     lines= lines + x.bmId +","+
              self.getDensity(x) + ","+
              self.getDensityH(x) + "," +
              self.getNumberPointInside(x) + "," +
              self.getVolumecal(x) + "," +
              self.getHolescal(x) + "\n" ;
   });
   data = data + lines;
   var newWindow = window.open(encodeURI(data));
 }


 this.downloadRegionsJSON = function(polygon){
   polygon.downloadJSONlink.click();
 }


//function that fill the modals of the polygon with info
 this.showInfoPolygon = function(polygon){
   var self=this;
   if (document){
     var pmb=document.getElementById(polygon.bmId+"-body");
  if (pmb){
     empty(pmb,pmb.firstChild);}
     var volunit=" "+this.unit_cal+"^3";
     var areaunit=" "+this.unit_cal+"^2";
     var point=this.getNumberPointInside(polygon);
     var areacal=this.getAreacal(polygon);
     var volcal=this.getVolumecal(polygon);
     var holescal=this.getHolescal(polygon);
     var densityTot=this.getDensity(polygon);
     var densityH=this.getDensityH(polygon);


     var list = document.createElement("UL");
     list.className="list-group";

     var pointT=document.createElement("LI");
     pointT.className="list-group-item";
     pointT.innerHTML="Total number of puncta: "+ point;

     var volumT=document.createElement("H2");
     volumT.className="list-group-item-heading";
     volumT.innerHTML="Volume examined: " + volcal.toFixed(2) + volunit;

     var holesT=document.createElement("P");
     holesT.className="list-group-item-text";
     holesT.innerHTML="Holes: " + holescal.toFixed(2) + volunit;
     var neuropilT=document.createElement("P");
     neuropilT.className="list-group-item-text";
     neuropilT.innerHTML="Neuropil: " + (volcal-holescal).toFixed(2) + volunit;

     var contVolT=document.createElement("LI");
     contVolT.className="list-group-item";
     contVolT.appendChild(volumT);
     contVolT.appendChild(holesT);
     contVolT.appendChild(neuropilT);

     //density
     var densityT=document.createElement("LI");
     densityT.className="list-group-item";
     densityT.innerHTML="Density of puncta: " + densityTot.toFixed(2) + "  puncta /"+volunit  ;
     var densityTH=document.createElement("LI");
     densityTH.className="list-group-item";
     densityTH.innerHTML="Denisty of puncta in neuropil: " + densityH.toFixed(2) + "  puncta /"+volunit ;

     list.appendChild(contVolT);
     list.appendChild(pointT);
     list.appendChild(densityT);
     list.appendChild(densityTH);

     var polygonToDownload={
       area_px : polygon.area_px,
       holes_vx : polygon.holes_vx,
       points : polygon.points,
       latlngs : polygon.getLatLngs()
     };
     var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(polygonToDownload));
     var contDown=document.createElement("DIV");
     var dow=document.createElement("A");
     polygon.downloadJSONlink=dow;
     dow.setAttribute("href","data:"+data);
     dow.setAttribute("download","region"+polygon.bmId+".json");
     dow.innerHTML="download JSON";
     contDown.appendChild(dow);
     var containerLink=document.createElement("DIV");
     containerLink.setAttribute("style","max-height: 150px; overflow-y: auto;");
     contDown.appendChild(containerLink);
     var ref=this.getReferences(polygon.getBounds());

     if (ref.length){
       ref.map(function(r){
         var imgDownCont=document.createElement("DIV");

         var imgDown=document.createElement("A");
         var imgView=document.createElement("A");

         var url=self.objectsUrlTemplate.replace("{x}",r.col);
         url=url.replace("{y}",r.row);

         imgDown.setAttribute("href",url);
         imgDown.setAttribute("download","segmented_X"+r.col+"_Y"+r.row+".tiff");
         imgDown.innerHTML="download "+"segmented_X"+r.col+"_Y"+r.row+".tiff";
         imgDown.setAttribute("download","segmented_X"+r.col+"_Y"+r.row+".tiff");
         imgDown.setAttribute("target","new");

         imgDownCont.appendChild(imgDown);

        /*
         imgView.setAttribute("href","/viewer/viewer.html");
         imgView.setAttribute("target","new");
         imgView.innerHTML="view "+"segmented_X"+r.col+"_Y"+r.row+".tiff";

         imgDownCont.appendChild(imgView);
  */
         containerLink.appendChild(imgDownCont);

       })
   }


     if (document.getElementById(polygon.bmId+"-body")){
     document.getElementById(polygon.bmId+"-body").appendChild(list)
     document.getElementById(polygon.bmId+"-body").appendChild(contDown);
      }
     addPolInfoEl(polygon.bmId,[densityH.toPrecision(3)],
     "fa fa-file",[{att:"role",vAt:"button"}]);
   }
 }


    this.computeDensity = function(polygon){
      var self=this;
      //get the list of references for points and holes tiles
      var references=this.getReferences(polygon.getBounds());
      var l=2*references.length;
      var tot=l;

      //start spinng icon
      addPolInfoEl(polygon.bmId,["computing"],"fa fa-spinner fa-spin");

      //reset statistics to 0
      polygon.points=[0];
      polygon.area_px=[0];
      polygon.areaEasy=polygonArea(polygon.getLatLngs())*self.scale_px*self.scale_px;
      polygon.holes_vx=[0];
      var latlngs=polygon.getLatLngs();

      if (window.Worker && this.useWorkers){
        var input={
          latlngs: latlngs,
          references: references,
          scale_px: self.scale_px,
          holesUrlTemplate: self.holesUrlTemplate,
          pointsUrlTemplate: self.pointsUrlTemplate,
          unbiasedDensity:  self.state.unbiasedDensity,
          fastArea: self.state.fastArea,
          depth_px: self.depth_px
        };
        var wk=new Worker("js/workerParsing.js");
        wk.onmessage=function(e){
          var temp=JSON.parse(e.data);
          polygon.points=temp.points;
          polygon.holes_vx=temp.holes_vx;
          polygon.area_px=temp.area_px;
          if (self.state.fastArea){
            polygon.area_px.push(polygonArea(polygon.getLatLngs())*self.scale_px*self.scale_px);
          }
          self.showInfoPolygon(polygon);
          badgeUp("region-badge");
          addAlert("alert-worker","alert-success",
          "region "+polygon.bmId+ " computed","Statistics for the region are available to display");
          setTimeout(function(){
            $('#alert-worker').alert("close");
          }, 2000)
        }
        wk.postMessage(JSON.stringify(input));
      }
      else{
        var funH=function(holes,area){
          l=l-1;
          updateProgressBar("comp",100*(tot-l)/tot);
          polygon.area_px.push(area);
          polygon.holes_vx.push(holes);
          if (l<=0){
            closeProgressBar("comp");
            self.state.unClikable=false;
            self.showInfoPolygon(polygon);
                  }
        }
        var funP=function(points){
          l=l-1;
          updateProgressBar("comp",100*(tot-l)/tot);
          polygon.points.push(points);
          if (l<=0){
            closeProgressBar("comp");
            self.state.unClikable=false;
            self.showInfoPolygon(polygon);
          }
        }
        var error=function(){
          l=l-1;
          if (l>0){
          updateProgressBar("comp",100*(tot-l)/tot);
        }
          if (l<=0){
            closeProgressBar("comp");
            self.state.unClikable=false;
            self.showInfoPolygon(polygon);
          }
        }
      addProgressBar("comp");
      for (var tt=0;tt<references.length;tt++){
        self.state.unClikable=true;
        if (self.state.fastArea){
          l=l-1;
          updateProgressBar("comp",100*(tot-l)/tot);
        }
        else{readHoles(polygon,references[tt],funH,error,self);}
        readPoints(latlngs,references[tt],funP,error,self);
      }
      if (self.state.fastArea){
        polygon.area_px.push(polygonArea(polygon.getLatLngs())*self.scale_px*self.scale_px);
      }
    }
    }







   this.addPolygon=function(polygon,notcompute){
    var self=this;

    badgeShow("region-badge"); //show the badge for new regions

    polygon.bmId=this.polygons.length; //attach an id to polygon

    //initialise empty statistics
    polygon.points=[null];
    polygon.area_px=[null];
    //compute the area with the formula (not always correct)
    polygon.areaEasy=polygonArea(polygon.getLatLngs())*self.scale_px*self.scale_px;
    polygon.holes_vx=[null];

    //add the polygon to the polygons array
    this.polygons.push(polygon);

    //create the polygon info modal and add it to the DOM
    if (document){
   polygon.modal=newModal(polygon.bmId,"Area "+polygon.bmId);
   document.getElementsByTagName("BODY")[0].appendChild(self.polygons[self.polygons.length-1].modal);
    }



    if (!notcompute && this.state.computePolygon){
      //compute statistics area, holes and points
    this.computeDensity(polygon);
     }
     else{
       //generate the modal anyway
       addPolInfoEl(polygon.bmId,["not computed"],"fa fa-question");
       this.showInfoPolygon(polygon);
      }




    polygon.bindContextMenu({
    contextmenu: true,
    contextmenuWidth: 140,
    contextmenuItems: [{
        text: 'Info',
        iconCls: "fa fa-info",
        callback: function(){onClickPolygon({target:polygon})}
    }, {
        text: 'Compute',
        iconCls: "fa fa-cog",
        callback: function(){self.computeDensity(polygon)}
    }, '-', {
        text: "Results csv",
        iconCls: 'fa fa-file-text-o',
        callback: function(){self.downloadRegionsCSV([polygon]);}
    }, {
        text: 'JSON',
        iconCls: 'fa fa-download',
        callback: function(){self.downloadRegionsJSON(polygon);}
    }]
});


// set onclick function

//define the onCLick function for the polygon
function onClickPolygon(e){
 if (document){
   if (self.state.unClickable){
     return;
   }
   //this.showInfoPolygon(e.target);
   $('#'+e.target.bmId).modal('toggle');
}
};
    polygon.on("click",onClickPolygon);



//define the hoover function
function onHoover(e){

}

polygon.on("mouseover", onHoover)

   }


   //util functions to retrive statistics... (area, volume density etc..)
   this.getNumberPointInside=function(x){
     return(x.points.reduce(getSum));
   }
   this.getAreapx=function(x){
     return(x.area_px.reduce(getSum));
   }
   this.getHolesvx=function(x){
     return(x.holes_vx.reduce(getSum));
   }
   this.getAreacal=function(x){
     var areapx=this.getAreapx(x)
     return(areapx*this.px2calAreaFactor);
   }
//return the volume of holes in the polygon in cal
   this.getHolescal=function(x){
     var holesvx=this.getHolesvx(x)
     var holescal=holesvx*this.calVolumeVoxel;
     return(holescal);
   }
//return the volume defined by the polygon in cal
  this.getVolumecal=function(x){
  var areapx=this.getAreapx(x)
  return(areapx*this.px2calVolumeFactor);
      }
  this.getDensity=function(x){
    var volcal=this.getVolumecal(x);
    return(this.getNumberPointInside(x)/volcal);
  }
  this.getDensityH=function(x){
      var volcal=this.getVolumecal(x)-this.getHolescal(x);
      return(this.getNumberPointInside(x)/volcal);
    }


//add and remove the base layer to the map
  this.addToMap=function(){
    this.defineLayer();
    this.map.addLayer(this.layer);
    this.map.setView([-100,100],1);
  }
  this.removeLayer=function(){
    if (this.layer){
    this.map.removeLayer(this.layer);
    this.map.removeLayer(this.holesLayer);
    }
  }


//add and remove the holes layer from map
  this.addHolesLayer=function(){
      var holesBounds =L.latLngBounds( [[0, 0], [-255, 255]]);
      this.holesLayer=L.tileLayer(this.holesMapUrlTemplate,{continuousWorld: true,maxZoom:5, opacity: 0.5});
  }
  this.removeHolesLayer=function(){
    if (this.holesLayer){
      if (this.map){
        this.map.removeLayer(this.holesLayer);
      }
    }
  }

//remove a given polygon modal from DOM
  this.removePolygonModal=function(polygon){
    if (polygon.modal){
    if (polygon.modal.parentElement){
    polygon.modal.parentElement.removeChild(polygon.modal);} }
  }

  //deleta a polygon
  this.deletePolygon=function(polygon){
    if (polygon){
      //remove the modal
    this.removePolygonModal(polygon);
    if (this.drawnItems){
    //remove the layer form the featureGroup drawnItems
    this.drawnItems.removeLayer(polygon);}
    }
    addPolInfoEl(polygon.bmId,["deleted"],"fa fa-times");
    polygon=undefined;
  }

  //delete all polygons
  this.clearPolygons=function(){
    var self=this;
    if (this.polygons){
    this.polygons.map(function(pol){if (pol) {self.deletePolygon(pol)}});}
    var cnt=document.getElementById("polygonsInfo");
    empty(cnt,cnt.firstChild);
    addHeadPolInfoEl("id",["density"],
    "fa fa-file",[{att:"role",vAt:"button"},{att:"id",vAt:"down-all-region-button"},
    {att:"onclick",vAt:"brainmap.downloadRegionsCSV();"}]);
  }

  this.disableZoom=function(){
    this.map.touchZoom.disable();
    this.map.doubleClickZoom.disable();
    this.map.scrollWheelZoom.disable();
  }

  this.enableZoom=function(){
    this.map.touchZoom.enable();
    this.map.doubleClickZoom.enable();
    this.map.scrollWheelZoom.enable();
  }

  //add the layer controls
  this.addControls=function(){
    var baseMaps={};
    var overlayMaps = {};
    if (this.holesLayer){
    overlayMaps["Neuropilum"]=this.holesLayer;
  }
  if (this.heatMap){
    overlayMaps["HeatMap"]=this.heatMap;
  }
   if (this.drawnItems){
     overlayMaps["Regions"]=this.drawnItems;
   }
   if (this.markerClusterGroup){
     overlayMaps["Markers"]=this.markerClusterGroup;
   }

   this.controls =	L.control.layers(baseMaps,overlayMaps,{position:"bottomleft", autoZIndex:false});
   this.controls.addTo(this.map);
   var self=this;
   this.map.on("overlayadd",function(e){
     if (e.name=="Neuropilum"){
     }});
   this.map.on("overlayremove",function(e){
       if (e.name=="Neuropilum"){
       }
   });
  }


  this.removeControls=function(){
    if (this.controls){
    this.map.removeControl(this.controls);}
  }

  this.updateInfoSections=function(){
    if (document){
    if (document.getElementById("summaryAll")){
        document.getElementById("infomodal_body").removeChild(
          document.getElementById("summaryAll"));}
    if (document.getElementById("summarySmall")){
        document.getElementById("sidebar-body").removeChild(
          document.getElementById("summarySmall"));}

    document.getElementById("infomodal_body").appendChild(
      this.generateSummary(this.validConfigFields,"summaryAll"));
  /*  document.getElementById("map-settingBody").appendChild(
      this.generateSummary(["name","author"],"summarySmall")); */
  }
  }


  this.initialiseMarkerCluster=function(){
    var markers = L.markerClusterGroup();
    this.markerClusterGroup=markers;
    this.map.addLayer(markers);
  }

  this.clearMarkers=function(){
    if (this.markerClusterGroup){
      this.markerClusterGroup.clearLayers();
    //this.map.removeLayer(this.markerClusterGroup);
  }
  }

  this.addMarkersOf=function(e){
    this.clearMarkers();
    var self=this;
    var ref=this.getReferences(L.latLngBounds(e.latlng,e.latlng));
    readPoints(null,ref[0],function(useless){
    },null,self,function(latlng,self,numberPoint){
      if (!latlng.some(isNaN)){
      self.markerClusterGroup.addLayer(L.circleMarker(latlng));}
    })
  }


  this.initialiseHeatMap=function(){
    this.heatMap = L.heatLayer([[1000,1000]],{radius: 8, minOpacity: 20, maxZoom:0})
    //this.map.addLayer(this.heatMap);
  }



  this.clearHeatMap=function(){
    if (this.heatMap){
    this.heatMap.setLatLngs([[1000,1000]]);
    this.map.removeLayer(this.heatMap);
  }
  }

  this.heatMapHere=function(e){
    var self=this;
    var ref=this.getReferences(L.latLngBounds(e.latlng,e.latlng));
    readPoints(null,ref[0],function(useless){
      self.heatMap.redraw();
      self.map.addLayer(self.heatMap);
      //self.map.addLayer(L.heatLayer(self.tempPoints.slice(0,self.tempPoints.length-1),{radius: 5, minOpacity: 70}));
      //self.map.addLayer(L.heatLayer([[0,0,10],[200,200,10]],{radius: 10}));
    },null,self,function(latlng,self){
      if (!latlng.some(isNaN)){
      self.heatMap.addLatLng(latlng);}
    })
  }


  this.heatMapAll=function(){
    var n = this.dim_px/1024;
    var delta = 255/n;
    for (var i=0+delta; i<256 ; i=i+delta ){
      for (var j=0+delta; j<256 ; j=j+delta ){
        this.heatMapHere({latlng:[-i,j]});
      }
    }
  }





  this.autobuild=function(info){
    this.clearMarkers();
    this.clearPolygons();
		this.removeControls();
		this.removeLayer();
    this.clearHeatMap();
		this.initialiseEmptyConfig();
    this.updateMapInfo(info);
    this.addToMap();
    this.addHolesLayer();
    this.initialiseMarkerCluster();
    this.initialiseHeatMap();
    this.addControls();
    this.updateInfoSections();
    this.map.setView([-100,100],1);
  }

  this.initialiseEmptyConfig();
  this.initialiseDrawnItems();
  this.inintialiseDrawControls();
  this.initialiseFreeDrawControls();
  this.map.addControl(sidebar);

}
