layui.use(['carousel', 'element'], function() {
	var carousel = layui.carousel
	var element = layui.element
	
	
	var user = JSON.parse(storage['user'])
	user.userid = "'" + user.userid + "'"
	user.cxid = getQueryString('cxid')? getQueryString('cxid'): 'joanbIjdacvsx',
	user.cxid = "'" + user.cxid + "'"
	user.date = function() {
		var now = getTime(new Date())
		var result = getQueryString('date')? getQueryString('date'): now.year + '-' + now.month + '-' + now.day
		return "'" + result + "'"
	}
	
	var uuid = urlHash()
	//全局存储chart信息
	window.charts = {}
	window.socketInfo = {}
	
	
	//初始化socketIo
	//配置服务器域名
	var socket = io.connect(serverIP + ':9092')
	
	//启动时发送一条信息给服务器
	socket.on('connect', function() {
		socket.emit('echo', 'hello~Server')
		//此处处理数据重连
		for (var x = 0; x < Object.keys(socketInfo).length; x++) {
			(function(x) {
				//通知服务器我需要接收的数据
				//十秒延迟避免同时大量请求冲击服务器
				setTimeout(function() {
					callAjax('data/addEvent', {
						eventId: Object.keys(socketInfo)[x],
						sqlArr: socketInfo[Object.keys(socketInfo)[x]]
					}, function(res) {})
				}, 1000 * 10 * Math.random())
			})(x)
		}
	})
	
	//调试用的好东西
	socket.on('echo', function(data) {
		console.log(data)
	})
	
	
	
	function setStyle(dom, style) {
		var style = style || {}
		for (var x = 0; x < Object.keys(style).length; x++) {
			dom.style[Object.keys(style)[x]] = style[Object.keys(style)[x]]
		}
	}
	
	//html插入工具方法
	window.loadHtml = function(dbId, htmlList) {
		for (var x = 0; x < htmlList.length; x++) {
			(function(x) {
				var config = JSON.parse(htmlList[x].config)
				var style = JSON.parse(htmlList[x].style)
				//创建对象
				var div = document.createElement('div')
				//设置定位
				div.style.position = 'absolute'
				div.style.top = config.top + 'px'
				div.style.left = config.left + 'px'
				div.style.width = config.width + 'px'
				div.style.height = config.height + 'px'
				setStyle(div, style)
				document.getElementById('db_' + dbId).appendChild(div)
				var self = $(div)
				eval(htmlList[x].after)
				//如果存在数据源，则设置事件与回调
				if (htmlList[x].ds_id) {
					var eventId = uuid + 'html_' + htmlList[x].id
					var call_back = htmlList[x].call_back
					//新建监听
					socket.on(eventId, function(res) {
						eval(call_back)
						callAjax('data/backLife', {eventId: eventId}, function(){})
					})
					//通知服务器建立事件
					callAjax('data/byid', {id: htmlList[x].ds_id}, function(res) {
						var sqls = res.data.sql_stmt.split(';')
						var result = ""
						sqls.forEach(function(sql) {
							sql = sql.replace(/\n/g, ' ')
							result += eval(sql) + ';'
						})
						socketInfo[eventId] = result
						callAjax('data/addEvent', {eventId: eventId,sqlArr: result}, function() {})
					})
				}
			})(x)
		}
	}
	
	//chart插入工具方法
	window.loadChart = function(dbId, chartList) {
		for (var x = 0; x < chartList.length; x++) {
			//闭包问题
			(function(x) {
				var config = JSON.parse(chartList[x].config)
				var style = JSON.parse(chartList[x].style)
				//创建对象
				var div = document.createElement('div')
				div.style.position = 'absolute'
				div.style.top = config.top + 'px'
				div.style.left = config.left + 'px'
				div.style.width = config.width + 'px'
				div.style.height = config.height + 'px'
				//CSS
				setStyle(div, style)
				document.getElementById('db_' + dbId).appendChild(div)
				//before
				eval(chartList[x].before)
				//如果存在chart主题，则启用
				var chart = JSON.stringify(dbs[dbId].config.chartTheme) == '{}'? echarts.init(div): echarts.init(div, dbId)
				charts[chartList[x].id] = chart
				chart.setOption(JSON.parse(chartList[x].option))
				eval(chartList[x].after)
				//如果存在数据源，则设置事件与回调
				if (chartList[x].ds_id) {
					var eventId = uuid + 'chart_' + chartList[x].id
					var call_back = chartList[x].call_back
					//新建监听
					socket.on(eventId, function(res) {
						eval(call_back)
						callAjax('data/backLife', {eventId: eventId}, function(){})
					})
					//通知服务器建立事件
					callAjax('data/byid', {id: chartList[x].ds_id}, function(res) {
						var sqls = res.data.sql_stmt.split(';')
						var result = ""
						sqls.forEach(function(sql) {
							sql = sql.replace(/\n/g, ' ')
							result += eval(sql) + ';'
						})
						socketInfo[eventId] = result
						callAjax('data/addEvent', {eventId: eventId,sqlArr: result}, function() {})
					})
				}
			})(x)
		}
	}
	
	//Table载入的工具方法
	window.loadTable = function(dbId, tableList) {
		for (var x = 0; x < tableList.length; x++) {
			//闭包问题
			(function(x) {
				var config = JSON.parse(tableList[x].config)
				var style = JSON.parse(tableList[x].style)
				var table = document.createElement('table')
				table.style.position = 'absolute'
				table.style.top = config.top + 'px'
				table.style.left = config.left + 'px'
				table.style.width = config.width + 'px'
				table.style.height = config.height + 'px'
				document.getElementById('db_' + dbId).appendChild(table)
				//子元素
				var thead = document.createElement('thead')
				var tbody = document.createElement('tbody')
				table.appendChild(thead)
				table.appendChild(tbody)
				//处理config中的表头信息
				if (config.head && config.head.length > 0) {
					var tr = document.createElement('tr')
					thead.appendChild(tr)
					for (var y = 0; y < config.head.length; y++) {
						var th = document.createElement('th')
						th.innerHTML = config.head[y].replace(/\n/g, '<br />')
						tr.appendChild(th)
					}
				}
				//生命周期after
				eval(tableList[x].after)
				//CSS
				setTableCss(table, thead, tbody, style)
				//执行取数与回调
				if (tableList[x].ds_id) {
					var eventId = uuid + 'table_' + tableList[x].id
					var call_back = tableList[x].call_back
					//新建监听
					socket.on(eventId, function(res) {
						eval(call_back)
						callAjax('data/backLife', {eventId: eventId}, function(){})
					})
					//通知服务器建立事件
					callAjax('data/byid', {id: tableList[x].ds_id}, function(res) {
						var sqls = res.data.sql_stmt.split(';')
						var result = ""
						sqls.forEach(function(sql) {
							sql = sql.replace(/\n/g, ' ')
							result += eval(sql) + ';'
						})
						socketInfo[eventId] = result
						callAjax('data/addEvent', {eventId: eventId,sqlArr: result}, function() {})
					})
				}
			})(x)
		}
	}
	
	//Table元素样式配置的工具方法
	function setTableCss(table, thead, tbody, style) {
		setStyle(table, style.table)
		setStyle(thead, style.thead)
		setStyle(tbody, style.tbody)
		var trs = childrenByName(table, 'tr')
		trs.forEach(function(tr) {
			setStyle(tr, style.tr)
		})
		var ths = childrenByName(table, 'th')
		ths.forEach(function(th) {
			setStyle(th, style.th)
		})
		var tds = childrenByName(table, 'td')
		tds.forEach(function(td) {
			setStyle(td, style.td)
		})
	}
	
	function childrenByName(parent, childName) {
		var result = []
		var children = parent.children
		for (var x = 0; x < children.length; x++) {
			if (children[x].localName == childName){
				result.push(children[x])
			}
			//递归
			result = result.concat(childrenByName(children[x], childName))
		}
		return result
	}
	
	//Image载入的工具方法
	window.loadImage = function(dbId, imageList) {
		for (var x = 0; x < imageList.length; x++) {
			(function(x) {
				var config = JSON.parse(imageList[x].config)
				var style = JSON.parse(imageList[x].style)
				//创建对象
				var div = document.createElement('div')
				//设置定位
				div.style.position = 'absolute'
				div.style.top = config.top + 'px'
				div.style.left = config.left + 'px'
				div.style.width = config.width + 'px'
				div.style.height = config.height + 'px'
				div.style.backgroundImage = 'url(' + imageList[x].url + ')'
				div.style.backgroundRepeat = 'no-repeat'
				div.style.backgroundSize = '100% 100%'
				setStyle(div, style)
				document.getElementById('db_' + dbId).appendChild(div)
			})(x)
		}
	}
})

