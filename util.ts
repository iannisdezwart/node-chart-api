import * as http from 'http'

export const readBody = (
	req: http.IncomingMessage
) => new Promise<string>((resolve, reject) => {
	let body = ''

	req.on('data', chunk => body += chunk)
	req.on('end', () => resolve(body))
	req.on('error', () => reject())
})