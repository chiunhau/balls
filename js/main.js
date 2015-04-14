function Frame() {
	this.previousFrame = null; 
	this.currentFrame = null;
	this.previousCentroid = null;
	this.currentCentroid = null;
	this.deltaCentroid = new Point(0, 0);
	this.canvas = document.getElementById('sourceCanvas');
	this.video = document.getElementById('video');
	this.xParts = 90;
	this.yParts = 60;
	this.xSide = Math.floor($(window).width() / this.xParts);
	this.ySide = Math.floor($(window).height() / this.yParts);
	this.counter = 0;
	this.center = view.center;
	this.startAni = false;
};

Frame.prototype.getStream = function() {

	this.canvas.width = $(window).width();
	this.canvas.height = $(window).height();

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
 					this.startAni = true;
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

		var gX = Math.floor(cSum / changedNum) * this.xSide + Math.floor(this.xSide / 2);
		var gY = Math.floor(rSum / changedNum) * this.ySide + Math.floor(this.ySide / 2);
		var centroid = new Point(gX, gY);
		return centroid;
	}
	else {

		return -1;
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

Frame.prototype.calcDeltaCentroid = function() {
	if (this.currentCentroid === -1 || this.previousCentroid === -1) {
		this.deltaCentroid = new Point(0, 0);// vector 0, 0
	}
	else {
		this.deltaCentroid = this.currentCentroid - this.previousCentroid;
	}
}

function Ball(radius) {
	this.path = new Path.Circle(view.center, radius);
	this.path.fillColor = '#f00';
	this.moveVector = new Point(0, 0);
	this.staticVector = this.path.position - view.center;
	this.gravity = 1;
	this.v = new Point(0, 0);	
}

Ball.prototype.update = function () {
	this.staticVector = this.path.position - view.center;
	this.aX = Math.cos(this.staticVector.angleInRadians) * this.gravity * -1;
	this.aY = Math.sin(this.staticVector.angleInRadians) * this.gravity * -1;
	if (this.staticVector.length > 1) {
		this.v += new Point(this.aX, this.aY);
	}
	else {
		this.v = new Point(0, 0);
	}
}

Ball.prototype.updateOutFource = function() {
	this.v += frame.deltaCentroid * 0.01;
}

Ball.prototype.move = function() {
	this.path.position += this.v;
}

var onFrame = function(event) {
	frame.counter += 1;
	frame.drawCanvas();
	ball1.update();
	//每40幅算出一個移動物體向量
	if (frame.counter === 1) {
		frame.storeFrames();
	}
	else if (frame.counter === 2) {
		frame.storeFrames();
		frame.storeCentroid();
	}
	else if (frame.counter === 60) {
		frame.storeFrames();
		frame.storeCentroid();
		frame.calcDeltaCentroid();
		frame.counter = 0;
		console.log(frame.deltaCentroid);
		ball1.updateOutFource();
		$(function(){
			$x = $('#x');
			$y = $('#y');

			$a = $('#a');
			$aX = $('#aX');
			$aY = $('#aY');

			$v = $('#v');
			$vX = $('#vX');
			$vY = $('#vY');

			$x.html(ball1.path.position.x);
			$y.html(ball1.path.position.y);
			$a.html(ball1.gravity);
			$aX.html(ball1.aX);
			$aY.html(ball1.aY);
			$v.html(ball1.v.length);
			$vX.html(ball1.v.x);
			$vY.html(ball1.v.y);
		});
	}

	
	ball1.move();
	

}

var ball1 = new Ball(20);
var frame = new Frame();

frame.getStream();