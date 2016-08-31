
importScripts("papaparse.min.js");
function pointinpolygon (point, polygon) {
   // ray-casting algorithm based on
   // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

   var x = point[0], y = point[1];

   var vs=polygon.map(function(ltlng){return([ltlng.lat,ltlng.lng])});
   var inside = false;
   for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
       var xi = vs[i][0], yi = vs[i][1];
       var xj = vs[j][0], yj = vs[j][1];

       var intersect = ((yi > y) != (yj > y))
           && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
       if (intersect) inside = !inside;
   }

   return inside;

}

function readHoles(latlngs,reference,cl,errCl,holesUrlTemplate,scale_px,depth_px){
	var holes=0;
	var points=0;
	var area=0;
	var y=0;
  var url=holesUrlTemplate.replace("{x}",reference.col);
  url="../"+url.replace("{y}",reference.row);

  var project=function(point){
		var s=(point[0]+reference.x)/scale_px;
		var t=(point[1]+reference.y)/scale_px;
		return([-t,s]);
	}

	Papa.parse(url,{
		download : true,
		header: false,
		worker: false,
		dynamicTyping: true,
	  fastMode: true,
		step: function(results,parser){
			y=y+1;
			for (x=0;x<results.data[0].length;x++){
				if (pointinpolygon(project([x,y]),latlngs) ){
					area=area+1;
				if (results.data[0][x]>0){
						holes=holes+(results.data[0][x]);
					}
				}


		  }
		} ,
		complete: function(results, file){
		//	$('#alert-workers-image').alert("close");
      //window.alert(url);
			if (cl) {cl(holes,area);}
	},
	error: function(error,file){
		//$('#alert-workers-image').alert("close");
	if (errCl){errCl();}
	}
	} );}


function readPoints(polygon,reference,cl,errCl,pointsUrlTemplate,scale_px,unbiased){
 var numberPoint=0;
 var url=pointsUrlTemplate.replace("{x}",reference.col);
 url="../"+url.replace("{y}",reference.row);
 var project=function(point){
 var s=(point[0]+reference.x)/scale_px;
 var t=(point[1]+reference.y)/scale_px;
 return([-t,s]);
 }
 Papa.parse(url,{
  download : true,
  header: false,
  worker: false,
  dynamicTyping: true,
  fastMode: true,
  step:  function(results, parser) {

   if (pointinpolygon(project([results.data[0][0],results.data[0][1]]),polygon) &&
       (!unbiased || results.data[0][3]==0 || results.data[0][3]==null )){
	  numberPoint=numberPoint+1;
   }
  },
  complete: function(results, file){
   	//window.alert("complete "+url+" \n" +"points: "+ numberPoint);
   	if (cl) {cl(numberPoint);}
  },
  error: function(error,file){
   if (errCl){errCl();}
   }
  } );
}




var onmessage = function(e) {
	var input=JSON.parse(e.data);
	var references=input.references;
	var l=2*references.length;
	var tot=l;
	var latlngs=input.latlngs;
	var holesUrlTemplate=input.holesUrlTemplate;
	var pointsUrlTemplate=input.pointsUrlTemplate;
  var fastArea = input.fastArea;
	var scale_px=input.scale_px;
  var unbiased=input.unbiasedDensity;
  var depth_px=input.depth_px;
  points=[0];
  area_px=[0];
	holes_vx=[0];
	var funH=function(holes,area){
		l=l-1;
		area_px.push(area);
		holes_vx.push(holes);
		if (l<=0){
			var result={
				points:points,
				holes_vx:holes_vx,
				area_px:area_px
			}
			postMessage(JSON.stringify(result));
		}
	}

	var funP=function(point){
		l=l-1;
    points.push(point);
		if (l<=0){
			var result={
				points:points,
				holes_vx:holes_vx,
				area_px:area_px
			}
			postMessage(JSON.stringify(result));
		}
	}

	var error=function(){
		l=l-1;
		if (l>0){

	}
	if (l<=0){
		var result={
			points:points,
			holes_vx:holes_vx,
			area_px:area_px
		}
		postMessage(JSON.stringify(result));
	}
	}
	for (var tt=0;tt<references.length;tt++){
    if (fastArea){
    l=l-1;}
    else{readHoles(latlngs,references[tt],funH,error,holesUrlTemplate,scale_px,depth_px);}
		readPoints(latlngs,references[tt],funP,error,pointsUrlTemplate,scale_px,unbiased);
	}

}
