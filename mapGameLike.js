var maptxt;
var maptemp=[];
var map=[];
var cellsize=32;
var reader;
var ctx;
var can;
var sourceCount=0;
var DestinationCount=0;
var sourceChosen=false;
var DestinationChosen=false;
var hashMap = new Object();
var destinationInterval;
var sourceinterval;
var AstarInterval;
var source={};
var goal={};
var openList= new Object();
var closedList = new Object();
var AstarCount=0;
var current;
var Neighbour=new Object();
var skipNeighbour=false;
var addOpenList= true;
var parent;
var AstarStepCount=0;
var interval=50;
var previous;
var AstarIntervaltick;
var previousSet=false;
var can2;
var ctx2;


var grassImage=new Image();

var antImage=new Image();

var cookieImage=new Image();


grassImage.src="Images/grass.png";

antImage.src="Images/ant.png";

cookieImage.src="Images/cookie.png";

function checkFileAPI() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
        return true;
    } else {
        alert('The File APIs are not fully supported by your browser. Fallback required.');
        return false;
    }
}
//read text input
function readText(filePath) {
    var output = ""; //placeholder for text output

    reader.onload = function (e) {
        output = e.target.result;
        displayContents(output);
    };//end onload()
    reader.readAsText(filePath.files[0]);

    return true;
}
//display content using a basic HTML replacement
function displayContents(txt) {
    var el = document.getElementById('main');
    el.value = txt; //display output in DOM
    maptxt =  document.getElementById('main').value;
    for(var i=0,j=0; i<maptxt.length;i++) {
        if (maptxt[i] == "o")
            maptemp.push(0);
        if (maptxt[i] == "e")
            maptemp.push(1);
        if (maptxt[i] == "\n" || i == maptxt.length - 1) {
            map[j] = maptemp;
            j++;
            maptemp = [];
        }
    }

    drawCanvas();
    drawGrid();
    drawObstacles();
}

//-----------------------------------------------map read done----------------------------------------------------------
function drawCanvas() {
    var canvas = document.createElement('canvas');
    canvas.id = "canvas";
    canvas.width = map[0].length * cellsize+200;
    canvas.height = map.length * cellsize;

    var body = document.getElementsByTagName("body")[0];
    body.appendChild(canvas);
    can = document.getElementById('canvas');
    ctx = document.getElementById("canvas").getContext('2d');
}
//----------------------------------------------created canvas-----------------------------------------------------------

function drawGrid() {
    var mapRows = map.length;
    var mapCols = map[0].length;
    var sourceX=0;
    var sourceY=0;
    var id=0;
    for (var row = 0; row < mapRows; row++) {
        if (row != 0) {
            sourceY += cellsize;
            sourceX=0;
        }
        for (var col = 0; col < mapCols; col++) {
            ctx.drawImage(grassImage,
                0,0,            // sprite upper left positino
                32,32, // size of a sprite
                sourceX,sourceY,  // canvas position
                1*cellsize,1*cellsize      // sprite size shrinkage
            );
            hashMap[id] = [sourceX,sourceY];
            id++;
            sourceX +=cellsize;
        }
    }
    sourceinterval = setInterval(chooseSource,30);
}
//-----------------------------------------------Grid Drawn-------------------------------------------------------------

function chooseSource() {
    can.addEventListener("click", function (evt) {
        var mousePos = getMousePos(can, evt);
        //console.log(mousePos);
        for (var i = 0, len = map.length * map[0].length; i < len; i++) {
            if (hashMap[i][0] + cellsize-1 >= mousePos.x && hashMap[i][0] <= mousePos.x && hashMap[i][1] + cellsize-1 >= mousePos.y && hashMap[i][1] <= mousePos.y) {
                if (sourceCount < 1) {
                    ctx.fillStyle = "#FF0000";
                    ctx.fillRect(hashMap[i][0], hashMap[i][1], cellsize-1, cellsize-1);
                    ctx.drawImage(antImage,
                        0,0,            // sprite upper left positino
                        32,32, // size of a sprite
                        hashMap[i][0],hashMap[i][1],  // canvas position
                        1*cellsize,1*cellsize      // sprite size shrinkage
                    );
                    source = [(hashMap[i][1])/cellsize,(hashMap[i][0])/cellsize];
                    sourceCount++;
                    sourceChosen=true;
                }
            }
        }
    }, false);
    if(sourceChosen){
        clearInterval(sourceinterval);
        destinationInterval = setInterval(chooseDestination,30);
    }
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function chooseDestination() {
    can.addEventListener("click", function (evt) {
        var mousePos = getMousePos(can, evt);
        for (var i = 0, len = map.length * map[0].length; i < len; i++) {
            if (hashMap[i][0] + cellsize-1 >= mousePos.x && hashMap[i][0] <= mousePos.x && hashMap[i][1] + cellsize-1 >= mousePos.y && hashMap[i][1] <= mousePos.y){
                //    console.log(hashMap[i]);
                if (DestinationCount < 1) {
                    ctx.drawImage(cookieImage,
                        0,0,            // sprite upper left positino
                        32,32, // size of a sprite
                        hashMap[i][0],hashMap[i][1],  // canvas position
                        1*cellsize,1*cellsize      // sprite size shrinkage
                    );
                    goal = [(hashMap[i][1])/cellsize,(hashMap[i][0])/cellsize];
                    DestinationCount++;
                    DestinationChosen=true;
                }
            }
        }
    }, false);
    if(DestinationChosen) {
        clearInterval(destinationInterval);
    }
}


//------------------------------------------------Chosen Source and Destination-----------------------------------------

function drawObstacles(){
    for(var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {
            if (map[i][j]==0){
                ctx.fillStyle = "black";
                ctx.fillRect(hashMap[(map[i].length*i)+j][0], hashMap[(map[i].length*i)+j][1], cellsize-1, cellsize-1);
            }
        }
    }
}
// hashmap[k] = map[i][j] iff k= (map[i].length*i)+j

//----------------------------------------obstacle Drawn----------------------------------------------------------------

function Astar() {
    if(AstarCount==0) {
        //Adding start point to Open List
        openList[0] = [source[0],source[1]];
        current=[source[0],source[1]];
        current.g=0;
        current.h=0;
        current.f=0;
        current.parent=null;
    }
    //Finding all squares neighbouring current node
    Neighbour = findNeighbour(current);

    //Remove current from open List
    removeFromOpenList(current);
    ctx.font="20px Georgia ";
    ctx.fillStyle= "black";
    ctx.clearRect(((map[0].length)*cellsize)+30,0,200,150);
    if(previousSet) {
        ctx.fillText("Previous F(x): " + previous.f + "\n", ((map[0].length)*cellsize)+30, 30);
        ctx.fillText("Previous G(x): " + previous.g + "\n", ((map[0].length)*cellsize)+30, 50);
        ctx.fillText("Previous H(x): " + previous.h, ((map[0].length)*cellsize)+30, 70);
    }
    ctx.fillText("Final F(x): "+ current.f +"\n",((map[0].length)*cellsize)+30,90);
    ctx.fillText("Final G(x): "+ current.g + "\n",((map[0].length)*cellsize)+30,110);
    ctx.fillText("Final H(x): "+ current.h,((map[0].length)*cellsize)+30,130);

    // if current node is the destination, we are done!
    if(current[0]==goal[0] && current[1]==goal[1]) {
        clearInterval(AstarInterval);
        return;
    }

    for (var node in Neighbour){
        var ListId=0;
        Neighbour[node] =calculateCost(Neighbour[node]);
        for(var closeNode in closedList){
            if(Neighbour[node][0]==closedList[closeNode][0] && Neighbour[node][1]==closedList[closeNode][1]){
                skipNeighbour=true;
            }
        }
        if(skipNeighbour){
            skipNeighbour=false;
            continue;
        }
        for(var openNode in openList){
            if(Neighbour[node][0]==openList[openNode][0]&& Neighbour[node][1]==openList[openNode][1]){
                addOpenList=false;
            }
        }

        if(addOpenList){
            //Add neighbour to Open List
            addToOpenList(Neighbour[node]);
            addOpenList=true;
        }
    }
    closedList[AstarCount]=[current[0],current[1]];
    previous=current;
    previousSet=true;
    current=findMinimum(Neighbour);
    // markPath(current);
    markPath(current);
    AstarCount++;
}

//----------------------------------------Main A* Loop------------------------------------------------------------------

//------------------------------A* Neighbour finding and Cost Functions Below-------------------------------------------
function findNeighbour(current){
    var open=new Object();
    var id=0;
    var skip=false;
    for(var i= current[0]-1;i<=current[0]+1;i++){
        for(var j= current[1]-1;j<=current[1]+1;j++) {
            if(i==current[0]&&j==current[1]){
                continue;
            }
            for(var node in closedList){
                if(i==closedList[node][0] && j==closedList[node][1]){
                    skip=true;
                }
            }
            if(skip){
                skip=false;
                continue;
            }
            if(i>=0 && j>=0 && i<map.length && j<map[0].length){
                if(map[i][j]==1) {
                    open[id] = [i, j];
                    open[id].parent=current;
                    ctx.fillStyle = "pink";
                    ctx.fillRect(hashMap[(map[i].length*i)+j][0], hashMap[(map[i].length*i)+j][1], cellsize-1, cellsize-1);
                    ctx.fillStyle = "#FF0000";
                    ctx.fillRect(hashMap[(map[source[0]].length*source[0])+source[1]][0], hashMap[(map[source[0]].length*source[0])+source[1]][1], cellsize-1, cellsize-1);
                    ctx.drawImage(antImage,
                        0,0,            // sprite upper left positino
                        32,32, // size of a sprite
                        hashMap[(map[source[0]].length*source[0])+source[1]][0],hashMap[(map[source[0]].length*source[0])+source[1]][1],  // canvas position
                        1*cellsize,1*cellsize      // sprite size shrinkage
                    );
                   ctx.drawImage(cookieImage,
                        0,0,            // sprite upper left positino
                        32,32, // size of a sprite
                        hashMap[(map[goal[0]].length*goal[0])+goal[1]][0], hashMap[(map[goal[0]].length*goal[0])+goal[1]][1],  // canvas position
                        1*cellsize,1*cellsize      // sprite size shrinkage
                    );
                    id++;
                }
            }
        }
    }
    return open;
}

function calculateCost(cell){

    var parentTemp = new Object();
    parentTemp = [cell.parent[0],cell.parent[1]];
    parentTemp.g=cell.parent.g;
    parentTemp.h=cell.parent.h;
    parentTemp.f=cell.parent.f;

    var tempcell= removeParent(cell);
    tempcell.parent=parentTemp;
    cell=tempcell;

    if(cell[0] == cell.parent[0] || cell[1]==cell.parent[1]){
        cell.g=cell.parent.g+10;
    }
    else
    {
        cell.g=cell.parent.g+14;
    }
    cell.h= Math.abs(cell[0]-goal[0])*10+Math.abs(cell[1]-goal[1])*10;
    cell.f=cell.g+cell.h;

    return cell;
}

//---------------------------------------------Helping Functions Below----------------------------------------------------
function markPath(current) {
    ctx.drawImage(antImage,
        0,0,            // sprite upper left positino
        32,32, // size of a sprite
        hashMap[(map[current[0]].length*current[0])+current[1]][0],hashMap[(map[current[0]].length*current[0])+current[1]][1],  // canvas position
        1*cellsize,1*cellsize      // sprite size shrinkage
    );
}

function addToOpenList(neighbour) {
    var length = objectSize(openList);
    openList[length]=neighbour;
}

function removeFromOpenList(current) {
    var index;
    for(var node in openList){
        if(openList[node][0]==current[0] && openList[node][1]==current[1]){
            delete openList[node];
            index=node;
        }
    }
    index=parseInt(index);
    for (var i=index; i<objectSize(openList)-1;i++){
        openList[i]=openList[i+1];
    }
    delete openList[objectSize(openList)-1];
}

function removeFromNeighbour(current) {
    var index;
    for(var node in Neighbour){
        if(Neighbour[node][0]==current[0] && Neighbour[node][1]==current[1]){
            delete Neighbour[node];
            index=node;
        }
    }
    index=parseInt(index);
    for (var i=index; i<objectSize(Neighbour)-1;i++){
        Neighbour[i]=Neighbour[i+1];
    }
    delete Neighbour[objectSize(Neighbour)-1];
}

function objectSize(object){
    var size=0;
    for (var obj in object){
        size++;
    }
    return size;
}

function findMinimum(openList) {
    var minimum=[];
    for(var node in openList){
        minimum.push(openList[node].f);
    }
    var minF = minimum.indexOf(Math.min.apply(null,minimum));
    return openList[minF];
}

function removeParent(myArray) {
    myArray = myArray.filter(function (obj) {
        return obj.field !== 'parent';
    });
    return myArray;
}

function AstarInterval(){
    if(AstarStepCount==0) {
        AstarStepCount++
        clearInterval(AstarIntervaltick);
    }
    Astar();
}

function increaseInterval() {
    interval=interval-10;
    if(interval<0){
        interval=10;
    }
}
function decreaseInterval() {
    interval=interval+100;
}
function AstarStart() {
    AstarIntervaltick = setInterval(Astar,interval);
}