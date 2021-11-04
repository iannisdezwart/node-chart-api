import { createCanvas } from 'canvas'
import * as ChartJS from 'chart.js'
import * as fs from 'fs'

const BackgroundPlugin: ChartJS.Plugin = {
	id: 'background_plugin',
	beforeDraw: ({ canvas, ctx }) => {
		ctx.fillStyle = 'white'
		ctx.fillRect(0, 0, canvas.width, canvas.height)
	}
}

/*
{"type":"line","data":{"labels":["a","b","c"],"datasets":[{"label":"My First dataset","data":[10,20,30],"backgroundColor":"red","borderColor":"blue","borderWidth":1}]},"options":{"scales":{"y":{"beginAtZero":true}}}}
*/

export const drawChart = (
	width: number,
	height: number,
	chart: any
) => new Promise<Buffer>((resolve, reject) => {
	const canvas = createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	if (chart == null) {
		reject(new Error('chart is null'))
		return
	}

	if (chart.plugins == null) {
		chart.plugins = []
	}

	chart.plugins.push(BackgroundPlugin)

	try {
		new ChartJS.Chart(ctx, chart)
	} catch(err) {
		reject('Invalid chart input')
	}

	canvas.toBuffer((err, buf) => {
		if (err) {
			reject(err)
		}

		resolve(buf)
	})
})