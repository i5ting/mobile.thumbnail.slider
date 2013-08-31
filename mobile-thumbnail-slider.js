// function.bind() polyfill
// taken from: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      throw new TypeError(
        "Function.prototype.bind - what is trying to be bound is not callable"
      );
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
      fToBind = this, 
      fNOP = function() { },
      fBound = function() {
        return fToBind.apply(
          this instanceof fNOP ? this : oThis || window,
          aArgs.concat( Array.prototype.slice.call(arguments) )
        );
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}


(function(undefined) {
  
  // mapping of event handlers
  var events = {
    start: ['touchstart', 'mousedown'],
    move: ['touchmove', 'mousemove'],
    end: ['touchend', 'touchcancel', 'mouseup']
  };

  // constructor
  function MobileThumbnailSlider(element, options) {

    this.element = element;
    
    this.options = {};
    
    options = options || {};
    
    var property;
    
    for (property in this.defaultOptions){
      if (options[property] !== undefined){
        // set options passed to constructor
        this.options[property] = options[property];
      } else {
        // set default options
        this.options[property] = this.defaultOptions[property];
      }
    }
 
    // detect support for Webkit CSS 3d transforms
    this.supportsWebkit3dTransform = (
      'WebKitCSSMatrix' in window && 
      'm11' in new WebKitCSSMatrix()
    );
    
    // store references to DOM elements
    if (typeof element === 'string'){
      this.element = document.getElementById(element);
    }
        
    this.knob = this.element.getElementsByClassName('knob')[0];
    this.track = this.element.getElementsByClassName('track')[0];
    
    // set context for event handlers
    this.start = this.start.bind(this);
    this.move = this.move.bind(this);
    this.end = this.end.bind(this);
    
    // set the inital value
    this.addEvents("start");
    this.setValue(this.options.value);
    
    // update postion on page resize
    window.addEventListener("resize", this.update.bind(this));
  }
  
  // default options
  MobileThumbnailSlider.prototype.defaultOptions = {
    photos:[],
    _value_changed: false,
    value: 0, // initial value
    min: 0, // minimum value
    max: 100, // maximum value
    change: null, // change callback
    end: null, // change callback
    start: null // change callback
  };

  // add event handlers for a given name
  MobileThumbnailSlider.prototype.addEvents = function(name){
    var list = events[name], 
      handler = this[name],
      all;
    
    for (all in list){
      this.element.addEventListener(list[all], handler, false);
    }
  };
  
  // remove event handlers for a given name
  MobileThumbnailSlider.prototype.removeEvents = function(name){ 
    var list = events[name], 
      handler = this[name],
      all;
      
    for (all in list){
      this.element.removeEventListener(list[all], handler, false);
    }
  };
  
  // start to listen for move events
  MobileThumbnailSlider.prototype.start = function(event) {
    this.addEvents("move");
    this.addEvents("end");
    this.handle(event);
    this.startcallback(this.value);
  };
  
  // handle move events
  MobileThumbnailSlider.prototype.move = function(event) {
    this.handle(event);
  }; 

  // stop listening for move events
  MobileThumbnailSlider.prototype.end = function() {
    this.removeEvents("move");
    this.removeEvents("end");
    if(this._value_changed){
        this.endcallback(this.value);
    }
  };
  
  // update the knob position
  MobileThumbnailSlider.prototype.update = function() {
    this.setValue(this.value);
  };
  
  // set the new value of the slider
  MobileThumbnailSlider.prototype.setValue = function(value) {
    
    if (value === undefined){ value = this.options.min; }
    
    value = Math.min(value, this.options.max);
    value = Math.max(value, this.options.min);
    
    var 
      knobWidth = this.knob.offsetWidth,
      trackWidth = this.track.offsetWidth,
      range = this.options.max - this.options.min,
      width = trackWidth - knobWidth,
      position = Math.round((value - this.options.min) * width / range);
    
    this.setKnobPosition(position);
    
    this.value = value;
    
    if(width>10)
        this.callback(value);
  };
  
  MobileThumbnailSlider.prototype.setKnobPosition = function(x){
    // use Webkit CSS 3d transforms for hardware acceleration if available 
    if (this.supportsWebkit3dTransform) {
      this.knob.style.webkitTransform = 'translate3d(' + x + 'px, 0, 0)';
    } else {
      this.knob.style.webkitTransform = 
      this.knob.style.MozTransform = 
      this.knob.style.msTransform = 
      this.knob.style.OTransform = 
      this.knob.style.transform = 'translateX(' + x + 'px)';
    }
  };

  // handle a mouse event
  MobileThumbnailSlider.prototype.handle = function(event){
    event.preventDefault();
    if (event.targetTouches){ event = event.targetTouches[0]; }
  
    var position = event.pageX, 
      element,
      knobWidth = this.knob.offsetWidth,
      trackWidth = this.track.offsetWidth,
      width = trackWidth - knobWidth,
      range = this.options.max - this.options.min,
      value;
      
    for (element = this.element; element; element = element.offsetParent){
      position -= element.offsetLeft;
    }

    console.log("position := "+position)
    // keep knob in the bounds
    position += knobWidth / 2;
    position = Math.min(position, trackWidth);
    position = Math.max(position - knobWidth, 0);
  
    this.setKnobPosition(position);
  
    // update
    value = this.options.min + Math.round(position * range / width);
    console.log(this.value)
    
    console.log(Math.abs(event.x - position));
    
    if( (this.value - value) != 0)
    {
        this.setValue(value);    
        this._value_changed = true;    
    }else{
        this._value_changed = false;    
    }
    
    // TODO: 
    var tip_style = $c('top_tooltip')[0].style;
    tip_style.left = (position - 140/2)+"px";
    tip_style.top = "44px";
    
    var data = $c('top_tooltip')[0].innerHTML 
    var reCat = /photo/gi;
    if(reCat.test(data)){  
         console.log('没有图片时重置tip位置')
         tip_style.left = (position - 58/2)+"px";
         tip_style.top = "164px";
    }
  };

  // call callback with new value
  MobileThumbnailSlider.prototype.callback = function(value) { 
    $c('knob')[0].innerHTML = ("<center>"+value+"</center>");
    if (this.options.change){
      this.show_img_with_number(value);
      this.options.change(value);
    }
  };
  
  MobileThumbnailSlider.prototype.endcallback = function(value) { 
    if (this.options.end){
      this.show_img_with_number(value);
      this.options.end(value);
    }
  };

  MobileThumbnailSlider.prototype.startcallback = function(value) { 
    if (this.options.start){
      this.options.start(value);
    }
  };

  //public function
  window.MobileThumbnailSlider = MobileThumbnailSlider;
  
  window.$c = function(className, node, tag) {
      node = node || document;
      tag = tag || '*';
      var i = 0,
          j = 0,
          classElements = [],
          els = node.getElementsByTagName(tag),
          elsLen = els.length,
          pattern = new RegExp("(^|\\s)" + className + "(\\s|$)");
        
      for (; i < elsLen; i ++) {
          if (pattern.test(els[i].className)) {
              classElements[j] = els[i];
              j ++;
          };
      };
      return classElements;
  };
  
  //jq init
  var getTooltip = function () {
      var TooltipHtml =
      "<div class='top_tooltip'>" +
          "<div class='conten_tooltip'>" +
          "</div>" +
          "<div class='bottom_tooltip'></div>" +
      "</div>";
      return TooltipHtml;
  };
  //$("body").prepend(getTooltip()); // add tootlip into the body
  document.write(getTooltip());
  
  // $('.knob').click(function(){
 //      $('.top_tooltip').hide();
 //  });
 //  
  MobileThumbnailSlider.prototype.show_img_with_number = function(i){
    // var $this = $(this);
    // var tText = $this.attr("title");
    // $this.data('tipText', tText).removeAttr('title');
    console.log("this numberu=" + i);
    // 
    // var tip = $c('top_tooltip')[0];
    // 
    // tip = $('.top_tooltip');
    
    // var tip = $c('top_tooltip');
    // var tipInner = $('.top_tooltip .conten_tooltip'); // add title content into the tooltip
    var tipInner = $c('conten_tooltip')[0]; // add title content into the tooltip
    try{
        tipInner.innerHTML = ("<a href='#'><img src='"+this.options.photos[i].url+"'/></a>");
    }catch(e)
    {
        tipInner.innerHTML = ("<center><font color='blue'>no photo</font></center>");
        console.log(e);
    }
    
    // tip.show();
    $c('top_tooltip')[0].style.display = 'block';
  }
  
})();