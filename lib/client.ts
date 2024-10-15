import Redis from 'ioredis'
// connect redis using uri
if (!process.env.REDIS_URI) {
  throw new Error('REDIS_URI is not defined')
}
const kv = new Redis(process.env.REDIS_URI)

export default kv
