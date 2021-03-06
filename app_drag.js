/* jshint eqnull:true */
var
	max = Math.max,
	min = Math.min;
var VideoPlayer = Backbone.View.extend({
	events: {
		"mousedown .state-button": "stateChange",
		"mouseup .timeline": "jump",
		"mousemove .arc": "onmousemove",
		"click .video-controls .rewind": "rewind",
		"click .video-controls .forward": "forward"
	},
	initialize: function(){
		this.stateButton = this.$( ".state-button" );
		this._state = "play";
		this.setStateButton();
		/*this.knobEl = this.$(".knob" );
		this.knobEl.knob({
			change: _.bind( this.onChange, this )
		});*/
		this.$videoEl = this.$( "video" )
			.on( "timeupdate", _.bind( this.onTimeUpdate, this ) );
		this.videoEl = this.$videoEl[0];
		this.$( ".arc" )
			.on( "mousedown", _.bind( this.onmousedown, this ) )
			.on( "touchstart", _.bind( this.ontouchstart, this ) );
		this._v = 0;
		var o = this.$( "svg" ).offset();
		this.x = o.left;
		this.y = o.top;
		this.w2 = 70;
		this.v = this.cv = 0;
		this.o = {
			min: 0,
			max: 100,
			step: 1,
			stopper: true
		};
		this._t = 0;

		this.$el.find(".state-button").on( "click", _.bind( this.stateChange, this ));
		this._playbackFunc = _.bind( this._playbackFunc, this );
		this.enableFeatures();
	},
	enableFeatures: function(){
		var search = location.search;
		if( ~search.indexOf( "drag" ) ){
			this.enableDrag();
		}
		if( ~search.indexOf( "hover" ) ){
			this.enableHover();
		}
	},
	enableDrag: function(){
		console.log("enable feature drag" );
		this.$( ".video-controlling" ).draggable({
			containment: this.$videoEl
		});
		this.$videoEl.droppable();
	},
	enableHover: function(){
		var self = this;
		this.$( ".video-controlling" )
			.hover(
				function(){
					self.$( ".video-controlling" ).removeClass( "hidden-item" );
				},
				function(){
					if( self._state === "pause" ){
						self.$( ".video-controlling" ).addClass( "hidden-item" );
					}
					else{
						self.once( "state-change:play", function(){
							self.$( ".video-controlling" ).addClass( "hidden-item" );
						});
					}
				}
			);
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
		this.trigger( "state-change:" + this._state );
		this.setStateButton();
		if( this._playbackRate !== 1 ){
			this.setPlaybackRate( 1 );
		}
	},
	formatTime: function( num ){
		return ( "0" + Math.floor( num ) ).slice( -2 );
	},
	preventScrolling: function( addOrRemove ){
		$( "html, body" ).toggleClass( "prevent-scroll", addOrRemove );
		if( addOrRemove ){
			$( document ).on( "touchmove.vp", function( e ){
				e.preventDefault();
			});
		}
		else{
			$( document ).off( "touchmove.vp" );
		}
	},
	currentTime: function( percent ){
		percent = percent || this.val();
		if( this.videoEl.readyState > 0 ){
			var time = this.videoEl.duration * (percent / 100);
			this.videoEl.currentTime = time;
		}
		else{
			this.$videoEl
				.off( "loadedmetadata.ct" )
				.one( "loadedmetadata.ct", function(){
					var time = this.duration * (percent / 100);
					this.currentTime = time;
				});
		}
	},
	onTimeUpdate: function( draw ){
		var value = (100 / this.videoEl.duration) * this.videoEl.currentTime;
		var time = this.videoEl.currentTime;
		var hours = this.formatTime( ~~(time / 3600) );
		var minutes = this.formatTime( ~~((time % 3600) / 60) );
		var secs = this.formatTime( time % 60 );
		if( draw !== false ){
			this.val( value );
			this._draw();
		}
		this.$( ".video-time strong" ).text( [ hours, minutes, secs ].join( ":" ) );
	},
	touchIndex: function( e ){
		return e.originalEvent.touches.length - 1;
	},
	ontouchmove: function( e ){
		var v = this.xy2val(
			e.originalEvent.touches[this._t].pageX,
			e.originalEvent.touches[this._t].pageY
		);

		if (v == this.cv){
			console.log("v equals cv",{
				v: v,
				cv: this.cv
			});
			return;
		}

		this.change(this._validate(v));
		this._draw();
		this.currentTime();
	},
	ontouchstart: function( e ){
		this.$( ".arc" )
			.on( "touchmove.vp", _.bind( this.ontouchmove, this ) )
			.on( "touchend.vp", _.bind( this.ontouchend, this ) );
		this._t = this.touchIndex( e );
		this.preventScrolling( true );
		this.ontouchmove( e );
	},
	ontouchend: function( e ){
		this.$( ".arc" ).off( "touchmove.vp touchend.vp" );
		this.preventScrolling( false );
		//this.val( this.cv );
		//this._draw();
	},
	onmousedown: function( e ){
		this.$( ".arc" )
			.on( "mousemove.vp", _.bind( this.onmousemove, this ) )
			.on( "mouseup.vp", _.bind( this.onmouseup, this ) );
		this.preventScrolling( true );
		this.onmousemove( e );
	},
	onmouseup: function( e ){
		this.$( ".arc" ).off( "mousemove.vp mouseup.vp" );
		this.preventScrolling( false );
		//this.val( this.cv );
		//this._draw();
	},
	onmousemove: function( e ){
		//console.log( "move", e, e.originalEvent );
		var v = this.xy2val(e.pageX, e.pageY);
		if (v == this.cv){
			return;
		}

		this.change(this._validate(v));
		this._draw();
		this.currentTime();
	},
	val: function( v ){
		if( v == null ){
			return this._v;
		}
		this._v = v;

	},
	onChange: function( value ){
		this.currentTime( value );
	},
	angleOffset: -130 * Math.PI / 180,
	angleArc: 310 * Math.PI / 180,
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
		path = path.data(pie([this.val(), 100 - this.val()])); // update the data
		path.transition().duration(10).attrTween("d", arcTween);
	},
	_playbackRate: 1,
	_playbackFunc: function(){
		this.videoEl.currentTime += this._playbackRate;
		if( this._playbackRate === 1 || this.videoEl.currentTime === 0 || this.videoEl.currentTime === this.videoEl.duration ){
			return;
		}
		this._playbackInterval = setTimeout( this._playbackFunc, 500 );
	},
	setPlaybackRate: function( rate ){
		clearTimeout( this._playbackInterval );
		this._playbackRate = rate || 1;
		if( this._playbackRate === 1 ){
			return;
		}
		var _set = _.bind( function(){
			this._playbackFunc();
		}, this );
		if( this.videoEl.readyState > 0 ){
			_set();
		}
		else{
			this.$videoEl
				.off( "loadedmetadata.pbr" )
				.one( "loadedmetadata.pbr", _set );
		}
	},
	rewind: function(){
		var playbackRate = this._playbackRate,
				newRate;

		if( playbackRate < 0 ){
			// should set back to normal
			newRate = 1;
		}
		else{
			newRate = -2;
		}
		this.setPlaybackRate( newRate );
	},

	forward: function(){
		var playbackRate = this._playbackRate,
				newRate;

		if( playbackRate > 1 ){
			// should set back to normal
			newRate = 1;
		}
		else{
			newRate = 2;
		}
		this.setPlaybackRate( newRate );
	}
}, {
	stateTexts: {
		"play":">",
		"pause": "||"
	}
});


	var width = 140,
		height = 140,
		radius = 110; //Math.min(width, height) / 2;
	var margin = 30,
			radius = Math.min(width - margin, height - margin) / 2;

	var arc = d3.svg.arc()
			.outerRadius(radius + 15)
			.innerRadius(radius - 15);

	var pie = d3.layout.pie()
			.sort(null)
			.value(function( d ){ return d;})
			.startAngle( 0.2 )
			.endAngle( 5.7 );

	var svg = d3.select( ".video-timeline" )
			.attr("width", width)
			.attr("height", height);
	var bigG = svg
		.append("g")
			.attr("transform", "translate(" + 70 + "," + 70 + ")  rotate(215)");

	var stateLabel = svg.append("svg:text")
		.attr("class", "state-button")
		.attr("dy", 10)
		.attr("transform", "translate(" + 70 + "," + 80 + ")")
		.attr("text-anchor", "middle") // text-align: right
		.style( "fill", "white" )
		.text(">");


	var data = [ 0, 100 ];
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
	var path = g.append("path")
			.attr("d", arc)
			.style("fill", function( d, i ){ return !i ? "red" :  "white"; })
			.each(function(d) { this._current = d; });
function arcTween(a) {
	var i = d3.interpolate(this._current, a);
	this._current = i(0);
	return function(t) {
		return arc(i(t));
	};
}
/*
var addNewPie = function(){

	var arc = d3.svg.arc()
			.outerRadius(radius + 5)
			.innerRadius(radius - 10);

	var pie = d3.layout.pie()
			.sort(null)
			.value(function( d ){ return d;})
			.startAngle( 0.2 )
			.endAngle( 4.9 );

	var bigG = svg
		.append("g")
			.attr("transform", "translate(" + 40 + "," +40 + ")  rotate(215)");


	var data = [ 80, 20 ];
	var g = bigG.selectAll(".arc")
			.data(pie(data))
			.enter()
				.append("g")
				.attr("class", "arc");

	var path = g.append("path")
			.attr("d", arc)
			.each(function(d) { this._current = d; })
			.style("fill", function( d, i ){ console.log("d,i", d,i);return !i ? "red" : "transparent" });
	function arcTween(a) {
		var i = d3.interpolate(this._current, a);
		this._current = i(0);
		return function(t) {
			return arc(i(t));
		};
	}
	setTimeout(function(){
		console.log("set data" );
	path = path.data(pie([60,40])); // update the data
			path.transition().duration(150).attrTween("d", arcTween);
	}, 5000);
	return path;
};

*/

var videoPlayer = new VideoPlayer({
		el: document.body
	});