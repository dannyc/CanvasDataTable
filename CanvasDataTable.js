/*
MIT License 2015 
Work In Progress!
Proof of concept
*/
//options
/*
1) canvas id - canvas element on the screen (or should we create one?)
2) selectable - should the canvas have checkboxes
3) row height - how tall each row should be (fixed!)
4) columns OR setColumns
5) font
6) id - id of containing div
7) auto-width
*/

function CanvasDataTable(options){
	this.properties = {};
	this.canvas = null;
	this.context = null;
	this.scrollContainter = null;
	this.numberOfRows = 0;
	this.data = null;
	this.init(options);
}

CanvasDataTable.prototype.init = function(options){
	this.properties = {
		rowHeight: 20,
		font: '14px Ariel',
		textColor: '#00',
		hoverColor:	'#eee'
	};
	this.setProperties(options);
	this.initCanvas();
	this.handleEvents();
};

CanvasDataTable.prototype.setProperties = function(options){
	this.properties.rowHeight = Number(options.rowHeight || this.properties.rowHeight);
	this.properties.font = options.font || this.properties.font;
	this.properties.textColor = options.textColor || this.properties.textColor;
	this.properties.hoverColor = options.hoverColor || this.properties.hoverColor;
	
	this.properties.container = document.getElementById(options.containerId);
	var containerPositionStyle = this.properties.container.style.position;
	if(containerPositionStyle != 'fixed' && containerPositionStyle != 'absolute'){ //TODO: fix for style sheet
		this.properties.container.style.position = 'relative';
	}
	this.properties.container.style.overflow = 'scroll';
	//this.setColumns(options.columns);
	//this.checkboxes = document.getElementById(options.checkboxId);
	//this.columns = options.columns;	
};

CanvasDataTable.prototype.handleEvents = function(){
	var self = this;
	this.properties.container.addEventListener("scroll", function(event){ //TODO: throttle
		self.render();
	});
	this.canvas.addEventListener("mousemove", function(event){ //TODO: throttle
		var canvasPos = self.canvas.getBoundingClientRect(); //the position of the canvas relative to the page
		var partialRow = self.caculatePartialRow();
		var rowsDown = Math.floor((event.clientY - canvasPos.top + partialRow) / self.properties.rowHeight);
		//console.log("mousemove event.clientY: " + event.clientY + " rowsDown: " + rowsDown + " partialRow: " + partialRow);
		self.render(rowsDown);
	});
};

CanvasDataTable.prototype.initCanvas = function(options){
	this.canvas = document.createElement("canvas");
	this.scrollContainter = document.createElement("div");
	this.scrollContainter.style.position = "absolute";
	this.canvas.style.position = "relative";
	this.canvas.width = this.properties.container.clientWidth;
	this.canvas.height = this.properties.container.clientHeight;
	this.properties.container.appendChild(this.scrollContainter);
	//this.scrollContainter.appendChild(this.canvas);
	this.properties.container.appendChild(this.canvas);
	this.numberOfRows = Math.ceil(this.canvas.height / this.properties.rowHeight); //how many rows to render
	this.context = this.canvas.getContext("2d");
	this.context.font = this.properties.font;
	this.context.textBaseline = "top";
};

CanvasDataTable.prototype.setColumns = function(columns){
	columns = columns || []; //default to empty array if no columns provided
	this.properties.columns = columns;
	var dataWidth = 0;
	for(var i = 0, l = columns.length; i < l; i++){
		dataWidth += Number(columns[i].width);
	}
	this.scrollContainter.style.width = dataWidth + 'px';
};

CanvasDataTable.prototype.setData = function(data){
	this.data = data || []; //default to empty data set
	this.scrollContainter.style.height = (this.properties.rowHeight * data.length) + 'px';
	this.render(); //render every time the data is set
};

CanvasDataTable.prototype.calculateRows = function(){
	var scrollTop = this.properties.container.scrollTop;
	this.canvas.style.top = scrollTop + 'px'; //to keep it in view TODO: fix me?
	var first = Math.floor(scrollTop / this.properties.rowHeight); //how many rows down were scrolled
	var last = first + this.numberOfRows;
	if(last > this.data.length){ //don't print more than rows than we have data for
		last = this.data.length;
	}
	return {first: first, last: last, partialRow : this.caculatePartialRow()};
};


CanvasDataTable.prototype.caculatePartialRow = function(){
	var scrollTop = this.properties.container.scrollTop;
	var partialRow = (scrollTop % this.properties.rowHeight); //how much of PART of the row was scrolled
	return partialRow;
};
CanvasDataTable.prototype.render = function(rowToHighlight){
	var firstLast = this.calculateRows();
	this.renderRows(firstLast, rowToHighlight);
	this.renderText(firstLast);
};

CanvasDataTable.prototype.renderRows = function(firstLast, rowToHighlight){
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); //clear the canvas
	this.context.save();
	this.context.beginPath();
	this.context.lineWidth = 1;
	this.context.strokeStyle = "#ccc";
	var existingRows = firstLast.last - firstLast.first;
	for(var i = 0, l = this.numberOfRows <= existingRows ? this.numberOfRows : existingRows; i < l; i++){
		var yPosition = (i * this.properties.rowHeight) - firstLast.partialRow;
		this.context.moveTo(0,yPosition - .5);
		this.context.lineTo(this.canvas.width, yPosition - .5);
	}
	this.context.stroke();
	this.context.fillStyle = this.properties.hoverColor;
	this.context.fillRect(0,(rowToHighlight * this.properties.rowHeight) - firstLast.partialRow, this.canvas.width, this.properties.rowHeight - 1); //row height - lines
	this.context.restore();
};

CanvasDataTable.prototype.renderText = function(firstLast){
	//for(var i = 0; i < this.numberOfRows && i < this.data.length; i++){
	//(rowCount * this.rowHeight) - partialRow
	this.context.save();
	this.context.fillStyle = this.properties.textColor;
	var rowCount = 0; //0 based counter
	for(; firstLast.first < firstLast.last; firstLast.first++){
		var item = this.data[firstLast.first];
		var xPosition = 0 + 5; //start out at left most part of canvas. add 2 pixel for indentation. subtract the partial aspect of the column
		var yPosition = (rowCount * this.properties.rowHeight) - firstLast.partialRow + 3; //which row we are printing, subtracting a few pixels for partially scrolled rows and add 3 pixels so it's not so close to the top of the row
		for(var j = 0; j < this.properties.columns.length; j++){
			var column = this.properties.columns[j];
			var text = item[column.id] || '';
			this.context.fillText(text, xPosition, yPosition);
			xPosition += Number(column.width); //move the cursor to the right based on the width of the column
		}
		rowCount++;
	}
	this.context.restore();
};
