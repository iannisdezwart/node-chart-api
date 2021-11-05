import * as http from 'http'
import { drawChart, drawChartCSV } from './draw_chart'
import { authenticated } from './auth'

const PORT = +process.argv[2] || 3000

const server = http.createServer((req, res) => {
	const apiToken = req.headers['x-api-token'] as string
	const url = new URL(req.url, 'http://localhost')
	const route = url.pathname

	if (!authenticated(apiToken)) {
		res.statusCode = 401
		res.end('Unauthorized')
		return
	}

	if (route == '/' || route == '/json') {
		drawChart(req, res)
	}
	else if (route == '/csv') {
		drawChartCSV(req, res)
	}
	else {
		res.statusCode = 404
		res.end('Not found')
		return
	}
})

server.listen(PORT, () => console.log(`Listening on port ${ PORT }`))