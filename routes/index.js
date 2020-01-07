const router = require('koa-router')()
const cheerio = require('cheerio')
const charset = require('superagent-charset')
const superagent = charset(require('superagent'))
const request = require('superagent')

// extend with Request#proxy()
require('superagent-proxy')(request)

const user = '531381235898273792'
const password = 'EwGd604n'
const host = 'http-short.xiaoxiangdaili.com'
const port = 10010
const proxyUrl = 'http://' + user + ':' + password + '@' + host + ':' + port

const knex = require('knex')({
	client: 'mysql', //指明数据库类型，还可以是pg，sqlite3等等
	connection: {
		//指明连接参数
		host: '127.0.0.1',
		user: 'root',
		password: 'root',
		database: 'native_symbol'
	},
	debug: false, //指明是否开启debug模式，默认为true表示开启
	pool: {
		//指明数据库连接池的大小，默认为{min: 2, max: 10}
		min: 0,
		max: 7
	},
	acquireConnectionTimeout: 2000, //指明连接计时器大小，默认为60000ms
	migrations: {
		tableName: 'migrations' //数据库迁移，可选
	}
})

let allnum = []
const init = () => {
	return new Promise(res => {
		superagent
			.get(`http://kaijiang.500.com/shtml/ssq/03001.shtml`)
			// .proxy(proxyUrl)
			.charset('gbk')
			.buffer(true)
			.end(async (err, data) => {
				//页面获取到的数据
				if (err) {
					// return next(err);
					console.log('页面不存在', err)
				}
				let html = data.text,
					$ = cheerio.load(html, {
						decodeEntities: false,
						ignoreWhitespace: false,
						xmlMode: false,
						lowerCaseTags: false
					}) //用cheerio解析页面数据

				$('.iSelectBox').each((index, element) => {
					let $element = $(element)
					let num = $element.find('a')
					num.each((i, e) => {
						let $num = $(e)

						allnum.push($num.text())
						res(allnum)
					})

					console.log(num.length)
				})
			})
	})
}
const sleep = timer => {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, timer)
	})
}

const timePlay = (url, datenum) => {
	superagent
		.get(url)
		// .proxy(proxyUrl)
		.charset('gbk')
		.buffer(true)
		.end(async (err, data) => {
			//页面获取到的数据
			if (err) {
				// return next(err);
				console.log('页面不存在', err)
			}
			let html = data.text,
				$ = cheerio.load(html, {
					decodeEntities: false,
					ignoreWhitespace: false,
					xmlMode: false,
					lowerCaseTags: false
				}) //用cheerio解析页面数据
			let arr = []
			let redarr = []

			$('.ball_box01').each((index, element) => {
				let $element = $(element)
				// $element.find('.ball_red').next().find('a').addClass('link').attr('class', 'link').text('')
				let blue = $element.find('.ball_blue').text()
				let red = $element.find('.ball_red')
				redarr = []
				red.each((i, e) => {
					let $red = $(e)
					redarr.push($red.text())
				})
				// console.log(url)
				// console.log(redarr)
				// console.log(blue)
				arr.push({
					periods: datenum,
					red: JSON.stringify(redarr),
					blue: blue
				})
			})
			for (let i of arr) {
				const findRes = await knex('products2')
					.select()
					.where('periods', i.periods)
				if (findRes.length) {
					console.log('数据已存在')
				} else {
					await knex('products2')
						.returning('periods')
						.insert(i)
						.then(res => {
							console.log('success', res)
						})
						.catch(error => {
							console.log('error', error)
						})
				}
			}
		})
}
router.get('/', async (ctx, next) => {
	const datanum = await init()
	// const foo = async () => {
	// 	for (let i = 0; i < datanum.length; i++) {
	// 		await sleep(1000)
	// 		console.log(datanum[i])
	// 		let url = `http://kaijiang.500.com/shtml/ssq/${datanum[i]}.shtml` //爬虫地址
	// 		await timePlay(url, datanum[i])
	// 	}
	// }
	// foo()
	ctx.body = allnum
})

module.exports = router
