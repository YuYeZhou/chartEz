//提供看板设置当中的各种工具方法

//日期格式化方法
var weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]

function getTime(now) {
	var result = {
		year: now.getFullYear(),
		month: now.getMonth() + 1,
		day: now.getDate(),
		week: weekday[now.getDay()],
		hour: oneToTen(now.getHours()),
		minute: oneToTen(now.getMinutes()),
		second: oneToTen(now.getSeconds())
	}
	return result
}

//补零方法
function oneToTen(int) {
	if (int < 10) {
		return '0' + int
	} else {
		return int
	}
}


//动态生成底部滚动条方法
var bottomScrool = {}
function makeBottomScrool(ele_id, text) {
	var html = ''
	html += '<div style="height:100%;width:100%;text-align:right;flex-shrink:0">' + text + '</div>'
	html += '<div style="height:100%;width:100%;text-align:right;background-color:#393D49;flex-shrink:0">' + text + '</div>'
	$('#' + ele_id).html(html)
	bottomScrool[ele_id] = 0
	setInterval(function() {
		if (bottomScrool[ele_id] <= -99) {
			bottomScrool[ele_id] = 0
		} else {
			bottomScrool[ele_id] = bottomScrool[ele_id] - 1
		}
		$('#' + ele_id).css('margin-left', bottomScrool[ele_id] + '%')
	}, 150)
}
