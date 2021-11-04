import * as jwt from 'jsonwebtoken'
import * as fs from 'fs'
import { randomBytes } from 'crypto'

if (!fs.existsSync('.jwtsecret')) {
	fs.writeFileSync('.jwtsecret', randomBytes(128).toString('base64'))
}

const secret = fs.readFileSync('.jwtsecret', 'utf-8')

export const authenticated = (apiToken: string) => {
	try {
		return jwt.verify(apiToken, secret)
	} catch {
		return false
	}
}

export const createToken = (user: string) => {
	return jwt.sign({ user }, secret)
}