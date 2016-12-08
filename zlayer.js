angular.module('zLayer', [])

.factory('$zLayer', ['$compile', '$resource', function($c, $r)
{
	var e = angular.element( document.createElement('div') ).attr('uu-zlayer-init', '')
	angular.element(document.body).append(e)
	
	var p = 
	{
		name: 'zLayer',
		pageIndex: 0,
		onInitDo: function(){},
		pages:{},
		path: angular.element(document.head).html().match(/src=["|'](.*?)zlayer\.js/)[1],
		trackHistory: true,
		reg: {},
		
		init: function(s)
		{
			this.scope = s
			this.history._ = this
			this.buttons = this.buttons()
			
			if ( this.myButtons )
			{
				for ( var i in this.myButtons )
				{
					this.buttons[i] = this.myButtons[i]
				}
			}
			
			this.onInitDo()
		},
		
		onInit: function(f)
		{
			this.onInitDo = f
		},
		
		register: function(id, o)
		{
			this.reg[id] = o
		},
		
		history:
		{
			a: [],
			add: function(s)
			{
				this.a.unshift(s)
			},
			remove: function(s)
			{
				
			},
			back: function()
			{
				if ( this.a.length > 0 )
				{
					var p = this.a.shift()
					this._.trigger( p, this._.pages[p].$cfg, this._.pages[p].$context, this._.pages[p])
				}
				else
				{
					this._.close()
				}
			},
			clear: function()
			{
				if ( this.c ) return false
				this.c = true
				
				for ( var i in this.a )
				{
					this._.pg = this.a[i]
					this._.page = this._.pages[this.a[i]]
					this._.close()
				}
				
				this.a = []
				this.c = false
			}
		},
		
		open: function(p)
		{
			if ( typeof p === 'string' )
			{
				this.trigger(p, {})
			}
			else
			{
				this.trigger('page'+this.pageIndex, p)
			}
			
		},
		
		trigger: function(id, props, scope, page)
		{
			console.log('id: '+id)
			if ( this.isOpen && !page )
			{
				this.history.add(this.pg)
			}
			
			this.pg = this.reg[id] ? 'page'+this.pageIndex : id
			this.pageIndex++
			
			// Set the ID attribute on the trigger element. 
			// This will ensure that the element reuses the same layer when reopening, if available.
			// Also referenced by the zlayer template to know which element to show
			props.uuZlayer = this.pg
			console.log('pg:  '+this.pg)
			
			pr = Object.create( this.reg[id] || props )
			
			// Invoke any properties defined as functions to get their returned value; Only registered properties can be functions
			
			for ( var i in pr )
			{
				if ( i.search(/\$/) === -1 && i !== 'toJSON' )
				{
					pr[i] = typeof pr[i] === 'function' ? pr[i](props) : pr[i]
				}
			}
			
			for ( var i in props )
			{
				if ( i.search(/\$/) === -1 && i !== 'toJSON' )
				{
					pr[i] = props[i]
				}
			}
			
			/*
			| Layer Buttons
			| If provided, parse the buttons property, converting it into an array of properly formatted buttons.
			| Each button can be a reference to a default button, custom registered button, or a new on-the-fly button.
			| References to default or registered/custom buttons will inherit all properties of that button.
			| Those properties can be overridden with unique properties.
			| Example usage: buttons: ['back']; buttons: ['customRegisteredButton', 'On-The-Fly-Button:$close:red:white']
			| If defined in layer properties, button action reffers to a function on the layer scope
			|	This includes default functions like "$back" and the layer's controller functions, if layer has a controller.
			*/
			
			var btns = []
			
			if ( pr.buttons )
			{
				for ( var i in pr.buttons )
				{
					var btn = pr.buttons[i].split(':')

					var obj = {
						label: btn[0],
						action: btn[1] || '$back',
						background: btn[2],
						color: btn[3],
					}
					
					var tb = this.buttons[btn[0]]
					
					if ( tb )
					{
						obj.label = tb.label
						obj.action = obj.action || tb.action
						obj.background = obj.background || tb.background
						obj.color = obj.color || tb.color
					}
					
					btns.push(obj)
				}
			}
			
			pr.buttons = btns
			
			//
			
			this.page = this.pages[this.pg] = page || this.pages[this.pg] || 
			{
				$attr: props,
				$origID: id,
				$cfg: pr, 
				$context: scope,
				$controller: pr.controller || {},
				$scope: page ? page.$scope : false
			}
			
			this.isOpen = true
            
			scrY = Math.max(document.documentElement.scrollTop, document.body.scrollTop)
			scrX = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft)
			
//			window.scrollTo(scrX, scrY)
			
            angular.element(document).find('html')
//				.css('marginLeft', -scrX+'px')
//				.css('marginTop', -scrY+'px')
				.addClass('uu')
            
			if ( !this.scope.$$phase )
			{
				this.scope.$apply()
			}
            
            var fn = function(t) // Prevent double clicks from causing unintended closing
            {
				t.closeDelayed = true
				
                t.timer = setInterval(function()
                {
                    clearInterval(t.timer)
                    t.closeDelayed = false
                }, 300)
            }(this)
			
		},
		
		buttons: function()
		{
			var s = this.scope
			
			return {
				cancel:
				{
					label: 'Cancel',
					action: function()
					{
						s.$uu.zLayer.history.back()
					},
					background: '',
					color: ''
				},
				back:
				{
					label: 'Back',
					action: function()
					{
						s.$uu.zLayer.history.back()
					},
					background: '',
					color: ''
				},
				ok:
				{
					label: 'OK',
					action: function()
					{
						s.$uu.zLayer.history.back()
					},
					background: '#5a95d9',
					color: '#fff'
				}
			}
		},
		
		buttonWidth: function()
		{
			return {width: 100 / Object.keys(this.page.$cfg.buttons).length + '%' }
		},
		
		loadData: function(s)
		{
			return $r
			(
				s,
			 	{},
				{
			  		go: {method:'POST'}
			 	}
			)
		},
		
		update: function(o, p)
		{
			if ( !this.page )
			{
				return false
			}
			
			p = p || this.pg
			
			var pg = this.scope.$uu.zLayer.pages[p]
			
			if ( !pg )
			{
				console.error('zLayer: update() - Invalid ID provided.', '"', p, '"')
				return false
			}
			
			for ( var k in o )
			{
				if ( pg )
				{
					pg.$scope[k] = o[k]
				}
			}
			
			if ( pg.$scope.init )
			{
				pg.$scope.init()
			}
			
			if ( !this.scope.$$phase )
			{
				this.scope.$apply()
			}
		},
		
		showPage: function(p)
		{
			return p === this.pg
		},
		
		close: function()
		{
            angular.element(document).find('html')
//				.css('marginLeft', '')
//				.css('marginTop', '')
				.removeClass('uu')
			
			this.closeDo = false
			this.closeDelayed = true
			
			if ( this.page.$scope.onClose )
			{
				this.page.$scope.onClose()
			}
			
			if ( this.page.$cfg.cache === 'false' )
			{
				this.page.$attr.uuZlayer = this.page.$origID
				this.pages[this.pg].$scope.$destroy()
				delete this.pages[this.pg]
			}
			
			this.pg = ''
			this.isOpen = false
			
			this.history.clear()
			
			if ( !this.scope.$$phase )
			{
				this.scope.$apply()
			}
		},
		
		link: function(s, e, a)
		{
			var t = this, p = t.page
			
			s = p.$scope || s // May need to destroy scope here instead of overriding it with reference to another scope
			p.$scope = s
			
			s.$c = p.$context
			s.$s = s
			console.log(s)
			
			for (var i in s.LC )
			{
				s[i] = s.LC[i]
			}
			
			s.$back = function(){t.history.back() }
			s.$close = function(){ t.close() }
			
			// Append any passed-in scope data to the scope
			
			if ( p.$cfg.inject )
			{
				for ( var i in p.$cfg.inject )
				{
					s[i] = p.$cfg.inject[i]
				}
			}
			
			//
			
			var url = p.$cfg.model
			
			if ( url )
			{
				t.loadData(url).go({}, function(a)
				{
					for ( var i in a )
					{
						if ( i.search(/\$/) === -1 && i !== 'toJSON' )
						{
							s[i] = a[i]
						}
					}
					
					t.update({}, t.pg)
					
				})
			}
			else
			{
				t.update({}, t.pg)
			}
		},
		
		/* 
		| Parse malformed JSON object from attribute into proper JSON format and parse into an object
		| The data passed in from the user is expected to be malformed
		| Remove potentially malicious code to prevent XSS attacks
		*/
		
		malToJSON: function(s)
		{
			s = s.replace(/function/g, '')
			return JSON.parse( JSON.stringify( eval('('+s+')') ) )
		}
	}
	
	return p
}])

.directive('uuZlayerInit', ['$zLayer', function($z)
{
	return {
        replace:true,
		templateUrl: $z.path + 'zlayer.html',
		link: function(s, e)
		{
			s.$uu = s.$uu ? s.$uu : {}
			s.$uu.zLayer = $z
			s.$uu.zLayer.pages = {}
			
			angular.element(document).on('keydown', function(ev)
			{
				ev = ev || event || window.event // Test to make sure this is really necessary in angular/jqlite
				k = ev.keyCode || ev.which; // Test to make sure this is really necessary in angular/jqlite
				
				if ( k === 27 )
				{
					if ( $z.isOpen )
					{
						$z.close()
						ev.preventDefault()
						ev.stopPropagation()
					}
				}
			})
			
			e.on('mousedown', function()
			{
				$z.closeDo = true
			})
			
			e.on('mouseup', function()
			{
				if ( $z.closeDo && !$z.closeDelayed && $z.page.$cfg.clickOutsideClose !== 'false' )
				{
					$z.close()
				}
			})
			
			$z.init(s)
		}
	}
}])

.directive('uuZlayerPrep', ['$compile', function($c)
{
	/*
		ngRepeat directive invoke any other directives on the generated elements immediately.
		This intermediate directive is needed so that this effect does not cause uuZlayerLoad to execute before this directive's link phase.
	*/
	
	return {
		link: function(s, e, a)
		{
			e = e.find('div')
			
			var 
			p = s.$uu.zLayer.page,
			v = p.$cfg.view,
			c = p.$cfg.controller
            
            if ( p.$cfg.iframe )
            {
                e.html('<iframe src="'+v+'" style="width:100%; min-height:300px" frameborder="0"></iframe>')
            }
			else if ( v.substr(0, 1) === '=' )
            {
                e.attr('uu-zlayer-load-literal', '')
            }
			else
			{
				 e.attr('uu-zlayer-load', '')
			}
            
			if ( c ) e.attr('ng-controller', c + ' as LC')
			
			$c(e)(s)
		}
	}
}])

.directive('uuZlayerClosestopper', ['$zLayer', function($z)
{
	return {
		link: function(s, e)
		{
			e.on('mousedown', function(ev)
			{
				$z.closeDo = false
				ev.stopPropagation()
			})
			
			e.on('mouseup', function(ev)
			{
				$z.closeDo = true
				ev.stopPropagation()
			})
		}
	}
}])

.directive('uuZlayer', ['$zLayer', function($z)
{
	return {
		link: function(s, e, a)
		{
			var go = function(ev)
			{
				ev = ev || event || window.event
				var id = a.uuZlayer || 'page'+$z.pageIndex
				a.uuZlayer = id
				
				if ( a.uuOptions )
				{
					var o = $z.malToJSON(a.uuOptions)
				}
				
				$z.trigger(id, o||a, s)

				ev.preventDefault()
			}
			
			e.on('click', go)
			
			e.on('$destroy', function()
			{
				e.off('click', go)
			})
		}
	}
}])

.directive('uuZlayerLoad', ['$zLayer', function($z)
{
	return {
		templateUrl: function()
		{
			return $z.page.$cfg.view
		},
		restrict:'A',
		link: function(s, e, a)
		{
			s.$p = $z.scope
			$z.link(s, e, a)
		}
	}
}])

.directive('uuZlayerLoadLiteral', ['$zLayer', function($z)
{
	return {
		template: function()
		{
			return '<p>' + $z.page.$cfg.view.substr(1).replace(/\[\[/g, '{{').replace(/\]\]/g, '}}') + '</p>'
		},
		restrict: 'A',
		link: function(s, e, a)
		{
			s.$p = $z.scope
			$z.page.$cfg.cache = 'false'
			$z.link(s, e, a)
		}
	}
}])

.directive('uuZlayerClose', function()
{
	return {
		link: function(s, e)
		{
			e.on('mousedown', function(){ s.$uu.zLayer.close() })
		}
	}
})

.directive('uuZlayerButton', ['$zLayer', function($z)
{
	return {
		link: function(s, e, a)
		{
			var go = function()
			{
				var act = $z.page.$cfg.buttons[a.uuZlayerButton].action
				typeof act === 'string' ? $z.page.$scope[act]() : act()
			}
			
			e.on('click', go)
			
			e.on('$destroy', function()
			{
				e.off('click', go)
			})
		}
	}
}])