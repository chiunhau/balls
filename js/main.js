function Frame() {
	this.previousFrame; 
	this.currentFrame;
	this.previousCentroid;
	this.currentCentroid;
	this.deltaCentroid = [0, 0];
	this.canvas = document.getElementById('sourceCanvas');
	this.video = document.getElementById('video');
	this.xParts = 90;
	this.yParts = 60;
	this.xSide = Math.floor($(window).width() / this.xParts);
	this.ySide = Math.floor($(window).height() / this.yParts);
	this.counter = 0;

};

Frame.prototype.getStream = function() {
	navigator.getMedia = navigator.getUserMedia || 
		navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  if (navigator.getMedia) {
 		navigator.getMedia(
   		{
   			video: true
   		},
 			function(localMediaStream){
 				this.video.src = window.URL.createObjectURL(localMediaStream);
 				this.video.onloadedmetadata = function(e) {
		      onFrame();
		    }
			},
	   	function(e){
	   		console.log(e);
	   	}
		);
	}
}

Frame.prototype.drawCanvas = function() {
	var c = this.canvas.getContext('2d');
	c.save();
	c.scale(-1, 1);
  c.drawImage(video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
  c.restore();		 
}

Frame.prototype.storeFrames = function() {
	var c = this.canvas.getContext('2d');
	if (this.previousFrame === null) {
		this.previousFrame = c.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}
	else {
		if (this.currentFrame !== null) {
			this.previousFrame = this.currentFrame;
		}
		this.currentFrame = c.getImageData(0, 0, this.canvas.width, this.canvas.height);
	}
}

Frame.prototype.detect = function() {
	var changed = [];
	var previous = this.previousFrame;
	var current = this.currentFrame;

	for(var r = 0; r < this.yParts; r++) {
		for(var c = 0; c < this.xParts; c++) {
			var x = c * this.xSide + Math.floor(this.xSide / 2);
			var y = r * this.ySide + Math.floor(this.ySide / 2);
			var pixelPos = (this.canvas.width * 4) * y + x * 4;

			var dr = Math.abs(previous.data[pixelPos] - current.data[pixelPos]);
			var dg = Math.abs(previous.data[pixelPos + 1] - current.data[pixelPos + 1]);
			var db = Math.abs(previous.data[pixelPos + 2] - current.data[pixelPos + 2]);

			// motion detected
			if((dr + dg + db) >= 100) {
				changed.push([c, r]);
			}			
		}
	}

	if (changed.length != 0) {
		var cSum = 0, rSum = 0, changedNum = changed.length;

		for (var i = 0; i < changedNum; i++) {
			cSum += changed[i][0];
			rSum += changed[i][1];
		}

		var gX = Math.floor(cSum / changedNum) * xSide + Math.floor(xSide / 2);
		var gY = Math.floor(rSum / changedNum) * ySide + Math.floor(ySide / 2);
		var centroid = [gX, gY];

		return centroid;
	}
	else {

		return false;
	}
}

Frame.prototype.storeCentroid = function() {
	var centroid = this.detect();
	if (this.previousCentroid === null) {
		this.previousCentroid = centroid;
	}
	else {
		if (this.currentCentroid !== null) {
			this.previousCentroid = this.currentCentroid;
		}
		this.currentCentroid = centroid;
	}
}

Frame.prototype.calcMoveVector = function() {
	this.deltaCentroid = this.currentCentroid - this.previousCentroid;
}

function Ball(position, radius) {
	this.path = new Path.Circle(position, radius);
	this.path.fillColor = '#f00';
	this.originPos = position;//Point
	this.isMoveingOut = false;
	this.moveVector = 0;

	this.back = function() {
		var vectorBack = 
		this.path.position += vectorBack;
	}
}

Ball.prototype.move = function() {
	this.path.position += this.deltaCentroid;
}

Ball.prototype.backward = function() {
	var vectorBack = this.originPos - this.path.position;
	this.path.position += vectorBack * 0.5;
}

var onFrame = function(event) {
	frame.counter += 1;
	
	frame.drawCanvas();
	ball1.moveVector *= 0.5;
	console.log(ball1.moveVector);
	switch(frame.counter) {
		case 1:
			frame.storeFrames();
			console.log(1);
			break;

		case 2:
			frame.storeFrames();
			frame.storeCentroid();
			console.log(2);
			break;

		case 20:
			frame.storeFrames();
			frame.storeCentroid();
			frame.calcMoveVector();
			ball1.moveVector = frame.deltaCentroid;
			console.log(20);
			break;

		default:
	}

	if (frame.counter > 20) {
		ball1.move();

		//start moving back
		if (frame.deltaCentroid === [0, 0] && ball1.isMoveingOut === true) {
			ball1.isMoveingOut = false;
			ball1.moveVector = frame.deltaCentroid * -1;
		}
		//just moved back to origin position
		else if (frame.deltaCentroid === [0, 0] && ball1.isMoveingOut === false) {
			frame.counter = 0;
		}
	}
}

var ball1 = new Ball(new Point(500, 100), 10);

var frame = new Frame();
frame.canvas.width = $(window).width();
frame.canvas.height = $(window).height();
frame.getStream();