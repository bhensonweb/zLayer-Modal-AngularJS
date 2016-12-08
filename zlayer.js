angular.module('zLayer', ['ngResource'])

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
			
			if ( this.myStyles )
			{
				for ( var i in this.myStyles )
				{
					this.styles[i] = this.myStyles[i]
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
					this._.trackHistory = false
					this._.trigger( p, this._.pages[p].$cfg )
					this._.trackHistory = true
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
		
		trigger: function(id, props, scope)
		{
			id = id || 'page' + this.pageIndex
			
			if ( id === this.pg ) return false // Prevent layer with same ID from triggering twice in a row.
			
			if ( this.isOpen && this.trackHistory )
			{
				this.history.add(this.pg)
			}
			
			pr = Object.create( this.reg[id] || props )
			pr.id = id
			
			pr.loadModel = typeof pr.model === 'function' // Cause the Model to load again if speficied as a function
			
			// Invoke any properties defined as functions to get their returned value; Only registered properties can be functions
			
			for ( var i in pr )
			{
				if ( i.search(/\$/) === -1 && i !== 'toJSON' )
				{
					pr[i] = typeof pr[i] === 'function' ? pr[i](props) : pr[i]
				}
			}
			
			this.pg = id
			
			if ( !this.pages[id] )
			{
				this.pageIndex++
				var isNew = true
				pr.loadModel = true
			}
			else
			{
				var isNew = false
			}
			
			this.page = this.pages[id] = 
			{
				$cfg: pr, 
				$context: scope,
				$controller: pr.controller ? this.myControllers[pr.controller] : {},
				$scope: isNew ? {} : this.page.$scope
			}
			
			/*if ( pr.buttons )
			{
				var btns = pr.buttons

				if ( typeof pr.buttons === 'string' )
				{
					btns = pr.buttons.replace(/\s/g, '').split(',')
				}

				this.page.$cfg.buttons = {}

				for ( var i in btns )
				{
					if ( !this.buttons[btns[i]] )
					{
						console.error('zLayer: Button: "' + btns[i] + '" does not exist.')
					}
					else
					{
						this.buttons[btns[i]].name = btns[i]
						this.page.$cfg.buttons[btns[i]] = this.buttons[btns[i]]
					}
				}
			}*/
			
			this.isOpen = true
			
			if ( !isNew ) 
			{
				console.log('re-link')
				this.link(this.page.$scope, {}, pr)
			}
            
//            angular.element(document).find('html').addClass('noscroll')
            
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
						s.$uu.zLayer.close()
					},
					style: 'moduul'
				},
				back:
				{
					label: 'Back',
					action: function()
					{
						s.$uu.zLayer.history.back()
					},
					style: 'moduul'
				},
				ok:
				{
					label: 'OK',
					action: function()
					{
						s.$uu.zLayer.close()
					},
					style: 'uu_blue'
				}
			}
		},
		
		buttonWidth: function()
		{
			return {width: 100 / Object.keys(this.page.$cfg.buttons).length + '%' }
		},
		
		styles:
		{
			moduul: {background:'', color:''},
			uu_red: {background:'#d6223c', color:'#fff'},
            uu_yellow: {background:'#fcc964', color:'#fff'},
			uu_green: {background:'#51ae7b ', color:'#fff'},
			uu_blue: {background:'#5a95d9', color:'#fff'}
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
//            angular.element(document).find('html').removeClass('noscroll')
			
			this.closeDo = false
			this.closeDelayed = true
			
			if ( this.page.$scope.onClose )
			{
				this.page.$scope.onClose()
			}
			
			if ( this.page.$cfg.cache === 'false' )
			{
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
			var t = this
			
			t.page.$scope = s
			
			s.$c = t.page.$context
			s.$s = s
			
			for (var i in t.page.$controller )
			{
				s[i] = t.page.$controller[i]
			}
			
			s.$back = function(){t.history.back() }
			s.$close = function(){ t.close() }
			
			var url = t.page.$cfg.model
			
			if ( url && t.page.$cfg.loadModel )
			{
				t.page.$cfg.loadModel = false
				
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
			var t = s.$uu.zLayer.page.$cfg.template
            
            if ( s.$uu.zLayer.page.$cfg.iframe )
            {
                e.html('<iframe src="'+t+'" style="width:100%; min-height:300px" frameborder="0"></iframe>')
            }
			else if ( t.substr(0, 1) === '=' )
            {
                e.attr('uu-zlayer-load-literal', '')
            }
			else
			{
				 e.attr('uu-zlayer-load', '')
			}
            
			e.attr('data-parent', '$parent')
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
				
				$z.trigger(a.uuZlayer, a, s)

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
			return $z.page.$cfg.template
		},
		restrict:'A',
		scope:
		{
			$p: '=parent'
		},
		link: function(s, e, a)
		{
			$z.link(s, e, a)
		}
	}
}])

.directive('uuZlayerLoadLiteral', ['$zLayer', function($z)
{
	return {
		template: function()
		{
			return '<p>' + $z.page.$cfg.template.substr(1) + '</p>'
		},
		restrict: 'A',
		scope:
		{
			$p: '=parent'
		},
		link: function(s, e, a)
		{
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

.directive('uuZlayerButton', function()
{
	return {
		link: function(s, e, a)
		{
			var go = function()
			{
				s.$uu.zLayer.buttons[a.uuZlayerButton].action()
			}
			
			e.on('click', go)
			
			e.on('$destroy', function()
			{
				e.off('click', go)
			})
		}
	}
})

.directive('uuZlayerStyle', function()
{
	return {
		link: function(s, e, a)
		{
			if ( a.uuZlayerStyle === '' ) { return false }
			
			var style = s.$uu.zLayer.styles[a.uuZlayerStyle]
			
			if ( !style )
			{
				console.error('zLayer: Style "' + a.uuZlayerStyle + '" is not defined.')
			}
			
			for ( var i in style )
			{
				e[0].style[i] = style[i]
			}
		}
	}
})