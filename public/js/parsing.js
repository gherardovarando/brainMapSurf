function readMapList(url,cl){
	Papa.parse("maps/mapList.csv",{
		delimiter: ",",
    preview: 1,
		download : true,
		skipEmptyLines: true,
		complete: function(results, file) {
			listOk();
  		var mapList = results.data[0];
			updateMapMenu(mapList);
      if (cl){cl(mapList[0]);}
		},
		error: function(error,file){
			window.alert();
			listError();
		}
		} );
	}

function readMapConfig(configUrl,cl,errCl){
  Papa.parse(configUrl,{
  download : true,
	dynamicTyping: true,
  header: true,
  preview: 1,
	worker: false,
  complete: function(results, file){
  cl(results.data[0]);
},
error: function(error,file){
  if (errCl){errCl();}
}
} );
}

function readHoles(polygon,reference,cl,errCl,self){
	var holes=0;
	var points=0;
	var area=0;
	var y=0;
	var latlngs=polygon.getLatLngs();
  var url=self.holesUrlTemplate.replace("{x}",reference.col);
  url=url.replace("{y}",reference.row);

  var project=function(point){
		var s=(point[0]+reference.x)/self.scale_px;
		var t=(point[1]+reference.y)/self.scale_px;
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
						holes=holes+(self.depth_px*results.data[0][x]/255);
					}
				}


		  }
		} ,
		complete: function(results, file){
		//	$('#alert-workers-image').alert("close");
      window.alert("complete "+url);
			if (cl) {cl(holes,area);}
	},
	error: function(error,file){
		//$('#alert-workers-image').alert("close");
	if (errCl){errCl();}
	}
	} );}


function readPoints(polygon,reference,cl,errCl,self,step){
 var numberPoint=0;
 var url=self.pointsUrlTemplate.replace("{x}",reference.col);
 url=url.replace("{y}",reference.row);
 //var latlngs=polygon.getLatLngs();
 var project=function(point){
 var s=(point[0]+reference.x)/self.scale_px;
 var t=(point[1]+reference.y)/self.scale_px;
 return([-t,s]);
 }
 Papa.parse(url,{
  download : true,
  header: false,
  worker: false,
  dynamicTyping: true,
  fastMode: true,
  step:  function(results, parser) {
		if (polygon){
   if (pointinpolygon(project([results.data[0][0],results.data[0][1]]),polygon)&&
       (!self.unbiasedDensity || results.data[0][3]==0 || results.data[0][3]==null ) ) {
	  numberPoint=numberPoint+1;
	}
  }
	else{
		numberPoint=numberPoint+1;
		step(project([results.data[0][0],results.data[0][1]]),self,numberPoint);
	}

  },
  complete: function(results, file){
   //window.alert("complete "+url+" \n" +"points: "+ numberPoint);
   	if (cl) {cl(numberPoint);}
  },
  error: function(error,file){
		//window.alert("error "+url);
   if (errCl){errCl();}
   }
  } );
}
