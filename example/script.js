var app = angular.module('app', ['zLayer', 'ngResource', 'ngAnimate'])

app.controller('myApp', ['$scope', '$zLayer', function($s, $z)
{
	myApp = $s
	$s.appScope = 'from App Scope'
	
	$s.items = 
	[
		{
			"id":1,
			"name":"Item One",
			"desc":"Example item"
		},
		{
			"id":2,
			"name":"Item Two",
			"desc":"Second option"
		},
		{
			"id":3,
			"name":"Item Three",
			"desc":"The third one"
		}
	]
	
	$z.register('myFirstRegister', 
	{
		view: 'partials/message_3.html',
		title: function(a)
		{
			return 'Registered Layer: '+a.titleExtra + ' - ' + Math.random()
		},
		controller: 'LayerController',
		model: function(a)
		{
			return a.model
		},
		inject:
		{
			specialBehavior: 'Weird Mode',
			forController: 'data passed via registered property'
		}
	})
	
	$z.register('mySecondRegister', 
	{
		view: 'partials/message.html',
		title: 'Template cache test',
		model: 'pageData.json'
	})
	
	$z.register('editItem', 
	{
		view: 'partials/inject_test.html',
		model:'pageData.json',
		buttons: ['back']
	})
	
	$z.myButtons = 
	{
		custom: 
		{
			label: 'Confirm', 
			action: '$back', 
			background:'grey',
			color:'red'
		}
	}
	
	/*$z.onInit(function()
	{
		$z.trigger('myPageID',
		{
			href: 'zlayer/partials/message.html',
			title: 'Script-triggered zLayer Test',
			cache:false,
			buttons:'newInstance, cancel, ok',
            width:'200px',
            contentStyles: {background:'lightgrey', height:'300px', overflow:'hidden'},
            boxStyles: {height:'500px'}
		})
	})*/
	
}])

app.controller('LayerController', [function()
{
	return {
		controllerData:'Hi from the controller',
		init: function()
		{
			this.controllerData = this.controllerData + ' (modified by init())'
		}
	}
}])

app.controller('TestController', [function()
{
	return {
		init: function()
		{
			console.log('controller init')
		},
		testIt: function()
		{
			console.log('this: ')
			console.log(this)
		},
		scopeTest: 'originalValue',
		anotherScopeTest: function()
		{
			console.log(this.device)
		},
		onClose: function()
		{
			console.log('on close')
			console.log(this.$c)
		},
		btnClick: function()
		{
			console.log('button clicked')
			this.$back()
		}
	}
}])

/* Animations */

app.animation('.zlM', [function()
{
	return {
		beforeRemoveClass: function(e, c, fn)
		{
			TweenLite.set(e, {scale:.95, alpha:0, onComplete:fn})
		},
		removeClass: function(e, c, fn)
		{
			switch ( c )
			{
				case 'ng-hide':
				TweenLite.to(e, .3, {alpha:1, scale:1, ease:Cubic.easeInOut, onComplete:fn})
			}
		},
		beforeAddClass: function(e, c, fn)
		{
			switch ( c )
			{
				case 'ng-hide':
				TweenLite.to(e, .3, {alpha:0, scale:.95, ease:Cubic.easeInOut, onComplete:fn})
			}
		}
	}
}])