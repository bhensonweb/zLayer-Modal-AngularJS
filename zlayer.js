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
		
		history:
		{
			a: [],
			add: function(s)
			{
				this.a.unshift(s)
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
			}
		},
		
		trigger: function(s, e, a)
		{
			if ( this.isOpen && this.trackHistory )
			{
				this.history.add(this.pg)
			}
			
			var attr = a || e || {}
			
			this.pg = typeof s === 'string' ? s : attr.id ? attr.id : 'page' + this.pageIndex
			
			attr.templateURL = attr.uuZlayerBind ? attr.uuZlayerBind : attr.href ? attr.href : attr.template
			
			if ( !this.scope.$uu.zLayer.pages[this.pg] )
			{
				this.pageIndex++
				
				attr.id = this.pg
				
				this.isOpen = true
				
				var c = attr.controller ? this.myControllers[attr.controller] : {}
				
				this.page = this.scope.$uu.zLayer.pages[this.pg] = 
				{
					$cfg: Object.create(attr), 
					$context: s,
					$controller: c
				}
				
				if ( attr.buttons )
				{
					var btns = attr.buttons
					
					if ( typeof attr.buttons === 'string' )
					{
						btns = attr.buttons.replace(/\s/g, '').split(',')
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
				}
			}
			else
			{
				this.page = this.scope.$uu.zLayer.pages[this.pg]
				this.isOpen = true
			}
            
            this.contentStyle = JSON.parse && typeof attr.contentStyle === 'string' ? JSON.parse(attr.contentStyle) : ( attr.contentStyle || {} )
            this.boxStyle = JSON.parse && typeof attr.boxStyle === 'string' ? JSON.parse(attr.boxStyle) : ( attr.boxStyle || {} )
            
            this.boxStyle.maxWidth = this.boxStyle.width || ( attr.width ? attr.width : '' )
            this.boxStyle.width = ''
            
            this.contentStyle.borderRadius = this.contentStyle.borderRadius || ( attr.buttons ? '' : '0 0 6px 6px' )
            this.contentStyle.padding = attr.padding || this.contentStyle.padding
            
            this.bottomStyles = attr.buttons ? {} : {display:'none'}
            
            if ( attr.iframe )
            {
                this.contentStyle.padding = '0'
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
					}
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
//			console.log('show page "'+this.pg+'"?')
			return p === this.pg
		},
		
		close: function()
		{
			if ( this.page.$cfg.cache === 'false' )
			{
				delete this.scope.$uu.zLayer.pages[this.pg].$scope.$destroy()
				delete this.scope.$uu.zLayer.pages[this.pg]
			}
			
			this.pg = ''
			this.isOpen = false
            
//            angular.element(document).find('html').removeClass('noscroll')
			
			this.closeDo = false
			this.closeDelayed = true
			
			if ( !this.scope.$$phase )
			{
				this.scope.$apply()
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
	// ngRepeat elements always run any directive template functions before repeated elements generate. 
	// This intermediate directive is needed.
	
	return {
		link: function(s, e, a)
		{
			e = e.find('div')
			
            var 
            tmpl = s.$uu.zLayer.page.$cfg.templateURL,
            isLiteral = tmpl.substr(0, 1) === '='
            
            if ( isLiteral )
            {
                var str = tmpl.substr(1)
                e.html('<p>' + str + '</p>')
            }
            else if ( s.$uu.zLayer.page.$cfg.iframe )
            {
                console.log('iframe mode')
                e.html('<iframe src="'+tmpl+'" style="width:100%; min-height:300px" frameborder="0"></iframe>')
            }
            else
            {
                e.attr('uu-zlayer-load', '')
            }
            
			e.attr('ng-show', '$uu.zLayer.showPage(\'{{i.$cfg.id}}\')')
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
				
				$z.trigger(s, e, a)

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
		restrict:'A',
		templateUrl: function()
		{
			return $z.page.$cfg.templateURL
		},
		scope:
		{
			$p: '=parent'
		},
		link: function(s, e, a)
		{
			// Configure some scope vars, create controller properties, and load model
			
			$z.page.$scope = s
			
			s.$c = $z.page.$context
			s.$s = s
			
			for (var i in $z.page.$controller )
			{
				s[i] = $z.page.$controller[i]
			}
			
			s.$back = function(){ $z.history.back() }
			s.$close = function(){ $z.close() }
			
			var url = $z.page.$cfg.url
			
			if ( url )
			{
				$z.loadData(url).go({}, function(a)
				{
					for ( var i in a )
					{
						if ( i.search(/\$/) === -1 && i !== 'toJSON' )
						{
							s[i] = a[i]
						}
					}
					
					$z.update({}, $z.pg)
					
				})
			}
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