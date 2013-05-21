/* jshint eqnull:true */
var
	max = Math.max,
	min = Math.min;
var VideoPlayer = Backbone.View.extend({
	events: {
		"click .state-button": "stateChange",
		"mouseup .timeline": "jump",
		"mousemove .arc": "onmousemove"
	},
	initialize: function(){
		this.stateButton = this.$( ".state-button" );
		this._state = "play";
		this.setStateButton();
		this.knobEl = this.$(".knob" );
		this.knobEl.knob({
			change: _.bind( this.onChange, this )
		});
		this.videoEl = this.$( "video" )
			.on( "timeupdate", _.bind( this.onTimeUpdate, this ) )[0];
		this.$( ".arc" ).on("mousemove", _.bind( this.onmousemove, this ) );
		this._v = 0;
		var o = this.$( "svg" ).offset();
		this.x = o.left;
		this.y = o.top;
		this.w2 = 40;
		this.v = this.cv = 0;
		this.o = {
			min: 0,
			max: 100,
			step: 1,
			stopper: true
		};
	},

	setStateButton: function(){
		this.stateButton.text( VideoPlayer.stateTexts[ this._state ] );
	},

	stateChange: function(){
		var oldState = this._state;
		if( this.videoEl.paused !== true ){
			this._state = "play";
			this.videoEl.pause();
		}
		else{
			this._state = "pause";
			this.videoEl.play();
		}
		this.trigger( "state-change", this._state, oldState );

		this.setStateButton();
	},
	onTimeUpdate: function(){

		var value = (100 / this.videoEl.duration) * this.videoEl.currentTime;

		this.knobEl
			.val( Math.floor( value ) )
			.trigger( "change" );
	},
	onmousemove: function( e ){
		//console.log( "move", e, e.originalEvent );
		var v = this.xy2val(e.pageX, e.pageY);
		if (v == this.cv){
			console.log("v equals cv",{
				v: v,
				cv: this.cv
			});
			return;
		}

    this.change(this._validate(v));
    this._draw();
	},
	val: function( v ){
		if( v == null ){
			return this._v;
		}
		this._v = v;

	},
	onChange: function( value ){
		var time = this.videoEl.duration * (value / 100);
		this.videoEl.currentTime = time;
	},
	angleOffset: -125 * Math.PI / 180,
	angleArc: 250 * Math.PI / 180, 
	PI2: 2*Math.PI,
	xy2val: function (x, y) {
			var a, ret;

			a = Math.atan2(
									x - (this.x + this.w2),
									- (y - this.y - this.w2)
							) - this.angleOffset;

			if(this.angleArc != this.PI2 && (a < 0) && (a > -0.5)) {
					// if isset angleArc option, set to min if .5 under min
					a = 0;
			} else if (a < 0) {
					a += this.PI2;
			}

			ret = ~~ (0.5 + (a * (this.o.max - this.o.min) / this.angleArc)) + this.o.min;

			if( this.o.stopper ) ret = max(min(ret, this.o.max), this.o.min);

			return ret;
	},
	_validate: function( v ){
		return (~~ (((v < 0) ? -0.5 : 0.5) + (v/this.o.step))) * this.o.step;
	},
	change: function( v ){
		this.cv = v;
		this.val(v);
	},
	_draw: function(){
		console.log( "draw that shit", this.val() );
	}
}, {
	stateTexts: {
		"play":">",
		"pause": "||"
	}
});


	var width = 80,
		height = 80,
		radius = 30; //Math.min(width, height) / 2;
	var margin = 10,
			radius = Math.min(width - margin, height - margin) / 2;

	var arc = d3.svg.arc()
			.outerRadius(radius + 5)
			.innerRadius(radius - 10);

	var pie = d3.layout.pie()
			.sort(null)
			.value(function( d ){ return d;})
			.startAngle( 0.2 )
			.endAngle( 4.9 );

	var svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height);
	var bigG = svg
		.append("g")
			.attr("transform", "translate(" + 40 + "," +40 + ")  rotate(215)");

	var stateLabel = svg.append("svg:text")
		.attr("class", "state-button")
		.attr("dy", 10)
		.attr("transform", "translate(" + 40 + "," + 40 + ")")
		.attr("text-anchor", "middle") // text-align: right
		.text(">");


	var data = [ 80 ];
	var g = bigG.selectAll(".arc")
			.data(pie(data))
			.enter()
				.append("g")
				.attr("class", "arc");
	/*g.on("mousemove", function(d){
		
		var ang = d.startAngle + (d.endAngle - d.startAngle)/2; 
		// Transformate to SVG space
		ang = (ang - (Math.PI / 2) ) * -1;

		// Calculate a 10% radius displacement
		var x = Math.cos(ang) * radius * 0.1;
		var y = Math.sin(ang) * radius * -0.1;
		console.log( this, d, x, y, radius );
	});*/
	g.append("path")
			.attr("d", arc)
			.style("fill", function( d ){ return d.data === 80 ?  "#25272A" : "transparent"; });

var addNewPie = function(){

	var arc = d3.svg.arc()
			.outerRadius(radius + 5)
			.innerRadius(radius - 10);

	var pie = d3.layout.pie()
			.sort(null)
			.value(function( d ){ return d;});


	var bigG = svg
		.append("g")
			.attr("transform", "translate(" + 40 + "," +40 + ")  rotate(215)");


	var data = [ 40, 60 ];
	var g = bigG.selectAll(".arc")
			.data(pie(data))
			.enter()
				.append("g")
				.attr("class", "arc");

	g.append("path")
			.attr("d", arc)
			.style("fill", function( d ){ return d.data === 40 ?  "red" : "transparent"; });
};



var videoPlayer = new VideoPlayer({
		el: document.body
	});