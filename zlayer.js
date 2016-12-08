angular.module('zLayer', ['ngResource'])

.factory('$zLayer', ['$compile', '$resource', function($c, $r)
{
	var p = 
	{
		name: 'zLayer',
		pageIndex: 0,
		onInitDo: function(){},
		pages:{},
		
		init: function(s)
		{
			this.scope = s
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
			
			/*if ( this.myControllers )
			{
				for ( var i in this.myControllers )
				{
					this.controllers[i] = this.myControllers[i]
				}
			}*/
			
			this.onInitDo()
		},
		
		onInit: function(f)
		{
			this.onInitDo = f
		},
		
		trigger: function(s, e, a)
		{
			var attr = a || e
			
			this.pg = typeof s === 'string' ? s : attr.page ? attr.page : 'page' + this.pageIndex
			
			var controller = attr.controller ? this.myControllers[attr.controller] : false
			
			attr.templateURL = attr.uuZlayerBind ? attr.uuZlayerBind : attr.href ? attr.href : attr.template
			
			if ( !this.scope['$uu_'+this.pg] )
			{
				this.pageIndex++
				
				attr.page = this.pg
				
				this.isOpen = true
				
				this.page = this.scope['$uu_'+this.pg] = 
				{
					$uu: '$uu_'+this.pg, 
					$cfg: Object.create(attr), 
					$context: s,
					$controller: controller
				}
				this.pages[this.pg] = this.page
				
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
				this.page = this.scope['$uu_'+this.pg]
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
            
            angular.element(document).find('html').addClass('noscroll')
            
             if ( !this.scope.$$phase )
            {
                this.scope.$apply()
            }
            
            var timerCapsule = function(t)
            {
                t.closeOnClickTimer = setInterval(function()
                {
                    clearInterval(t.closeOnClickTimer)
                    t.closeOnClick = true
                }, 300)
            }(this)
			
			
			if ( !attr.templateURL )
			{
				console.error('zLayer: Must specify a template (HTML partial) to load. Use one of the following properties/attributes: "href", "uu-zlayer-bind", "data-template".')
			}
			
		},
		
		buttons: function()
		{
			var s = this.scope
			
			return {
				cancel:
				{
					label: "Cancel",
					action: function()
					{
						s.$uu.zLayer.close()
					}
				},
				ok:
				{
					label: "OK",
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
			
			for ( var k in o )
			{
				if ( p )
				{
					if ( this.scope['$uu_'+p] )
					{
						this.scope['$uu_'+p][k] = o[k]
					}
				}
				else
				{
					this.page[k] = o[k]
				}
			}
			
			if ( this.page.$controller )
			{
				this.page.$controller.$scope = this.page
				
				if ( this.page.$controller.init )
				{
					this.page.$controller.init()
				}
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
				console.log('removing '+this.pg)
				delete this.pages[this.pg]
				delete this.scope['$uu_'+this.pg]
			}
			
			this.pg = ''
			this.isOpen = false
            
            angular.element(document).find('html').removeClass('noscroll')
			
			if ( !this.scope.$$phase )
			{
				this.scope.$apply()
			}
		}
	}
	
	return p
}])

.directive('uuZlayer', ['$zLayer', function($z)
{
	return {
        replace:true,
		templateUrl: '../0.9.0/zlayer.html',
		link: function(s, e)
		{
			s.$uu = s.$uu ? s.$uu : {}
			s.$uu.zLayer = $z
			
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
			
			e.on('click', function()
			{
				if ( $z.closeOnClick && $z.page.$cfg.clickOutsideClose !== 'false' )
				{
					$z.close()
					$z.closeOnClick = false
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
            
			e.attr('ng-show', '$uu.zLayer.showPage(\'{{i.$cfg.page}}\')')
			e.attr('data-uu', '$uu_'+s.$uu.zLayer.pg)
			e.attr('data-context', '$uu_'+s.$uu.zLayer.pg+'.$context')
			e.attr('data-parent', '$parent')
			e.attr('data-controller', '$uu_'+s.$uu.zLayer.pg+'.$controller')
			$c(e)(s)
		}
	}
}])

.directive('uuZlayerCloseclick', ['$zLayer', function($z)
{
	return {
		link: function(s, e)
		{
			var b
			
			e.on('mouseenter', function()
			{
                clearInterval($z.closeOnClickTimer)
				$z.closeOnClick = false
			})
			
			e.on('mouseleave', function()
			{
				$z.closeOnClick = true
			})
		}
	}
}])

.directive('uuZlayerBind', ['$zLayer', function($z)
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
			return $z.isOpen ? $z.page.$cfg.templateURL : 'zlayer/LICENSE.txt'
		},
		scope:
		{
			uu: '=',
			$c: '=context',
			$p: '=parent',
			$t: '=controller'
		},
		link: function(s, e, a)
		{
			// load page data here
			
			var url = $z.page.$cfg.url
			
			if ( url )
			{
				$z.loadData(url).go({}, function(a)
				{
					var o = {}
					
					for ( var i in a )
					{
						if ( i.search(/\$/) === -1 && i !== 'toJSON' )
						{
							o[i] = a[i]
						}
					}
					
					$z.update(o, $z.pg)
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
			e.on('click', function(){ s.$uu.zLayer.close() })
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