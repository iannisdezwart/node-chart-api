import * as http from 'http'
import { drawChart } from './draw_chart'
import { authenticated } from './auth'

const server = http.createServer((req, res) => {
	const apiToken = req.headers['x-api-token'] as string
	const width = +req.headers['x-width']
	const height = +req.headers['x-height']

	if (!authenticated(apiToken)) {
		res.statusCode = 401
		res.end('Unauthorized')
		return
	}

	let body = ''

	req.on('data', chunk => body += chunk)

	req.on('end', async () => {
		try {
			console.log(body)
			const chart = JSON.parse(body)
			console.log(chart)
			const buf = await drawChart(width, height, chart)

			res.setHeader('Content-Type', 'image/png')
			res.end(buf)
		}
		catch (e) {
			res.statusCode = 400
			res.end('Bad input')
		}
	})
})

server.listen(3000, () => console.log('Listening on port 3000'))