import { createCanvas } from 'canvas'
import * as ChartJS from 'chart.js'
import * as http from 'http'
import { readBody } from './util'

const chartTypes = [ 'bar', 'line', 'scatter', 'bubble', 'pie', 'doughnut',
	'polarArea', 'radar' ]

const lineColours = [ '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
	'#00FFFF', '#000000' ]

const BackgroundPlugin: ChartJS.Plugin = {
	id: 'background_plugin',
	beforeDraw: ({ canvas, ctx }) => {
		ctx.fillStyle = 'white'
		ctx.fillRect(0, 0, canvas.width, canvas.height)
	}
}

/**
 * Creates a chart from a JSON body.
 *
 * The following headers are optional:
 * * X-Width = width of the chart
 * * X-Height = height of the chart
 *
 * @param req The request.
 * @param res The response.
 */
export const drawChart = async (
	req: http.IncomingMessage,
	res: http.ServerResponse
) => {
	const width = +(req.headers['x-width'] ?? '600')
	const height = +(req.headers['x-height'] ?? '400')

	let chart: any

	try {
		chart = JSON.parse(await readBody(req))
	}
	catch {
		res.statusCode = 400
		res.end('Invalid JSON body')
		return
	}


	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	if (chart == null) {
		res.statusCode = 400
		res.end('chart is null')
		return
	}

	if (chart.plugins == null) {
		chart.plugins = []
	}

	chart.plugins.push(BackgroundPlugin)

	try {
		new ChartJS.Chart(ctx, chart)
	}
	catch {
		res.statusCode = 400
		res.end('Invalid chart input')
		return
	}

	canvas.toBuffer((err, buf) => {
		if (err) {
			res.statusCode = 500
			res.end('Error drawing chart')
			return
		}

		res.setHeader('Content-Type', 'image/png')
		res.end(buf)
	})
}

/**
 * Creates a chart from a CSV body.
 *
 * The following headers are required:
 * * X-Chart-Type = chart type
 * * X-Number-Of-Datasets = number
 *
 * The following headers are optional:
 * * X-Title = chart title
 * * X-Width = width of the chart
 * * X-Height = height of the chart
 * * X-Scale-X-Type = scale type of the x axis (linear, logarithmic)
 * * X-Scale-Y-Type = scale type of the y axis (linear, logarithmic)
 *
 * Example format of a body:
 * * 2018, 2019, 2020, 2021
 * * dataset 1 name
 * * 1, 4, 5, 6
 * * dataset 2 name
 * * 9, 1, 3, 4
 * @param req The request.
 * @param res The response.
 */
export const drawChartCSV = async (
	req: http.IncomingMessage,
	res: http.ServerResponse
) => {
	const width = +(req.headers['x-width'] ?? '600')
	const height = +(req.headers['x-height'] ?? '400')
	const chartType = req.headers['x-chart-type'] ?? 'line'
	const scaleXType = req.headers['x-scale-x-type'] ?? 'linear'
	const scaleYType = req.headers['x-scale-y-type'] ?? 'linear'
	const title = req.headers['x-title']
	const xLabel = req.headers['x-label-x']
	const yLabel = req.headers['x-label-y']

	if (!chartTypes.includes(chartType as string)) {
		res.statusCode = 400
		res.end('Invalid chart type')
		return
	}

	if (req.headers['x-number-of-datasets'] == null) {
		res.statusCode = 400
		res.end('X-Number-Of-Datasets header is required')
		return
	}

	const numberOfDatasets = +req.headers['x-number-of-datasets']

	const body = (await readBody(req)).split('\n')

	if (body.length < 1 + numberOfDatasets * 2) {
		res.statusCode = 400
		res.end('Invalid number of lines in CSV body')
		return
	}

	const chart: ChartJS.ChartConfiguration = {
		type: chartType as keyof ChartJS.ChartTypeRegistry,
		data: {
			labels: body[0].split(',').map(e => e.trim()),
			datasets: []
		},
		plugins: [ BackgroundPlugin ],
		options: {
			scales: {
				x: {
					type: scaleXType as keyof ChartJS.ScaleTypeRegistry
				},
				y: {
					type: scaleYType as keyof ChartJS.ScaleTypeRegistry
				}
			}
		}
	}

	for (let i = 0; i < numberOfDatasets; i++) {
		const datasetName = body[1 + i * 2]
			.trim()

		const datasetData = body[2 + i * 2]
			.split(',')
			.map(e => +e.trim())

		if (datasetData.length != chart.data.labels.length) {
			res.statusCode = 400
			res.end('Invalid number of data points in CSV body')
			return
		}

		chart.data.datasets.push({
			label: datasetName,
			data: datasetData,
			backgroundColor: lineColours[i % lineColours.length],
			borderColor: lineColours[i % lineColours.length],
			borderWidth: 1
		})
	}

	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	chart.plugins.push(BackgroundPlugin)

	if (title != null) {
		chart.options.plugins = {
			title: {
				display: true,
				text: title,
				color: 'black',
				font: {
					size: 20,
					family: 'Arial',
				}
			}
		}
	}

	if (xLabel != null) {
		// @ts-ignore
		chart.options.scales.y.title = {
			display: true,
			text: xLabel,
			color: 'black',
			font: {
				size: 20,
				family: 'Arial',
			}
		}
	}

	if (yLabel != null) {
		// @ts-ignore
		chart.options.scales.y.title = {
			display: true,
			text: yLabel,
			color: 'black',
			font: {
				size: 20,
				family: 'Arial',
			}
		}
	}

	new ChartJS.Chart(ctx, chart)

	canvas.toBuffer((err, buf) => {
		console.log(err, buf)

		if (err) {
			res.statusCode = 500
			res.end('Error drawing chart')
			return
		}

		res.setHeader('Content-Type', 'image/png')
		res.end(buf)
	})
}