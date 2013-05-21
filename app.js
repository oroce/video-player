var VideoPlayer = Backbone.View.extend({
	events: {
		"click .state-button": "stateChange",
		"mouseup .timeline": "jump"
	},
	initialize: function(){
		this.stateButton = this.$( ".state-button" );
		this._state = "play";
		this.setStateButton();
	},

	setStateButton: function(){
		this.stateButton.text( VideoPlayer.stateTexts[ this._state ] );
	},

	stateChange: function(){
		var oldState = this._state;
		if( oldState === "pause" ){
			this._state = "play";
		}
		else{
			this._state = "pause";
		}
		this.trigger( "state-change", this._state, oldState );

		this.setStateButton();
	},

	jump: function( e ){
		console.log( "jump", e )
		var $_target=$(e.currentTarget);

			var _offset=$_target.offset();

			var _relativeX=e.pageX-_offset.left;

			var _relativeY=e.pageY-_offset.top;

		var _position = {left: _relativeX, top: _relativeY};
		var _percentage=100*_position.left/$_target.width();

		console.log( "should jump to ", _percentage );
	}
}, {
	stateTexts: {
		"play":">",
		"pause": "||"
	}
});

var videoPlayer;
$(function(){
	videoPlayer = new VideoPlayer({
		el: document.body
	});
});

	var width = 80,
		height = 80,
		radius = 30; //Math.min(width, height) / 2;


	var arc = d3.svg.arc()
			.outerRadius(radius + 5)
			.innerRadius(radius - 10);

	var pie = d3.layout.pie()
			.sort(null)
			.value(function( d ){ return d;});

	var svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height);
	var bigG = svg
		.append("g")
			.attr("transform", "translate(" + 40 + "," +40 + ")  rotate(215)")

	var stateLabel = svg.append("svg:text")
		.attr("class", "state-button")
		.attr("dy", 10)
		.attr("transform", "translate(" + 40 + "," + 40 + ")")
		.attr("text-anchor", "middle") // text-align: right
		.text(">");


	var data = [ 80, 20 ];
	var g = bigG.selectAll(".arc")
			.data(pie(data))
			.enter()
				.append("g")
				.attr("class", "arc");

	g.append("path")
			.attr("d", arc)
			.style("fill", function( d ){ return d.data === 80 ?  "#25272A" : "transparent"; });

