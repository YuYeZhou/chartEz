//登录校验
var pathArray = window.location.pathname.split('/')
var fileName = pathArray[pathArray.length - 1]
if (fileName != 'login.html' && fileName != 'index.html') {
	//非登录页面进行用户校验
	if (!storage['user']) {
		window.location.href = './login.html'
	} else {
		window.user = JSON.parse(storage['user'])
		$('#username').html(user.username)
	}
}